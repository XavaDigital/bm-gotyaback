import React from "react";
import { Tooltip } from "antd";

interface LogoSponsorProps {
  name: string;
  logoUrl: string;
  logoWidth: number;
  message?: string;
  isPending?: boolean;
}

const LogoSponsor: React.FC<LogoSponsorProps> = ({
  name,
  logoUrl,
  logoWidth,
  message,
  isPending = false,
}) => {
  const content = (
    <img
      src={logoUrl}
      alt={name}
      style={{
        maxWidth: `${logoWidth}px`,
        maxHeight: `${logoWidth}px`,
        width: "auto",
        height: "auto",
        opacity: isPending ? 0.6 : 1,
        transition: "opacity 0.2s",
        display: "inline-block",
        objectFit: "contain",
      }}
    />
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

export default LogoSponsor;

