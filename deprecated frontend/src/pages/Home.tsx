import React, { useEffect, useState } from "react";
import { Button, Row, Col, Card } from "antd";
import {
  RocketOutlined,
  DollarOutlined,
  CreditCardOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import beastmodeLogo from "../assets/beastmode-logo.png";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Override body styles for full-width landing page
    const body = document.body;
    const html = document.documentElement;

    const originalStyles = {
      display: body.style.display,
      placeItems: (body.style as any).placeItems,
      margin: body.style.margin,
      width: body.style.width,
      htmlWidth: html.style.width,
    };

    body.style.display = "block";
    (body.style as any).placeItems = "initial";
    body.style.margin = "0";
    body.style.width = "100%";
    html.style.width = "100%";

    return () => {
      body.style.display = originalStyles.display;
      (body.style as any).placeItems = originalStyles.placeItems;
      body.style.margin = originalStyles.margin;
      body.style.width = originalStyles.width;
      html.style.width = originalStyles.htmlWidth;
    };
  }, []);

  const features = [
    {
      icon: <DollarOutlined style={{ fontSize: 48, color: "#C8102E" }} />,
      title: "100% Free to Use",
      description:
        "No setup fees, no monthly charges. Only pay standard payment processing fees when you receive donations.",
    },
    {
      icon: <CreditCardOutlined style={{ fontSize: 48, color: "#C8102E" }} />,
      title: "Multiple Payment Options",
      description:
        "Accept credit cards via Stripe, cash payments, or manual bank transfers. Your choice, your flexibility.",
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: 48, color: "#C8102E" }} />,
      title: "Quick Setup",
      description:
        "Create your fundraising campaign in minutes. Choose your layout, set your goals, and start raising funds immediately.",
    },
    {
      icon: <SafetyOutlined style={{ fontSize: 48, color: "#C8102E" }} />,
      title: "Secure & Reliable",
      description:
        "Built with enterprise-grade security. Your data and your supporters' information are always protected.",
    },
    {
      icon: <TeamOutlined style={{ fontSize: 48, color: "#C8102E" }} />,
      title: "Sponsor Recognition",
      description:
        "Showcase your sponsors with logos, custom layouts, and tiered recognition levels. Make them feel valued.",
    },
    {
      icon: <RocketOutlined style={{ fontSize: 48, color: "#C8102E" }} />,
      title: "Easy Management",
      description:
        "Track donations, manage sponsors, and monitor your progress with our intuitive dashboard.",
    },
  ];

  const benefits = [
    "Create unlimited campaigns",
    "Accept donations of any size",
    "Customizable sponsor layouts",
    "Real-time donation tracking",
    "Automated email notifications",
    "Mobile-friendly public pages",
    "Logo approval workflow",
    "Export sponsor data",
  ];

  return (
    <div
      style={{
        background: "#1f1f1f",
        minHeight: "100vh",
        color: "#ffffff",
      }}
    >
      {/* Navigation Bar */}
      <div
        style={{
          background: "#2a2a2a",
          borderBottom: "2px solid #3a3a3a",
          padding: "16px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img
            src={beastmodeLogo}
            alt="Beast Mode Logo"
            style={{ height: 50, width: "auto" }}
          />
          <h2
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            Got Your Back
          </h2>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {user ? (
            <Button
              type="primary"
              size="large"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button size="large" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                onClick={() => navigate("/register")}
              >
                Get Started Free
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)",
          padding: "100px 40px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            marginBottom: 24,
            color: "#ffffff",
            lineHeight: 1.2,
          }}
        >
          Fundraising Made <span style={{ color: "#C8102E" }}>Simple</span>
        </h1>
        <p
          style={{
            fontSize: 24,
            color: "#cccccc",
            maxWidth: 800,
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}
        >
          The easiest way to raise funds for your sports team, club, or cause.
          Create beautiful sponsorship campaigns in minutes, accept payments
          online, and track your progress in real-time.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            onClick={() => navigate("/register")}
            style={{
              height: 60,
              fontSize: 20,
              padding: "0 48px",
              fontWeight: 600,
            }}
          >
            Start Your Campaign Free
          </Button>
          {!user && (
            <Button
              size="large"
              onClick={() => navigate("/login")}
              style={{
                height: 60,
                fontSize: 20,
                padding: "0 48px",
                background: "transparent",
                borderColor: "#ffffff",
                color: "#ffffff",
              }}
            >
              Login
            </Button>
          )}
        </div>
        <p
          style={{
            marginTop: 24,
            fontSize: 16,
            color: "#999999",
          }}
        >
          <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
          No credit card required • Free forever • Setup in 5 minutes
        </p>
      </div>

      {/* Features Section */}
      <div
        style={{
          padding: "80px 40px",
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontSize: 48,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 16,
            color: "#ffffff",
          }}
        >
          Everything You Need to{" "}
          <span style={{ color: "#C8102E" }}>Succeed</span>
        </h2>
        <p
          style={{
            fontSize: 18,
            color: "#cccccc",
            textAlign: "center",
            marginBottom: 60,
            maxWidth: 700,
            margin: "0 auto 60px",
          }}
        >
          Powerful features designed to make fundraising effortless and
          effective.
        </p>

        <Row gutter={[32, 32]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card
                style={{
                  background: "#2a2a2a",
                  border: "1px solid #3a3a3a",
                  borderRadius: 12,
                  height: "100%",
                  transition: "all 0.3s ease",
                }}
                bodyStyle={{ padding: 32 }}
                hoverable
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ marginBottom: 20 }}>{feature.icon}</div>
                  <h3
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      marginBottom: 12,
                      color: "#ffffff",
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 16,
                      color: "#cccccc",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Benefits Section */}
      <div
        style={{
          background: "#2a2a2a",
          padding: "80px 40px",
          borderTop: "2px solid #3a3a3a",
          borderBottom: "2px solid #3a3a3a",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <h2
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  marginBottom: 24,
                  color: "#ffffff",
                }}
              >
                Why Choose{" "}
                <span style={{ color: "#C8102E" }}>Got Your Back</span>?
              </h2>
              <p
                style={{
                  fontSize: 18,
                  color: "#cccccc",
                  lineHeight: 1.8,
                  marginBottom: 32,
                }}
              >
                We've built the most user-friendly fundraising platform
                specifically for sports teams, clubs, and community
                organizations. No technical skills required, no hidden fees,
                just results.
              </p>
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate("/register")}
                style={{
                  height: 56,
                  fontSize: 18,
                  padding: "0 40px",
                }}
              >
                Create Your Free Campaign
              </Button>
            </Col>
            <Col xs={24} lg={12}>
              <div
                style={{
                  background: "#1f1f1f",
                  padding: 40,
                  borderRadius: 12,
                  border: "2px solid #3a3a3a",
                }}
              >
                <h3
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    marginBottom: 24,
                    color: "#ffffff",
                  }}
                >
                  What's Included:
                </h3>
                <Row gutter={[16, 16]}>
                  {benefits.map((benefit, index) => (
                    <Col span={12} key={index}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <CheckCircleOutlined
                          style={{
                            color: "#C8102E",
                            fontSize: 20,
                            marginRight: 12,
                          }}
                        />
                        <span style={{ fontSize: 16, color: "#ffffff" }}>
                          {benefit}
                        </span>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Payment Methods Section */}
      <div
        style={{
          padding: "80px 40px",
          maxWidth: 1200,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: 48,
            fontWeight: 700,
            marginBottom: 24,
            color: "#ffffff",
          }}
        >
          Flexible <span style={{ color: "#C8102E" }}>Payment Options</span>
        </h2>
        <p
          style={{
            fontSize: 18,
            color: "#cccccc",
            marginBottom: 60,
            maxWidth: 700,
            margin: "0 auto 60px",
          }}
        >
          Accept payments the way that works best for you and your supporters.
        </p>

        <Row gutter={[32, 32]} justify="center">
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                background: "#2a2a2a",
                border: "2px solid #C8102E",
                borderRadius: 12,
                height: "100%",
              }}
              bodyStyle={{ padding: 32 }}
            >
              <CreditCardOutlined
                style={{ fontSize: 56, color: "#C8102E", marginBottom: 16 }}
              />
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  marginBottom: 12,
                  color: "#ffffff",
                }}
              >
                Credit Card
              </h3>
              <p style={{ fontSize: 16, color: "#cccccc", margin: 0 }}>
                Secure online payments via Stripe. Instant processing and
                automated receipts.
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                background: "#2a2a2a",
                border: "2px solid #C8102E",
                borderRadius: 12,
                height: "100%",
              }}
              bodyStyle={{ padding: 32 }}
            >
              <DollarOutlined
                style={{ fontSize: 56, color: "#C8102E", marginBottom: 16 }}
              />
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  marginBottom: 12,
                  color: "#ffffff",
                }}
              >
                Cash Payments
              </h3>
              <p style={{ fontSize: 16, color: "#cccccc", margin: 0 }}>
                Accept cash in person and manually track payments in your
                dashboard.
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                background: "#2a2a2a",
                border: "2px solid #C8102E",
                borderRadius: 12,
                height: "100%",
              }}
              bodyStyle={{ padding: 32 }}
            >
              <SafetyOutlined
                style={{ fontSize: 56, color: "#C8102E", marginBottom: 16 }}
              />
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  marginBottom: 12,
                  color: "#ffffff",
                }}
              >
                Bank Transfer
              </h3>
              <p style={{ fontSize: 16, color: "#cccccc", margin: 0 }}>
                Direct bank transfers for larger donations. Track manually in
                your system.
              </p>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Final CTA Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #C8102E 0%, #A00D25 100%)",
          padding: "100px 40px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: 56,
            fontWeight: 800,
            marginBottom: 24,
            color: "#ffffff",
          }}
        >
          Ready to Start Fundraising?
        </h2>
        <p
          style={{
            fontSize: 22,
            color: "#ffffff",
            marginBottom: 40,
            maxWidth: 700,
            margin: "0 auto 40px",
            opacity: 0.95,
          }}
        >
          Join hundreds of teams and organizations raising funds with Got Your
          Back. Create your first campaign in minutes.
        </p>
        <Button
          size="large"
          icon={<RocketOutlined />}
          onClick={() => navigate("/register")}
          style={{
            height: 64,
            fontSize: 22,
            padding: "0 56px",
            fontWeight: 700,
            background: "#ffffff",
            color: "#C8102E",
            border: "none",
          }}
        >
          Get Started Free
        </Button>
        <p
          style={{
            marginTop: 24,
            fontSize: 16,
            color: "#ffffff",
            opacity: 0.9,
          }}
        >
          No credit card required • Cancel anytime • Free forever
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          background: "#2a2a2a",
          padding: "40px 40px",
          textAlign: "center",
          borderTop: "2px solid #3a3a3a",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <img
            src={beastmodeLogo}
            alt="Beast Mode Logo"
            style={{ height: 40, width: "auto" }}
          />
          <p style={{ margin: 0, fontSize: 16, color: "#cccccc" }}>
            Powered by Beast Mode
          </p>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "#999999" }}>
          © {new Date().getFullYear()} Got Your Back. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Home;
