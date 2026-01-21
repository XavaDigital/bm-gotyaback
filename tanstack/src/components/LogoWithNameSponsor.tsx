import React from "react";
import { Tooltip } from "antd";

interface LogoWithNameSponsorProps {
  name: string;
  displayName: string;
  logoUrl: string;
  message?: string;
  isPending?: boolean;
}

const LogoWithNameSponsor: React.FC<LogoWithNameSponsorProps> = ({
  name,
  displayName,
  logoUrl,
  message,
  isPending = false,
}) => {
  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        height: "100%",
        width: "100%",
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 0.2s",
        overflow: "hidden",
      }}
    >
      <img
        src={logoUrl}
        alt={name}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          width: "auto",
          height: "auto",
          objectFit: "contain",
          flex: "1 1 auto",
          minHeight: 0, // Critical for flex shrinking
        }}
      />
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          textAlign: "center",
          maxWidth: "100%",
          wordWrap: "break-word",
          color: "white",
          flex: "0 0 auto", // Prevent text from shrinking
          lineHeight: "1.2",
          marginTop: "auto",
          zIndex: 1,
          textShadow: "0 1px 2px rgba(0,0,0,0.8)", // Ensure legibility over any background
        }}
      >
        {displayName}
      </div>
    </div>
  );

  if (message) {
    return (
      <Tooltip title={message} placement="top">
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default LogoWithNameSponsor;
