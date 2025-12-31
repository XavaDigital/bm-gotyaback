import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Spin,
  Empty,
  message,
  Button,
  Space,
  Typography,
  Alert,
  Tabs,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import sponsorshipService from "../services/sponsorship.service";
import campaignService from "../services/campaign.service";
import LogoApprovalCard from "../components/LogoApprovalCard";
import type { SponsorEntry, Campaign } from "../types/campaign.types";

const { Title, Text } = Typography;

const LogoApproval: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [pendingLogos, setPendingLogos] = useState<SponsorEntry[]>([]);
  const [allSponsors, setAllSponsors] = useState<SponsorEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>("pending");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Load campaign details
      const campaignData = await campaignService.getCampaign(id);
      setCampaign(campaignData);

      // Load pending logos
      const pending = await sponsorshipService.getPendingLogos(id);
      setPendingLogos(pending);

      // Load all sponsors to show approved/rejected
      const all = await sponsorshipService.getSponsors(id);
      setAllSponsors(all);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Failed to load logo approvals"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sponsorId: string) => {
    try {
      await sponsorshipService.approveLogo(sponsorId, {
        approved: true,
      });
      message.success("Logo approved successfully!");
      await loadData(); // Reload data
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Failed to approve logo"
      );
    }
  };

  const handleReject = async (sponsorId: string, reason: string) => {
    try {
      await sponsorshipService.approveLogo(sponsorId, {
        approved: false,
        rejectionReason: reason,
      });
      message.success("Logo rejected");
      await loadData(); // Reload data
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to reject logo");
    }
  };

  const approvedLogos = allSponsors.filter(
    (s) => s.sponsorType === "logo" && s.logoApprovalStatus === "approved"
  );
  const rejectedLogos = allSponsors.filter(
    (s) => s.sponsorType === "logo" && s.logoApprovalStatus === "rejected"
  );

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading logo approvals...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <Empty description="Campaign not found" />
        <Button
          type="primary"
          onClick={() => navigate("/campaigns")}
          style={{ marginTop: 16 }}
        >
          Back to Campaigns
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
      {/* Header */}
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/campaigns/${id}`)}
            style={{ marginBottom: 16 }}
          >
            Back to Campaign
          </Button>
          <Title level={2}>Logo Approvals</Title>
          <Text type="secondary">{campaign.title}</Text>
        </div>

        {/* Info Alert */}
        {campaign.sponsorDisplayType !== "text-only" && (
          <Alert
            message="Logo Approval Required"
            description="All uploaded logos must be approved before they appear publicly on the campaign page. Review each logo for quality and appropriateness."
            type="info"
            showIcon
          />
        )}

        {/* Tabs */}
        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "pending",
                label: `Pending (${pendingLogos.length})`,
                children: (
                  <div>
                    {pendingLogos.length === 0 ? (
                      <Empty
                        description="No pending logo approvals"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    ) : (
                      pendingLogos.map((sponsor) => (
                        <LogoApprovalCard
                          key={sponsor._id}
                          sponsor={sponsor}
                          onApprove={handleApprove}
                          onReject={handleReject}
                        />
                      ))
                    )}
                  </div>
                ),
              },
              {
                key: "approved",
                label: `Approved (${approvedLogos.length})`,
                children: (
                  <div>
                    {approvedLogos.length === 0 ? (
                      <Empty
                        description="No approved logos yet"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    ) : (
                      approvedLogos.map((sponsor) => (
                        <LogoApprovalCard
                          key={sponsor._id}
                          sponsor={sponsor}
                          onApprove={handleApprove}
                          onReject={handleReject}
                        />
                      ))
                    )}
                  </div>
                ),
              },
              {
                key: "rejected",
                label: `Rejected (${rejectedLogos.length})`,
                children: (
                  <div>
                    {rejectedLogos.length === 0 ? (
                      <Empty
                        description="No rejected logos"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    ) : (
                      rejectedLogos.map((sponsor) => (
                        <LogoApprovalCard
                          key={sponsor._id}
                          sponsor={sponsor}
                          onApprove={handleApprove}
                          onReject={handleReject}
                        />
                      ))
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </Space>
    </div>
  );
};

export default LogoApproval;

