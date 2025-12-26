import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Alert,
  Descriptions,
  Tag,
  message,
} from "antd";
import { CopyOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Campaign } from "../types/campaign.types";
import campaignService from "../services/campaign.service";

const { RangePicker } = DatePicker;

interface DuplicateCampaignModalProps {
  visible: boolean;
  campaign: Campaign | null;
  onCancel: () => void;
  onSuccess: (newCampaign: Campaign) => void;
}

const DuplicateCampaignModal: React.FC<DuplicateCampaignModalProps> = ({
  visible,
  campaign,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleDuplicate = async () => {
    if (!campaign) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const [startDate, endDate] = values.dates || [];

      const newCampaign = await campaignService.duplicateCampaign(
        campaign._id,
        {
          title: values.title,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
        }
      );

      message.success(
        "Campaign duplicated successfully! The new campaign is in draft status."
      );
      form.resetFields();
      onSuccess(newCampaign);
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error
        return;
      }
      message.error(
        error.response?.data?.message || "Failed to duplicate campaign"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  if (!campaign) return null;

  const getCampaignTypeLabel = (type: string) => {
    switch (type) {
      case "fixed":
        return "Fixed Price";
      case "positional":
        return "Positional Pricing";
      case "pay-what-you-want":
        return "Pay What You Want";
      default:
        return type;
    }
  };

  const getLayoutStyleLabel = (style: string) => {
    switch (style) {
      case "ordered":
        return "Ordered Grid";
      case "sections":
        return "Tiered Sections";
      case "cloud":
        return "Word Cloud";
      case "list":
        return "List";
      case "word-cloud":
        return "Word Cloud";
      default:
        return style;
    }
  };

  return (
    <Modal
      title={
        <span>
          <CopyOutlined /> Duplicate Campaign
        </span>
      }
      open={visible}
      onCancel={handleCancel}
      onOk={handleDuplicate}
      okText="Duplicate Campaign"
      confirmLoading={loading}
      width={700}
      destroyOnClose
    >
      <Alert
        message="Create a copy of this campaign"
        description="All settings will be copied. The duplicated campaign will be set to draft status."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Descriptions
        title="Campaign to Duplicate"
        bordered
        size="small"
        column={1}
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Title">{campaign.title}</Descriptions.Item>
        <Descriptions.Item label="Type">
          <Tag color="blue">{getCampaignTypeLabel(campaign.campaignType)}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Layout">
          <Tag color="green">{getLayoutStyleLabel(campaign.layoutStyle)}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Garment">
          <Tag>{campaign.garmentType}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Currency">
          {campaign.currency}
        </Descriptions.Item>
      </Descriptions>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          title: `${campaign.title} (Copy)`,
        }}
      >
        <Form.Item
          label="Campaign Title"
          name="title"
          rules={[
            { required: true, message: "Please enter a campaign title" },
            { min: 3, message: "Title must be at least 3 characters" },
          ]}
          extra="Enter a name for the duplicated campaign"
        >
          <Input placeholder="Enter campaign title" />
        </Form.Item>

        <Form.Item
          label="Campaign Duration"
          name="dates"
          rules={[
            { required: true, message: "Please select campaign dates" },
            {
              validator: (_, value) => {
                if (!value || !value[0] || !value[1]) {
                  return Promise.resolve();
                }
                const [start, end] = value;
                if (end.isBefore(start)) {
                  return Promise.reject(
                    new Error("End date must be after start date")
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
          extra="Choose new dates for the duplicated campaign"
        >
          <RangePicker
            style={{ width: "100%" }}
            disabledDate={(current) => {
              return current && current < dayjs().startOf("day");
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DuplicateCampaignModal;
