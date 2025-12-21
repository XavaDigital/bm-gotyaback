import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateCampaign from "./pages/CreateCampaign";
import MyCampaigns from "./pages/MyCampaigns";
import CampaignDetail from "./pages/CampaignDetail";
import PublicCampaign from "./pages/PublicCampaign";
import ProfileSettings from "./pages/ProfileSettings";
import OrganizerLandingPage from "./pages/OrganizerLandingPage";
import { AppLayout } from "./components/AppLayout";
import { AuthGuard } from "./components/AuthGuard";
import { GuestGuard } from "./components/GuestGuard";
import authService from "./services/auth.service";
import "./App.css";

// Light theme for admin portal
const lightTheme = {
  token: {
    colorPrimary: "#C8102E",
    colorLink: "#C8102E",
    colorLinkHover: "#A00D25",
    fontFamily:
      "Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontFamilyCode: "'Courier New', Courier, monospace",
  },
  components: {
    Button: {
      primaryShadow: "0 0 0 0 rgba(0,0,0,0)",
    },
    Typography: {
      fontFamilyHeading:
        "Archivo, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
  },
};

// Dark theme for public pages
const darkTheme = {
  token: {
    colorPrimary: "#C8102E",
    colorLink: "#C8102E",
    colorLinkHover: "#A00D25",
    colorBgContainer: "#2a2a2a",
    colorText: "#ffffff",
    colorTextSecondary: "#cccccc",
    colorTextTertiary: "#999999",
    colorBorder: "#3a3a3a",
    fontFamily:
      "Montserrat, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontFamilyCode: "'Courier New', Courier, monospace",
  },
  components: {
    Button: {
      primaryShadow: "0 0 0 0 rgba(0,0,0,0)",
    },
    Typography: {
      fontFamilyHeading:
        "Archivo, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
  },
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes (Guests only - redirect to dashboard if logged in) - Light Theme */}
        <Route element={<GuestGuard />}>
          <Route
            path="/login"
            element={
              <ConfigProvider theme={lightTheme}>
                <Login />
              </ConfigProvider>
            }
          />
          <Route
            path="/register"
            element={
              <ConfigProvider theme={lightTheme}>
                <Register />
              </ConfigProvider>
            }
          />
        </Route>

        {/* Public Routes (No auth required) - Dark Theme */}
        <Route
          path="/"
          element={
            <ConfigProvider theme={darkTheme}>
              <Home />
            </ConfigProvider>
          }
        />
        <Route
          path="/campaign/:slug"
          element={
            <ConfigProvider theme={darkTheme}>
              <PublicCampaign />
            </ConfigProvider>
          }
        />
        <Route
          path="/u/:slug"
          element={
            <ConfigProvider theme={darkTheme}>
              <OrganizerLandingPage />
            </ConfigProvider>
          }
        />

        {/* Protected Routes (Authenticated users only) - Light Theme */}
        <Route element={<AuthGuard />}>
          <Route
            element={
              <ConfigProvider theme={lightTheme}>
                <AppLayout onLogout={authService.logout} />
              </ConfigProvider>
            }
          >
            <Route path="/campaigns/create" element={<CreateCampaign />} />
            <Route path="/dashboard" element={<MyCampaigns />} />
            <Route path="/dashboard/profile" element={<ProfileSettings />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
