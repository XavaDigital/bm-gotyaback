import React, { useState } from 'react';
import { Card, Form, Input, Button, App, Typography, Space, InputNumber, Divider, Table, Popconfirm, Tag, Tooltip, Tabs } from 'antd';
import { ThunderboltOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined, DollarOutlined, ClearOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import apiClient from '~/services/apiClient';
import campaignService from '~/services/campaign.service';
import type { Campaign } from '~/types/campaign.types';

const { Title, Text } = Typography;

const Admin: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { message } = App.useApp();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Fetch all campaigns
    const { data: campaigns = [], isLoading: campaignsLoading, refetch: refetchCampaigns } = useQuery({
        queryKey: ['admin-campaigns'],
        queryFn: campaignService.getAllCampaigns,
    });

    // Delete campaign mutation
    const deleteMutation = useMutation({
        mutationFn: campaignService.deleteCampaign,
        onSuccess: () => {
            message.success('Campaign deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to delete campaign');
        },
    });

    const handleSeedSponsors = async (values: { campaignId: string; numberOfSponsors: number }) => {
        setLoading(true);
        try {
            const response = await apiClient.post('/admin/seed-sponsors', {
                campaignId: values.campaignId,
                numberOfSponsors: values.numberOfSponsors,
            });

            message.success(`Successfully seeded ${response.data.count} sponsors!`);
            form.resetFields();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to seed sponsors');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveAllLogos = async (campaignId: string) => {
        setLoading(true);
        try {
            const response = await apiClient.post('/admin/approve-all-logos', {
                campaignId,
            });

            message.success(`Approved ${response.data.count} logos!`);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to approve logos');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllAsPaid = async (campaignId: string) => {
        setLoading(true);
        try {
            const response = await apiClient.post('/admin/mark-all-paid', {
                campaignId,
            });

            message.success(`Marked ${response.data.count} sponsors as paid!`);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to mark sponsors as paid');
        } finally {
            setLoading(false);
        }
    };

    const handleClearSponsors = async (campaignId: string) => {
        setLoading(true);
        try {
            const response = await apiClient.post('/admin/clear-sponsors', {
                campaignId,
            });

            message.success(`Deleted ${response.data.count} sponsors!`);
            queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to clear sponsors');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCampaign = (campaignId: string) => {
        deleteMutation.mutate(campaignId);
    };

    const handleViewCampaign = (campaignId: string) => {
        navigate({ to: '/campaigns/$id', params: { id: campaignId } });
    };

    const handleCopyId = (campaignId: string) => {
        navigator.clipboard.writeText(campaignId);
        message.success('Campaign ID copied to clipboard!');
    };

    const handleRefreshCampaigns = async () => {
        setIsRefreshing(true);
        try {
            await refetchCampaigns();
            message.success('Campaign list refreshed!');
        } catch (error) {
            message.error('Failed to refresh campaigns');
        } finally {
            setIsRefreshing(false);
        }
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: 'Owner',
            dataIndex: 'ownerId',
            key: 'owner',
            render: (owner: any) => owner?.name || owner?.email || 'N/A',
        },
        {
            title: 'Type',
            dataIndex: 'campaignType',
            key: 'campaignType',
            render: (type: string) => (
                <Tag color={type === 'fixed' ? 'blue' : type === 'positional' ? 'green' : 'orange'}>
                    {type}
                </Tag>
            ),
        },
        {
            title: 'Layout',
            dataIndex: 'layoutStyle',
            key: 'layoutStyle',
            render: (style: string) => (
                <Tag color="purple">
                    {style}
                </Tag>
            ),
        },
        {
            title: 'Display',
            dataIndex: 'sponsorDisplayType',
            key: 'sponsorDisplayType',
            render: (type: string) => (
                <Tag color={type === 'logo-only' ? 'cyan' : type === 'both' ? 'geekblue' : 'default'}>
                    {type}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'isClosed',
            key: 'status',
            render: (isClosed: boolean) => (
                <Tag color={isClosed ? 'red' : 'green'}>
                    {isClosed ? 'Closed' : 'Open'}
                </Tag>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 220,
            render: (_: any, record: Campaign) => (
                <Space size="small">
                    <Tooltip title="Copy Campaign ID">
                        <Button
                            type="text"
                            icon={<CopyOutlined />}
                            onClick={() => handleCopyId(record._id)}
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="View Campaign">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewCampaign(record._id)}
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="Approve All Logos">
                        <Button
                            type="text"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleApproveAllLogos(record._id)}
                            loading={loading}
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="Mark All Paid">
                        <Button
                            type="text"
                            icon={<DollarOutlined />}
                            onClick={() => handleMarkAllAsPaid(record._id)}
                            loading={loading}
                            size="small"
                        />
                    </Tooltip>
                    <Popconfirm
                        title="Clear All Sponsors"
                        description="Are you sure you want to delete all sponsors for this campaign? This action cannot be undone."
                        onConfirm={() => handleClearSponsors(record._id)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Clear Sponsors">
                            <Button
                                type="text"
                                danger
                                icon={<ClearOutlined />}
                                loading={loading}
                                size="small"
                            />
                        </Tooltip>
                    </Popconfirm>
                    <Popconfirm
                        title="Delete Campaign"
                        description="Are you sure you want to delete this campaign? This will also delete all associated sponsors and layouts."
                        onConfirm={() => handleDeleteCampaign(record._id)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Tooltip title="Delete Campaign">
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                loading={deleteMutation.isPending}
                                size="small"
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <Card>
                <Title level={2} style={{ fontSize: 'clamp(20px, 5vw, 28px)' }}>
                    Admin Settings
                </Title>
                <Text type="secondary" style={{ fontSize: 'clamp(13px, 2.5vw, 14px)' }}>
                    Development tools for data seeding and testing
                </Text>

                <Divider />

                <Tabs
                    defaultActiveKey="campaigns"
                    items={[
                        {
                            key: 'campaigns',
                            label: 'All Campaigns',
                            children: (
                                <div>
                                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            icon={<ReloadOutlined spin={isRefreshing} />}
                                            onClick={handleRefreshCampaigns}
                                            loading={isRefreshing}
                                            disabled={isRefreshing}
                                        >
                                            Refresh
                                        </Button>
                                    </div>
                                    <Table
                                        columns={columns}
                                        dataSource={campaigns}
                                        rowKey="_id"
                                        loading={campaignsLoading}
                                        pagination={{
                                            pageSize: 10,
                                            showSizeChanger: true,
                                            showTotal: (total) => `Total ${total} campaigns`,
                                        }}
                                        scroll={{ x: 800 }}
                                    />
                                </div>
                            ),
                        },
                        {
                            key: 'seed-sponsors',
                            label: (
                                <span>
                                    <ThunderboltOutlined style={{ marginRight: 8 }} />
                                    Seed Sponsors
                                </span>
                            ),
                            children: (
                                <div>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                                        Generate test sponsor data for a campaign. This will create random sponsors with paid status.
                                        For logo-only campaigns, placeholder logos will be generated and require approval.
                                    </Text>

                                    <Form
                                        form={form}
                                        layout="vertical"
                                        onFinish={handleSeedSponsors}
                                        initialValues={{ numberOfSponsors: 10 }}
                                    >
                                        <Form.Item
                                            label="Campaign ID"
                                            name="campaignId"
                                            rules={[
                                                { required: true, message: 'Please enter a campaign ID' },
                                                { len: 24, message: 'Campaign ID must be 24 characters' },
                                            ]}
                                        >
                                            <Input
                                                placeholder="Enter campaign ID (e.g., 507f1f77bcf86cd799439011)"
                                                maxLength={24}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Number of Sponsors"
                                            name="numberOfSponsors"
                                            rules={[
                                                { required: true, message: 'Please enter number of sponsors' },
                                                { type: 'number', min: 1, max: 100, message: 'Must be between 1 and 100' },
                                            ]}
                                        >
                                            <InputNumber
                                                min={1}
                                                max={100}
                                                style={{ width: '100%' }}
                                                placeholder="Enter number of sponsors to generate"
                                            />
                                        </Form.Item>

                                        <Form.Item>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                loading={loading}
                                                icon={<ThunderboltOutlined />}
                                                block
                                            >
                                                Generate Sponsors
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                </div>
                            ),
                        },
                    ]}
                />
            </Card>
        </div>
    );
};

export default Admin;

