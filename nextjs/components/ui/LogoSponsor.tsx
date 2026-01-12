'use client';

import React from 'react';
import { Tooltip } from 'antd';
import Image from 'next/image';

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
        width: `${logoWidth}px`,
        height: 'auto',
        opacity: isPending ? 0.6 : 1,
        transition: 'opacity 0.2s',
        display: 'inline-block',
        objectFit: 'contain',
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

