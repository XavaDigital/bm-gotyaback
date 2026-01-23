import React from "react";
import { Tooltip } from "antd";

interface LogoWithNameSponsorProps {
  name: string;
  displayName: string;
  logoUrl: string;
  logoWidth: number;
  message?: string;
  isPending?: boolean;
}

const LogoWithNameSponsor: React.FC<LogoWithNameSponsorProps> = ({
  name,
  displayName,
  logoUrl,
  logoWidth,
  message,
  isPending = false,
}) => {
  const content = (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 0.2s",
      }}
    >
      <img
        src={logoUrl}
        alt={name}
        style={{
          width: `${logoWidth}px`,
          height: "auto",
          maxHeight: `${logoWidth}px`,
          objectFit: "contain",
        }}
      />
      <div
        style={{
          fontSize: "12px",
          fontWeight: 500,
          textAlign: "center",
          maxWidth: `${logoWidth + 20}px`,
          wordWrap: "break-word",
          color: "white",
          lineHeight: "1.2",
          textShadow: "0 1px 2px rgba(0,0,0,0.8)",
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
