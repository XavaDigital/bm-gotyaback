import mongoose from "mongoose";

const failedRefundSchema = new mongoose.Schema(
  {
    paymentIntentId: { type: String, required: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    sponsorEmail: { type: String },
    amount: { type: Number, required: true },
    fulfillmentError: { type: String },
    refundError: { type: String },
    status: {
      type: String,
      enum: ["pending_manual_refund", "fulfillment_failed_refunded"],
      default: "pending_manual_refund",
    },
  },
  { timestamps: true },
);

failedRefundSchema.index({ status: 1, createdAt: -1 });

export const FailedRefund = mongoose.model("FailedRefund", failedRefundSchema);
