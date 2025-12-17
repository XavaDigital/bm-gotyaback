import React, { useEffect, useState } from 'react';
import { Button, Alert } from 'antd';
import apiClient from '../services/apiClient';

const Home: React.FC = () => {
    const [apiStatus, setApiStatus] = useState<string>('Checking backend connection...');
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const response = await apiClient.get('/');
                setApiStatus(`Backend Connected: ${response.data}`);
                setIsConnected(true);
            } catch (error) {
                setApiStatus('Backend Connection Failed');
                setIsConnected(false);
                console.error('API Error:', error);
            }
        };

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        checkConnection();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        window.location.reload();
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Welcome to Got Ya Back</h1>

            <div style={{ marginBottom: '20px' }}>
                {isConnected !== null && (
                    <Alert
                        message={apiStatus}
                        type={isConnected ? 'success' : 'error'}
                        showIcon
                    />
                )}
                {isConnected === null && (
                    <Alert message={apiStatus} type="info" showIcon />
                )}
            </div>

            {user ? (
                <div>
                    <h3>Hello, {user.name} ({user.role})!</h3>
                    <Button onClick={handleLogout} danger>Logout</Button>
                </div>
            ) : (
                <div style={{ gap: '10px', display: 'flex' }}>
                    <Button type="primary" href="/login">Login</Button>
                    <Button href="/register">Register</Button>
                </div>
            )}
        </div>
    );
};

export default Home;
