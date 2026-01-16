import React, { useState } from 'react';
import { Card, Form, Input, Button, App, Typography, Space, InputNumber, Divider, Table, Popconfirm, Tag } from 'antd';
import { ThunderboltOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import apiClient from '~/services/apiClient';
import campaignService from '~/services/campaign.service';
import type { Campaign } from '~/types/campaign.types';

const { Title, Text } = Typography;

const Admin: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { message } = App.useApp();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Fetch all campaigns
    const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
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

    const handleDeleteCampaign = (campaignId: string) => {
        deleteMutation.mutate(campaignId);
    };

    const handleViewCampaign = (campaignId: string) => {
        navigate({ to: '/campaigns/$id', params: { id: campaignId } });
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: 'ID',
            dataIndex: '_id',
            key: '_id',
            render: (id: string) => (
                <Text copyable={{ text: id }} style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                    {id.substring(0, 8)}...
                </Text>
            ),
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
            render: (_: any, record: Campaign) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewCampaign(record._id)}
                    >
                        View
                    </Button>
                    <Popconfirm
                        title="Delete Campaign"
                        description="Are you sure you want to delete this campaign? This will also delete all associated sponsors and layouts."
                        onConfirm={() => handleDeleteCampaign(record._id)}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="link"
                            danger
                            icon={<DeleteOutlined />}
                            loading={deleteMutation.isPending}
                        >
                            Delete
                        </Button>
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

                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Campaigns List Section */}
                    <Card
                        type="inner"
                        title="All Campaigns"
                    >
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
                    </Card>

                    {/* Seed Sponsors Section */}
                    <Card
                        type="inner"
                        title={
                            <Space>
                                <ThunderboltOutlined />
                                <span>Seed Sponsors</span>
                            </Space>
                        }
                    >
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
                    </Card>
                </Space>
            </Card>
        </div>
    );
};

export default Admin;

