import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Spin, message, Tag, Statistic, List, Empty, Button } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import type {
  Campaign,
  ShirtLayout as ShirtLayoutType,
  SponsorEntry,
} from "../types/campaign.types";
import campaignService from "../services/campaign.service";
import sponsorshipService from "../services/sponsorship.service";
import ShirtLayout from "../components/ShirtLayout";
import SponsorCheckoutModal from "../components/SponsorCheckoutModal";
import FlexibleLayoutRenderer from "../components/FlexibleLayoutRenderer";
import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";

const PublicCampaign: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [layout, setLayout] = useState<ShirtLayoutType | null>(null);
  const [sponsors, setSponsors] = useState<SponsorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<
    string | undefined
  >();
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [checkoutVisible, setCheckoutVisible] = useState(false);

  useEffect(() => {
    if (slug) {
      loadCampaignData();
    }
  }, [slug]);

  const loadCampaignData = async () => {
    try {
      const campaignData = await campaignService.getPublicCampaign(slug!);
      setCampaign(campaignData);

      // Load public sponsors
      const sponsorsData = await sponsorshipService.getPublicSponsors(
        campaignData._id
      );
      setSponsors(sponsorsData);

      // Load layout for all campaign types
      try {
        const layoutData = await campaignService.getLayout(campaignData._id);
        setLayout(layoutData);
      } catch (error) {
        console.error("No layout found");
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Campaign not found");
    } finally {
      setLoading(false);
    }
  };

  const handlePositionSelect = (positionId: string, price: number) => {
    setSelectedPosition(positionId);
    setSelectedAmount(price);
    setCheckoutVisible(true);
  };

  const handleSponsorshipSubmit = async (data: any) => {
    try {
      await sponsorshipService.createSponsorship(campaign!._id, data);
      setCheckoutVisible(false);
      setSelectedPosition(undefined);
      await loadCampaignData(); // Reload to update layout
      message.success("Sponsorship submitted successfully!");
    } catch (error) {
      throw error;
    }
  };

  // Auto-reload campaign data periodically after modal closes to catch webhook updates
  useEffect(() => {
    if (!checkoutVisible && campaign) {
      // Poll for updates every 2 seconds for 10 seconds after modal closes
      // This catches webhook updates for card payments
      let pollCount = 0;
      const maxPolls = 5;

      const pollInterval = setInterval(() => {
        pollCount++;
        loadCampaignData();

        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
        }
      }, 2000);

      return () => clearInterval(pollInterval);
    }
  }, [checkoutVisible]);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 60,
          background: "#1f1f1f",
          minHeight: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: 60,
          background: "#1f1f1f",
          minHeight: "100vh",
        }}
      >
        <Empty description="Campaign not found" />
      </div>
    );
  }

  // Show "Coming Soon" for draft campaigns
  if (campaign.status === "draft") {
    return (
      <div
        style={{
          background: "#1f1f1f",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "0 20px",
          }}
        >
          <PublicHeader />

          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              marginTop: 60,
            }}
          >
            <Card>
              <div style={{ padding: "40px 20px" }}>
                <h1
                  style={{ fontSize: 48, marginBottom: 16, color: "#1890ff" }}
                >
                  Coming Soon
                </h1>
                <h2 style={{ fontSize: 24, marginBottom: 24, fontWeight: 400 }}>
                  {campaign.title}
                </h2>
                <p style={{ fontSize: 16, color: "#666", marginBottom: 32 }}>
                  This campaign is currently in draft mode and will be available
                  soon. Check back later!
                </p>
                {campaign.startDate && (
                  <div style={{ marginTop: 24 }}>
                    <Tag
                      color="blue"
                      style={{ fontSize: 14, padding: "8px 16px" }}
                    >
                      Expected Launch:{" "}
                      {new Date(campaign.startDate).toLocaleDateString()}
                    </Tag>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <PublicFooter />
        </div>
      </div>
    );
  }

  const isClosed =
    campaign.isClosed ||
    (campaign.endDate && new Date() > new Date(campaign.endDate));
  const deadline = campaign.endDate
    ? new Date(campaign.endDate).getTime()
    : undefined;
  const totalSpots = layout?.placements.length || 0;
  const takenSpots = layout?.placements.filter((p) => p.isTaken).length || 0;

  return (
    <div
      style={{
        background: "#1f1f1f",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        <PublicHeader />

        {/* Title and Time Remaining Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h1 style={{ margin: 0, color: "#ffffff" }}>{campaign.title}</h1>
          {!isClosed && deadline && (
            <Card variant="borderless" style={{ textAlign: "center" }}>
              <Statistic.Timer
                type="countdown"
                title={
                  <>
                    <ClockCircleOutlined /> Time Remaining
                  </>
                }
                value={deadline}
                format="D [days] H [hrs] m [min]"
              />
            </Card>
          )}
        </div>

        {/* Header Image */}
        {campaign.headerImageUrl && (
          <div style={{ marginBottom: 24 }}>
            <img
              src={campaign.headerImageUrl}
              alt={campaign.title}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: 8,
                objectFit: "cover",
              }}
            />
          </div>
        )}

        {/* Description - Full Width */}
        {campaign.description && (
          <Card style={{ marginBottom: 24 }}>
            <div
              className="campaign-description"
              dangerouslySetInnerHTML={{ __html: campaign.description }}
              style={{ fontSize: 16 }}
            />
          </Card>
        )}

        {layout && layout.layoutType === "grid" && (
          <Card
            title={
              <span style={{ fontSize: "24px", fontWeight: "600" }}>
                Select Your Sponsorship Spot
              </span>
            }
            style={{ marginBottom: 24 }}
            extra={
              <div style={{ fontSize: 14 }}>
                {takenSpots} / {totalSpots} spots filled
              </div>
            }
          >
            {isClosed ? (
              <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
                <h3>This campaign has ended</h3>
                <p>No more sponsorships can be accepted.</p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    backgroundColor: "#1f1f1f",
                    borderRadius: 4,
                    border: "1px solid #3a3a3a",
                  }}
                >
                  <strong style={{ color: "#ffffff" }}>Legend:</strong>
                  <span style={{ marginLeft: 16, color: "#ffffff" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 16,
                        height: 16,
                        backgroundColor: "#52c41a",
                        borderRadius: 2,
                        marginRight: 4,
                      }}
                    />
                    Available
                  </span>
                  <span style={{ marginLeft: 16, color: "#ffffff" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 16,
                        height: 16,
                        backgroundColor: "#d9d9d9",
                        borderRadius: 2,
                        marginRight: 4,
                      }}
                    />
                    Taken
                  </span>
                </div>
                <ShirtLayout
                  layout={layout}
                  selectedPosition={selectedPosition}
                  onPositionSelect={handlePositionSelect}
                  currency={campaign.currency}
                  showPriceGradient={campaign.campaignType === "positional"}
                  sponsors={sponsors}
                />
                <div
                  style={{
                    marginTop: 24,
                    textAlign: "center",
                    backgroundColor: "#1f1f1f",
                    padding: 24,
                    borderRadius: 8,
                    border: "1px solid #3a3a3a",
                  }}
                >
                  <h4
                    style={{
                      marginBottom: 12,
                      color: "#ffffff",
                      fontSize: "28px",
                      fontWeight: "600",
                    }}
                  >
                    Not looking for a spot on the shirt?
                  </h4>
                  <p
                    style={{
                      marginBottom: 20,
                      color: "#cccccc",
                      fontSize: "18px",
                    }}
                  >
                    You can still support this campaign by making a general
                    donation of any amount.
                  </p>
                  <Button
                    type="primary"
                    onClick={() => {
                      setSelectedPosition(undefined);
                      setSelectedAmount(0);
                      setCheckoutVisible(true);
                    }}
                    style={{
                      height: "60px",
                      fontSize: "20px",
                      padding: "0 48px",
                      fontWeight: "600",
                    }}
                  >
                    Make a General Donation
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}

        {/* Pay What You Want Section */}
        {layout && layout.layoutType === "flexible" && (
          <Card
            title={
              <span style={{ fontSize: "24px", fontWeight: "600" }}>
                Become a Sponsor
              </span>
            }
            style={{ marginBottom: 24 }}
            extra={
              layout.maxSponsors && (
                <div style={{ fontSize: 14 }}>
                  {sponsors.length} / {layout.maxSponsors} sponsors
                </div>
              )
            }
          >
            {isClosed ? (
              <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
                <h3>This campaign has ended</h3>
                <p>No more sponsorships can be accepted.</p>
              </div>
            ) : layout.maxSponsors && sponsors.length >= layout.maxSponsors ? (
              <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
                <h3>Sponsor Limit Reached</h3>
                <p>This campaign has reached its maximum number of sponsors.</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 16, marginBottom: 16 }}>
                    {campaign.pricingConfig?.sizeTiers &&
                    campaign.pricingConfig.sizeTiers.length > 0
                      ? "Choose your contribution amount. Your sponsor display size will be based on your contribution tier."
                      : `Choose your contribution amount. Minimum contribution: $${
                          campaign.pricingConfig?.minimumAmount || 0
                        }`}
                  </p>

                  {/* Size Tiers Display - only show if tiers are defined */}
                  {campaign.pricingConfig?.sizeTiers &&
                    campaign.pricingConfig.sizeTiers.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <strong>Size Tiers:</strong>
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            marginTop: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          {campaign.pricingConfig.sizeTiers.map(
                            (tier, index) => (
                              <div
                                key={index}
                                style={{
                                  flex: "1 1 200px",
                                  padding: 12,
                                  border: "1px solid #d9d9d9",
                                  borderRadius: 8,
                                  background: "#fafafa",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "bold",
                                    textTransform: "capitalize",
                                    marginBottom: 4,
                                  }}
                                >
                                  {tier.size}
                                </div>
                                <div style={{ fontSize: 14, color: "#666" }}>
                                  ${tier.minAmount} -{" "}
                                  {tier.maxAmount ? `$${tier.maxAmount}` : "∞"}
                                </div>
                                {campaign.sponsorDisplayType !== "logo-only" &&
                                  tier.textFontSize && (
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: "#999",
                                        marginTop: 4,
                                      }}
                                    >
                                      Font: {tier.textFontSize}px
                                    </div>
                                  )}
                                {campaign.sponsorDisplayType !== "text-only" &&
                                  tier.logoWidth && (
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: "#999",
                                        marginTop: 4,
                                      }}
                                    >
                                      Logo: {tier.logoWidth}px
                                    </div>
                                  )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>

                <div style={{ textAlign: "center" }}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => {
                      setSelectedPosition(undefined);
                      setSelectedAmount(
                        campaign.pricingConfig?.minimumAmount || 0
                      );
                      setCheckoutVisible(true);
                    }}
                    style={{
                      height: "60px",
                      fontSize: "20px",
                      padding: "0 48px",
                      fontWeight: "600",
                    }}
                  >
                    Become a Sponsor
                  </Button>
                </div>
              </>
            )}
          </Card>
        )}

        <Card
          title={
            <span style={{ fontSize: "24px", fontWeight: "600" }}>
              Our Sponsors ({sponsors.length})
            </span>
          }
        >
          {sponsors.length === 0 ? (
            <Empty
              description="No sponsors yet. Be the first!"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : campaign.campaignType === "pay-what-you-want" &&
            layout?.layoutType === "flexible" ? (
            /* Flexible layout for pay-what-you-want */
            <FlexibleLayoutRenderer
              sponsors={sponsors}
              layoutStyle={campaign.layoutStyle}
              sponsorDisplayType={campaign.sponsorDisplayType}
            />
          ) : (
            /* Traditional list for grid layouts */
            <List
              dataSource={sponsors}
              renderItem={(sponsor) => (
                <List.Item
                  style={{
                    opacity: sponsor.paymentStatus === "pending" ? 0.6 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                    }}
                  >
                    {sponsor.sponsorType === "logo" &&
                    sponsor.logoUrl &&
                    sponsor.logoApprovalStatus === "approved" ? (
                      <img
                        src={sponsor.logoUrl}
                        alt={sponsor.name}
                        style={{
                          width: 60,
                          height: 60,
                          objectFit: "contain",
                          border: "1px solid #e8e8e8",
                          borderRadius: 4,
                          padding: 4,
                        }}
                      />
                    ) : null}
                    <List.Item.Meta
                      title={sponsor.name}
                      description={sponsor.message || "No message"}
                    />
                    {sponsor.paymentStatus === "pending" && (
                      <Tag color="orange">Pending Payment</Tag>
                    )}
                  </div>
                </List.Item>
              )}
            />
          )}
        </Card>

        <SponsorCheckoutModal
          visible={checkoutVisible}
          onCancel={() => {
            setCheckoutVisible(false);
            setSelectedPosition(undefined);
          }}
          onSubmit={handleSponsorshipSubmit}
          positionId={selectedPosition}
          amount={selectedAmount}
          currency={campaign.currency}
          campaignId={campaign._id}
          campaign={campaign}
        />

        <PublicFooter />
      </div>
    </div>
  );
};

export default PublicCampaign;
