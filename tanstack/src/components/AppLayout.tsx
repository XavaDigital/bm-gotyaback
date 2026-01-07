import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Typography } from "antd";
import {
    DashboardOutlined,
    LogoutOutlined,
    UserOutlined,
    SettingOutlined,
    GlobalOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import authService from "../services/auth.service";
import beastmodeLogo from "../assets/beastmode-logo.png";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface AppLayoutProps {
    children?: React.ReactNode;
    onLogout?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, onLogout }) => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate(); // Used for logout navigation
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const user = authService.getCurrentUser();
        setCurrentUser(user);
    }, [location.pathname]); // Re-check user when route changes

    useEffect(() => {
        // Add class to body to override default styles
        const body = document.body;
        const html = document.documentElement;

        body.classList.add("has-admin-layout");
        body.style.margin = "0";
        body.style.width = "100%";
        html.style.width = "100%";

        return () => {
            body.classList.remove("has-admin-layout");
        };
    }, []);

    const menuItems = [
        {
            key: "/",
            icon: <DashboardOutlined />,
            label: <Link to="/">Home</Link>,
        },
        {
            key: "/dashboard",
            icon: <UserOutlined />,
            label: <Link to="/dashboard">My Campaigns</Link>,
        },
        {
            key: "/campaigns/create",
            icon: <SettingOutlined />,
            label: <Link to="/campaigns/create">Create Campaign</Link>,
        },
        {
            key: "/dashboard/profile",
            icon: <SettingOutlined />,
            label: <Link to="/dashboard/profile">Profile Settings</Link>,
        }
    ];

    const handleLogout = () => {
        // try {
        //   localStorage.removeItem("session"); // Example
        // } catch {}
        if (onLogout) onLogout();
        navigate({ to: "/login" }); // Navigate to login on logout
    };

    return (
        <div className="admin-layout">
            <Layout style={{ height: "100vh", width: "100%" }}>
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    theme="dark"
                    width={250}
                    style={{
                        overflow: "auto",
                        height: "100vh",
                        position: "fixed",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        background: "#1f1f1f",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            paddingBottom: 8,
                        }}
                    >
                        <div
                            style={{
                                padding: "16px",
                                textAlign: "center",
                                borderBottom: "1px solid #3a3a3a",
                            }}
                        >
                            {collapsed ? (
                                <img
                                    src={beastmodeLogo}
                                    alt="BM Logo"
                                    style={{
                                        width: "40px",
                                        height: "auto",
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "12px",
                                    }}
                                >
                                    <img
                                        src={beastmodeLogo}
                                        alt="Beast Mode Logo"
                                        style={{
                                            height: "60px",
                                            width: "auto",
                                        }}
                                    />
                                    <Title
                                        level={4}
                                        style={{
                                            color: "white",
                                            margin: 0,
                                            fontSize: "18px",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        Got Your Back
                                    </Title>
                                </div>
                            )}
                        </div>

                        <div style={{ flex: 1, overflow: "auto", marginTop: "16px" }}>
                            <Menu
                                theme="dark"
                                mode="inline"
                                selectedKeys={[location.pathname]}
                                items={menuItems}
                                style={{ background: "#1f1f1f" }}
                            />
                        </div>
                        <div
                            style={{
                                padding: "16px",
                                borderTop: "1px solid #3a3a3a",
                                marginTop: "auto",
                                marginBottom: 8,
                            }}
                        >
                            <Button
                                block
                                danger
                                icon={<LogoutOutlined />}
                                onClick={handleLogout}
                            >
                                {!collapsed && "Logout"}
                            </Button>
                        </div>
                    </div>
                </Sider>
                <Layout
                    style={{
                        marginLeft: collapsed ? 80 : 250,
                        transition: "margin-left 0.2s ease",
                    }}
                >
                    <Header
                        style={{
                            background: "#fff",
                            padding: "0 24px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            position: "sticky",
                            top: 0,
                            zIndex: 1,
                        }}
                    >
                        <Title level={3} style={{ margin: 0, color: "#C8102E" }}>
                            Admin Panel
                        </Title>
                        <div>
                            {currentUser?.organizerProfile?.slug && (
                                <Button
                                    type="link"
                                    icon={<GlobalOutlined />}
                                    href={`/u/${currentUser.organizerProfile.slug}`}
                                    target="_blank"
                                >
                                    View Public Profile
                                </Button>
                            )}
                        </div>
                    </Header>
                    <Content
                        style={{
                            padding: "24px",
                            background: "#f5f5f5",
                            minHeight: "calc(100vh - 64px)",
                            overflow: "auto",
                        }}
                    >
                        {children ?? <Outlet />}
                    </Content>
                </Layout>
            </Layout>
        </div>
    );
};
