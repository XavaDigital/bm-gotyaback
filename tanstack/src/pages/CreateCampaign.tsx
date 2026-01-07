import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Form, Input, Select, Steps, Button, DatePicker, InputNumber, Radio, message, Card, Switch, Alert } from 'antd';
import type { CreateCampaignRequest, CreateLayoutRequest } from '../types/campaign.types';
import campaignService from '../services/campaign.service';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const CreateCampaign: React.FC = () => {
    const [current, setCurrent] = useState(0);
    const [campaignData, setCampaignData] = useState<Partial<CreateCampaignRequest>>({});
    const [layoutData, setLayoutData] = useState<Partial<CreateLayoutRequest>>({});
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const next = () => {
        form.validateFields().then((values) => {
            if (current === 0) {
                setCampaignData({ ...campaignData, ...values });
            } else if (current === 2) {
                setLayoutData({ ...layoutData, ...values });
            } else {
                setCampaignData({ ...campaignData, ...values });
            }
            setCurrent(current + 1);
            form.resetFields();
        });
    };

    const prev = () => {
        setCurrent(current - 1);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // Extract dates from RangePicker
            let finalCampaignData = { ...campaignData };
            if (values.dates && values.dates.length === 2) {
                finalCampaignData.startDate = values.dates[0].toISOString();
                finalCampaignData.endDate = values.dates[1].toISOString();
                delete values.dates;
            }

            finalCampaignData = { ...finalCampaignData, ...values };

            setLoading(true);
            const campaign = await campaignService.createCampaign(finalCampaignData);

            // Create layout if it's a placement or fixed campaign
            if (campaign.campaignType !== 'donation' && layoutData.rows && layoutData.columns) {
                await campaignService.createLayout(campaign._id, layoutData as CreateLayoutRequest);
            }

            message.success('Campaign created successfully!');
            navigate({ to: '/campaigns/$id', params: { id: campaign._id } });
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to create campaign');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        {
            title: 'Basic Info',
            content: (
                <Form form={form} layout="vertical" initialValues={campaignData}>
                    <Form.Item
                        label="Campaign Title"
                        name="title"
                        rules={[{ required: true, message: 'Please enter a title' }]}
                    >
                        <Input placeholder="My Fundraising Campaign 2025" />
                    </Form.Item>

                    <Form.Item label="Description" name="description">
                        <TextArea rows={4} placeholder="Tell people about your campaign..." />
                    </Form.Item>

                    <Form.Item
                        label="Garment Type"
                        name="garmentType"
                        rules={[{ required: true, message: 'Please select a garment type' }]}
                    >
                        <Select placeholder="Select garment type">
                            <Select.Option value="singlet">Singlet</Select.Option>
                            <Select.Option value="tshirt">T-Shirt</Select.Option>
                            <Select.Option value="hoodie">Hoodie</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            ),
        },
        {
            title: 'Campaign Type',
            content: (
                <Form form={form} layout="vertical" initialValues={{ campaignType: campaignData.campaignType }}>
                    <Form.Item
                        label="Campaign Type"
                        name="campaignType"
                        rules={[{ required: true, message: 'Please select a campaign type' }]}
                    >
                        <Radio.Group>
                            <Card style={{ marginBottom: 16 }}>
                                <Radio value="fixed">
                                    <strong>Fixed Price</strong>
                                    <p style={{ marginLeft: 24, color: '#888' }}>
                                        All sponsorship spots cost the same amount
                                    </p>
                                </Radio>
                            </Card>
                            <Card style={{ marginBottom: 16 }}>
                                <Radio value="placement">
                                    <strong>Placement-Based</strong>
                                    <p style={{ marginLeft: 24, color: '#888' }}>
                                        Different positions on the shirt have different prices
                                    </p>
                                </Radio>
                            </Card>
                            <Card>
                                <Radio value="donation">
                                    <strong>Donation Only</strong>
                                    <p style={{ marginLeft: 24, color: '#888' }}>
                                        No shirt placement, pure fundraising
                                    </p>
                                </Radio>
                            </Card>
                        </Radio.Group>
                    </Form.Item>
                </Form>
            ),
        },
        {
            title: 'Configuration',
            content: (
                <Form form={form} layout="vertical" initialValues={layoutData}>
                    {campaignData.campaignType === 'fixed' && (
                        <>
                            <Form.Item
                                label="Price per Spot"
                                name={['pricing', 'fixedPrice']}
                                rules={[{ required: true, message: 'Please enter a price' }]}
                            >
                                <InputNumber
                                    min={1}
                                    prefix="$"
                                    style={{ width: '100%' }}
                                    placeholder="20"
                                />
                            </Form.Item>
                            <Form.Item
                                label="Grid Rows"
                                name="rows"
                                rules={[{ required: true, message: 'Please enter number of rows' }]}
                            >
                                <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="4" />
                            </Form.Item>
                            <Form.Item
                                label="Grid Columns"
                                name="columns"
                                rules={[{ required: true, message: 'Please enter number of columns' }]}
                            >
                                <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="5" />
                            </Form.Item>
                        </>
                    )}

                    {campaignData.campaignType === 'placement' && (
                        <>
                            <Form.Item
                                label="Grid Rows"
                                name="rows"
                                rules={[{ required: true, message: 'Please enter number of rows' }]}
                            >
                                <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="4" />
                            </Form.Item>
                            <Form.Item
                                label="Grid Columns"
                                name="columns"
                                rules={[{ required: true, message: 'Please enter number of columns' }]}
                            >
                                <InputNumber min={1} max={10} style={{ width: '100%' }} placeholder="5" />
                            </Form.Item>
                            <Form.Item
                                label="Top Zone Price"
                                name={['pricing', 'zonePricing', 'top']}
                                rules={[{ required: true, message: 'Please enter top zone price' }]}
                            >
                                <InputNumber min={1} prefix="$" style={{ width: '100%' }} placeholder="50" />
                            </Form.Item>
                            <Form.Item
                                label="Middle Zone Price"
                                name={['pricing', 'zonePricing', 'middle']}
                                rules={[{ required: true, message: 'Please enter middle zone price' }]}
                            >
                                <InputNumber min={1} prefix="$" style={{ width: '100%' }} placeholder="30" />
                            </Form.Item>
                            <Form.Item
                                label="Bottom Zone Price"
                                name={['pricing', 'zonePricing', 'bottom']}
                                rules={[{ required: true, message: 'Please enter bottom zone price' }]}
                            >
                                <InputNumber min={1} prefix="$" style={{ width: '100%' }} placeholder="20" />
                            </Form.Item>
                        </>
                    )}

                    {campaignData.campaignType === 'donation' && (
                        <p style={{ color: '#888', textAlign: 'center' }}>
                            No configuration needed for donation-only campaigns.
                            <br />
                            Skip to the next step.
                        </p>
                    )}
                </Form>
            ),
        },
        {
            title: 'Settings',
            content: (
                <Form form={form} layout="vertical" initialValues={campaignData}>
                    <Form.Item
                        label="Campaign Duration"
                        name="dates"
                        rules={[{ required: true, message: 'Please select campaign dates' }]}
                    >
                        <RangePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        label="Currency"
                        name="currency"
                        initialValue="NZD"
                        rules={[{ required: true, message: 'Please select a currency' }]}
                    >
                        <Select>
                            <Select.Option value="NZD">NZD</Select.Option>
                            <Select.Option value="AUD">AUD</Select.Option>
                            <Select.Option value="USD">USD</Select.Option>
                        </Select>
                    </Form.Item>

                    <Alert
                        message="Payment Methods"
                        description="Offline payments (cash, bank transfer, etc.) are always enabled. You can optionally enable online payments via Stripe."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <Form.Item
                        label="Enable Online Payments (Stripe)"
                        name="enableStripePayments"
                        valuePropName="checked"
                        initialValue={false}
                        tooltip="Allow sponsors to pay with credit/debit cards via Stripe. Requires Stripe to be configured on the server."
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            ),
        },
    ];

    return (
        <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
            <h1>Create Campaign</h1>
            <Steps
                current={current}
                style={{ marginBottom: 40 }}
                items={steps.map((item) => ({ title: item.title }))}
            />

            <div style={{ minHeight: 300 }}>{steps[current].content}</div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                {current > 0 && (
                    <Button onClick={prev}>
                        Previous
                    </Button>
                )}
                <div style={{ flex: 1 }} />
                {current < steps.length - 1 && (
                    <Button type="primary" onClick={next}>
                        Next
                    </Button>
                )}
                {current === steps.length - 1 && (
                    <Button type="primary" onClick={handleSubmit} loading={loading}>
                        Create Campaign
                    </Button>
                )}
            </div>
        </div>
    );
};

export default CreateCampaign;
