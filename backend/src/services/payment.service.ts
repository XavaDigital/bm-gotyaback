import Stripe from "stripe";
import { SponsorEntry } from "../models/SponsorEntry";
import { Transaction } from "../models/Transaction";
import * as sponsorshipService from "./sponsorship.service";
import * as campaignService from "./campaign.service";
import * as shirtLayoutService from "./shirtLayout.service";

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
  sponsorData: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    sponsorType?: string;
    logoUrl?: string;
    displayName?: string;
  },
) => {
  // Get campaign details for metadata
  const campaign = await campaignService.getCampaignById(campaignId);

  // Validate campaign is open
  campaignService.validateCampaignIsOpen(campaign);

  // Validate Stripe is enabled for this campaign
  if (!campaign.enableStripePayments) {
    throw new Error("Online payments are not enabled for this campaign");
  }

  // Optimistic Concurrency Check: Verify spot is still available before starting payment
  if (positionId && positionId !== "none") {
    try {
      const layout = await shirtLayoutService.getLayoutByCampaignId(campaignId);
      const position = await shirtLayoutService.getPositionDetails(
        layout._id.toString(),
        positionId,
      );

      if (position.isTaken) {
        throw new Error(
          "This position has just been taken by another sponsor. Please select a different spot.",
        );
      }
    } catch (error) {
      if ((error as Error).message.includes("just been taken")) {
        throw error;
      }
      // Ignore other errors here (e.g. layout not found checks are handled later/elsewhere,
      // or we let the main flow proceed and fail if critical)
      // But for "position taken", we block immediately.
      console.log("Optimistic check warning:", error);
    }
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
      sponsorPhone: sponsorData.phone || "",
      sponsorMessage: sponsorData.message || "",
      sponsorType: sponsorData.sponsorType || "text",
      logoUrl: sponsorData.logoUrl || "",
      displayName: sponsorData.displayName || "",
    },
    // Explicitly allow payment methods to debug visibility
    payment_method_types: ["card", "afterpay_clearpay"],
  });

  console.log(
    `Created PaymentIntent ${paymentIntent.id} with methods:`,
    paymentIntent.payment_method_types,
  );
  console.log(`Currency: ${paymentIntent.currency}`);
  console.log(`Amount: ${paymentIntent.amount}`);

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
};

export const handleWebhook = async (
  rawBody: string | Buffer,
  signature: string,
) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    throw new Error(
      `Webhook signature verification failed: ${(err as Error).message}`,
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
    sponsorType,
    logoUrl,
    displayName,
  } = paymentIntent.metadata;

  try {
    // Create sponsorship entry
    const sponsorship = await sponsorshipService.createSponsorship(campaignId, {
      positionId: positionId === "none" ? undefined : positionId,
      name: sponsorName,
      email: sponsorEmail,
      phone: sponsorPhone || undefined,
      message: sponsorMessage || undefined,
      amount: paymentIntent.amount / 100, // Convert from cents
      paymentMethod: (paymentIntent.payment_method_types?.[0] as any) || "card",
      sponsorType: (sponsorType as "text" | "logo") || "text",
      logoUrl: logoUrl || undefined,
      displayName: displayName || undefined,
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

    // AUTOMATIC REFUND: If the sponsorship failed (likely due to race condition on spot reservation),
    // we must refund the user immediately to avoid taking money for a spot they didn't get.
    if (paymentIntent.id) {
      try {
        const stripe = getStripe();
        console.log(
          `Initiating automatic refund for ${paymentIntent.id} due to fulfillment failure.`,
        );

        await stripe.refunds.create({
          payment_intent: paymentIntent.id,
          reason: "duplicate", // closest fit for "logic error / race condition"
          metadata: {
            reason: "System Error: Spot taken or fulfillment failed",
            originalError: (error as Error).message,
          },
        });

        console.log(`Successfully refunded ${paymentIntent.id}`);
      } catch (refundError) {
        // CRITICAL: If refund fails, we have a charged customer with no spot and no refund.
        // This requires manual intervention.
        console.error(
          "CRITICAL: Failed to process automatic refund!",
          refundError,
        );
      }
    }
  }
};

const handlePaymentFailure = async (paymentIntent: Stripe.PaymentIntent) => {
  const { campaignId, positionId, sponsorName } = paymentIntent.metadata;

  console.log(
    `Payment failed for campaign ${campaignId}, position ${positionId}, sponsor ${sponsorName}`,
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
