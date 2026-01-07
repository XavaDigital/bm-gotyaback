import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd';
import { useNavigate, Link } from '@tanstack/react-router';
import authService from '../services/auth.service';



const { Title, Text } = Typography;

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            await authService.login(values);
            message.success('Login successful!');
            navigate({ to: '/' });
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Login failed';
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 400 }}>
                 <Alert
        message="Development Mode"
        description={
          <div>
            <Text strong>Test Accounts:</Text>
          
            <div style={{ marginTop: 12 }}>
              <Text strong>User Account:</Text>
              <br />
              <Text copyable>user@gmail.com</Text>
              <br />
              <Text>Password: </Text>
              <Text copyable>qweqweqwe</Text>
            </div>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <Title level={2}>Login</Title>
                </div>
                <Form
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                >
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Please input your email!' },
                            { type: 'email', message: 'Please enter a valid email!' }
                        ]}
                    >
                        <Input placeholder="Email Address" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, message: 'Please input your password!' }]}
                    >
                        <Input.Password placeholder="Password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Log in
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        Or <Link to="/register">register now!</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
