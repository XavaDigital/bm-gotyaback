import React from "react";
import { Avatar, Typography, Space } from "antd";
import {
  GlobalOutlined,
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
} from "@ant-design/icons";
import type { OrganizerProfile } from "../types/campaign.types";
import "../styles/richtext.css";

const { Title, Paragraph, Link } = Typography;

interface OrganizerProfileHeaderProps {
  profile: OrganizerProfile;
}

const OrganizerProfileHeader: React.FC<OrganizerProfileHeaderProps> = ({
  profile,
}) => {
  return (
    <div style={{ position: "relative", marginBottom: 24 }}>
      {/* Cover Image */}
      {profile.coverImageUrl && (
        <div
          style={{
            width: "100%",
            height: 200,
            backgroundImage: `url(${profile.coverImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: 8,
          }}
        />
      )}

      {/* Profile Info */}
      <div style={{ padding: "24px 0" }}>
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <Space align="center" size="large">
            {/* Logo */}
            {profile.logoUrl ? (
              <Avatar size={80} src={profile.logoUrl} />
            ) : (
              <Avatar size={80} style={{ backgroundColor: "#1890ff" }}>
                {profile.displayName?.charAt(0) || "O"}
              </Avatar>
            )}

            {/* Name and Links */}
            <div>
              <Title level={2} style={{ margin: 0 }}>
                {profile.displayName || "Organizer"}
              </Title>
              <Space size="middle" style={{ marginTop: 8 }}>
                {profile.websiteUrl && (
                  <Link href={profile.websiteUrl} target="_blank">
                    <GlobalOutlined /> Website
                  </Link>
                )}
                {profile.socialLinks?.facebook && (
                  <Link href={profile.socialLinks.facebook} target="_blank">
                    <FacebookOutlined /> Facebook
                  </Link>
                )}
                {profile.socialLinks?.twitter && (
                  <Link href={profile.socialLinks.twitter} target="_blank">
                    <TwitterOutlined /> Twitter
                  </Link>
                )}
                {profile.socialLinks?.instagram && (
                  <Link href={profile.socialLinks.instagram} target="_blank">
                    <InstagramOutlined /> Instagram
                  </Link>
                )}
              </Space>
            </div>
          </Space>

          {/* Bio */}
          {profile.bio && (
            <div>
              <Title level={4}>About</Title>
              <div
                className="campaign-description"
                style={{ padding: 0, color: "#000000" }}
                dangerouslySetInnerHTML={{ __html: profile.bio }}
              />
            </div>
          )}
        </Space>
      </div>
    </div>
  );
};

export default OrganizerProfileHeader;
