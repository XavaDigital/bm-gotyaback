import React, { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Button,
  Spin,
  message,
  Empty,
  Modal,
  Input,
  Image,
  Tag,
  Space,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import type { SponsorEntry } from "~/types/campaign.types";
import sponsorshipService from "~/services/sponsorship.service";
import campaignService from "~/services/campaign.service";

const { TextArea } = Input;

const LogoApproval: React.FC = () => {
  const { id } = useParams({ from: "/campaigns/$id/logo-approval" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<SponsorEntry | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch campaign details
  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => campaignService.getCampaignById(id!),
  });

  // Fetch pending logos
  const {
    data: pendingLogos,
    isLoading: logosLoading,
    error: logosError,
    refetch,
  } = useQuery({
    queryKey: ["pending-logos", id],
    queryFn: () => sponsorshipService.getPendingLogos(id!),
  });

  // Approve logo mutation
  const approveMutation = useMutation({
    mutationFn: (sponsorshipId: string) =>
      sponsorshipService.approveLogo(sponsorshipId, { approved: true }),
    onSuccess: () => {
      message.success("Logo approved successfully!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || "Failed to approve logo");
    },
  });

  // Reject logo mutation
  const rejectMutation = useMutation({
    mutationFn: ({
      sponsorshipId,
      reason,
    }: {
      sponsorshipId: string;
      reason: string;
    }) =>
      sponsorshipService.approveLogo(sponsorshipId, {
        approved: false,
        rejectionReason: reason,
      }),
    onSuccess: () => {
      message.success("Logo rejected");
      setRejectionModalVisible(false);
      setSelectedSponsor(null);
      setRejectionReason("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || "Failed to reject logo");
    },
  });

  // Approve all mutation
  const approveAllMutation = useMutation({
    mutationFn: () => sponsorshipService.approveAllLogos(id!),
    onSuccess: () => {
      message.success("All logos approved successfully!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || "Failed to approve all logos",
      );
    },
  });

  const handleApprove = (sponsor: SponsorEntry) => {
    approveMutation.mutate(sponsor._id);
  };

  const handleRejectClick = (sponsor: SponsorEntry) => {
    setSelectedSponsor(sponsor);
    setRejectionModalVisible(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedSponsor) return;
    if (!rejectionReason.trim()) {
      message.error("Please provide a reason for rejection");
      return;
    }
    rejectMutation.mutate({
      sponsorshipId: selectedSponsor._id,
      reason: rejectionReason,
    });
  };

  if (campaignLoading || logosLoading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <h2>Campaign not found</h2>
      </div>
    );
  }

  if (logosError) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <h2>Error loading pending logos</h2>
        <p>
          {(logosError as any)?.response?.data?.message ||
            (logosError as Error).message}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "clamp(12px, 3vw, 24px)",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() =>
            navigate({ to: "/campaigns/$id", params: { id: id! } })
          }
          style={{ marginBottom: 16 }}
        >
          Back to Campaign
        </Button>
        <h1 style={{ fontSize: "clamp(20px, 5vw, 32px)", margin: 0 }}>
          Logo Approval - {campaign.title}
        </h1>
      </div>

      {pendingLogos && pendingLogos.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              Modal.confirm({
                title: "Approve All Logos",
                content: "Are you sure you want to approve all pending logos?",
                onOk: () => approveAllMutation.mutate(),
              });
            }}
            loading={approveAllMutation.isPending}
          >
            Approve All
          </Button>
        </div>
      )}

      {!pendingLogos || pendingLogos.length === 0 ? (
        <Card>
          <Empty
            description="No pending logo approvals"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          }}
        >
          {pendingLogos.map((sponsor) => (
            <Card
              key={sponsor._id}
              title={sponsor.name}
              extra={
                <Tag
                  color={sponsor.paymentStatus === "paid" ? "green" : "orange"}
                >
                  {sponsor.paymentStatus}
                </Tag>
              }
            >
              <div style={{ marginBottom: 16, textAlign: "center" }}>
                {sponsor.logoUrl && (
                  <Image
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: 200,
                      objectFit: "contain",
                    }}
                  />
                )}
              </div>
              <p>
                <strong>Email:</strong> {sponsor.email}
              </p>
              <p>
                <strong>Amount:</strong> ${sponsor.amount} {campaign.currency}
              </p>
              {sponsor.message && (
                <p>
                  <strong>Message:</strong> {sponsor.message}
                </p>
              )}
              <Space
                style={{ width: "100%", marginTop: 16 }}
                direction="vertical"
              >
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove(sponsor)}
                  loading={approveMutation.isPending}
                  block
                >
                  Approve Logo
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleRejectClick(sponsor)}
                  loading={rejectMutation.isPending}
                  block
                >
                  Reject Logo
                </Button>
              </Space>
            </Card>
          ))}
        </div>
      )}

      <Modal
        title="Reject Logo"
        open={rejectionModalVisible}
        onOk={handleRejectConfirm}
        onCancel={() => {
          setRejectionModalVisible(false);
          setSelectedSponsor(null);
          setRejectionReason("");
        }}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <p>Please provide a reason for rejecting this logo:</p>
        <TextArea
          rows={4}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="e.g., Logo quality is too low, inappropriate content, etc."
        />
      </Modal>
    </div>
  );
};

export default LogoApproval;
