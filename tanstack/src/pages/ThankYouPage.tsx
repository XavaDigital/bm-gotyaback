import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, Button, Result } from "antd";
import { CheckCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import type { Campaign } from "~/types/campaign.types";
import campaignService from "../services/campaign.service";
import PublicHeader from "../components/PublicHeader";
import PublicFooter from "../components/PublicFooter";
import { getRouteApi } from "@tanstack/react-router";

const routeApi = getRouteApi("/campaign/$slug/thank-you");

const ThankYouPage: React.FC = () => {
  const { slug } = routeApi.useParams();
  const navigate = useNavigate();
  const loaderData = routeApi.useLoaderData();

  // Clean up URL query parameters from Stripe redirect
  useEffect(() => {
    // Remove payment_intent, payment_intent_client_secret, and redirect_status params
    const url = new URL(window.location.href);
    if (url.searchParams.size > 0) {
      window.history.replaceState({}, document.title, url.pathname);
    }
  }, []);

  // Use TanStack Query with loader data as placeholder
  const { data: campaignData } = useQuery({
    queryKey: ["public-campaign-thankyou", slug],
    queryFn: async () => {
      const campaign = await campaignService.getPublicCampaign(slug!);
      return { campaign };
    },
    placeholderData: loaderData as { campaign: Campaign } | undefined,
    staleTime: 0,
  });

  const campaign = campaignData?.campaign || null;

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

        <Card
          style={{
            marginTop: 40,
            marginBottom: 40,
            textAlign: "center",
            border: "none",
          }}
        >
          <Result
            icon={
              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 72 }} />
            }
            title={
              <h1
                style={{
                  fontSize: "clamp(24px, 5vw, 32px)",
                  fontWeight: "600",
                  marginBottom: 16,
                  color: "#ffffff",
                }}
              >
                Thank You for Your Support!
              </h1>
            }
            subTitle={
              <div
                style={{
                  fontSize: "clamp(14px, 3vw, 16px)",
                  color: "#cccccc",
                  marginBottom: 24,
                }}
              >
                {campaign && (
                  <>
                    <p
                      style={{
                        marginBottom: 12,
                        fontSize: "clamp(16px, 3.5vw, 18px)",
                        fontWeight: 500,
                        color: "#ffffff",
                      }}
                    >
                      {campaign.title}
                    </p>
                    <p style={{ marginBottom: 8 }}>
                      Your sponsorship has been received and is being processed.
                    </p>
                    <p style={{ marginBottom: 0 }}>
                      You will receive a confirmation email shortly. Your
                      sponsorship will appear on the campaign page once the
                      payment is confirmed.
                    </p>
                  </>
                )}
                {!campaign && (
                  <p>
                    Your sponsorship has been received and is being processed.
                    You will receive a confirmation email shortly.
                  </p>
                )}
              </div>
            }
            extra={[
              <Button
                key="return"
                type="primary"
                size="large"
                icon={<ArrowLeftOutlined />}
                onClick={() => {
                  if (campaign) {
                    navigate({ to: "/campaign/$slug", params: { slug } });
                  } else {
                    window.location.href = "/";
                  }
                }}
                style={{
                  height: "clamp(40px, 8vw, 48px)",
                  fontSize: "clamp(14px, 3vw, 16px)",
                  fontWeight: "600",
                  padding: "0 clamp(20px, 4vw, 32px)",
                }}
              >
                Return to Campaign
              </Button>,
            ]}
          />

          <div
            style={{
              marginTop: 32,
              padding: "20px",
              backgroundColor: "#2a2a2a",
              borderRadius: 8,
              fontSize: "clamp(12px, 2.5vw, 14px)",
              color: "#cccccc",
              textAlign: "left",
              border: "1px solid #3a3a3a",
            }}
          >
            <p style={{ marginBottom: 8, fontWeight: 600, color: "#ffffff" }}>
              What happens next?
            </p>
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li style={{ marginBottom: 4 }}>
                ✅ Payment confirmation will be sent to your email
              </li>
              <li style={{ marginBottom: 4 }}>
                🎯 Your sponsorship will appear on the campaign once confirmed
              </li>
              <li style={{ marginBottom: 0 }}>
                📧 You'll be notified of any updates from the campaign organizer
              </li>
            </ul>
          </div>
        </Card>

        <PublicFooter />
      </div>
    </div>
  );
};

export default ThankYouPage;
