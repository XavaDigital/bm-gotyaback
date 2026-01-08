import React, { useState } from 'react';
import { Button, Dropdown, message } from 'antd';
import { ShareAltOutlined, FacebookOutlined, TwitterOutlined, LinkedinOutlined, LinkOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

interface ShareButtonProps {
    url: string;
    title: string;
    description?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ url, title, description }) => {
    const [loading, setLoading] = useState(false);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            message.success('Link copied to clipboard!');
        } catch (error) {
            message.error('Failed to copy link');
        }
    };

    const handleShare = (platform: string) => {
        setLoading(true);
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);
        const encodedDescription = encodeURIComponent(description || title);

        let shareUrl = '';

        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
                break;
            default:
                break;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }

        setLoading(false);
    };

    const items: MenuProps['items'] = [
        {
            key: 'facebook',
            label: 'Share on Facebook',
            icon: <FacebookOutlined />,
            onClick: () => handleShare('facebook'),
        },
        {
            key: 'twitter',
            label: 'Share on Twitter',
            icon: <TwitterOutlined />,
            onClick: () => handleShare('twitter'),
        },
        {
            key: 'linkedin',
            label: 'Share on LinkedIn',
            icon: <LinkedinOutlined />,
            onClick: () => handleShare('linkedin'),
        },
        {
            type: 'divider',
        },
        {
            key: 'copy',
            label: 'Copy Link',
            icon: <LinkOutlined />,
            onClick: handleCopyLink,
        },
    ];

    return (
        <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
            <Button icon={<ShareAltOutlined />} loading={loading}>
                Share
            </Button>
        </Dropdown>
    );
};

export default ShareButton;

