import Stripe from "stripe";
import mongoose from "mongoose";
import { SponsorEntry } from "../models/SponsorEntry";
import { Transaction } from "../models/Transaction";
import { FailedRefund } from "../models/FailedRefund";
import * as sponsorshipService from "./sponsorship.service";
import * as campaignService from "./campaign.service";
import * as shirtLayoutService from "./shirtLayout.service";
import { logAudit, AuditAction, AuditLevel } from "../utils/auditLogger";

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
      // Afterpay is only supported for AUD, NZD, and USD.
      // Derive the method list from the campaign's currency so adding a new
      // currency later won't silently pass an unsupported method to Stripe.
      payment_method_types: ["aud", "nzd", "usd"].includes(campaign.currency.toLowerCase())
        ? ["card", "afterpay_clearpay"]
        : ["card"],
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");

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

const persistFailedRefund = async (
  paymentIntent: Stripe.PaymentIntent,
  fulfillmentError: Error,
  refundError?: Error,
): Promise<void> => {
  await FailedRefund.create({
    paymentIntentId: paymentIntent.id,
    campaignId: paymentIntent.metadata.campaignId,
    sponsorEmail: paymentIntent.metadata.sponsorEmail,
    amount: paymentIntent.amount / 100,
    fulfillmentError: fulfillmentError.message,
    refundError: refundError?.message,
    status: refundError ? "pending_manual_refund" : "fulfillment_failed_refunded",
  });
};

const attemptRefund = async (
  paymentIntent: Stripe.PaymentIntent,
  fulfillmentError: Error,
): Promise<void> => {
  const stripe = getStripe();
  const { campaignId } = paymentIntent.metadata;
  console.log(`Initiating automatic refund for ${paymentIntent.id} due to fulfillment failure.`);

  try {
    await stripe.refunds.create({
      payment_intent: paymentIntent.id,
      reason: "duplicate", // closest fit for "logic error / race condition"
      metadata: {
        reason: "System Error: Spot taken or fulfillment failed",
        originalError: fulfillmentError.message,
      },
    });

    logAudit({
      action: AuditAction.PAYMENT_REFUND_SUCCEEDED,
      level: AuditLevel.WARNING,
      details: { paymentIntentId: paymentIntent.id, campaignId, amount: paymentIntent.amount / 100 },
      success: true,
    });

    // Persist a durable record even though the refund succeeded — fulfillment
    // still failed and the customer received no spot, so this needs audit visibility.
    await persistFailedRefund(paymentIntent, fulfillmentError).catch((dbErr) =>
      console.error("Failed to persist fulfillment-failed record:", dbErr),
    );

    console.log(`Successfully refunded ${paymentIntent.id}`);
  } catch (refundError) {
    // CRITICAL: customer was charged but got no spot and the refund also failed.
    try {
      await persistFailedRefund(paymentIntent, fulfillmentError, refundError as Error);
    } catch (dbError) {
      console.error("CRITICAL: Failed to persist FailedRefund record:", dbError);
    }

    logAudit({
      action: AuditAction.PAYMENT_REFUND_FAILED,
      level: AuditLevel.CRITICAL,
      details: { paymentIntentId: paymentIntent.id, campaignId, refundError: (refundError as Error).message },
      success: false,
      errorMessage: (refundError as Error).message,
    });
    console.error(
      "CRITICAL: Failed to process automatic refund — manual intervention required.",
      { paymentIntentId: paymentIntent.id, refundError },
    );
  }
};

const attemptFulfillment = async (paymentIntent: Stripe.PaymentIntent): Promise<void> => {
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
      amount: paymentIntent.amount / 100,
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

  logAudit({
    action: AuditAction.PAYMENT_SUCCESS,
    level: AuditLevel.INFO,
    resourceType: "SponsorEntry",
    resourceId: sponsorship._id.toString(),
    details: { paymentIntentId: paymentIntent.id, amount: paymentIntent.amount / 100, campaignId },
    success: true,
  });
};

const handlePaymentSuccess = async (paymentIntent: Stripe.PaymentIntent) => {
  try {
    await attemptFulfillment(paymentIntent);
  } catch (error) {
    logAudit({
      action: AuditAction.PAYMENT_FULFILLMENT_FAILURE,
      level: AuditLevel.ERROR,
      details: {
        paymentIntentId: paymentIntent.id,
        campaignId: paymentIntent.metadata.campaignId,
        error: (error as Error).message,
      },
      success: false,
      errorMessage: (error as Error).message,
    });
    console.error("Error handling payment success:", error);

    // AUTOMATIC REFUND: If fulfillment failed (likely a race condition on spot reservation),
    // refund immediately so the customer is not charged for a spot they didn't receive.
    await attemptRefund(paymentIntent, error as Error);
  }
};

const handlePaymentFailure = async (paymentIntent: Stripe.PaymentIntent) => {
  const { campaignId, positionId } = paymentIntent.metadata;

  logAudit({
    action: AuditAction.PAYMENT_FAILURE,
    level: AuditLevel.WARNING,
    details: { paymentIntentId: paymentIntent.id, campaignId, positionId },
    success: false,
  });

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
