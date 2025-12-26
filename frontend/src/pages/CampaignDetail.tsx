import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Spin,
  message,
  Tag,
  Descriptions,
  Table,
  Modal,
  Statistic,
  Badge,
  Alert,
} from "antd";
import {
  CloseCircleOutlined,
  ExportOutlined,
  EditOutlined,
  BellOutlined,
  CopyOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type {
  Campaign,
  SponsorEntry,
  ShirtLayout,
} from "../types/campaign.types";
import campaignService from "../services/campaign.service";
import sponsorshipService from "../services/sponsorship.service";
import EditCampaignModal from "../components/EditCampaignModal";
import DuplicateCampaignModal from "../components/DuplicateCampaignModal";
import ShirtLayoutComponent from "../components/ShirtLayout";
import LogoApprovalCard from "../components/LogoApprovalCard";
import FlexibleLayoutRenderer from "../components/FlexibleLayoutRenderer";

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sponsors, setSponsors] = useState<SponsorEntry[]>([]);
  const [layout, setLayout] = useState<ShirtLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [closingCampaign, setClosingCampaign] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDuplicateModalVisible, setIsDuplicateModalVisible] = useState(false);
  const [pendingLogos, setPendingLogos] = useState<SponsorEntry[]>([]);
  const [loadingPendingLogos, setLoadingPendingLogos] = useState(false);
  const [creatingLayout, setCreatingLayout] = useState(false);
  const [activatingCampaign, setActivatingCampaign] = useState(false);
  const [draftingCampaign, setDraftingCampaign] = useState(false);

  useEffect(() => {
    if (id) {
      loadCampaignData();
      loadPendingLogos();
    }
  }, [id]);

  const loadCampaignData = async () => {
    try {
      const [campaignData, sponsorsData] = await Promise.all([
        campaignService.getCampaignById(id!),
        sponsorshipService.getSponsors(id!),
      ]);

      setCampaign(campaignData);
      setSponsors(sponsorsData);

      // Load layout for all campaign types
      try {
        const layoutData = await campaignService.getLayout(id!);
        setLayout(layoutData);
      } catch (error) {
        // Layout might not exist yet
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to load campaign");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingLogos = async () => {
    if (!id) return;

    try {
      setLoadingPendingLogos(true);
      const logos = await sponsorshipService.getPendingLogos(id);
      setPendingLogos(logos);
    } catch (error: any) {
      // Silently fail - user might not have permission or no pending logos
      console.error("Failed to load pending logos:", error);
    } finally {
      setLoadingPendingLogos(false);
    }
  };

  const handleApproveLogo = async (sponsorId: string) => {
    await sponsorshipService.approveLogo(sponsorId, { approved: true });
    // Reload data
    loadPendingLogos();
    loadCampaignData();
  };

  const handleRejectLogo = async (sponsorId: string, reason: string) => {
    await sponsorshipService.approveLogo(sponsorId, {
      approved: false,
      rejectionReason: reason,
    });
    // Reload data
    loadPendingLogos();
    loadCampaignData();
  };

  const handleCreateLayout = async () => {
    if (!campaign) return;

    try {
      setCreatingLayout(true);

      // Determine layout parameters based on campaign type
      if (campaign.campaignType === "pay-what-you-want") {
        await campaignService.createLayout(campaign._id, {
          maxSponsors: 0, // unlimited
          campaignType: campaign.campaignType,
          pricingConfig: campaign.pricingConfig,
        });
      } else {
        // For sections layout, use the existing priceTiers
        // For other layouts, provide default pricing if missing
        let pricingConfig = campaign.pricingConfig;

        // If it's a positional campaign without sections and missing pricing, add defaults
        if (
          campaign.campaignType === "positional" &&
          campaign.layoutStyle !== "sections" &&
          !pricingConfig?.basePrice &&
          !pricingConfig?.priceMultiplier
        ) {
          pricingConfig = {
            basePrice: 10,
            pricePerPosition: 5,
          };
        }

        // Default grid layout for fixed/positional
        await campaignService.createLayout(campaign._id, {
          totalPositions: 20,
          columns: 5,
          arrangement: "horizontal",
          campaignType: campaign.campaignType,
          pricingConfig: pricingConfig,
        });
      }

      message.success("Layout created successfully!");
      await loadCampaignData(); // Reload to show the layout
    } catch (error: any) {
      console.error("Layout creation error:", error);
      message.error(error.response?.data?.message || "Failed to create layout");
    } finally {
      setCreatingLayout(false);
    }
  };

  const handleCloseCampaign = () => {
    Modal.confirm({
      title: "Close Campaign?",
      content:
        "Are you sure you want to close this campaign? This action cannot be undone.",
      okText: "Yes, Close Campaign",
      okType: "danger",
      onOk: async () => {
        setClosingCampaign(true);
        try {
          await campaignService.closeCampaign(id!);
          message.success("Campaign closed successfully");
          loadCampaignData();
        } catch (error: any) {
          message.error(
            error.response?.data?.message || "Failed to close campaign"
          );
        } finally {
          setClosingCampaign(false);
        }
      },
    });
  };

  const handleActivateCampaign = () => {
    Modal.confirm({
      title: "Activate Campaign?",
      content:
        "Are you sure you want to activate this campaign? It will become publicly visible and sponsors can start joining.",
      okText: "Yes, Activate Campaign",
      okType: "primary",
      onOk: async () => {
        setActivatingCampaign(true);
        try {
          await campaignService.updateCampaign(id!, { status: "active" });
          message.success("Campaign activated successfully!");
          loadCampaignData();
        } catch (error: any) {
          message.error(
            error.response?.data?.message || "Failed to activate campaign"
          );
        } finally {
          setActivatingCampaign(false);
        }
      },
    });
  };

  const handleDraftCampaign = () => {
    Modal.confirm({
      title: "Move Campaign to Draft?",
      content:
        "Are you sure you want to move this campaign back to draft mode? It will be hidden from the public until you activate it again.",
      okText: "Yes, Move to Draft",
      okType: "default",
      onOk: async () => {
        setDraftingCampaign(true);
        try {
          await campaignService.updateCampaign(id!, { status: "draft" });
          message.success("Campaign moved to draft successfully!");
          loadCampaignData();
        } catch (error: any) {
          message.error(
            error.response?.data?.message || "Failed to move campaign to draft"
          );
        } finally {
          setDraftingCampaign(false);
        }
      },
    });
  };

  const handleMarkAsPaid = async (sponsorshipId: string) => {
    try {
      await sponsorshipService.markAsPaid(sponsorshipId);
      message.success("Marked as paid");
      loadCampaignData();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to mark as paid");
    }
  };

  const handleTogglePaymentStatus = async (
    sponsorshipId: string,
    currentStatus: string,
    paymentMethod: string
  ) => {
    if (paymentMethod === "card") {
      message.error("Cannot manually change payment status for card payments");
      return;
    }

    const newStatus = currentStatus === "paid" ? "pending" : "paid";
    const actionText = newStatus === "paid" ? "paid" : "pending";

    try {
      await sponsorshipService.updatePaymentStatus(sponsorshipId, newStatus);
      message.success(`Payment status updated to ${actionText}`);
      loadCampaignData();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Failed to update payment status"
      );
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalVisible(false);
    loadCampaignData(); // Reload campaign data after edit
  };

  const sponsorColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Position",
      dataIndex: "positionId",
      key: "positionId",
      render: (positionId?: string) => positionId || "N/A",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => `${campaign?.currency || "NZD"} $${amount}`,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
    },
    {
      title: "Status",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status: string) => (
        <Tag
          color={
            status === "paid"
              ? "green"
              : status === "pending"
              ? "orange"
              : "red"
          }
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: SponsorEntry) => {
        // Only show toggle for cash/manual payments
        if (record.paymentMethod === "card") {
          return (
            <span style={{ fontSize: 12, color: "#888" }}>
              Managed by Stripe
            </span>
          );
        }

        // Show toggle button for cash payments
        return (
          <Button
            size="small"
            type={record.paymentStatus === "paid" ? "default" : "primary"}
            onClick={() =>
              handleTogglePaymentStatus(
                record._id,
                record.paymentStatus,
                record.paymentMethod
              )
            }
          >
            {record.paymentStatus === "paid"
              ? "Mark as Pending"
              : "Mark as Paid"}
          </Button>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const totalRaised = sponsors
    .filter((s) => s.paymentStatus === "paid")
    .reduce((sum, s) => sum + s.amount, 0);

  const pendingAmount = sponsors
    .filter((s) => s.paymentStatus === "pending")
    .reduce((sum, s) => sum + s.amount, 0);

  const spotsTaken = layout?.placements.filter((p) => p.isTaken).length || 0;
  const totalSpots = layout?.placements.length || 0;
  const isFlexibleLayout = layout?.layoutType === "flexible";

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h1>{campaign.title}</h1>
        <div>
          <Button
            onClick={() => window.open(`/campaign/${campaign.slug}`, "_blank")}
            style={{ marginRight: 8 }}
            icon={<ExportOutlined />}
          >
            View Public Page
          </Button>
          <Button
            icon={<CopyOutlined />}
            onClick={() => setIsDuplicateModalVisible(true)}
            style={{ marginRight: 8 }}
          >
            Duplicate
          </Button>
          {campaign.status === "draft" && (
            <Button
              type="primary"
              onClick={handleActivateCampaign}
              loading={activatingCampaign}
              style={{ marginRight: 8 }}
            >
              Activate Campaign
            </Button>
          )}
          {!campaign.isClosed && campaign.status === "active" && (
            <>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setIsEditModalVisible(true)}
                style={{ marginRight: 8 }}
              >
                Edit Campaign
              </Button>
              <Button
                onClick={handleDraftCampaign}
                loading={draftingCampaign}
                style={{ marginRight: 8 }}
              >
                Move to Draft
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleCloseCampaign}
                loading={closingCampaign}
              >
                Close Campaign
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Missing Layout Warning */}
      {!layout &&
        (campaign.campaignType === "fixed" ||
          campaign.campaignType === "positional" ||
          campaign.campaignType === "pay-what-you-want") && (
          <Alert
            message="Layout Missing"
            description={
              <div>
                <p>
                  This campaign is missing a layout configuration. Sponsors
                  cannot join until a layout is created.
                </p>
                <Button
                  type="primary"
                  onClick={handleCreateLayout}
                  loading={creatingLayout}
                  icon={<WarningOutlined />}
                >
                  Create Layout Now
                </Button>
              </div>
            }
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

      <Card title="Campaign Statistics" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 24 }}>
          <Statistic
            title="Total Raised"
            value={totalRaised}
            prefix={campaign.currency}
            suffix="$"
            valueStyle={{ color: "#3f8600" }}
          />
          <Statistic
            title="Pending Payments"
            value={pendingAmount}
            prefix={campaign.currency}
            suffix="$"
            valueStyle={{ color: "#cf1322" }}
          />
          {layout && !isFlexibleLayout && (
            <Statistic
              title="Spots Filled"
              value={spotsTaken}
              suffix={`/ ${totalSpots}`}
            />
          )}
          <Statistic title="Total Sponsors" value={sponsors.length} />
          {isFlexibleLayout && layout?.maxSponsors && (
            <Statistic
              title="Sponsor Limit"
              value={sponsors.length}
              suffix={`/ ${layout.maxSponsors}`}
            />
          )}
          {pendingLogos.length > 0 && (
            <Statistic
              title="Pending Logo Approvals"
              value={pendingLogos.length}
              valueStyle={{ color: "#faad14" }}
            />
          )}
        </div>
      </Card>

      {/* Pending Logo Approvals */}
      {pendingLogos.length > 0 && (
        <Card
          title={
            <span>
              <BellOutlined style={{ marginRight: 8 }} />
              Pending Logo Approvals
              <Badge
                count={pendingLogos.length}
                style={{ marginLeft: 8 }}
                showZero={false}
              />
            </span>
          }
          style={{ marginBottom: 24 }}
        >
          {loadingPendingLogos ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin />
            </div>
          ) : (
            <div>
              {pendingLogos.map((sponsor) => (
                <LogoApprovalCard
                  key={sponsor._id}
                  sponsor={sponsor}
                  onApprove={handleApproveLogo}
                  onReject={handleRejectLogo}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      <Card title="Campaign Details" style={{ marginBottom: 24 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Status">
            {campaign.status === "draft" ? (
              <Tag color="orange">Draft</Tag>
            ) : campaign.isClosed || campaign.status === "closed" ? (
              <Tag color="red">Closed</Tag>
            ) : (
              <Tag color="green">Active</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Campaign Type">
            <Tag color="blue">{campaign.campaignType}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Garment">
            {campaign.garmentType}
          </Descriptions.Item>
          <Descriptions.Item label="Currency">
            {campaign.currency}
          </Descriptions.Item>
          <Descriptions.Item label="Public URL">
            <a
              href={`/campaign/${campaign.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              /campaign/{campaign.slug}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label="End Date">
            {campaign.endDate
              ? new Date(campaign.endDate).toLocaleDateString()
              : "No end date"}
          </Descriptions.Item>
          <Descriptions.Item label="Start Date">
            {campaign.startDate
              ? new Date(campaign.startDate).toLocaleDateString()
              : "Not set"}
          </Descriptions.Item>
          <Descriptions.Item label="Short Description" span={2}>
            {campaign.shortDescription || "None"}
          </Descriptions.Item>
          {campaign.description && (
            <Descriptions.Item label="Description" span={2}>
              <div
                dangerouslySetInnerHTML={{ __html: campaign.description }}
                style={{ maxHeight: "200px", overflow: "auto" }}
              />
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Campaign Settings */}
      <Card title="Campaign Settings" style={{ marginBottom: 24 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Sponsor Display Type">
            <Tag color="purple">{campaign.sponsorDisplayType}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Layout Style">
            <Tag color="cyan">{campaign.layoutStyle}</Tag>
          </Descriptions.Item>
          {campaign.layoutOrder && (
            <Descriptions.Item label="Layout Order">
              <Tag>
                {campaign.layoutOrder === "asc" ? "Ascending" : "Descending"}
              </Tag>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Stripe Payments">
            {campaign.enableStripePayments ? (
              <Tag color="green">Enabled</Tag>
            ) : (
              <Tag color="red">Disabled</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Offline Payments">
            {campaign.allowOfflinePayments ? (
              <Tag color="green">Allowed</Tag>
            ) : (
              <Tag color="red">Not Allowed</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Pricing Configuration */}
      <Card title="Pricing Configuration" style={{ marginBottom: 24 }}>
        <Descriptions bordered column={2}>
          {campaign.campaignType === "fixed" &&
            campaign.pricingConfig.fixedPrice && (
              <Descriptions.Item label="Fixed Price" span={2}>
                <strong style={{ fontSize: "18px", color: "#3f8600" }}>
                  {campaign.currency} ${campaign.pricingConfig.fixedPrice}
                </strong>
              </Descriptions.Item>
            )}
          {campaign.campaignType === "positional" && (
            <>
              {campaign.pricingConfig.basePrice !== undefined && (
                <Descriptions.Item label="Base Price">
                  {campaign.currency} ${campaign.pricingConfig.basePrice}
                </Descriptions.Item>
              )}
              {campaign.pricingConfig.pricePerPosition !== undefined && (
                <Descriptions.Item label="Price Per Position">
                  {campaign.currency} ${campaign.pricingConfig.pricePerPosition}
                </Descriptions.Item>
              )}
              {campaign.pricingConfig.priceMultiplier !== undefined && (
                <Descriptions.Item label="Price Multiplier">
                  {campaign.pricingConfig.priceMultiplier}x
                </Descriptions.Item>
              )}
              {campaign.pricingConfig.priceTiers &&
                campaign.pricingConfig.priceTiers.length > 0 && (
                  <Descriptions.Item label="Price Tiers" span={2}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {campaign.pricingConfig.priceTiers.map((tier) => (
                        <div
                          key={tier.tierNumber}
                          style={{
                            padding: "8px",
                            background: "#f5f5f5",
                            borderRadius: "4px",
                          }}
                        >
                          <strong>Tier {tier.tierNumber}:</strong>{" "}
                          {campaign.currency} ${tier.price}
                          <Tag style={{ marginLeft: "8px" }}>
                            {tier.sponsorDisplayType}
                          </Tag>
                        </div>
                      ))}
                    </div>
                  </Descriptions.Item>
                )}
            </>
          )}
          {campaign.campaignType === "pay-what-you-want" && (
            <>
              {campaign.pricingConfig.minimumAmount !== undefined && (
                <Descriptions.Item label="Minimum Amount">
                  {campaign.currency} ${campaign.pricingConfig.minimumAmount}
                </Descriptions.Item>
              )}
              {campaign.pricingConfig.suggestedAmounts &&
                campaign.pricingConfig.suggestedAmounts.length > 0 && (
                  <Descriptions.Item label="Suggested Amounts" span={2}>
                    {campaign.pricingConfig.suggestedAmounts.map(
                      (amount, idx) => (
                        <Tag key={idx} color="blue" style={{ margin: "4px" }}>
                          {campaign.currency} ${amount}
                        </Tag>
                      )
                    )}
                  </Descriptions.Item>
                )}
              {campaign.pricingConfig.sizeTiers &&
                campaign.pricingConfig.sizeTiers.length > 0 && (
                  <Descriptions.Item label="Size Tiers" span={2}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {campaign.pricingConfig.sizeTiers.map((tier, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "8px",
                            background: "#f5f5f5",
                            borderRadius: "4px",
                          }}
                        >
                          <Tag color="purple">{tier.size}</Tag>
                          <span style={{ marginLeft: "8px" }}>
                            {campaign.currency} ${tier.minAmount} -{" "}
                            {tier.maxAmount ? `$${tier.maxAmount}` : "∞"}
                          </span>
                          <span style={{ marginLeft: "8px", color: "#666" }}>
                            (Text: {tier.textFontSize}px, Logo: {tier.logoWidth}
                            px)
                          </span>
                        </div>
                      ))}
                    </div>
                  </Descriptions.Item>
                )}
            </>
          )}
        </Descriptions>
      </Card>

      {/* Layout Configuration */}
      {layout && (
        <Card title="Layout Configuration" style={{ marginBottom: 24 }}>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Layout Type">
              <Tag color="geekblue">{layout.layoutType}</Tag>
            </Descriptions.Item>
            {layout.layoutType === "grid" && (
              <>
                <Descriptions.Item label="Grid Size">
                  {layout.rows} rows × {layout.columns} columns
                </Descriptions.Item>
                <Descriptions.Item label="Total Positions">
                  {layout.totalPositions}
                </Descriptions.Item>
                <Descriptions.Item label="Arrangement">
                  <Tag>{layout.arrangement}</Tag>
                </Descriptions.Item>
              </>
            )}
            {layout.layoutType === "flexible" && layout.maxSponsors && (
              <Descriptions.Item label="Max Sponsors">
                {layout.maxSponsors}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Layout Display */}
      {layout && (
        <Card title="Shirt Layout" style={{ marginBottom: 24 }}>
          {layout.layoutType === "grid" ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <Tag color="blue">
                  {campaign.campaignType === "fixed"
                    ? "Fixed Pricing"
                    : "Positional Pricing"}
                </Tag>
                <span style={{ marginLeft: 8, color: "#666" }}>
                  {layout.rows} rows × {layout.columns} columns = {totalSpots}{" "}
                  positions
                </span>
              </div>
              <ShirtLayoutComponent
                layout={layout}
                readonly={true}
                currency={campaign.currency}
                showPriceGradient={campaign.campaignType === "positional"}
                sponsors={sponsors}
              />
            </>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <Tag color="purple">Pay What You Want</Tag>
                <span style={{ marginLeft: 8, color: "#666" }}>
                  Flexible layout
                  {layout.maxSponsors
                    ? ` (max ${layout.maxSponsors} sponsors)`
                    : " (unlimited sponsors)"}
                </span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
                  Layout style: <strong>{campaign.layoutStyle}</strong>
                </p>
              </div>
              {sponsors.length > 0 ? (
                <FlexibleLayoutRenderer
                  sponsors={sponsors}
                  layoutStyle={campaign.layoutStyle}
                  sponsorDisplayType={campaign.sponsorDisplayType}
                />
              ) : (
                <div
                  style={{
                    padding: 40,
                    background: "#f5f5f5",
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: 16, color: "#999", margin: 0 }}>
                    No sponsors yet
                  </p>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      <Card title="Sponsors">
        <Table
          dataSource={sponsors}
          columns={sponsorColumns}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Edit Campaign Modal */}
      {campaign && (
        <EditCampaignModal
          visible={isEditModalVisible}
          campaign={campaign}
          onCancel={() => setIsEditModalVisible(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Duplicate Campaign Modal */}
      {campaign && (
        <DuplicateCampaignModal
          visible={isDuplicateModalVisible}
          campaign={campaign}
          onCancel={() => setIsDuplicateModalVisible(false)}
          onSuccess={(newCampaign) => {
            setIsDuplicateModalVisible(false);
            navigate(`/campaigns/${newCampaign._id}`);
          }}
        />
      )}
    </div>
  );
};

export default CampaignDetail;
