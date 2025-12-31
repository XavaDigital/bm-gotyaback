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
} from "antd";
import {
  CloseCircleOutlined,
  ExportOutlined,
  EditOutlined,
  BellOutlined,
} from "@ant-design/icons";
import type {
  Campaign,
  SponsorEntry,
  ShirtLayout,
} from "../types/campaign.types";
import campaignService from "../services/campaign.service";
import sponsorshipService from "../services/sponsorship.service";
import EditCampaignModal from "../components/EditCampaignModal";
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
  const [pendingLogos, setPendingLogos] = useState<SponsorEntry[]>([]);
  const [loadingPendingLogos, setLoadingPendingLogos] = useState(false);

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
          {campaign.sponsorDisplayType !== "text-only" && (
            <Badge count={pendingLogos.length} offset={[-5, 5]}>
              <Button
                onClick={() => navigate(`/campaigns/${id}/logo-approval`)}
                style={{ marginRight: 8 }}
                icon={<BellOutlined />}
              >
                Logo Approvals
              </Button>
            </Badge>
          )}
          {!campaign.isClosed && (
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
            {campaign.isClosed ? (
              <Tag color="red">Closed</Tag>
            ) : (
              <Tag color="green">Active</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Campaign Type">
            {campaign.campaignType}
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
        </Descriptions>
      </Card>

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
    </div>
  );
};

export default CampaignDetail;
