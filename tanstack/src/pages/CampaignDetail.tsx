import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  CampaignType,
} from "~/types/campaign.types";
import campaignService from "../services/campaign.service";
import sponsorshipService from "../services/sponsorship.service";
import EditCampaignModal from "../components/EditCampaignModal";
import ShirtLayoutComponent from "../components/ShirtLayout";
import LogoApprovalCard from "../components/LogoApprovalCard";
import FlexibleLayoutRenderer from "../components/FlexibleLayoutRenderer";
import { Route } from "../routes/campaigns.$id";

// Helper function to format campaign type labels
const formatCampaignType = (type: CampaignType): string => {
  switch (type) {
    case 'fixed':
      return 'Fixed Pricing';
    case 'positional':
      return 'Tiered Pricing';
    case 'pay-what-you-want':
      return 'Pay What You Want';
    default:
      return type;
  }
};

const CampaignDetail: React.FC = () => {
  const { id } = useParams({ from: '/campaigns/$id' });
  const navigate = useNavigate();
  const loaderData = Route.useLoaderData();

  // Use TanStack Query with loader data as placeholder
  // Use placeholderData instead of initialData so it always refetches on mount
  const { data: campaignData, isLoading, refetch } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const [campaign, sponsors, layout] = await Promise.all([
        campaignService.getCampaignById(id!),
        sponsorshipService.getSponsors(id!),
        campaignService.getLayout(id!), // 404s handled by interceptor
      ]);
      return { campaign, sponsors, layout };
    },
    placeholderData: loaderData,
    staleTime: 0, // Always refetch on mount
  });

  const campaign = campaignData?.campaign || null;
  const sponsors = campaignData?.sponsors || [];
  const layout = campaignData?.layout || null;

  const [closingCampaign, setClosingCampaign] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [pendingLogos, setPendingLogos] = useState<SponsorEntry[]>([]);
  const [loadingPendingLogos, setLoadingPendingLogos] = useState(false);

  useEffect(() => {
    if (id) {
      loadPendingLogos();
    }
  }, [id]);

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
    refetch();
  };

  const handleRejectLogo = async (sponsorId: string, reason: string) => {
    await sponsorshipService.approveLogo(sponsorId, {
      approved: false,
      rejectionReason: reason,
    });
    // Reload data
    loadPendingLogos();
    refetch();
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
          refetch();
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
      refetch();
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
      refetch();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Failed to update payment status"
      );
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalVisible(false);
    refetch(); // Reload campaign data after edit
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

  if (isLoading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "clamp(40px, 8vw, 60px)",
        }}
      >
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

  const potentialFunds = sponsors.reduce((sum, s) => sum + s.amount, 0);

  // Calculate maximum potential if all slots are filled (for grid layouts)
  const maxPotentialIfAllFilled = layout?.placements
    ? layout.placements.reduce((sum, p) => sum + p.price, 0)
    : 0;

  const spotsTaken = layout?.placements.filter((p) => p.isTaken).length || 0;
  const totalSpots = layout?.placements.length || 0;
  const isFlexibleLayout = layout?.layoutType === "flexible";

  return (
    <div
      style={{
        padding: "clamp(12px, 3vw, 24px)",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "clamp(16px, 3vw, 24px)",
          flexWrap: "wrap",
          gap: "clamp(12px, 2vw, 16px)",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(20px, 5vw, 32px)",
            margin: 0,
            flex: "1 1 100%",
          }}
        >
          {campaign.title}
        </h1>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "clamp(6px, 1.5vw, 8px)",
            width: "100%",
          }}
        >
          <Button
            onClick={() => window.open(`/campaign/${campaign.slug}`, "_blank")}
            icon={<ExportOutlined />}
            style={{
              fontSize: "clamp(12px, 2.5vw, 14px)",
              height: "clamp(30px, 6vw, 32px)",
              padding: "0 clamp(8px, 2vw, 15px)",
            }}
          >
            <span style={{ display: window.innerWidth < 768 ? "none" : "inline" }}>
              View Public Page
            </span>
            <span style={{ display: window.innerWidth >= 768 ? "none" : "inline" }}>
              View
            </span>
          </Button>
          {campaign.sponsorDisplayType !== "text-only" && (
            <Badge count={pendingLogos.length} offset={[-5, 5]}>
              <Button
                onClick={() => navigate({ to: `/campaigns/${id}/logo-approval` })}
                icon={<BellOutlined />}
                style={{
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  height: "clamp(30px, 6vw, 32px)",
                  padding: "0 clamp(8px, 2vw, 15px)",
                }}
              >
                <span style={{ display: window.innerWidth < 768 ? "none" : "inline" }}>
                  Logo Approvals
                </span>
                <span style={{ display: window.innerWidth >= 768 ? "none" : "inline" }}>
                  Logos
                </span>
              </Button>
            </Badge>
          )}
          {!campaign.isClosed && (
            <>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setIsEditModalVisible(true)}
                style={{
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  height: "clamp(30px, 6vw, 32px)",
                  padding: "0 clamp(8px, 2vw, 15px)",
                }}
              >
                <span style={{ display: window.innerWidth < 768 ? "none" : "inline" }}>
                  Edit Campaign
                </span>
                <span style={{ display: window.innerWidth >= 768 ? "none" : "inline" }}>
                  Edit
                </span>
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleCloseCampaign}
                loading={closingCampaign}
                style={{
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  height: "clamp(30px, 6vw, 32px)",
                  padding: "0 clamp(8px, 2vw, 15px)",
                }}
              >
                <span style={{ display: window.innerWidth < 768 ? "none" : "inline" }}>
                  Close Campaign
                </span>
                <span style={{ display: window.innerWidth >= 768 ? "none" : "inline" }}>
                  Close
                </span>
              </Button>
            </>
          )}
        </div>
      </div>

      <Card
        title={
          <span style={{ fontSize: "clamp(16px, 3.5vw, 20px)" }}>
            Campaign Statistics
          </span>
        }
        style={{
          marginBottom: "clamp(16px, 3vw, 24px)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "clamp(12px, 3vw, 24px)",
          }}
        >
          <Statistic
            title="Total Raised"
            value={totalRaised}
            prefix={campaign.currency}
            suffix="$"
            valueStyle={{
              color: "#3f8600",
              fontSize: "clamp(18px, 4vw, 24px)",
            }}
          />
          <Statistic
            title="Pending Payments"
            value={pendingAmount}
            prefix={campaign.currency}
            suffix="$"
            valueStyle={{
              color: "#cf1322",
              fontSize: "clamp(18px, 4vw, 24px)",
            }}
          />
          {layout && !isFlexibleLayout && (
            <Statistic
              title="Spots Filled"
              value={spotsTaken}
              suffix={`/ ${totalSpots}`}
              valueStyle={{ fontSize: "clamp(18px, 4vw, 24px)" }}
            />
          )}
          <Statistic
            title="Total Sponsors"
            value={sponsors.length}
            valueStyle={{ fontSize: "clamp(18px, 4vw, 24px)" }}
          />
          {isFlexibleLayout && layout?.maxSponsors && (
            <Statistic
              title="Sponsor Limit"
              value={sponsors.length}
              suffix={`/ ${layout.maxSponsors}`}
              valueStyle={{ fontSize: "clamp(18px, 4vw, 24px)" }}
            />
          )}
          {pendingLogos.length > 0 && (
            <Statistic
              title="Pending Logo Approvals"
              value={pendingLogos.length}
              valueStyle={{
                color: "#faad14",
                fontSize: "clamp(18px, 4vw, 24px)",
              }}
            />
          )}
        </div>
      </Card>

      {/* Funds Calculator */}
      <Card
        title={
          <span style={{ fontSize: "clamp(16px, 3.5vw, 20px)" }}>
            Funds Calculator
          </span>
        }
        style={{
          marginBottom: "clamp(16px, 3vw, 24px)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "clamp(12px, 3vw, 24px)",
          }}
        >
          <div
            style={{
              padding: "clamp(16px, 3vw, 20px)",
              background: "#f0f9ff",
              borderRadius: 8,
              border: "1px solid #91d5ff",
            }}
          >
            <div
              style={{
                fontSize: "clamp(12px, 2.5vw, 14px)",
                color: "#666",
                marginBottom: 8,
              }}
            >
              Total Raised (Paid)
            </div>
            <div
              style={{
                fontSize: "clamp(24px, 5vw, 32px)",
                fontWeight: "bold",
                color: "#3f8600",
              }}
            >
              {campaign.currency} ${totalRaised.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: "clamp(11px, 2vw, 12px)",
                color: "#999",
                marginTop: 4,
              }}
            >
              {sponsors.filter((s) => s.paymentStatus === "paid").length} paid sponsor
              {sponsors.filter((s) => s.paymentStatus === "paid").length !== 1 ? "s" : ""}
            </div>
          </div>

          <div
            style={{
              padding: "clamp(16px, 3vw, 20px)",
              background: "#fff7e6",
              borderRadius: 8,
              border: "1px solid #ffd591",
            }}
          >
            <div
              style={{
                fontSize: "clamp(12px, 2.5vw, 14px)",
                color: "#666",
                marginBottom: 8,
              }}
            >
              Potential Funds (All)
            </div>
            <div
              style={{
                fontSize: "clamp(24px, 5vw, 32px)",
                fontWeight: "bold",
                color: "#d48806",
              }}
            >
              {campaign.currency} ${potentialFunds.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: "clamp(11px, 2vw, 12px)",
                color: "#999",
                marginTop: 4,
              }}
            >
              {sponsors.length} total sponsor{sponsors.length !== 1 ? "s" : ""}
              {pendingAmount > 0 && (
                <span style={{ color: "#d48806", marginLeft: 4 }}>
                  (${pendingAmount.toFixed(2)} pending)
                </span>
              )}
            </div>
          </div>

          {pendingAmount > 0 && (
            <div
              style={{
                padding: "clamp(16px, 3vw, 20px)",
                background: "#fff1f0",
                borderRadius: 8,
                border: "1px solid #ffa39e",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  color: "#666",
                  marginBottom: 8,
                }}
              >
                Pending Payments
              </div>
              <div
                style={{
                  fontSize: "clamp(24px, 5vw, 32px)",
                  fontWeight: "bold",
                  color: "#cf1322",
                }}
              >
                {campaign.currency} ${pendingAmount.toFixed(2)}
              </div>
              <div
                style={{
                  fontSize: "clamp(11px, 2vw, 12px)",
                  color: "#999",
                  marginTop: 4,
                }}
              >
                {sponsors.filter((s) => s.paymentStatus === "pending").length} pending sponsor
                {sponsors.filter((s) => s.paymentStatus === "pending").length !== 1 ? "s" : ""}
              </div>
            </div>
          )}

          {layout && !isFlexibleLayout && maxPotentialIfAllFilled > 0 && (
            <div
              style={{
                padding: "clamp(16px, 3vw, 20px)",
                background: "#f6ffed",
                borderRadius: 8,
                border: "1px solid #b7eb8f",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  color: "#666",
                  marginBottom: 8,
                }}
              >
                Max Potential (All Slots)
              </div>
              <div
                style={{
                  fontSize: "clamp(24px, 5vw, 32px)",
                  fontWeight: "bold",
                  color: "#52c41a",
                }}
              >
                {campaign.currency} ${maxPotentialIfAllFilled.toFixed(2)}
              </div>
              <div
                style={{
                  fontSize: "clamp(11px, 2vw, 12px)",
                  color: "#999",
                  marginTop: 4,
                }}
              >
                {spotsTaken} / {totalSpots} slots filled
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div
          style={{
            marginTop: "clamp(16px, 3vw, 20px)",
            padding: "clamp(12px, 2.5vw, 16px)",
            background: "#fafafa",
            borderRadius: 8,
            borderLeft: "4px solid #1890ff",
          }}
        >
          <div
            style={{
              fontSize: "clamp(13px, 2.5vw, 14px)",
              color: "#595959",
              lineHeight: 1.6,
            }}
          >
            <strong>Summary:</strong> You have raised{" "}
            <strong style={{ color: "#3f8600" }}>
              {campaign.currency} ${totalRaised.toFixed(2)}
            </strong>{" "}
            from paid sponsors.
            {pendingAmount > 0 && (
              <>
                {" "}
                If all pending payments are completed, you will have{" "}
                <strong style={{ color: "#d48806" }}>
                  {campaign.currency} ${potentialFunds.toFixed(2)}
                </strong>
                .
              </>
            )}
            {pendingAmount === 0 && totalRaised > 0 && (
              <> All payments have been received!</>
            )}
            {layout && !isFlexibleLayout && maxPotentialIfAllFilled > 0 && (
              <>
                {" "}
                If all {totalSpots} slots are filled, you could raise up to{" "}
                <strong style={{ color: "#52c41a" }}>
                  {campaign.currency} ${maxPotentialIfAllFilled.toFixed(2)}
                </strong>
                .
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Pending Logo Approvals */}
      {pendingLogos.length > 0 && (
        <Card
          title={
            <span style={{ fontSize: "clamp(16px, 3.5vw, 20px)" }}>
              <BellOutlined style={{ marginRight: 8 }} />
              Pending Logo Approvals
              <Badge
                count={pendingLogos.length}
                style={{ marginLeft: 8 }}
                showZero={false}
              />
            </span>
          }
          style={{
            marginBottom: "clamp(16px, 3vw, 24px)",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {loadingPendingLogos ? (
            <div
              style={{
                textAlign: "center",
                padding: "clamp(24px, 6vw, 40px)",
              }}
            >
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

      <Card
        title={
          <span style={{ fontSize: "clamp(16px, 3.5vw, 20px)" }}>
            Campaign Details
          </span>
        }
        style={{
          marginBottom: "clamp(16px, 3vw, 24px)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Descriptions
          bordered
          column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
        >
          <Descriptions.Item label="Status">
            {campaign.isClosed ? (
              <Tag color="red">Closed</Tag>
            ) : (
              <Tag color="green">Active</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Campaign Type">
            {formatCampaignType(campaign.campaignType)}
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
        <Card
          title={
            <span style={{ fontSize: "clamp(16px, 3.5vw, 20px)" }}>
              Shirt Layout
            </span>
          }
          style={{
            marginBottom: "clamp(16px, 3vw, 24px)",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {layout.layoutType === "grid" ? (
            <>
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <Tag color="blue">
                  {formatCampaignType(campaign.campaignType)}
                </Tag>
                <span
                  style={{
                    color: "#666",
                    fontSize: "clamp(12px, 2.5vw, 14px)",
                  }}
                >
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
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <Tag color="purple">Pay What You Want</Tag>
                <span
                  style={{
                    color: "#666",
                    fontSize: "clamp(12px, 2.5vw, 14px)",
                  }}
                >
                  Flexible layout
                  {layout.maxSponsors
                    ? ` (max ${layout.maxSponsors} sponsors)`
                    : " (unlimited sponsors)"}
                </span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <p
                  style={{
                    fontSize: "clamp(12px, 2.5vw, 14px)",
                    color: "#666",
                    marginBottom: 8,
                  }}
                >
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
                    padding: "clamp(24px, 6vw, 40px)",
                    background: "#f5f5f5",
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: "clamp(14px, 3vw, 16px)",
                      color: "#999",
                      margin: 0,
                    }}
                  >
                    No sponsors yet
                  </p>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      <Card
        title={
          <span style={{ fontSize: "clamp(16px, 3.5vw, 20px)" }}>Sponsors</span>
        }
        style={{
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Table
          dataSource={sponsors}
          columns={sponsorColumns}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
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
