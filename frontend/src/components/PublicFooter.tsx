import React from 'react';
import { Button } from 'antd';
import { RocketOutlined } from '@ant-design/icons';

const PublicFooter: React.FC = () => {
    return (
        <div
            style={{
                marginTop: 'clamp(40px, 8vw, 60px)',
                padding: 'clamp(24px, 6vw, 40px) clamp(16px, 4vw, 40px) clamp(40px, 8vw, 64px)',
                background: '#1f1f1f',
                textAlign: 'center',
                marginLeft: 'calc(-1 * clamp(16px, 3vw, 20px))',
                marginRight: 'calc(-1 * clamp(16px, 3vw, 20px))',
                boxSizing: 'border-box',
                maxWidth: '100vw',
            }}
        >
            <h2
                style={{
                    color: '#ffffff',
                    fontSize: 'clamp(20px, 5vw, 32px)',
                    fontWeight: '700',
                    marginBottom: 'clamp(12px, 2vw, 16px)',
                    lineHeight: '1.3',
                }}
            >
                Want to create your own fundraising campaign?
            </h2>
            <p
                style={{
                    color: '#cccccc',
                    fontSize: 'clamp(14px, 3vw, 18px)',
                    marginBottom: 'clamp(16px, 3vw, 24px)',
                    maxWidth: '600px',
                    margin: '0 auto clamp(16px, 3vw, 24px)',
                    lineHeight: '1.5',
                }}
            >
                Join Got Your Back and start raising funds for your team, club, or cause today.
            </p>
            <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                href="/register"
                style={{
                    height: 'clamp(44px, 8vw, 50px)',
                    fontSize: 'clamp(14px, 3vw, 18px)',
                    padding: '0 clamp(20px, 5vw, 40px)',
                }}
            >
                Get Started
            </Button>
        </div>
    );
};

export default PublicFooter;

