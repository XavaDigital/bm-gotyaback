'use client';

import React from 'react';
import { Tooltip } from 'antd';

interface TextSponsorProps {
  name: string;
  fontSize: number;
  message?: string;
  isPending?: boolean;
}

const TextSponsor: React.FC<TextSponsorProps> = ({
  name,
  fontSize,
  message,
  isPending = false,
}) => {
  const content = (
    <span
      style={{
        fontSize: `${fontSize}px`,
        fontWeight: '600',
        color: '#ffffff',
        opacity: isPending ? 0.6 : 1,
        transition: 'opacity 0.2s',
        display: 'inline-block',
        lineHeight: 1.2,
      }}
    >
      {name}
    </span>
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

export default TextSponsor;

