import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Typography, Space, Divider } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import userService from '../services/user.service';
import authService from '../services/auth.service';
import ImageUpload from '../components/ImageUpload';
import { QuillEditor } from '../components/QuillEditor';
import type { UpdateProfileRequest } from '../types/campaign.types';

const { Title, Text } = Typography;

const ProfileSettings: React.FC = () => {
    console.log('ProfileSettings component rendered');
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);

    useEffect(() => {
        console.log('ProfileSettings useEffect running');
        const user = authService.getCurrentUser();
        console.log('Current user:', user);
        setCurrentUser(user);

        // Pre-fill form if user has existing profile
        if (user?.organizerProfile) {
            console.log('Pre-filling form with existing profile');
            form.setFieldsValue({
                displayName: user.organizerProfile.displayName,
                slug: user.organizerProfile.slug,
                logoUrl: user.organizerProfile.logoUrl,
                coverImageUrl: user.organizerProfile.coverImageUrl,
                bio: user.organizerProfile.bio,
                websiteUrl: user.organizerProfile.websiteUrl,
                facebook: user.organizerProfile.socialLinks?.facebook,
                twitter: user.organizerProfile.socialLinks?.twitter,
                instagram: user.organizerProfile.socialLinks?.instagram,
            });
        } else {
            console.log('No existing profile found');
        }
    }, [form]);

    const onFinish = async (values: any) => {
        console.log('Form submitted with values:', values);
        setLoading(true);
        try {
            const profileData: UpdateProfileRequest = {
                displayName: values.displayName,
                slug: values.slug,
                bio: values.bio,
                websiteUrl: values.websiteUrl,
                socialLinks: {
                    facebook: values.facebook,
                    twitter: values.twitter,
                    instagram: values.instagram,
                },
            };

            // Keep existing URLs if no new files uploaded
            if (!logoFile && values.logoUrl) {
                profileData.logoUrl = values.logoUrl;
            }
            if (!coverFile && values.coverImageUrl) {
                profileData.coverImageUrl = values.coverImageUrl;
            }

            console.log('Sending profile data:', profileData);
            console.log('Logo file:', logoFile);
            console.log('Cover file:', coverFile);

            const response = await userService.updateProfile(profileData, logoFile, coverFile);
            console.log('Response from server:', response);

            // Update localStorage with new user data
            const currentUser = authService.getCurrentUser();
            if (currentUser && response.user) {
                const updatedUser = {
                    ...currentUser,
                    organizerProfile: response.user.organizerProfile
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setCurrentUser(updatedUser);
                console.log('Updated user in localStorage:', updatedUser);
            }

            message.success('Profile updated successfully!');

            // Reset file states
            setLogoFile(null);
            setCoverFile(null);
        } catch (error: any) {
            console.error('Error updating profile:', error);
            const msg = error.response?.data?.message || 'Failed to update profile';
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log('Form validation failed:', errorInfo);
        message.error('Please fill in all required fields correctly');
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
            <Card>
                <Title level={2}>Organizer Profile Settings</Title>
                <Text type="secondary">
                    Customize your public organizer profile. This will be visible to visitors viewing your campaigns.
                </Text>

                <Divider />

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                    autoComplete="off"
                >
                    <Title level={4}>Basic Information</Title>
                    
                    <Form.Item
                        label="Display Name"
                        name="displayName"
                        rules={[{ required: true, message: 'Please enter a display name' }]}
                    >
                        <Input placeholder="Your organization or personal name" />
                    </Form.Item>

                    <Form.Item
                        label="URL Slug"
                        name="slug"
                        rules={[
                            { required: true, message: 'Please enter a URL slug' },
                            { pattern: /^[a-z0-9-]+$/, message: 'Only lowercase letters, numbers, and hyphens allowed' }
                        ]}
                        extra="Your profile will be accessible at: /u/your-slug"
                    >
                        <Input placeholder="my-organization" />
                    </Form.Item>

                    <Form.Item
                        label="Bio"
                        name="bio"
                        tooltip="Use the editor toolbar to add formatting, headings, lists, and links"
                    >
                        <QuillEditor
                            placeholder="Tell people about your organization or cause..."
                        />
                    </Form.Item>

                    <Divider />

                    <Title level={4}>Images</Title>

                    <Form.Item
                        label="Logo"
                        name="logoUrl"
                        extra="Upload your organization logo (max 5MB)"
                    >
                        <ImageUpload
                            type="logo"
                            value={form.getFieldValue('logoUrl')}
                            onChange={(file) => setLogoFile(file)}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Cover Image"
                        name="coverImageUrl"
                        extra="Upload a cover/banner image (max 5MB)"
                    >
                        <ImageUpload
                            type="cover"
                            value={form.getFieldValue('coverImageUrl')}
                            onChange={(file) => setCoverFile(file)}
                        />
                    </Form.Item>

                    <Divider />

                    <Title level={4}>Links</Title>

                    <Form.Item
                        label="Website"
                        name="websiteUrl"
                    >
                        <Input placeholder="https://yourwebsite.com" />
                    </Form.Item>

                    <Form.Item
                        label="Facebook"
                        name="facebook"
                    >
                        <Input placeholder="https://facebook.com/yourpage" />
                    </Form.Item>

                    <Form.Item
                        label="Twitter"
                        name="twitter"
                    >
                        <Input placeholder="https://twitter.com/yourhandle" />
                    </Form.Item>

                    <Form.Item
                        label="Instagram"
                        name="instagram"
                    >
                        <Input placeholder="https://instagram.com/yourhandle" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={<SaveOutlined />}
                            >
                                Save Profile
                            </Button>
                            {currentUser?.organizerProfile?.slug && (
                                <Button
                                    type="link"
                                    href={`/u/${currentUser.organizerProfile.slug}`}
                                    target="_blank"
                                >
                                    View Public Profile
                                </Button>
                            )}
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default ProfileSettings;

