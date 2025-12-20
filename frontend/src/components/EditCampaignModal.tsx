import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Checkbox,
  message,
  Select,
  InputNumber,
  Divider,
  Alert,
  Tooltip,
  Switch,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";
import { InfoCircleOutlined } from "@ant-design/icons";
import type {
  Campaign,
  UpdateCampaignRequest,
  UpdatePricingRequest,
} from "../types/campaign.types";
import campaignService from "../services/campaign.service";
import sponsorshipService from "../services/sponsorship.service";
import RichTextEditor from "./RichTextEditor";

const { RangePicker } = DatePicker;

interface EditCampaignModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  campaign: Campaign | null;
}

const EditCampaignModal: React.FC<EditCampaignModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  campaign,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [hasSponsors, setHasSponsors] = useState(false);
  const [checkingSponsors, setCheckingSponsors] = useState(false);

  useEffect(() => {
    if (visible && campaign) {
      checkSponsors();

      // Initialize form values
      const formValues: any = {
        title: campaign.title,
        description: campaign.description,
        enableStripePayments: campaign.enableStripePayments,
        allowOfflinePayments: campaign.allowOfflinePayments,
        garmentType: campaign.garmentType,
        dates: [
          campaign.startDate ? dayjs(campaign.startDate) : null,
          campaign.endDate ? dayjs(campaign.endDate) : null,
        ],
      };

      // Initialize pricing values if needed (fetching from backend layout would be improved,
      // but for now we rely on user input/defaults or a separate fetch if we want pre-fill accuracy)
      // Note: Since we don't have pricing in the campaign object directly (it's in layout),
      // and we didn't add a 'getLayout' call here, valid pricing fields will start empty or we'd need to fetch.
      // For simplicity in this edit flow, we will leave them empty as "update if you want to change".
      // However, to be user friendly, let's verify if we should fetch layout.
      // A better UX is to fetch the layout to pre-fill.

      form.setFieldsValue(formValues);

      if (campaign.campaignType !== "donation") {
        loadPricing(campaign._id);
      }
    }
  }, [visible, campaign, form]);

  const checkSponsors = async () => {
    if (!campaign) return;
    setCheckingSponsors(true);
    try {
      // We can check if the sponsor list is empty.
      // Reuse existing service method or add a count method.
      // existing: getSponsors returns full list.
      const sponsors = await sponsorshipService.getSponsors(campaign._id);
      setHasSponsors(sponsors.length > 0);
    } catch (error) {
      console.error("Failed to check sponsors", error);
    } finally {
      setCheckingSponsors(false);
    }
  };

  const loadPricing = async (campaignId: string) => {
    try {
      const layout = await campaignService.getLayout(campaignId);
      if (layout && layout.placements && layout.placements.length > 0) {
        // Infer pricing from placements
        // For Fixed: take first price
        // For Placement: take representatives from zones

        // Helper to find price by row
        const getPriceAtRow = (r: number) => {
          // Find a placement that matches Row `r`
          const p = layout.placements.find((p) =>
            p.positionId.includes(`R${r + 1}C`)
          );
          return p ? p.price : undefined;
        };

        const pricingValues: any = {};
        if (campaign?.campaignType === "fixed") {
          pricingValues.fixedPrice = layout.placements[0]?.price;
        } else if (campaign?.campaignType === "placement") {
          const rows = layout.rows;
          pricingValues.zonePricing = {
            top: getPriceAtRow(0), // Top zone (0)
            middle: getPriceAtRow(Math.floor(rows / 2)), // Middleish
            bottom: getPriceAtRow(rows - 1), // Bottom
          };
        }

        form.setFieldsValue({ pricing: pricingValues });
      }
    } catch (error) {
      console.error("Failed to load layout pricing", error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 1. Update basic fields
      const updateData: UpdateCampaignRequest = {
        title: values.title,
        shortDescription: values.shortDescription,
        description: values.description,
        enableStripePayments: values.enableStripePayments,
        allowOfflinePayments: values.allowOfflinePayments,
        garmentType: values.garmentType,
      };

      if (values.dates && values.dates.length === 2) {
        updateData.startDate = values.dates[0].toISOString();
        updateData.endDate = values.dates[1].toISOString();
      }

      if (campaign) {
        await campaignService.updateCampaign(campaign._id, updateData);

        // 2. Update pricing if applicable and safe
        if (
          campaign.campaignType !== "donation" &&
          !hasSponsors &&
          values.pricing
        ) {
          const pricingData: UpdatePricingRequest = {};
          if (campaign.campaignType === "fixed") {
            pricingData.fixedPrice = values.pricing.fixedPrice;
          } else if (campaign.campaignType === "placement") {
            pricingData.zonePricing = values.pricing.zonePricing;
          }

          await campaignService.updatePricing(campaign._id, pricingData);
        }

        message.success("Campaign updated successfully");
        onSuccess();
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Failed to update campaign"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Campaign"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Save Changes"
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Campaign Title"
          name="title"
          rules={[{ required: true, message: "Please enter a title" }]}
        >
          <Input placeholder="Campaign Title" />
        </Form.Item>

        <Form.Item
          label="Short Description"
          name="shortDescription"
          extra="A brief summary (max 200 characters) shown on campaign cards"
        >
          <Input.TextArea
            rows={2}
            maxLength={200}
            showCount
            placeholder="A brief summary of your campaign..."
          />
        </Form.Item>

        <Form.Item label="Full Description" name="description">
          <RichTextEditor placeholder="Campaign Description" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Garment Type"
              name="garmentType"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="singlet">Singlet</Select.Option>
                <Select.Option value="tshirt">T-Shirt</Select.Option>
                <Select.Option value="hoodie">Hoodie</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Campaign Duration"
              name="dates"
              rules={[
                { required: true, message: "Please select campaign dates" },
              ]}
            >
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Payment Methods</Divider>

        <Alert
          title="At least one payment method must be enabled"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          label="Enable Online Payments (Stripe)"
          name="enableStripePayments"
          valuePropName="checked"
          tooltip="Allow sponsors to pay with credit/debit cards via Stripe"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Allow Offline Payments"
          name="allowOfflinePayments"
          valuePropName="checked"
          tooltip="Allow sponsors to pledge and pay manually (cash, bank transfer, etc.)"
        >
          <Switch />
        </Form.Item>

        {/* Pricing Section */}
        {campaign && campaign.campaignType !== "donation" && (
          <>
            <Divider orientation="left">Pricing Configuration</Divider>

            {checkingSponsors ? (
              <div style={{ marginBottom: 16 }}>
                Checking pricing availability...
              </div>
            ) : hasSponsors ? (
              <Alert
                title="Pricing Cannot Be Changed"
                description="Pricing updates are disabled because this campaign already has sponsors. This ensures fairness and data integrity."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            ) : (
              <Alert
                title="Update Pricing"
                description="You can update pricing since there are no sponsors yet."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <div
              style={{
                opacity: hasSponsors ? 0.5 : 1,
                pointerEvents: hasSponsors ? "none" : "auto",
              }}
            >
              {campaign.campaignType === "fixed" && (
                <Form.Item
                  label="Price per Spot"
                  name={["pricing", "fixedPrice"]}
                  rules={[
                    { required: !hasSponsors, message: "Please enter a price" },
                  ]}
                >
                  <InputNumber min={1} prefix="$" style={{ width: "100%" }} />
                </Form.Item>
              )}

              {campaign.campaignType === "placement" && (
                <>
                  <Form.Item
                    label="Top Zone Price"
                    name={["pricing", "zonePricing", "top"]}
                    rules={[{ required: !hasSponsors, message: "Required" }]}
                  >
                    <InputNumber min={1} prefix="$" style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item
                    label="Middle Zone Price"
                    name={["pricing", "zonePricing", "middle"]}
                    rules={[{ required: !hasSponsors, message: "Required" }]}
                  >
                    <InputNumber min={1} prefix="$" style={{ width: "100%" }} />
                  </Form.Item>
                  <Form.Item
                    label="Bottom Zone Price"
                    name={["pricing", "zonePricing", "bottom"]}
                    rules={[{ required: !hasSponsors, message: "Required" }]}
                  >
                    <InputNumber min={1} prefix="$" style={{ width: "100%" }} />
                  </Form.Item>
                </>
              )}
            </div>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default EditCampaignModal;
