import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { useNavigate, Link } from "react-router-dom";
import {
  LockOutlined,
  MailOutlined,
  UserOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import authService from "../services/auth.service";
import beastmodeLogo from "../assets/beastmode-logo.png";

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Override body styles for full-width dark page
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

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await authService.register(values);
      message.success("Registration successful!");
      navigate("/dashboard");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Registration failed";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1f1f1f",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
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
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/")}
          style={{
            background: "transparent",
            borderColor: "#ffffff",
            color: "#ffffff",
          }}
        >
          Back to Home
        </Button>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px 20px",
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: 480,
            background: "#2a2a2a",
            border: "2px solid #3a3a3a",
            borderRadius: 12,
          }}
          bodyStyle={{ padding: 40 }}
        >
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <Title level={2} style={{ color: "#ffffff", marginBottom: 8 }}>
              Create Your Account
            </Title>
            <Text style={{ fontSize: 16, color: "#cccccc" }}>
              Start your fundraising journey today
            </Text>
          </div>

          {/* Register Form */}
          <Form
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="name"
              label={<span style={{ color: "#ffffff" }}>Full Name</span>}
              rules={[{ required: true, message: "Please input your name!" }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: "#999999" }} />}
                placeholder="Full Name"
                style={{
                  background: "#1f1f1f",
                  border: "1px solid #3a3a3a",
                  color: "#ffffff",
                }}
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={<span style={{ color: "#ffffff" }}>Email</span>}
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#999999" }} />}
                placeholder="Email Address"
                style={{
                  background: "#1f1f1f",
                  border: "1px solid #3a3a3a",
                  color: "#ffffff",
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ color: "#ffffff" }}>Password</span>}
              rules={[
                { required: true, message: "Please input your password!" },
                { min: 6, message: "Password must be at least 6 characters!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#999999" }} />}
                placeholder="Password (min 6 characters)"
                style={{
                  background: "#1f1f1f",
                  border: "1px solid #3a3a3a",
                  color: "#ffffff",
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Create Account
              </Button>
            </Form.Item>

            <div style={{ textAlign: "center" }}>
              <Text style={{ color: "#cccccc" }}>
                Already have an account?{" "}
              </Text>
              <Link to="/login" style={{ color: "#C8102E", fontWeight: 600 }}>
                Login now
              </Link>
            </div>
          </Form>
        </Card>
      </div>

      {/* Footer */}
      <div
        style={{
          background: "#2a2a2a",
          padding: "24px 40px",
          textAlign: "center",
          borderTop: "2px solid #3a3a3a",
        }}
      >
        <Text style={{ color: "#999999", fontSize: 14 }}>
          © {new Date().getFullYear()} Got Your Back. All rights reserved.
        </Text>
      </div>
    </div>
  );
};

export default Register;
