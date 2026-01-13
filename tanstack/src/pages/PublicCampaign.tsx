import React, { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, Spin, message, Tag, Statistic, List, Empty, Button } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import type {
  Campaign,
  ShirtLayout as ShirtLayoutType,
  SponsorEntry,
} from "~/types/campaign.types";
import campaignService from "../services/campaign.service";
import sponsorshipService from "../services/sponsorship.service";
import ShirtLayout from "../components/ShirtLayout";
import SponsorCheckoutModal from "../components/SponsorCheckoutModal";
import FlexibleLayoutRenderer from "../components/FlexibleLayoutRenderer";
import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";
import { Route } from "../routes/campaign.$slug";

const PublicCampaign: React.FC = () => {
  const { slug } = useParams({ from: '/campaign/$slug' });
  const loaderData = Route.useLoaderData();

  // Use TanStack Query with loader data as placeholder
  // Use placeholderData instead of initialData so it always refetches on mount
  const { data: campaignData, isLoading, refetch } = useQuery({
    queryKey: ['public-campaign', slug],
    queryFn: async () => {
      const campaign = await campaignService.getPublicCampaign(slug!);
      const [sponsors, layout] = await Promise.all([
        sponsorshipService.getPublicSponsors(campaign._id),
        campaignService.getLayout(campaign._id), // 404s handled by interceptor
      ]);
      return { campaign, sponsors, layout };
    },
    placeholderData: loaderData,
    staleTime: 0, // Always refetch on mount
  });

  const campaign = campaignData?.campaign || null;
  const sponsors = campaignData?.sponsors || [];
  const layout = campaignData?.layout || null;

  const [selectedPosition, setSelectedPosition] = useState<
    string | undefined
  >();
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [checkoutVisible, setCheckoutVisible] = useState(false);

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
      await refetch(); // Reload to update layout
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
        refetch();

        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
        }
      }, 2000);

      return () => clearInterval(pollInterval);
    }
  }, [checkoutVisible]);

  if (isLoading) {
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
        overflowX: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 clamp(16px, 3vw, 20px)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <PublicHeader />

        {/* Title */}
        <h1
          style={{
            margin: 0,
            color: "#ffffff",
            fontSize: "clamp(24px, 6vw, 36px)",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          {campaign.title}
        </h1>

        {/* Time Remaining - Full Width */}
        {!isClosed && deadline && (
          <Card
            variant="borderless"
            style={{
              textAlign: "center",
              marginBottom: 24,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Statistic.Timer
              type="countdown"
              title={
                <span style={{ fontSize: "clamp(12px, 2.5vw, 14px)" }}>
                  <ClockCircleOutlined /> Time Remaining
                </span>
              }
              value={deadline}
              format="D [days] H [hrs] m [min]"
              style={{
                fontSize: "clamp(14px, 3vw, 16px)",
              }}
            />
          </Card>
        )}

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
          <Card
            style={{
              marginBottom: 24,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              className="campaign-description"
              dangerouslySetInnerHTML={{ __html: campaign.description }}
              style={{
                fontSize: "clamp(14px, 2.5vw, 16px)",
                wordWrap: "break-word",
                overflowWrap: "break-word",
              }}
            />
          </Card>
        )}

        {layout && layout.layoutType === "grid" && (
          <Card
            title={
              <span
                style={{
                  fontSize: "clamp(18px, 4vw, 24px)",
                  fontWeight: "600",
                }}
              >
                Select Your Sponsorship Spot
              </span>
            }
            style={{
              marginBottom: 24,
              width: "100%",
              boxSizing: "border-box",
            }}
            extra={
              <div style={{ fontSize: "clamp(12px, 2.5vw, 14px)" }}>
                {takenSpots} / {totalSpots} spots filled
              </div>
            }
          >
            {isClosed ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "clamp(24px, 6vw, 40px)",
                  color: "#888",
                }}
              >
                <h3 style={{ fontSize: "clamp(18px, 4vw, 24px)" }}>
                  This campaign has ended
                </h3>
                <p style={{ fontSize: "clamp(14px, 2.5vw, 16px)" }}>
                  No more sponsorships can be accepted.
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    marginBottom: 16,
                    padding: "clamp(8px, 2vw, 12px)",
                    backgroundColor: "#1f1f1f",
                    borderRadius: 4,
                    border: "1px solid #3a3a3a",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "clamp(8px, 2vw, 16px)",
                    alignItems: "center",
                  }}
                >
                  <strong
                    style={{
                      color: "#ffffff",
                      fontSize: "clamp(12px, 2.5vw, 14px)",
                    }}
                  >
                    Legend:
                  </strong>
                  <span
                    style={{
                      color: "#ffffff",
                      fontSize: "clamp(12px, 2.5vw, 14px)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "clamp(12px, 2.5vw, 16px)",
                        height: "clamp(12px, 2.5vw, 16px)",
                        backgroundColor: "#52c41a",
                        borderRadius: 2,
                      }}
                    />
                    Available
                  </span>
                  <span
                    style={{
                      color: "#ffffff",
                      fontSize: "clamp(12px, 2.5vw, 14px)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "clamp(12px, 2.5vw, 16px)",
                        height: "clamp(12px, 2.5vw, 16px)",
                        backgroundColor: "#d9d9d9",
                        borderRadius: 2,
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
                />
                <div
                  style={{
                    marginTop: 24,
                    textAlign: "center",
                    backgroundColor: "#1f1f1f",
                    padding: "clamp(12px, 3vw, 20px)",
                    borderRadius: 8,
                    border: "1px solid #3a3a3a",
                    boxSizing: "border-box",
                  }}
                >
                  <h4
                    style={{
                      marginBottom: 8,
                      color: "#ffffff",
                      fontSize: "clamp(15px, 3.5vw, 22px)",
                      fontWeight: "600",
                    }}
                  >
                    Not looking for a spot on the shirt?
                  </h4>
                  <p
                    style={{
                      marginBottom: 12,
                      color: "#cccccc",
                      fontSize: "clamp(12px, 2.5vw, 15px)",
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
                      height: "clamp(38px, 6vw, 44px)",
                      fontSize: "clamp(12px, 2.2vw, 14px)",
                      fontWeight: "600",
                      padding: "0 clamp(12px, 2.5vw, 20px)",
                      whiteSpace: "nowrap",
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
              <span
                style={{
                  fontSize: "clamp(18px, 4vw, 24px)",
                  fontWeight: "600",
                }}
              >
                Become a Sponsor
              </span>
            }
            style={{
              marginBottom: 24,
              width: "100%",
              boxSizing: "border-box",
            }}
            extra={
              layout.maxSponsors && (
                <div style={{ fontSize: "clamp(12px, 2.5vw, 14px)" }}>
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
          ) : campaign.layoutStyle === "word-cloud" ||
             campaign.layoutStyle === "amount-ordered" ||
             campaign.layoutStyle === "size-ordered" ||
             (campaign.campaignType === "pay-what-you-want" && layout?.layoutType === "flexible") ? (
            /* Use flexible layout renderer for word-cloud, amount-ordered, size-ordered, or flexible layouts */
            <FlexibleLayoutRenderer
              sponsors={sponsors}
              layoutStyle={campaign.layoutStyle}
              sponsorDisplayType={campaign.sponsorDisplayType}
              campaignType={campaign.campaignType}
            />
          ) : (
            /* Traditional list for grid layouts without special layout styles */
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
                    {sponsor.positionId && <Tag>{sponsor.positionId}</Tag>}
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
