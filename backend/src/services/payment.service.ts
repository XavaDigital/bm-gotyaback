import Stripe from "stripe";
import { SponsorEntry } from "../models/SponsorEntry";
import { Transaction } from "../models/Transaction";
import * as sponsorshipService from "./sponsorship.service";
import * as campaignService from "./campaign.service";

// Lazy initialization to ensure env vars are loaded
let stripeInstance: Stripe | null = null;

const getStripe = () => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe is not configured on this server");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
};

const isStripeConfigured = (): boolean => {
  return !!process.env.STRIPE_SECRET_KEY;
};

export const createPaymentIntent = async (
  campaignId: string,
  positionId: string | undefined,
  amount: number,
  sponsorData: { name: string; email: string; phone: string; message?: string }
) => {
  // Get campaign details for metadata
  const campaign = await campaignService.getCampaignById(campaignId);

  // Validate campaign is open
  campaignService.validateCampaignIsOpen(campaign);

  // Validate Stripe is enabled for this campaign
  if (!campaign.enableStripePayments) {
    throw new Error("Online payments are not enabled for this campaign");
  }

  // Get Stripe instance (will throw if not configured)
  const stripe = getStripe();

  // Create Payment Intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: campaign.currency.toLowerCase(),
    metadata: {
      campaignId,
      positionId: positionId || "none",
      sponsorName: sponsorData.name,
      sponsorEmail: sponsorData.email,
      sponsorPhone: sponsorData.phone,
      sponsorMessage: sponsorData.message || "",
    },
    // Allow payment methods
    payment_method_types: ["card"],
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
};

export const handleWebhook = async (
  rawBody: string | Buffer,
  signature: string
) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    throw new Error(
      `Webhook signature verification failed: ${(err as Error).message}`
    );
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;
    case "payment_intent.payment_failed":
      await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return { received: true };
};

const handlePaymentSuccess = async (paymentIntent: Stripe.PaymentIntent) => {
  const {
    campaignId,
    positionId,
    sponsorName,
    sponsorEmail,
    sponsorPhone,
    sponsorMessage,
  } = paymentIntent.metadata;

  try {
    // Create sponsorship entry
    const sponsorship = await sponsorshipService.createSponsorship(campaignId, {
      positionId: positionId === "none" ? undefined : positionId,
      name: sponsorName,
      email: sponsorEmail,
      phone: sponsorPhone,
      message: sponsorMessage || undefined,
      amount: paymentIntent.amount / 100, // Convert from cents
      paymentMethod: "card",
    });

    // Update sponsorship to paid status
    sponsorship.paymentStatus = "paid";
    await sponsorship.save();

    // Create transaction record
    await Transaction.create({
      sponsorEntryId: sponsorship._id,
      provider: "stripe",
      providerRef: paymentIntent.id,
      status: "success",
      amount: paymentIntent.amount / 100,
    });

    console.log(`Payment successful for sponsorship ${sponsorship._id}`);
  } catch (error) {
    console.error("Error handling payment success:", error);
    // Note: Position may have been reserved. Manual cleanup may be needed.
  }
};

const handlePaymentFailure = async (paymentIntent: Stripe.PaymentIntent) => {
  const { campaignId, positionId, sponsorName } = paymentIntent.metadata;

  console.log(
    `Payment failed for campaign ${campaignId}, position ${positionId}, sponsor ${sponsorName}`
  );

  // Could implement cleanup logic here if needed
  // e.g., release reserved position if it was held
};

export const getStripePublishableKey = () => {
  return process.env.STRIPE_PUBLIC_KEY;
};

export const getPaymentConfig = () => {
  return {
    stripeEnabled: isStripeConfigured(),
    publishableKey: isStripeConfigured() ? process.env.STRIPE_PUBLIC_KEY : null,
  };
};

export const getCampaignPaymentConfig = async (campaignId: string) => {
  const campaign = await campaignService.getCampaignById(campaignId);

  return {
    enableStripePayments: campaign.enableStripePayments,
    allowOfflinePayments: campaign.allowOfflinePayments,
    publishableKey:
      campaign.enableStripePayments && isStripeConfigured()
        ? process.env.STRIPE_PUBLIC_KEY
        : null,
  };
};
