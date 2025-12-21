import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Steps,
  Button,
  DatePicker,
  InputNumber,
  Radio,
  Card,
  Switch,
  Alert,
  Row,
  Col,
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import RichTextEditor from "./RichTextEditor";

const { RangePicker } = DatePicker;

interface CampaignWizardProps {
  mode: "create" | "edit";
  initialCampaignData?: any;
  initialLayoutData?: any;
  onSubmit: (campaignData: any, layoutData: any) => Promise<void>;
  submitButtonText?: string;
  loading?: boolean;
  hasSponsors?: boolean;
}

/**
 * CampaignWizard - The EXACT SAME wizard used in both CreateCampaign and EditCampaignModal
 * This is the single source of truth for the campaign form
 */
const CampaignWizard: React.FC<CampaignWizardProps> = ({
  mode,
  initialCampaignData = {},
  initialLayoutData = {},
  onSubmit,
  submitButtonText = "Submit",
  loading = false,
  hasSponsors = false,
}) => {
  const [current, setCurrent] = useState(0);
  const [campaignData, setCampaignData] = useState<any>(initialCampaignData);
  const [layoutData, setLayoutData] = useState<any>(initialLayoutData);
  const [form] = Form.useForm();
  const [headerImageFile, setHeaderImageFile] = useState<File | undefined>(
    undefined
  );
  const [headerImageFileList, setHeaderImageFileList] = useState<UploadFile[]>(
    []
  );

  // Custom styles for form labels
  const formLabelStyle = `
    /* Make all labels bold */
    .campaign-wizard-form .ant-form-item-label > label {
      font-weight: 600;
      display: flex;
      flex-direction: row-reverse;
      justify-content: flex-end;
      align-items: center;
    }

    /* Hide the ::after pseudo-element that appears on the left */
    .campaign-wizard-form .ant-form-item-label > label::after {
      display: none !important;
      content: '' !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Remove default spacing from the required marker */
    .campaign-wizard-form .ant-form-item-required .ant-form-item-label > label .ant-form-item-required-mark {
      margin-inline-end: 0 !important;
      margin-inline-start: 4px !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    /* Remove any padding/margin from label text */
    .campaign-wizard-form .ant-form-item-label > label > span {
      margin: 0 !important;
      padding: 0 !important;
    }
  `;

  // Update campaignData when initialCampaignData changes (for edit mode)
  useEffect(() => {
    if (mode === "edit" && initialCampaignData) {
      setCampaignData(initialCampaignData);
    }
  }, [mode, initialCampaignData]);

  // Update form fields when step changes
  useEffect(() => {
    if (current === 0) {
      // Step 0: Basic Info
      form.setFieldsValue({
        title: campaignData.title,
        shortDescription: campaignData.shortDescription,
        description: campaignData.description,
        garmentType: campaignData.garmentType,
      });
    } else if (current === 1) {
      // Step 1: Campaign Type
      form.setFieldsValue({
        campaignType: campaignData.campaignType,
        sponsorDisplayType: campaignData.sponsorDisplayType || "text-only",
        layoutStyle: campaignData.layoutStyle || "grid",
      });
    } else if (current === 2) {
      // Step 2: Configuration
      if (mode === "create") {
        form.setFieldsValue(layoutData);
      } else {
        // Edit mode - set pricing values, pricing mode, and layout config
        const editModeValues: any = {};

        console.log("Step 2 - campaignData.pricing:", campaignData.pricing);
        console.log(
          "Step 2 - campaignData.layoutConfig:",
          campaignData.layoutConfig
        );

        if (campaignData.pricing) {
          editModeValues.pricing = campaignData.pricing;
        }

        if (campaignData.layoutConfig) {
          editModeValues.layoutConfig = campaignData.layoutConfig;
        }

        console.log("Setting edit mode configuration values:", editModeValues);
        console.log(
          "Current form values before setFieldsValue:",
          form.getFieldsValue()
        );
        form.setFieldsValue(editModeValues);
        console.log(
          "Current form values after setFieldsValue:",
          form.getFieldsValue()
        );
      }
    } else if (current === 3) {
      // Step 3: Settings
      form.setFieldsValue({
        dates: campaignData.dates,
        currency: campaignData.currency,
        enableStripePayments: campaignData.enableStripePayments,
        allowOfflinePayments: campaignData.allowOfflinePayments,
      });
    }
  }, [current, campaignData, layoutData, mode, form]);

  const next = () => {
    form.validateFields().then((values) => {
      console.log(`=== Next from step ${current} ===`);
      console.log("Form values:", values);
      console.log("Current campaignData before merge:", campaignData);

      if (current === 0) {
        setCampaignData({ ...campaignData, ...values });
      } else if (current === 2) {
        // Step 2 is Configuration - save to layoutData in create mode, campaignData in edit mode
        if (mode === "create") {
          console.log("Saving to layoutData (create mode)");
          setLayoutData({ ...layoutData, ...values });
        } else {
          console.log("Saving to campaignData (edit mode)");
          const newCampaignData = { ...campaignData, ...values };
          console.log("New campaignData after merge:", newCampaignData);
          setCampaignData(newCampaignData);
        }
      } else {
        setCampaignData({ ...campaignData, ...values });
      }
      setCurrent(current + 1);
    });
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      console.log("=== CampaignWizard handleSubmit ===");
      console.log("Mode:", mode);
      console.log("Current step:", current);
      console.log("Form values from current step:", values);
      console.log("Accumulated campaignData:", campaignData);
      console.log("Accumulated layoutData:", layoutData);

      // Start with accumulated campaignData
      let finalCampaignData = { ...campaignData };

      // Extract dates from RangePicker (from current step - Settings)
      if (values.dates && values.dates.length === 2) {
        finalCampaignData.startDate = values.dates[0].toISOString();
        finalCampaignData.endDate = values.dates[1].toISOString();
        delete values.dates;
      }

      // Merge current step values (Settings step)
      finalCampaignData = { ...finalCampaignData, ...values };

      // Merge pricingConfig from layoutData into campaignData (for create mode)
      let finalLayoutData = { ...layoutData };
      if (mode === "create" && layoutData.pricingConfig) {
        finalCampaignData.pricingConfig = {
          ...finalCampaignData.pricingConfig,
          ...layoutData.pricingConfig,
        };
      }

      // For edit mode, pricing is already in campaignData.pricing from step 2
      // No need to do anything special - it's already accumulated

      // Add header image file if present
      if (headerImageFile) {
        finalCampaignData.headerImageFile = headerImageFile;
      }

      console.log("Final campaignData to submit:", finalCampaignData);
      console.log("Final layoutData to submit:", finalLayoutData);

      await onSubmit(finalCampaignData, finalLayoutData);
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  // EXACT SAME STEPS AS CreateCampaign
  const steps = [
    {
      title: "Basic Info",
      content: (
        <Form form={form} layout="vertical" initialValues={campaignData}>
          <Form.Item
            label="Campaign Title"
            name="title"
            rules={[{ required: true, message: "Please enter a title" }]}
          >
            <Input placeholder="My Fundraising Campaign 2025" />
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
            <RichTextEditor placeholder="Tell people about your campaign..." />
          </Form.Item>

          <Form.Item
            label="Header Image"
            extra="Optional banner image displayed at the top of your campaign page (max 5MB, PNG or JPG)"
          >
            <Upload
              accept="image/png,image/jpeg,image/jpg"
              maxCount={1}
              fileList={headerImageFileList}
              beforeUpload={(file) => {
                // Validate file type
                const isImage =
                  file.type === "image/png" ||
                  file.type === "image/jpeg" ||
                  file.type === "image/jpg";
                if (!isImage) {
                  message.error("You can only upload PNG or JPG files!");
                  return Upload.LIST_IGNORE;
                }

                // Validate file size (5MB)
                const isLt5M = file.size / 1024 / 1024 < 5;
                if (!isLt5M) {
                  message.error("Image must be smaller than 5MB!");
                  return Upload.LIST_IGNORE;
                }

                setHeaderImageFile(file);
                setHeaderImageFileList([
                  {
                    uid: file.uid,
                    name: file.name,
                    status: "done",
                    url: URL.createObjectURL(file),
                  },
                ]);
                return false; // Prevent auto upload
              }}
              onRemove={() => {
                setHeaderImageFile(undefined);
                setHeaderImageFileList([]);
              }}
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>Select Image</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            label="Garment Type"
            name="garmentType"
            rules={[
              { required: true, message: "Please select a garment type" },
            ]}
          >
            <Select
              placeholder="Select garment type"
              disabled={mode === "edit"}
            >
              <Select.Option value="singlet">Singlet</Select.Option>
              <Select.Option value="tshirt">T-Shirt</Select.Option>
              <Select.Option value="hoodie">Hoodie</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      ),
    },
    {
      title: "Campaign Type",
      content: (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            campaignType:
              campaignData.campaignType ||
              (mode === "create" ? "positional" : undefined),
            sponsorDisplayType: campaignData.sponsorDisplayType || "text-only",
            layoutStyle: campaignData.layoutStyle || "grid",
          }}
        >
          <Form.Item
            label="Pricing Strategy"
            name="campaignType"
            rules={[
              { required: true, message: "Please select a pricing strategy" },
            ]}
          >
            <Radio.Group style={{ width: "100%" }}>
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => {
                  const selectedType = getFieldValue("campaignType");

                  return (
                    <Row gutter={16}>
                      <Col span={8}>
                        <Card
                          style={{
                            height: "100%",
                            cursor: "pointer",
                            borderColor:
                              selectedType === "fixed" ? "#1890ff" : undefined,
                            borderWidth: selectedType === "fixed" ? 2 : 1,
                            backgroundColor:
                              selectedType === "fixed" ? "#e6f7ff" : undefined,
                          }}
                          hoverable
                        >
                          <Radio value="fixed" style={{ display: "none" }} />
                          <div
                            onClick={() =>
                              form.setFieldsValue({ campaignType: "fixed" })
                            }
                          >
                            <strong style={{ fontSize: "16px" }}>
                              Fixed Price
                            </strong>
                            <p
                              style={{
                                color: "#888",
                                marginTop: 8,
                                marginBottom: 0,
                              }}
                            >
                              All sponsorship spots cost the same amount
                            </p>
                          </div>
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card
                          style={{
                            height: "100%",
                            cursor: "pointer",
                            borderColor:
                              selectedType === "positional"
                                ? "#1890ff"
                                : undefined,
                            borderWidth: selectedType === "positional" ? 2 : 1,
                            backgroundColor:
                              selectedType === "positional"
                                ? "#e6f7ff"
                                : undefined,
                          }}
                          hoverable
                        >
                          <Radio
                            value="positional"
                            style={{ display: "none" }}
                          />
                          <div
                            onClick={() =>
                              form.setFieldsValue({
                                campaignType: "positional",
                              })
                            }
                          >
                            <strong style={{ fontSize: "16px" }}>
                              Positional Pricing
                            </strong>
                            <p
                              style={{
                                color: "#888",
                                marginTop: 8,
                                marginBottom: 0,
                              }}
                            >
                              Price increases based on position number (e.g.,
                              $20 + $2 per position)
                            </p>
                          </div>
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card
                          style={{
                            height: "100%",
                            cursor: "pointer",
                            borderColor:
                              selectedType === "pay-what-you-want"
                                ? "#1890ff"
                                : undefined,
                            borderWidth:
                              selectedType === "pay-what-you-want" ? 2 : 1,
                            backgroundColor:
                              selectedType === "pay-what-you-want"
                                ? "#e6f7ff"
                                : undefined,
                          }}
                          hoverable
                        >
                          <Radio
                            value="pay-what-you-want"
                            style={{ display: "none" }}
                          />
                          <div
                            onClick={() =>
                              form.setFieldsValue({
                                campaignType: "pay-what-you-want",
                              })
                            }
                          >
                            <strong style={{ fontSize: "16px" }}>
                              Pay What You Want
                            </strong>
                            <p
                              style={{
                                color: "#888",
                                marginTop: 8,
                                marginBottom: 0,
                              }}
                            >
                              Sponsors choose their amount, size based on
                              contribution
                            </p>
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  );
                }}
              </Form.Item>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Sponsor Display Type"
            name="sponsorDisplayType"
            rules={[
              { required: true, message: "Please select sponsor display type" },
            ]}
            extra="Choose what type of sponsors you'll accept"
          >
            <Radio.Group style={{ width: "100%" }}>
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => {
                  const selectedDisplayType =
                    getFieldValue("sponsorDisplayType");

                  return (
                    <Row gutter={16}>
                      <Col span={8}>
                        <Card
                          style={{
                            height: "100%",
                            cursor: "pointer",
                            borderColor:
                              selectedDisplayType === "text-only"
                                ? "#1890ff"
                                : undefined,
                            borderWidth:
                              selectedDisplayType === "text-only" ? 2 : 1,
                            backgroundColor:
                              selectedDisplayType === "text-only"
                                ? "#e6f7ff"
                                : undefined,
                          }}
                          hoverable
                        >
                          <Radio
                            value="text-only"
                            style={{ display: "none" }}
                          />
                          <div
                            onClick={() =>
                              form.setFieldsValue({
                                sponsorDisplayType: "text-only",
                              })
                            }
                          >
                            <strong style={{ fontSize: "16px" }}>
                              Text Only
                            </strong>
                            <p
                              style={{
                                color: "#888",
                                marginTop: 8,
                                marginBottom: 0,
                              }}
                            >
                              Sponsor Names
                            </p>
                          </div>
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card
                          style={{
                            height: "100%",
                            cursor: "pointer",
                            borderColor:
                              selectedDisplayType === "logo-only"
                                ? "#1890ff"
                                : undefined,
                            borderWidth:
                              selectedDisplayType === "logo-only" ? 2 : 1,
                            backgroundColor:
                              selectedDisplayType === "logo-only"
                                ? "#e6f7ff"
                                : undefined,
                          }}
                          hoverable
                        >
                          <Radio
                            value="logo-only"
                            style={{ display: "none" }}
                          />
                          <div
                            onClick={() =>
                              form.setFieldsValue({
                                sponsorDisplayType: "logo-only",
                              })
                            }
                          >
                            <strong style={{ fontSize: "16px" }}>
                              Logo Only
                            </strong>
                            <p
                              style={{
                                color: "#888",
                                marginTop: 8,
                                marginBottom: 0,
                              }}
                            >
                              Images
                            </p>
                          </div>
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card
                          style={{
                            height: "100%",
                            cursor: "pointer",
                            borderColor:
                              selectedDisplayType === "both"
                                ? "#1890ff"
                                : undefined,
                            borderWidth: selectedDisplayType === "both" ? 2 : 1,
                            backgroundColor:
                              selectedDisplayType === "both"
                                ? "#e6f7ff"
                                : undefined,
                          }}
                          hoverable
                        >
                          <Radio value="both" style={{ display: "none" }} />
                          <div
                            onClick={() =>
                              form.setFieldsValue({
                                sponsorDisplayType: "both",
                              })
                            }
                          >
                            <strong style={{ fontSize: "16px" }}>Both</strong>
                            <p
                              style={{
                                color: "#888",
                                marginTop: 8,
                                marginBottom: 0,
                              }}
                            >
                              Text and Logos
                            </p>
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  );
                }}
              </Form.Item>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.campaignType !== currentValues.campaignType
            }
          >
            {({ getFieldValue }) => {
              const campaignType = getFieldValue("campaignType");

              // Only show layout style for pay-what-you-want
              if (campaignType === "pay-what-you-want") {
                return (
                  <Form.Item
                    label="Layout Style"
                    name="layoutStyle"
                    rules={[
                      {
                        required: true,
                        message: "Please select a layout style",
                      },
                    ]}
                    extra="How sponsors will be arranged on the shirt"
                  >
                    <Radio.Group
                      style={{ width: "100%" }}
                      disabled={mode === "edit"}
                    >
                      <Form.Item noStyle shouldUpdate>
                        {({ getFieldValue }) => {
                          const selectedLayoutStyle =
                            getFieldValue("layoutStyle");

                          return (
                            <Row gutter={16}>
                              <Col span={8}>
                                <Card
                                  style={{
                                    height: "100%",
                                    cursor:
                                      mode === "edit"
                                        ? "not-allowed"
                                        : "pointer",
                                    borderColor:
                                      selectedLayoutStyle === "size-ordered"
                                        ? "#1890ff"
                                        : undefined,
                                    borderWidth:
                                      selectedLayoutStyle === "size-ordered"
                                        ? 2
                                        : 1,
                                    backgroundColor:
                                      selectedLayoutStyle === "size-ordered"
                                        ? "#e6f7ff"
                                        : undefined,
                                    opacity: mode === "edit" ? 0.6 : 1,
                                  }}
                                  hoverable={mode !== "edit"}
                                >
                                  <Radio
                                    value="size-ordered"
                                    style={{ display: "none" }}
                                  />
                                  <div
                                    onClick={() => {
                                      if (mode !== "edit") {
                                        form.setFieldsValue({
                                          layoutStyle: "size-ordered",
                                        });
                                      }
                                    }}
                                  >
                                    <strong style={{ fontSize: "16px" }}>
                                      Size Ordered
                                    </strong>
                                    <p
                                      style={{
                                        color: "#888",
                                        marginTop: 8,
                                        marginBottom: 0,
                                      }}
                                    >
                                      Largest First
                                    </p>
                                  </div>
                                </Card>
                              </Col>
                              <Col span={8}>
                                <Card
                                  style={{
                                    height: "100%",
                                    cursor:
                                      mode === "edit"
                                        ? "not-allowed"
                                        : "pointer",
                                    borderColor:
                                      selectedLayoutStyle === "amount-ordered"
                                        ? "#1890ff"
                                        : undefined,
                                    borderWidth:
                                      selectedLayoutStyle === "amount-ordered"
                                        ? 2
                                        : 1,
                                    backgroundColor:
                                      selectedLayoutStyle === "amount-ordered"
                                        ? "#e6f7ff"
                                        : undefined,
                                    opacity: mode === "edit" ? 0.6 : 1,
                                  }}
                                  hoverable={mode !== "edit"}
                                >
                                  <Radio
                                    value="amount-ordered"
                                    style={{ display: "none" }}
                                  />
                                  <div
                                    onClick={() => {
                                      if (mode !== "edit") {
                                        form.setFieldsValue({
                                          layoutStyle: "amount-ordered",
                                        });
                                      }
                                    }}
                                  >
                                    <strong style={{ fontSize: "16px" }}>
                                      Amount Ordered
                                    </strong>
                                    <p
                                      style={{
                                        color: "#888",
                                        marginTop: 8,
                                        marginBottom: 0,
                                      }}
                                    >
                                      Highest Payers First
                                    </p>
                                  </div>
                                </Card>
                              </Col>
                              <Col span={8}>
                                <Card
                                  style={{
                                    height: "100%",
                                    cursor:
                                      mode === "edit"
                                        ? "not-allowed"
                                        : "pointer",
                                    borderColor:
                                      selectedLayoutStyle === "word-cloud"
                                        ? "#1890ff"
                                        : undefined,
                                    borderWidth:
                                      selectedLayoutStyle === "word-cloud"
                                        ? 2
                                        : 1,
                                    backgroundColor:
                                      selectedLayoutStyle === "word-cloud"
                                        ? "#e6f7ff"
                                        : undefined,
                                    opacity: mode === "edit" ? 0.6 : 1,
                                  }}
                                  hoverable={mode !== "edit"}
                                >
                                  <Radio
                                    value="word-cloud"
                                    style={{ display: "none" }}
                                  />
                                  <div
                                    onClick={() => {
                                      if (mode !== "edit") {
                                        form.setFieldsValue({
                                          layoutStyle: "word-cloud",
                                        });
                                      }
                                    }}
                                  >
                                    <strong style={{ fontSize: "16px" }}>
                                      Word Cloud
                                    </strong>
                                    <p
                                      style={{
                                        color: "#888",
                                        marginTop: 8,
                                        marginBottom: 0,
                                      }}
                                    >
                                      Artistic
                                    </p>
                                  </div>
                                </Card>
                              </Col>
                            </Row>
                          );
                        }}
                      </Form.Item>
                    </Radio.Group>
                  </Form.Item>
                );
              }

              // For fixed and positional, always use grid
              return (
                <Form.Item name="layoutStyle" initialValue="grid" hidden>
                  <Input />
                </Form.Item>
              );
            }}
          </Form.Item>
        </Form>
      ),
    },
    {
      title: "Configuration",
      content: (
        <Form
          form={form}
          layout="vertical"
          initialValues={mode === "create" ? layoutData : campaignData}
        >
          {campaignData.campaignType === "fixed" && (
            <>
              <Alert
                message="Fixed Price Configuration"
                description="All sponsor spots will cost the same amount"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              {mode === "edit" && hasSponsors && (
                <Alert
                  message="Pricing Locked"
                  description="Cannot change pricing after sponsors have joined."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Price per Spot"
                    name={
                      mode === "create"
                        ? ["pricingConfig", "fixedPrice"]
                        : ["pricing", "fixedPrice"]
                    }
                    rules={[
                      { required: true, message: "Please enter a price" },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      prefix="$"
                      style={{ width: "100%" }}
                      placeholder="20"
                      disabled={mode === "edit" && hasSponsors}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Total Positions"
                    name={
                      mode === "create"
                        ? "totalPositions"
                        : ["layoutConfig", "totalPositions"]
                    }
                    rules={
                      mode === "create"
                        ? [
                            {
                              required: true,
                              message: "Please enter total number of positions",
                            },
                          ]
                        : []
                    }
                    extra={
                      mode === "edit" && hasSponsors
                        ? "Cannot be changed after sponsors join"
                        : "Total sponsor spots (e.g., 20)"
                    }
                  >
                    <InputNumber
                      min={1}
                      max={100}
                      style={{ width: "100%" }}
                      placeholder="20"
                      disabled={mode === "edit" && hasSponsors}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Number of Columns"
                    name={
                      mode === "create"
                        ? "columns"
                        : ["layoutConfig", "columns"]
                    }
                    rules={
                      mode === "create"
                        ? [
                            {
                              required: true,
                              message: "Please enter number of columns",
                            },
                          ]
                        : []
                    }
                    extra={
                      mode === "edit" && hasSponsors
                        ? "Cannot be changed after sponsors join"
                        : "Columns in grid (e.g., 5)"
                    }
                  >
                    <InputNumber
                      min={1}
                      max={10}
                      style={{ width: "100%" }}
                      placeholder="5"
                      disabled={mode === "edit" && hasSponsors}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                label="Position Arrangement"
                name={
                  mode === "create"
                    ? "arrangement"
                    : ["layoutConfig", "arrangement"]
                }
                initialValue="horizontal"
              >
                <Radio.Group style={{ width: "100%" }}>
                  <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) => {
                      const fieldName =
                        mode === "create"
                          ? "arrangement"
                          : ["layoutConfig", "arrangement"];
                      const selectedArrangement =
                        getFieldValue(fieldName) || "horizontal";
                      const isDisabled = mode === "edit" && hasSponsors;
                      return (
                        <Row gutter={16}>
                          <Col span={12}>
                            <Card
                              hoverable={!isDisabled}
                              onClick={() => {
                                if (!isDisabled) {
                                  if (mode === "create") {
                                    form.setFieldsValue({
                                      arrangement: "horizontal",
                                    });
                                  } else {
                                    form.setFieldsValue({
                                      layoutConfig: {
                                        ...getFieldValue("layoutConfig"),
                                        arrangement: "horizontal",
                                      },
                                    });
                                  }
                                }
                              }}
                              style={{
                                border:
                                  selectedArrangement === "horizontal"
                                    ? "2px solid #1890ff"
                                    : "1px solid #d9d9d9",
                                backgroundColor:
                                  selectedArrangement === "horizontal"
                                    ? "#e6f7ff"
                                    : "white",
                                cursor: isDisabled ? "not-allowed" : "pointer",
                                opacity: isDisabled ? 0.6 : 1,
                              }}
                            >
                              <Radio
                                value="horizontal"
                                style={{ display: "none" }}
                              />
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "8px 0",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "48px",
                                    marginBottom: "8px",
                                    fontWeight: "bold",
                                    color: "#1890ff",
                                    fontFamily: "monospace",
                                    lineHeight: "1",
                                  }}
                                >
                                  ⟋
                                </div>
                                <div
                                  style={{
                                    fontWeight: "600",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Horizontal
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#666",
                                  }}
                                >
                                  Positions fill rows first
                                </div>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#999",
                                    marginTop: "4px",
                                  }}
                                >
                                  (1,2,3 in row 1)
                                </div>
                              </div>
                            </Card>
                          </Col>
                          <Col span={12}>
                            <Card
                              hoverable={!isDisabled}
                              onClick={() => {
                                if (!isDisabled) {
                                  if (mode === "create") {
                                    form.setFieldsValue({
                                      arrangement: "vertical",
                                    });
                                  } else {
                                    form.setFieldsValue({
                                      layoutConfig: {
                                        ...getFieldValue("layoutConfig"),
                                        arrangement: "vertical",
                                      },
                                    });
                                  }
                                }
                              }}
                              style={{
                                border:
                                  selectedArrangement === "vertical"
                                    ? "2px solid #1890ff"
                                    : "1px solid #d9d9d9",
                                backgroundColor:
                                  selectedArrangement === "vertical"
                                    ? "#e6f7ff"
                                    : "white",
                                cursor: isDisabled ? "not-allowed" : "pointer",
                                opacity: isDisabled ? 0.6 : 1,
                              }}
                            >
                              <Radio
                                value="vertical"
                                style={{ display: "none" }}
                              />
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "8px 0",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "48px",
                                    marginBottom: "8px",
                                    fontWeight: "bold",
                                    color: "#1890ff",
                                    fontFamily: "monospace",
                                    lineHeight: "1",
                                  }}
                                >
                                  ⟍
                                </div>
                                <div
                                  style={{
                                    fontWeight: "600",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Vertical
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#666",
                                  }}
                                >
                                  Positions fill columns first
                                </div>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#999",
                                    marginTop: "4px",
                                  }}
                                >
                                  (1,2,3 in column 1)
                                </div>
                              </div>
                            </Card>
                          </Col>
                        </Row>
                      );
                    }}
                  </Form.Item>
                </Radio.Group>
              </Form.Item>
            </>
          )}

          {campaignData.campaignType === "positional" && (
            <>
              <Alert
                message="Positional Pricing Configuration"
                description="Price increases based on position number"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              {mode === "edit" && hasSponsors && (
                <Alert
                  message="Pricing Locked"
                  description="Cannot change pricing after sponsors have joined."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Base Price"
                    name={
                      mode === "create"
                        ? ["pricingConfig", "basePrice"]
                        : ["pricing", "basePrice"]
                    }
                    rules={[
                      {
                        required: true,
                        message: "Please enter base price",
                      },
                    ]}
                    extra="Starting price for position 1"
                  >
                    <InputNumber
                      min={0}
                      prefix="$"
                      style={{ width: "100%" }}
                      placeholder="10"
                      disabled={mode === "edit" && hasSponsors}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Price Per Position"
                    name={
                      mode === "create"
                        ? ["pricingConfig", "pricePerPosition"]
                        : ["pricing", "pricePerPosition"]
                    }
                    rules={[
                      {
                        required: true,
                        message: "Please enter price per position",
                      },
                    ]}
                    extra="Amount to add for each position number"
                  >
                    <InputNumber
                      min={0}
                      prefix="$"
                      style={{ width: "100%" }}
                      placeholder="2"
                      disabled={mode === "edit" && hasSponsors}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Total Positions"
                    name={
                      mode === "create"
                        ? "totalPositions"
                        : ["layoutConfig", "totalPositions"]
                    }
                    rules={
                      mode === "create"
                        ? [
                            {
                              required: true,
                              message: "Please enter total number of positions",
                            },
                          ]
                        : []
                    }
                    extra={
                      mode === "edit" && hasSponsors
                        ? "Cannot be changed after sponsors join"
                        : "Total sponsor spots (e.g., 20)"
                    }
                  >
                    <InputNumber
                      min={1}
                      max={100}
                      style={{ width: "100%" }}
                      placeholder="20"
                      disabled={mode === "edit" && hasSponsors}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Number of Columns"
                    name={
                      mode === "create"
                        ? "columns"
                        : ["layoutConfig", "columns"]
                    }
                    rules={
                      mode === "create"
                        ? [
                            {
                              required: true,
                              message: "Please enter number of columns",
                            },
                          ]
                        : []
                    }
                    extra={
                      mode === "edit" && hasSponsors
                        ? "Cannot be changed after sponsors join"
                        : "Columns in grid (e.g., 5)"
                    }
                  >
                    <InputNumber
                      min={1}
                      max={10}
                      style={{ width: "100%" }}
                      placeholder="5"
                      disabled={mode === "edit" && hasSponsors}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                label="Position Arrangement"
                name={
                  mode === "create"
                    ? "arrangement"
                    : ["layoutConfig", "arrangement"]
                }
                initialValue="horizontal"
              >
                <Radio.Group style={{ width: "100%" }}>
                  <Form.Item noStyle shouldUpdate>
                    {({ getFieldValue }) => {
                      const fieldName =
                        mode === "create"
                          ? "arrangement"
                          : ["layoutConfig", "arrangement"];
                      const selectedArrangement =
                        getFieldValue(fieldName) || "horizontal";
                      const isDisabled = mode === "edit" && hasSponsors;
                      return (
                        <Row gutter={16}>
                          <Col span={12}>
                            <Card
                              hoverable={!isDisabled}
                              onClick={() => {
                                if (!isDisabled) {
                                  if (mode === "create") {
                                    form.setFieldsValue({
                                      arrangement: "horizontal",
                                    });
                                  } else {
                                    form.setFieldsValue({
                                      layoutConfig: {
                                        ...getFieldValue("layoutConfig"),
                                        arrangement: "horizontal",
                                      },
                                    });
                                  }
                                }
                              }}
                              style={{
                                border:
                                  selectedArrangement === "horizontal"
                                    ? "2px solid #1890ff"
                                    : "1px solid #d9d9d9",
                                backgroundColor:
                                  selectedArrangement === "horizontal"
                                    ? "#e6f7ff"
                                    : "white",
                                cursor: isDisabled ? "not-allowed" : "pointer",
                                opacity: isDisabled ? 0.6 : 1,
                              }}
                            >
                              <Radio
                                value="horizontal"
                                style={{ display: "none" }}
                              />
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "8px 0",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "48px",
                                    marginBottom: "8px",
                                    fontWeight: "bold",
                                    color: "#1890ff",
                                    fontFamily: "monospace",
                                    lineHeight: "1",
                                  }}
                                >
                                  ⟋
                                </div>
                                <div
                                  style={{
                                    fontWeight: "600",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Horizontal
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#666",
                                  }}
                                >
                                  Positions fill rows first
                                </div>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#999",
                                    marginTop: "4px",
                                  }}
                                >
                                  (1,2,3 in row 1)
                                </div>
                              </div>
                            </Card>
                          </Col>
                          <Col span={12}>
                            <Card
                              hoverable={!isDisabled}
                              onClick={() => {
                                if (!isDisabled) {
                                  if (mode === "create") {
                                    form.setFieldsValue({
                                      arrangement: "vertical",
                                    });
                                  } else {
                                    form.setFieldsValue({
                                      layoutConfig: {
                                        ...getFieldValue("layoutConfig"),
                                        arrangement: "vertical",
                                      },
                                    });
                                  }
                                }
                              }}
                              style={{
                                border:
                                  selectedArrangement === "vertical"
                                    ? "2px solid #1890ff"
                                    : "1px solid #d9d9d9",
                                backgroundColor:
                                  selectedArrangement === "vertical"
                                    ? "#e6f7ff"
                                    : "white",
                                cursor: isDisabled ? "not-allowed" : "pointer",
                                opacity: isDisabled ? 0.6 : 1,
                              }}
                            >
                              <Radio
                                value="vertical"
                                style={{ display: "none" }}
                              />
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "8px 0",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "48px",
                                    marginBottom: "8px",
                                    fontWeight: "bold",
                                    color: "#1890ff",
                                    fontFamily: "monospace",
                                    lineHeight: "1",
                                  }}
                                >
                                  ⟍
                                </div>
                                <div
                                  style={{
                                    fontWeight: "600",
                                    marginBottom: "4px",
                                  }}
                                >
                                  Vertical
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#666",
                                  }}
                                >
                                  Positions fill columns first
                                </div>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#999",
                                    marginTop: "4px",
                                  }}
                                >
                                  (1,2,3 in column 1)
                                </div>
                              </div>
                            </Card>
                          </Col>
                        </Row>
                      );
                    }}
                  </Form.Item>
                </Radio.Group>
              </Form.Item>
            </>
          )}

          {campaignData.campaignType === "pay-what-you-want" && (
            <>
              <Alert
                message="Pay What You Want Configuration"
                description={
                  mode === "create"
                    ? "Sponsors can contribute any amount they choose (above the minimum). All sponsors will be displayed at a standard size."
                    : "Pricing cannot be changed for pay-what-you-want campaigns after creation."
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              {mode === "create" && (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Minimum Amount"
                        name={["pricingConfig", "minimumAmount"]}
                        rules={[
                          {
                            required: true,
                            message: "Please enter minimum amount",
                          },
                        ]}
                        extra="Minimum contribution required from sponsors"
                      >
                        <InputNumber
                          min={1}
                          prefix="$"
                          style={{ width: "100%" }}
                          placeholder="10"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Maximum Sponsors (Optional)"
                        name="maxSponsors"
                        extra="Leave empty for unlimited sponsors"
                      >
                        <InputNumber
                          min={1}
                          style={{ width: "100%" }}
                          placeholder="Leave empty for unlimited"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}
            </>
          )}
        </Form>
      ),
    },
    {
      title: "Settings",
      content: (
        <Form form={form} layout="vertical" initialValues={campaignData}>
          <Form.Item
            label="Campaign Duration"
            name="dates"
            rules={[
              { required: true, message: "Please select campaign dates" },
            ]}
          >
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Currency"
            name="currency"
            initialValue="NZD"
            rules={[{ required: true, message: "Please select a currency" }]}
          >
            <Select disabled={mode === "edit"}>
              <Select.Option value="NZD">NZD</Select.Option>
              <Select.Option value="AUD">AUD</Select.Option>
              <Select.Option value="USD">USD</Select.Option>
            </Select>
          </Form.Item>

          <Alert
            message="Payment Methods"
            description="Configure how sponsors can pay for their sponsorships. At least one payment method must be enabled."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            label="Enable Online Payments (Stripe)"
            name="enableStripePayments"
            valuePropName="checked"
            initialValue={false}
            tooltip="Allow sponsors to pay with credit/debit cards via Stripe. Requires Stripe to be configured on the server."
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="Allow Offline Payments"
            name="allowOfflinePayments"
            valuePropName="checked"
            initialValue={true}
            tooltip="Allow sponsors to pledge and pay manually (cash, bank transfer, etc.). You'll need to mark payments as received."
          >
            <Switch />
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div className="campaign-wizard-form">
      <style>{formLabelStyle}</style>
      <Steps
        current={current}
        style={{ marginBottom: 40 }}
        items={steps.map((item) => ({ title: item.title }))}
      />

      <div style={{ minHeight: 300 }}>{steps[current].content}</div>

      <div
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {current > 0 && <Button onClick={prev}>Previous</Button>}
        <div style={{ flex: 1 }} />
        {current < steps.length - 1 && (
          <Button type="primary" onClick={next}>
            Next
          </Button>
        )}
        {current === steps.length - 1 && (
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            {submitButtonText}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CampaignWizard;
