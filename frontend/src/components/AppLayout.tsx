import React, { useState, useEffect, useRef } from "react";
import { Layout, Menu, Button, Typography, Drawer } from "antd";
import {
  DashboardOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  GlobalOutlined,
  MenuOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // Used for logout navigation
  const [currentUser, setCurrentUser] = useState<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  // Scroll content to top on route change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  const menuItems = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: "Home",
    },
    {
      key: "/dashboard",
      icon: <UserOutlined />,
      label: "My Campaigns",
    },
    {
      key: "/campaigns/create",
      icon: <SettingOutlined />,
      label: "Create Campaign",
    },
    {
      key: "/dashboard/profile",
      icon: <SettingOutlined />,
      label: "Profile Settings",
    },
    // Only show Admin Settings to admin users
    ...(currentUser?.role === "admin"
      ? [
          {
            key: "/admin",
            icon: <ToolOutlined />,
            label: "Admin Settings",
          },
        ]
      : []),
  ];

  const handleMenuClick = (e: any) => {
    navigate({ to: e.key });
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const handleLogout = () => {
    // try {
    //   localStorage.removeItem("session"); // Example
    // } catch {}
    if (onLogout) onLogout();
    navigate({ to: "/login" }); // Navigate to login on logout
  };

  // Sidebar content component (reused for both desktop and mobile)
  const SidebarContent = () => (
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
        {collapsed && !isMobile ? (
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
          onClick={handleMenuClick}
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
        <Button block danger icon={<LogoutOutlined />} onClick={handleLogout}>
          {(!collapsed || isMobile) && "Logout"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="admin-layout">
      <Layout style={{ minHeight: "100vh", width: "100%" }}>
        {/* Desktop Sidebar */}
        {!isMobile && (
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
            <SidebarContent />
          </Sider>
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <Drawer
            placement="left"
            onClose={() => setMobileDrawerOpen(false)}
            open={mobileDrawerOpen}
            styles={{
              body: { padding: 0, background: "#1f1f1f" },
            }}
            width={250}
          >
            <SidebarContent />
          </Drawer>
        )}

        <div
          ref={contentRef}
          style={{
            position: "fixed",
            left: isMobile ? 0 : collapsed ? 80 : 250,
            right: 0,
            top: 0,
            bottom: 0,
            transition: "left 0.2s ease",
            overflow: "auto",
          }}
        >
          <Layout style={{ minHeight: "100%" }}>
            <Header
              style={{
                background: "#fff",
                padding: isMobile ? "0 12px" : "0 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {isMobile && (
                  <Button
                    type="text"
                    icon={<MenuOutlined />}
                    onClick={() => setMobileDrawerOpen(true)}
                    style={{ fontSize: "18px" }}
                  />
                )}
                <Title
                  level={3}
                  style={{
                    margin: 0,
                    color: "#C8102E",
                    fontSize: isMobile ? "clamp(16px, 4vw, 20px)" : "24px",
                  }}
                >
                  {isMobile ? "Dashboard" : "Admin Panel"}
                </Title>
              </div>
              <div>
                {currentUser?.organizerProfile?.slug && (
                  <Button
                    type="link"
                    icon={<GlobalOutlined />}
                    href={`/u/${currentUser.organizerProfile.slug}`}
                    target="_blank"
                    style={{
                      fontSize: isMobile ? "12px" : "14px",
                      padding: isMobile ? "4px 8px" : "4px 15px",
                    }}
                  >
                    {isMobile ? "Profile" : "View Public Profile"}
                  </Button>
                )}
              </div>
            </Header>
            <Content
              style={{
                padding: isMobile ? "16px" : "24px",
                background: "#f5f5f5",
                minHeight: "calc(100vh - 64px)",
              }}
            >
              {children ?? <Outlet />}
            </Content>
          </Layout>
        </div>
      </Layout>
    </div>
  );
};
