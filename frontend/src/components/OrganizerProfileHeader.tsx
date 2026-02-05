import React from 'react';
import { Avatar, Typography, Space } from 'antd';
import { GlobalOutlined, FacebookOutlined, TwitterOutlined, InstagramOutlined } from '@ant-design/icons';
import type { OrganizerProfile } from '~/types/campaign.types';
import 'quill/dist/quill.snow.css';

const { Title, Paragraph, Link } = Typography;

interface OrganizerProfileHeaderProps {
    profile: OrganizerProfile;
}

const OrganizerProfileHeader: React.FC<OrganizerProfileHeaderProps> = ({ profile }) => {
    return (
        <div style={{ position: 'relative', marginBottom: 24 }}>
            {/* Cover Image */}
            {profile.coverImageUrl && (
                <div
                    style={{
                        width: '100%',
                        height: 'clamp(120px, 25vw, 200px)',
                        backgroundImage: `url(${profile.coverImageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: 8,
                    }}
                />
            )}

            {/* Profile Info */}
            <div style={{ padding: 'clamp(16px, 3vw, 24px) 0' }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Space
                        align="center"
                        size="large"
                        style={{
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                        }}
                    >
                        {/* Logo */}
                        {profile.logoUrl ? (
                            <Avatar size={typeof window !== 'undefined' && window.innerWidth < 768 ? 60 : 80} src={profile.logoUrl} />
                        ) : (
                            <Avatar size={typeof window !== 'undefined' && window.innerWidth < 768 ? 60 : 80} style={{ backgroundColor: '#1890ff' }}>
                                {profile.displayName?.charAt(0) || 'O'}
                            </Avatar>
                        )}

                        {/* Name and Links */}
                        <div style={{ textAlign: typeof window !== 'undefined' && window.innerWidth < 768 ? 'center' : 'left' }}>
                            <Title
                                level={2}
                                style={{
                                    margin: 0,
                                    color: '#ffffff',
                                    fontSize: 'clamp(20px, 5vw, 32px)',
                                }}
                            >
                                {profile.displayName || 'Organizer'}
                            </Title>
                            <Space
                                size="middle"
                                style={{
                                    marginTop: 8,
                                    flexWrap: 'wrap',
                                    justifyContent: typeof window !== 'undefined' && window.innerWidth < 768 ? 'center' : 'flex-start',
                                }}
                            >
                                {profile.websiteUrl && (
                                    <Link
                                        href={profile.websiteUrl}
                                        target="_blank"
                                        style={{
                                            color: '#C8102E',
                                            fontSize: 'clamp(12px, 2.5vw, 14px)',
                                        }}
                                    >
                                        <GlobalOutlined /> Website
                                    </Link>
                                )}
                                {profile.socialLinks?.facebook && (
                                    <Link
                                        href={profile.socialLinks.facebook}
                                        target="_blank"
                                        style={{
                                            color: '#C8102E',
                                            fontSize: 'clamp(12px, 2.5vw, 14px)',
                                        }}
                                    >
                                        <FacebookOutlined /> Facebook
                                    </Link>
                                )}
                                {profile.socialLinks?.twitter && (
                                    <Link
                                        href={profile.socialLinks.twitter}
                                        target="_blank"
                                        style={{
                                            color: '#C8102E',
                                            fontSize: 'clamp(12px, 2.5vw, 14px)',
                                        }}
                                    >
                                        <TwitterOutlined /> Twitter
                                    </Link>
                                )}
                                {profile.socialLinks?.instagram && (
                                    <Link
                                        href={profile.socialLinks.instagram}
                                        target="_blank"
                                        style={{
                                            color: '#C8102E',
                                            fontSize: 'clamp(12px, 2.5vw, 14px)',
                                        }}
                                    >
                                        <InstagramOutlined /> Instagram
                                    </Link>
                                )}
                            </Space>
                        </div>
                    </Space>

                    {/* Bio */}
                    {profile.bio && (
                        <div>
                            <Title
                                level={4}
                                style={{
                                    color: '#ffffff',
                                    fontSize: 'clamp(16px, 4vw, 20px)',
                                }}
                            >
                                About
                            </Title>
                            <div
                                className="ql-editor"
                                style={{
                                    padding: 0,
                                    color: '#cccccc',
                                    fontSize: 'clamp(14px, 2.5vw, 16px)',
                                }}
                                dangerouslySetInnerHTML={{ __html: profile.bio }}
                            />
                        </div>
                    )}
                </Space>
            </div>
        </div>
    );
};

export default OrganizerProfileHeader;

