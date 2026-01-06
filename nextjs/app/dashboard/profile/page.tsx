'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  message,
  Divider,
  Space,
  Upload,
} from 'antd';
import { SaveOutlined, UserOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useAuth } from '@/lib/contexts/auth-context';
import apiClient from '@/lib/api-client';
import type { UpdateProfileRequest } from '@/types/campaign.types';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [coverFileList, setCoverFileList] = useState<UploadFile[]>([]);
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (user?.organizerProfile) {
      form.setFieldsValue({
        displayName: user.organizerProfile.displayName,
        slug: user.organizerProfile.slug,
        bio: user.organizerProfile.bio,
        websiteUrl: user.organizerProfile.websiteUrl,
        facebook: user.organizerProfile.socialLinks?.facebook,
        twitter: user.organizerProfile.socialLinks?.twitter,
        instagram: user.organizerProfile.socialLinks?.instagram,
      });
    }
  }, [user, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      if (values.displayName) formData.append('displayName', values.displayName);
      if (values.slug) formData.append('slug', values.slug);
      if (values.bio) formData.append('bio', values.bio);
      if (values.websiteUrl) formData.append('websiteUrl', values.websiteUrl);
      
      const socialLinks: any = {};
      if (values.facebook) socialLinks.facebook = values.facebook;
      if (values.twitter) socialLinks.twitter = values.twitter;
      if (values.instagram) socialLinks.instagram = values.instagram;
      if (Object.keys(socialLinks).length > 0) {
        formData.append('socialLinks', JSON.stringify(socialLinks));
      }

      if (logoFileList[0]?.originFileObj) {
        formData.append('logo', logoFileList[0].originFileObj);
      }
      if (coverFileList[0]?.originFileObj) {
        formData.append('coverImage', coverFileList[0].originFileObj);
      }

      const response = await apiClient.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUser(response.data);
      message.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      message.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Title level={2}>Profile Settings</Title>
        <Text type="secondary">Manage your organizer profile and public information</Text>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Title level={4}>
            <UserOutlined className="mr-2" />
            Basic Information
          </Title>

          <Form.Item
            name="displayName"
            label="Display Name"
            extra="This name will be shown on your public profile"
          >
            <Input size="large" placeholder="Your Organization Name" />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Profile URL"
            extra={`Your profile will be available at: /organizer/${form.getFieldValue('slug') || 'your-slug'}`}
            rules={[
              {
                pattern: /^[a-z0-9-]+$/,
                message: 'Only lowercase letters, numbers, and hyphens allowed',
              },
            ]}
          >
            <Input
              size="large"
              placeholder="your-organization"
              addonBefore="/organizer/"
            />
          </Form.Item>

          <Form.Item
            name="bio"
            label="Bio"
            extra="Tell people about your organization"
          >
            <Input.TextArea
              rows={4}
              placeholder="We are a community organization dedicated to..."
            />
          </Form.Item>

          <Form.Item
            name="websiteUrl"
            label="Website"
            rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
          >
            <Input size="large" placeholder="https://yourwebsite.com" />
          </Form.Item>

          <Divider />

          <Title level={4}>Social Media</Title>

          <Form.Item
            name="facebook"
            label="Facebook"
          >
            <Input size="large" placeholder="https://facebook.com/yourpage" />
          </Form.Item>

          <Form.Item
            name="twitter"
            label="Twitter/X"
          >
            <Input size="large" placeholder="https://twitter.com/yourhandle" />
          </Form.Item>

          <Form.Item
            name="instagram"
            label="Instagram"
          >
            <Input size="large" placeholder="https://instagram.com/yourhandle" />
          </Form.Item>

          <Divider />

          <Title level={4}>Images</Title>

          <Form.Item
            name="logo"
            label="Logo"
            extra="Upload your organization logo"
          >
            <Upload
              listType="picture-card"
              fileList={logoFileList}
              onChange={({ fileList }) => setLogoFileList(fileList)}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              {logoFileList.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload Logo</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            name="coverImage"
            label="Cover Image"
            extra="Upload a cover image for your profile"
          >
            <Upload
              listType="picture-card"
              fileList={coverFileList}
              onChange={({ fileList }) => setCoverFileList(fileList)}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              {coverFileList.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload Cover</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              icon={<SaveOutlined />}
            >
              Save Profile
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

