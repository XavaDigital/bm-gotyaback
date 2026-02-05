import React, { useState } from "react";
import { Card, Button, Image, Modal, Input, message, Tag } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import type { SponsorEntry } from "~/types/campaign.types";

interface LogoApprovalCardProps {
  sponsor: SponsorEntry;
  onApprove: (sponsorId: string) => Promise<void>;
  onReject: (sponsorId: string, reason: string) => Promise<void>;
}

const LogoApprovalCard: React.FC<LogoApprovalCardProps> = ({
  sponsor,
  onApprove,
  onReject,
}) => {
  const [loading, setLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(sponsor._id);
      message.success("Logo approved successfully");
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to approve logo");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      message.error("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    try {
      await onReject(sponsor._id, rejectionReason);
      message.success("Logo rejected");
      setRejectModalVisible(false);
      setRejectionReason("");
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to reject logo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card
        style={{
          marginBottom: 16,
          width: "100%",
          boxSizing: "border-box",
        }}
        bodyStyle={{ padding: "clamp(12px, 3vw, 16px)" }}
      >
        <div
          style={{
            display: "flex",
            gap: "clamp(12px, 3vw, 16px)",
            alignItems: "flex-start",
            flexDirection: window.innerWidth < 640 ? "column" : "row",
          }}
        >
          {/* Logo Preview */}
          <div
            style={{
              flex: window.innerWidth < 640 ? "1 1 100%" : "0 0 150px",
              display: "flex",
              justifyContent: window.innerWidth < 640 ? "center" : "flex-start",
            }}
          >
            {sponsor.logoUrl ? (
              <Image
                src={sponsor.logoUrl}
                alt={`${sponsor.name}'s logo`}
                style={{
                  width: "clamp(120px, 30vw, 150px)",
                  height: "clamp(120px, 30vw, 150px)",
                  objectFit: "contain",
                  border: "1px solid #d9d9d9",
                  borderRadius: 8,
                  padding: 8,
                  background: "#fafafa",
                }}
              />
            ) : (
              <div
                style={{
                  width: "clamp(120px, 30vw, 150px)",
                  height: "clamp(120px, 30vw, 150px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #d9d9d9",
                  borderRadius: 8,
                  background: "#fafafa",
                  color: "#999",
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                }}
              >
                No Logo
              </div>
            )}
          </div>

          {/* Sponsor Details */}
          <div style={{ flex: 1, width: "100%" }}>
            <div
              style={{
                marginBottom: 8,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
              }}
            >
              <strong style={{ fontSize: "clamp(14px, 3vw, 16px)" }}>
                {sponsor.name}
              </strong>
              <Tag color="blue">${sponsor.amount}</Tag>
              {sponsor.displaySize && (
                <Tag color="purple" style={{ textTransform: "capitalize" }}>
                  {sponsor.displaySize}
                </Tag>
              )}
            </div>

            <div
              style={{
                marginBottom: 4,
                color: "#666",
                fontSize: "clamp(12px, 2.5vw, 14px)",
              }}
            >
              <strong>Email:</strong> {sponsor.email}
            </div>

            {sponsor.positionId && (
              <div
                style={{
                  marginBottom: 4,
                  color: "#666",
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                }}
              >
                <strong>Position:</strong> {sponsor.positionId}
              </div>
            )}

            {sponsor.message && (
              <div
                style={{
                  marginBottom: 4,
                  color: "#666",
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                }}
              >
                <strong>Message:</strong> {sponsor.message}
              </div>
            )}

            <div
              style={{
                marginBottom: 4,
                color: "#666",
                fontSize: "clamp(12px, 2.5vw, 14px)",
              }}
            >
              <strong>Payment Status:</strong>{" "}
              <Tag color={sponsor.paymentStatus === "paid" ? "green" : "orange"}>
                {sponsor.paymentStatus}
              </Tag>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleApprove}
                loading={loading}
                style={{
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  height: "clamp(30px, 6vw, 32px)",
                }}
              >
                Approve
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => setRejectModalVisible(true)}
                loading={loading}
                style={{
                  fontSize: "clamp(12px, 2.5vw, 14px)",
                  height: "clamp(30px, 6vw, 32px)",
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Reject Modal */}
      <Modal
        title="Reject Logo"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectionReason("");
        }}
        onOk={handleReject}
        confirmLoading={loading}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <p>Please provide a reason for rejecting this logo:</p>
        <Input.TextArea
          rows={4}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="e.g., Logo quality is too low, inappropriate content, etc."
        />
      </Modal>
    </>
  );
};

export default LogoApprovalCard;

