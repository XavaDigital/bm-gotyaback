import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Radio,
  Button,
  message,
  Alert,
  Spin,
  ConfigProvider,
  theme,
} from "antd";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type {
  CreateSponsorshipRequest,
  CampaignPaymentConfig,
  Campaign,
} from "~/types/campaign.types";
import getStripe from "~/utils/stripe";
import paymentService from "~/services/payment.service";
import sponsorshipService from "~/services/sponsorship.service";
import LogoUpload from "./LogoUpload";

interface SponsorCheckoutModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: CreateSponsorshipRequest) => Promise<void>;
  positionId?: string;
  amount: number;
  currency: string;
  campaignId: string;
  campaign: Campaign;
}

// Separate component for Stripe payment form using the modern PaymentElement
const StripePaymentForm: React.FC<{
  sponsorData: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    campaignId: string;
    positionId?: string;
    amount: number;
    sponsorType?: string;
    logoUrl?: string;
    displayName?: string;
  };
  amount: number;
  currency: string;
  loading: boolean;
}> = ({ clientSecret, sponsorData, amount, currency, loading }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      message.error("Stripe is not loaded");
      return;
    }

    setProcessing(true);
    try {
      // Confirm payment with Stripe - this will handle redirects for Afterpay
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/campaign/${sponsorData.campaignId}?payment_success=true`,
          receipt_email: sponsorData.email,
          payment_method_data: {
            billing_details: {
              name: sponsorData.name,
              email: sponsorData.email,
            },
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // confirmPayment usually redirects. If it doesn't error, it might be a sync payment.
    } catch (error: any) {
      message.error(error.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <PaymentElement />
        <div style={{ fontSize: 12, color: "#888", marginTop: 16 }}>
          🔒 Your payment will be processed securely by Stripe.
        </div>
      </div>

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
          Pay {currency} ${amount}
        </Button>
      </div>
    </div>
  );
};

const CheckoutForm: React.FC<{
  onSubmit: (paymentMethod: "card" | "cash") => Promise<void>;
  sponsorData: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    campaignId: string;
    positionId?: string;
    amount: number;
    sponsorType?: string;
    logoFile?: File;
    displayName?: string;
  };
  amount: number;
  currency: string;
  loading: boolean;
  paymentConfig: CampaignPaymentConfig;
  stripePromise: Promise<any> | null;
}> = ({
  onSubmit,
  sponsorData,
  amount,
  currency,
  loading,
  paymentConfig,
  stripePromise,
}) => {
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
    getDefaultPaymentMethod(),
  );
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [preparingStripe, setPreparingStripe] = useState(false);

  const handleCashSubmit = async () => {
    await onSubmit("cash");
  };

  const prepareStripePayment = async () => {
    if (clientSecret) return;

    setPreparingStripe(true);
    try {
      // Upload logo first if present
      let logoUrl: string | undefined;

      if (sponsorData.logoFile && sponsorData.sponsorType === "logo") {
        try {
          const uploadResult = await sponsorshipService.uploadLogo(
            sponsorData.campaignId,
            sponsorData.logoFile,
          );
          logoUrl = uploadResult.logoUrl;
        } catch (error: any) {
          throw new Error(`Logo upload failed: ${error.message}`);
        }
      }

      // Call backend to create payment intent
      const result = await paymentService.createPaymentIntent({
        campaignId: sponsorData.campaignId,
        positionId: sponsorData.positionId,
        amount,
        sponsorData: {
          name: sponsorData.name,
          email: sponsorData.email,
          phone: sponsorData.phone,
          message: sponsorData.message,
          sponsorType: sponsorData.sponsorType,
          logoUrl: logoUrl,
          displayName: sponsorData.displayName,
        },
      });
      setClientSecret(result.clientSecret);
    } catch (error: any) {
      message.error(error.message || "Failed to prepare payment");
    } finally {
      setPreparingStripe(false);
    }
  };

  useEffect(() => {
    if (paymentMethod === "card" && paymentConfig.enableStripePayments) {
      prepareStripePayment();
    }
  }, [paymentMethod]);

  return (
    <div>
      {!paymentConfig.enableStripePayments &&
        !paymentConfig.allowOfflinePayments && (
          <Alert
            message="No Payment Methods Available"
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
              <Radio value="card">Online Payment (Card, Afterpay, etc.)</Radio>
            )}
            {paymentConfig.allowOfflinePayments && (
              <Radio value="cash">Cash / Bank Transfer (Offline)</Radio>
            )}
          </Radio.Group>
        </Form.Item>
      )}

      {paymentMethod === "card" && paymentConfig.enableStripePayments && (
        <>
          {preparingStripe ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Spin size="small" />
              <div style={{ marginTop: 8 }}>Preparing secure payment...</div>
            </div>
          ) : clientSecret && stripePromise ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripePaymentForm
                sponsorData={{ ...sponsorData }}
                amount={amount}
                currency={currency}
                loading={loading}
              />
            </Elements>
          ) : null}
        </>
      )}

      {paymentMethod === "cash" && (
        <>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#888",
              marginBottom: 16,
            }}
          >
            You'll receive payment instructions after submitting. The campaign
            owner will mark your payment as received once confirmed.
          </div>
          <div
            style={{
              marginTop: 24,
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <Button type="primary" onClick={handleCashSubmit} loading={loading}>
              Submit Sponsorship
            </Button>
          </div>
        </>
      )}
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
  campaign,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sponsorData, setSponsorData] = useState<any>(null);
  const [paymentConfig, setPaymentConfig] =
    useState<CampaignPaymentConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [logoFile, setLogoFile] = useState<File | undefined>(undefined);

  const handleLogoChange = (file: File | undefined) => {
    setLogoFile(file);
  };

  // Set default sponsor type based on campaign settings when modal opens
  useEffect(() => {
    if (visible && campaign) {
      // Set default sponsor type based on campaign settings
      if (campaign.sponsorDisplayType === "logo-only") {
        form.setFieldsValue({ sponsorType: "logo" });
      } else if (campaign.sponsorDisplayType === "text-only") {
        form.setFieldsValue({ sponsorType: "text" });
      } else {
        // Default to logo for "both" option (logo with name)
        form.setFieldsValue({ sponsorType: "logo" });
      }
    }
  }, [visible, campaign, form]);

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

      // Validate logo upload if required
      if (values.sponsorType === "logo" && !logoFile) {
        message.error("Please upload a logo");
        return;
      }

      setSponsorData({
        ...values,
        campaignId,
        positionId,
        amount: finalAmount,
        logoFile: logoFile,
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
      setLogoFile(undefined);
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
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#C8102E",
          colorLink: "#C8102E",
          colorLinkHover: "#A00D25",
          colorBgContainer: "#ffffff",
          colorText: "rgba(0, 0, 0, 0.88)",
          colorTextSecondary: "rgba(0, 0, 0, 0.65)",
          colorTextTertiary: "rgba(0, 0, 0, 0.45)",
          colorBorder: "#d9d9d9",
        },
      }}
    >
      <Modal
        title="Become a Sponsor"
        open={visible}
        onCancel={() => {
          onCancel();
          form.resetFields();
          setSponsorData(null);
          setLogoFile(undefined);
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
                          new Error("Amount must be greater than 0"),
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

            <Form.Item label="Phone Number (Optional)" name="phone">
              <Input placeholder="+64 21 123 4567" />
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

            {/* Hidden field for sponsor type - set by campaign settings */}
            <Form.Item name="sponsorType" hidden>
              <Input />
            </Form.Item>

            {/* Logo Upload - show if campaign is logo-only OR if user selected logo type */}
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.sponsorType !== currentValues.sponsorType
              }
            >
              {({ getFieldValue }) => {
                const sponsorType = getFieldValue("sponsorType");
                const showLogoUpload =
                  campaign?.sponsorDisplayType === "logo-only" ||
                  (campaign?.sponsorDisplayType === "both" &&
                    sponsorType === "logo");

                return showLogoUpload ? (
                  <>
                    <Alert
                      message={
                        campaign?.sponsorDisplayType === "logo-only"
                          ? "Logo Display Only"
                          : "Logo with Name Display"
                      }
                      description={
                        campaign?.sponsorDisplayType === "logo-only"
                          ? "Only your logo will be displayed on the campaign. You can still enter your name for record-keeping purposes."
                          : "Your logo will be displayed with a name underneath. The display name can be different from your sponsor name (e.g., business name vs. personal name)."
                      }
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    <Form.Item
                      label="Logo"
                      required={
                        campaign?.sponsorDisplayType === "logo-only" ||
                        sponsorType === "logo"
                      }
                      extra="PNG, JPG, or SVG • Max 2MB • Min 200x200px • Square recommended"
                    >
                      <LogoUpload
                        value={logoFile}
                        onChange={handleLogoChange}
                      />
                    </Form.Item>
                  </>
                ) : null;
              }}
            </Form.Item>

            {/* Display Name - show only for name+logo display (both type with logo selected) */}
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.sponsorType !== currentValues.sponsorType
              }
            >
              {({ getFieldValue }) => {
                const sponsorType = getFieldValue("sponsorType");
                const showDisplayName =
                  campaign?.sponsorDisplayType === "both" &&
                  sponsorType === "logo";

                return showDisplayName ? (
                  <Form.Item
                    label="Display Name"
                    name="displayName"
                    rules={[
                      {
                        required: true,
                        message: "Please enter a display name",
                      },
                    ]}
                    extra="This name will appear below your logo on the campaign (e.g., your business name)"
                  >
                    <Input placeholder="e.g., Smith Family Business" />
                  </Form.Item>
                ) : null;
              }}
            </Form.Item>

            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
            >
              <Button onClick={onCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Continue to Payment
              </Button>
            </div>
          </Form>
        ) : (
          // Payment step
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

            <CheckoutForm
              onSubmit={handlePaymentSubmit}
              sponsorData={{ ...sponsorData, campaignId, positionId }}
              amount={sponsorData.amount}
              currency={currency}
              loading={loading}
              paymentConfig={paymentConfig}
              stripePromise={stripePromise}
            />
          </>
        )}
      </Modal>
    </ConfigProvider>
  );
};

export default SponsorCheckoutModal;
