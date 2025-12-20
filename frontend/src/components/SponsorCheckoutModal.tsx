import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Radio, Button, message, Alert, Spin } from "antd";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type {
  CreateSponsorshipRequest,
  CampaignPaymentConfig,
} from "../types/campaign.types";
import getStripe from "../utils/stripe";
import paymentService from "../services/payment.service";

interface SponsorCheckoutModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: CreateSponsorshipRequest) => Promise<void>;
  positionId?: string;
  amount: number;
  currency: string;
  campaignId: string;
}

// Offline payment form (no Stripe)
const OfflinePaymentForm: React.FC<{
  onSubmit: (paymentMethod: "card" | "cash") => Promise<void>;
  loading: boolean;
}> = ({ onSubmit, loading }) => {
  return (
    <div>
      <Alert
        title="Offline Payment"
        description="You will be contacted by the campaign organizer with payment instructions."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button
          onClick={() => onSubmit("cash")}
          type="primary"
          loading={loading}
        >
          Confirm Pledge
        </Button>
      </div>
    </div>
  );
};

// Stripe payment form
const CheckoutForm: React.FC<{
  onSubmit: (paymentMethod: "card" | "cash") => Promise<void>;
  sponsorData: {
    name: string;
    email: string;
    message?: string;
    campaignId: string;
    positionId?: string;
    amount: number;
  };
  amount: number;
  currency: string;
  loading: boolean;
  paymentConfig: CampaignPaymentConfig;
}> = ({ onSubmit, sponsorData, amount, currency, loading, paymentConfig }) => {
  const stripe = useStripe();
  const elements = useElements();

  // Determine default payment method based on what's available
  const getDefaultPaymentMethod = (): "card" | "cash" => {
    if (
      paymentConfig.enableStripePayments &&
      !paymentConfig.allowOfflinePayments
    ) {
      return "card";
    }
    return "cash";
  };

  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">(
    getDefaultPaymentMethod()
  );
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async () => {
    if (paymentMethod === "cash") {
      await onSubmit("cash");
      return;
    }

    // Handle card payment
    if (!stripe || !elements) {
      message.error("Stripe is not loaded");
      return;
    }

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      message.error("Card element not found");
      return;
    }

    setProcessing(true);
    try {
      // Call backend to create payment intent
      const { clientSecret } = await paymentService.createPaymentIntent({
        campaignId: sponsorData.campaignId,
        positionId: sponsorData.positionId,
        amount,
        sponsorData: {
          name: sponsorData.name,
          email: sponsorData.email,
          message: sponsorData.message,
        },
      });

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: sponsorData.name,
              email: sponsorData.email,
            },
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === "succeeded") {
        message.success("Payment successful!");
        await onSubmit("card");
      }
    } catch (error: any) {
      message.error(error.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      {!paymentConfig.enableStripePayments &&
        !paymentConfig.allowOfflinePayments && (
          <Alert
            title="No Payment Methods Available"
            description="This campaign has no payment methods enabled. Please contact the campaign organizer."
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

      {(paymentConfig.enableStripePayments ||
        paymentConfig.allowOfflinePayments) && (
        <Form.Item label="Payment Method">
          <Radio.Group
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            {paymentConfig.enableStripePayments && (
              <Radio value="card">Credit/Debit Card</Radio>
            )}
            {paymentConfig.allowOfflinePayments && (
              <Radio value="cash">Cash / Bank Transfer (Offline)</Radio>
            )}
          </Radio.Group>
        </Form.Item>
      )}

      {paymentMethod === "card" && (
        <div style={{ marginTop: 16, marginBottom: 16 }}>
          {/* Card Number */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Card Number
            </label>
            <div
              style={{
                padding: 12,
                border: "1px solid #d9d9d9",
                borderRadius: 4,
              }}
            >
              <CardNumberElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      "::placeholder": {
                        color: "#aab7c4",
                      },
                    },
                    invalid: {
                      color: "#9e2146",
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Expiry and CVC in a row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Expiry Date
              </label>
              <div
                style={{
                  padding: 12,
                  border: "1px solid #d9d9d9",
                  borderRadius: 4,
                }}
              >
                <CardExpiryElement
                  options={{
                    style: {
                      base: {
                        fontSize: "16px",
                        color: "#424770",
                        "::placeholder": {
                          color: "#aab7c4",
                        },
                      },
                      invalid: {
                        color: "#9e2146",
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                CVC
              </label>
              <div
                style={{
                  padding: 12,
                  border: "1px solid #d9d9d9",
                  borderRadius: 4,
                }}
              >
                <CardCvcElement
                  options={{
                    style: {
                      base: {
                        fontSize: "16px",
                        color: "#424770",
                        "::placeholder": {
                          color: "#aab7c4",
                        },
                      },
                      invalid: {
                        color: "#9e2146",
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: "#888" }}>
            🔒 Your payment will be processed securely by Stripe.
          </div>
        </div>
      )}

      {paymentMethod === "cash" && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
          You'll receive payment instructions after submitting. The campaign
          owner will mark your payment as received once confirmed.
        </div>
      )}

      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={loading || processing}
        >
          {paymentMethod === "card"
            ? `Pay ${currency} $${amount}`
            : "Submit Sponsorship"}
        </Button>
      </div>
    </div>
  );
};

const SponsorCheckoutModal: React.FC<SponsorCheckoutModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  positionId,
  amount,
  currency,
  campaignId,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sponsorData, setSponsorData] = useState<any>(null);
  const [paymentConfig, setPaymentConfig] =
    useState<CampaignPaymentConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);

  // Fetch payment config when modal opens
  useEffect(() => {
    if (visible && campaignId) {
      fetchPaymentConfig();
    }
  }, [visible, campaignId]);

  const fetchPaymentConfig = async () => {
    try {
      setLoadingConfig(true);
      const config = await paymentService.getCampaignConfig(campaignId);
      setPaymentConfig(config);

      // Only load Stripe if it's enabled for this campaign
      if (config.enableStripePayments) {
        const stripe = await getStripe(campaignId);
        setStripePromise(Promise.resolve(stripe));
      } else {
        setStripePromise(null);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load payment configuration";
      message.error(errorMessage);
      console.error("Failed to fetch payment config:", error);
      console.error("Error details:", error.response?.data);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const finalAmount = positionId ? amount : parseFloat(values.amount);
      setSponsorData({
        ...values,
        campaignId,
        positionId,
        amount: finalAmount,
      });
    } catch (error) {
      // Validation error
    }
  };

  const handlePaymentSubmit = async (paymentMethod: "card" | "cash") => {
    setLoading(true);
    try {
      // For card payments, the sponsorship is created by the webhook
      // For cash payments, create it directly
      if (paymentMethod === "cash") {
        await onSubmit({
          ...sponsorData,
          paymentMethod: "cash",
        });
      }

      form.resetFields();
      setSponsorData(null);
      onCancel();

      // Show success message for card payments
      if (paymentMethod === "card") {
        message.success("Payment successful! The spot will update shortly.");
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Become a Sponsor"
      open={visible}
      onCancel={() => {
        onCancel();
        form.resetFields();
        setSponsorData(null);
      }}
      footer={null}
      width={550}
    >
      {loadingConfig ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading payment options...</div>
        </div>
      ) : !paymentConfig ? (
        <Alert
          message="Error"
          description="Failed to load payment configuration. Please try again."
          type="error"
          showIcon
        />
      ) : !sponsorData ? (
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          {positionId && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                backgroundColor: "#f0f0f0",
                borderRadius: 4,
              }}
            >
              <strong>Position:</strong> {positionId}
              <br />
              <strong>Amount:</strong> {currency} ${amount}
            </div>
          )}

          {!positionId && (
            <Form.Item
              label={`Donation Amount (${currency})`}
              name="amount"
              rules={[
                { required: true, message: "Please enter an amount" },
                {
                  validator: async (_, value) => {
                    if (value && parseFloat(value) <= 0) {
                      return Promise.reject(
                        new Error("Amount must be greater than 0")
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                type="number"
                prefix="$"
                placeholder="10.00"
                min={1}
                step={0.01}
              />
            </Form.Item>
          )}

          <Form.Item
            label="Your Name"
            name="name"
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <Input placeholder="John Doe" />
          </Form.Item>

          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="john@example.com" />
          </Form.Item>

          <Form.Item
            label="Message / Dedication (Optional)"
            name="message"
            rules={[
              { max: 100, message: "Message must be 100 characters or less" },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Good luck! We're proud of you!"
              maxLength={100}
              showCount
            />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Continue to Payment
            </Button>
          </div>
        </Form>
      ) : paymentConfig.enableStripePayments && stripePromise ? (
        <Elements stripe={stripePromise}>
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              backgroundColor: "#f0f0f0",
              borderRadius: 4,
            }}
          >
            <strong>Name:</strong> {sponsorData.name} ({sponsorData.email})
            {sponsorData.message && (
              <>
                <br />
                <strong>Message:</strong> {sponsorData.message}
              </>
            )}
            <br />
            <strong>Amount:</strong> {currency} ${sponsorData.amount}
          </div>
          <CheckoutForm
            onSubmit={handlePaymentSubmit}
            sponsorData={{ ...sponsorData, campaignId, positionId }}
            amount={sponsorData.amount}
            currency={currency}
            loading={loading}
            paymentConfig={paymentConfig}
          />
        </Elements>
      ) : (
        // Offline payments only (no Stripe)
        <>
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              backgroundColor: "#f0f0f0",
              borderRadius: 4,
            }}
          >
            <strong>Name:</strong> {sponsorData.name} ({sponsorData.email})
            {sponsorData.message && (
              <>
                <br />
                <strong>Message:</strong> {sponsorData.message}
              </>
            )}
            <br />
            <strong>Amount:</strong> {currency} ${sponsorData.amount}
          </div>
          <OfflinePaymentForm
            onSubmit={handlePaymentSubmit}
            loading={loading}
          />
        </>
      )}
    </Modal>
  );
};

export default SponsorCheckoutModal;
