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
import { useNavigate } from "@tanstack/react-router";
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
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flex: "1 1 auto",
            minWidth: 0,
          }}
        >
          <img
            src={beastmodeLogo}
            alt="Beast Mode Logo"
            style={{
              height: "clamp(35px, 8vw, 50px)",
              width: "auto",
              flexShrink: 0,
            }}
          />
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(18px, 5vw, 28px)",
              fontWeight: 700,
              color: "#ffffff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Got Your Back
          </h2>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {user ? (
            <Button
              type="primary"
              size="large"
              onClick={() => navigate({ to: "/dashboard" })}
              style={{
                fontSize: "clamp(14px, 3vw, 16px)",
                padding: "4px 16px",
                height: "auto",
              }}
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button
                size="large"
                onClick={() => navigate({ to: "/login" })}
                style={{
                  fontSize: "clamp(14px, 3vw, 16px)",
                  padding: "4px 16px",
                  height: "auto",
                }}
              >
                Login
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                onClick={() => navigate({ to: "/register" })}
                style={{
                  fontSize: "clamp(14px, 3vw, 16px)",
                  padding: "4px 16px",
                  height: "auto",
                }}
              >
                <span style={{ display: "inline" }}>Get Started</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%)",
          padding: "clamp(40px, 10vw, 100px) 20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 16px",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(32px, 8vw, 64px)",
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
              fontSize: "clamp(16px, 4vw, 24px)",
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
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={() => navigate({ to: "/register" })}
              style={{
                height: "clamp(48px, 10vw, 60px)",
                fontSize: "clamp(16px, 3.5vw, 20px)",
                padding: "0 clamp(24px, 5vw, 48px)",
                fontWeight: 600,
              }}
            >
              Start Your Campaign Free
            </Button>
            {!user && (
              <Button
                size="large"
                onClick={() => navigate({ to: "/login" })}
                style={{
                  height: "clamp(48px, 10vw, 60px)",
                  fontSize: "clamp(16px, 3.5vw, 20px)",
                  padding: "0 clamp(24px, 5vw, 48px)",
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
              fontSize: "clamp(14px, 3vw, 16px)",
              color: "#999999",
            }}
          >
            <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />
            No credit card required • Free forever • Setup in 5 minutes
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div
        style={{
          padding: "clamp(40px, 8vw, 80px) clamp(16px, 4vw, 40px)",
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(28px, 6vw, 48px)",
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
            fontSize: "clamp(16px, 3vw, 18px)",
            color: "#cccccc",
            textAlign: "center",
            marginBottom: "clamp(30px, 6vw, 60px)",
            maxWidth: 700,
            margin: "0 auto clamp(30px, 6vw, 60px)",
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
                bodyStyle={{ padding: "clamp(20px, 4vw, 32px)" }}
                hoverable
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ marginBottom: 20 }}>{feature.icon}</div>
                  <h3
                    style={{
                      fontSize: "clamp(18px, 3.5vw, 22px)",
                      fontWeight: 600,
                      marginBottom: 12,
                      color: "#ffffff",
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "clamp(14px, 2.5vw, 16px)",
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
          padding: "clamp(40px, 8vw, 80px) clamp(16px, 4vw, 40px)",
          borderTop: "2px solid #3a3a3a",
          borderBottom: "2px solid #3a3a3a",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <h2
                style={{
                  fontSize: "clamp(28px, 6vw, 48px)",
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
                  fontSize: "clamp(16px, 3vw, 18px)",
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
                onClick={() => navigate({ to: "/register" })}
                style={{
                  height: "clamp(48px, 8vw, 56px)",
                  fontSize: "clamp(16px, 3vw, 18px)",
                  padding: "0 clamp(24px, 5vw, 40px)",
                }}
              >
                Create Your Free Campaign
              </Button>
            </Col>
            <Col xs={24} lg={12}>
              <div
                style={{
                  background: "#1f1f1f",
                  padding: "clamp(24px, 5vw, 40px)",
                  borderRadius: 12,
                  border: "2px solid #3a3a3a",
                }}
              >
                <h3
                  style={{
                    fontSize: "clamp(20px, 4vw, 24px)",
                    fontWeight: 600,
                    marginBottom: 24,
                    color: "#ffffff",
                  }}
                >
                  What's Included:
                </h3>
                <Row gutter={[16, 16]}>
                  {benefits.map((benefit, index) => (
                    <Col xs={24} sm={12} key={index}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <CheckCircleOutlined
                          style={{
                            color: "#C8102E",
                            fontSize: "clamp(16px, 3vw, 20px)",
                            marginRight: 12,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "clamp(14px, 2.5vw, 16px)",
                            color: "#ffffff",
                          }}
                        >
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
          padding: "clamp(40px, 8vw, 80px) clamp(16px, 4vw, 40px)",
          maxWidth: 1200,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(28px, 6vw, 48px)",
            fontWeight: 700,
            marginBottom: 24,
            color: "#ffffff",
          }}
        >
          Flexible <span style={{ color: "#C8102E" }}>Payment Options</span>
        </h2>
        <p
          style={{
            fontSize: "clamp(16px, 3vw, 18px)",
            color: "#cccccc",
            marginBottom: "clamp(30px, 6vw, 60px)",
            maxWidth: 700,
            margin: "0 auto clamp(30px, 6vw, 60px)",
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
              bodyStyle={{ padding: "clamp(20px, 4vw, 32px)" }}
            >
              <CreditCardOutlined
                style={{
                  fontSize: "clamp(40px, 8vw, 56px)",
                  color: "#C8102E",
                  marginBottom: 16,
                }}
              />
              <h3
                style={{
                  fontSize: "clamp(18px, 3.5vw, 22px)",
                  fontWeight: 600,
                  marginBottom: 12,
                  color: "#ffffff",
                }}
              >
                Credit Card
              </h3>
              <p
                style={{
                  fontSize: "clamp(14px, 2.5vw, 16px)",
                  color: "#cccccc",
                  margin: 0,
                }}
              >
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
              bodyStyle={{ padding: "clamp(20px, 4vw, 32px)" }}
            >
              <DollarOutlined
                style={{
                  fontSize: "clamp(40px, 8vw, 56px)",
                  color: "#C8102E",
                  marginBottom: 16,
                }}
              />
              <h3
                style={{
                  fontSize: "clamp(18px, 3.5vw, 22px)",
                  fontWeight: 600,
                  marginBottom: 12,
                  color: "#ffffff",
                }}
              >
                Cash Payments
              </h3>
              <p
                style={{
                  fontSize: "clamp(14px, 2.5vw, 16px)",
                  color: "#cccccc",
                  margin: 0,
                }}
              >
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
              bodyStyle={{ padding: "clamp(20px, 4vw, 32px)" }}
            >
              <SafetyOutlined
                style={{
                  fontSize: "clamp(40px, 8vw, 56px)",
                  color: "#C8102E",
                  marginBottom: 16,
                }}
              />
              <h3
                style={{
                  fontSize: "clamp(18px, 3.5vw, 22px)",
                  fontWeight: 600,
                  marginBottom: 12,
                  color: "#ffffff",
                }}
              >
                Bank Transfer
              </h3>
              <p
                style={{
                  fontSize: "clamp(14px, 2.5vw, 16px)",
                  color: "#cccccc",
                  margin: 0,
                }}
              >
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
          padding: "clamp(50px, 10vw, 100px) clamp(20px, 4vw, 40px)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 16px",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(32px, 7vw, 56px)",
              fontWeight: 800,
              marginBottom: 24,
              color: "#ffffff",
            }}
          >
            Ready to Start Fundraising?
          </h2>
          <p
            style={{
              fontSize: "clamp(16px, 4vw, 22px)",
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
            onClick={() => navigate({ to: "/register" })}
            style={{
              height: "clamp(52px, 10vw, 64px)",
              fontSize: "clamp(18px, 4vw, 22px)",
              padding: "0 clamp(32px, 6vw, 56px)",
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
              fontSize: "clamp(14px, 3vw, 16px)",
              color: "#ffffff",
              opacity: 0.9,
            }}
          >
            No credit card required • Cancel anytime • Free forever
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          background: "#2a2a2a",
          padding: "clamp(24px, 5vw, 40px) clamp(16px, 4vw, 40px)",
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
            flexWrap: "wrap",
          }}
        >
          <img
            src={beastmodeLogo}
            alt="Beast Mode Logo"
            style={{
              height: "clamp(30px, 6vw, 40px)",
              width: "auto",
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: "clamp(14px, 3vw, 16px)",
              color: "#cccccc",
            }}
          >
            Powered by Beast Mode
          </p>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "clamp(12px, 2.5vw, 14px)",
            color: "#999999",
          }}
        >
          © {new Date().getFullYear()} Got Your Back. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Home;
