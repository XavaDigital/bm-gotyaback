import Stripe from "stripe";
import mongoose from "mongoose";
import { SponsorEntry } from "../models/SponsorEntry";
import { Transaction } from "../models/Transaction";
import { FailedRefund } from "../models/FailedRefund";
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

  // Atomically reserve the position BEFORE creating the PaymentIntent.
  // This prevents two concurrent checkouts from both receiving a client_secret
  // for the same spot and racing to the webhook.
  let reservedLayoutId: string | undefined;
  const shouldReserve =
    (campaign.campaignType === "positional" || campaign.campaignType === "fixed") &&
    positionId &&
    positionId !== "none";

  if (shouldReserve) {
    try {
      const layout = await shirtLayoutService.getLayoutByCampaignId(campaignId);
      await shirtLayoutService.reservePosition(layout._id.toString(), positionId!);
      reservedLayoutId = layout._id.toString();
    } catch {
      throw new Error(
        "This position has just been taken by another sponsor. Please select a different spot.",
      );
    }
  }

  // Get Stripe instance (will throw if not configured)
  const stripe = getStripe();

  // Create Payment Intent — release the reservation if Stripe call fails.
  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
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
  } catch (stripeError) {
    if (reservedLayoutId && positionId) {
      await shirtLayoutService.releasePosition(reservedLayoutId, positionId).catch((e) =>
        console.error("Failed to release position after Stripe error:", e),
      );
    }
    throw stripeError;
  }

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
    // Create sponsorship entry — position was already reserved in createPaymentIntent,
    // so skip the second reservation attempt in createSponsorship.
    const sponsorship = await sponsorshipService.createSponsorship(
      campaignId,
      {
        positionId: positionId === "none" ? undefined : positionId,
        name: sponsorName,
        email: sponsorEmail,
        phone: sponsorPhone || undefined,
        message: sponsorMessage || undefined,
        amount: paymentIntent.amount / 100, // Convert from cents
        paymentMethod: (
          ({ card: "card", afterpay_clearpay: "afterpay" } as Record<string, "card" | "afterpay">)[
            paymentIntent.payment_method_types?.[0] ?? ""
          ] ?? "card"
        ),
        sponsorType: (sponsorType as "text" | "logo") || "text",
        logoUrl: logoUrl || undefined,
        displayName: displayName || undefined,
      },
      true, // positionAlreadyReserved
    );

    // Atomically mark as paid and record the transaction in a single MongoDB session.
    // Requires MongoDB replica set (Atlas or self-hosted RS) — transactions are no-ops
    // on standalone instances and will throw if sessions are unsupported.
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        sponsorship.paymentStatus = "paid";
        await sponsorship.save({ session });

        await Transaction.create(
          [
            {
              sponsorEntryId: sponsorship._id,
              provider: "stripe",
              providerRef: paymentIntent.id,
              status: "success",
              amount: paymentIntent.amount / 100,
            },
          ],
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
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
        // CRITICAL: customer was charged but got no spot and the refund failed.
        // Persist a durable record first so it survives beyond log retention,
        // then log for immediate alerting.
        try {
          await FailedRefund.create({
            paymentIntentId: paymentIntent.id,
            campaignId: paymentIntent.metadata.campaignId,
            sponsorEmail: paymentIntent.metadata.sponsorEmail,
            amount: paymentIntent.amount / 100,
            fulfillmentError: (error as Error).message,
            refundError: (refundError as Error).message,
          });
        } catch (dbError) {
          console.error("CRITICAL: Failed to persist FailedRefund record:", dbError);
        }
        console.error(
          "CRITICAL: Failed to process automatic refund — manual intervention required.",
          { paymentIntentId: paymentIntent.id, refundError },
        );
      }
    }
  }
};

const handlePaymentFailure = async (paymentIntent: Stripe.PaymentIntent) => {
  const { campaignId, positionId } = paymentIntent.metadata;

  if (!positionId || positionId === "none" || !campaignId) return;

  try {
    const campaign = await campaignService.getCampaignById(campaignId);
    if (
      campaign.campaignType === "positional" ||
      campaign.campaignType === "fixed"
    ) {
      const layout = await shirtLayoutService.getLayoutByCampaignId(campaignId);
      await shirtLayoutService.releasePosition(layout._id.toString(), positionId);
      console.log(
        `Released position ${positionId} for campaign ${campaignId} after payment failure (intent ${paymentIntent.id})`,
      );
    }
  } catch (error) {
    console.error(
      `Failed to release position ${positionId} for campaign ${campaignId} after payment failure (intent ${paymentIntent.id}):`,
      error,
    );
  }
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
