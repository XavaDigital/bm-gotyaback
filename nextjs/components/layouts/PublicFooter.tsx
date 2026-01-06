'use client';

import React from 'react';
import { Button } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import Link from 'next/link';

const PublicFooter: React.FC = () => {
  return (
    <div
      style={{
        marginTop: 60,
        padding: '40px 40px 64px 40px',
        background: '#1f1f1f',
        textAlign: 'center',
        marginLeft: '-20px',
        marginRight: '-20px',
      }}
    >
      <h2
        style={{
          color: '#ffffff',
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '16px',
        }}
      >
        Want to create your own fundraising campaign?
      </h2>
      <p
        style={{
          color: '#cccccc',
          fontSize: '18px',
          marginBottom: '24px',
          maxWidth: '600px',
          margin: '0 auto 24px',
        }}
      >
        Join Got Your Back and start raising funds for your team, club, or cause
        today.
      </p>
      <Link href="/register">
        <Button
          type="primary"
          size="large"
          icon={<RocketOutlined />}
          style={{
            height: '50px',
            fontSize: '18px',
            padding: '0 40px',
          }}
        >
          Get Started
        </Button>
      </Link>
    </div>
  );
};

export default PublicFooter;

