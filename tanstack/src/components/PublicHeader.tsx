import React from 'react';
import beastmodeLogo from '../assets/beastmode-logo.png';

const PublicHeader: React.FC = () => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                marginBottom: 32,
                paddingBottom: 32,
                paddingTop: 64,
                borderBottom: '2px solid #3a3a3a',
                background: '#1f1f1f',
                marginLeft: '-20px',
                marginRight: '-20px',
                paddingLeft: '40px',
                paddingRight: '40px',
            }}
        >
            <img src={beastmodeLogo} alt="Beast Mode Logo" style={{ height: '80px', width: 'auto' }} />
            <h1
                style={{
                    margin: 0,
                    fontSize: '56px',
                    fontWeight: '700',
                    color: '#ffffff',
                }}
            >
                Got Your Back
            </h1>
        </div>
    );
};

export default PublicHeader;

