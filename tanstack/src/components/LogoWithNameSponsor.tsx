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
        gap: "8px",
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 0.2s",
      }}
    >
      <img
        src={logoUrl}
        alt={name}
        style={{
          maxWidth: `${logoWidth}px`,
          maxHeight: `${logoWidth}px`,
          width: "auto",
          height: "auto",
          objectFit: "contain",
        }}
      />
      <div
        style={{
          fontSize: "14px",
          fontWeight: 500,
          textAlign: "center",
          maxWidth: `${logoWidth}px`,
          wordWrap: "break-word",
          color: "white",
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

