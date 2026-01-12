import React from 'react';
import beastmodeLogo from '~/assets/beastmode-logo.png';

const PublicHeader: React.FC = () => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(12px, 3vw, 24px)',
                marginBottom: 'clamp(16px, 4vw, 32px)',
                paddingBottom: 'clamp(16px, 4vw, 32px)',
                paddingTop: 'clamp(32px, 8vw, 64px)',
                borderBottom: '2px solid #3a3a3a',
                background: '#1f1f1f',
                marginLeft: 'calc(-1 * clamp(16px, 3vw, 20px))',
                marginRight: 'calc(-1 * clamp(16px, 3vw, 20px))',
                paddingLeft: 'clamp(20px, 4vw, 40px)',
                paddingRight: 'clamp(20px, 4vw, 40px)',
                flexWrap: 'wrap',
                justifyContent: 'center',
                maxWidth: '100vw',
                boxSizing: 'border-box',
            }}
        >
            <img
                src={beastmodeLogo}
                alt="Beast Mode Logo"
                style={{
                    height: 'clamp(50px, 10vw, 80px)',
                    width: 'auto',
                    maxWidth: '100%',
                }}
            />
            <h1
                style={{
                    margin: 0,
                    fontSize: 'clamp(28px, 8vw, 56px)',
                    fontWeight: '700',
                    color: '#ffffff',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                }}
            >
                Got Your Back
            </h1>
        </div>
    );
};

export default PublicHeader;

