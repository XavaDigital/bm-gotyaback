import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateCampaign from './pages/CreateCampaign';
import MyCampaigns from './pages/MyCampaigns';
import CampaignDetail from './pages/CampaignDetail';
import PublicCampaign from './pages/PublicCampaign';
import ProfileSettings from './pages/ProfileSettings';
import OrganizerLandingPage from './pages/OrganizerLandingPage';
import { AppLayout } from './components/AppLayout';
import { AuthGuard } from './components/AuthGuard';
import { GuestGuard } from './components/GuestGuard';
import authService from './services/auth.service';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes (Guests only) */}
        <Route element={<GuestGuard />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Public Routes (No auth required) */}
        <Route path="/campaign/:slug" element={<PublicCampaign />} />
        <Route path="/u/:slug" element={<OrganizerLandingPage />} />

        {/* Protected Routes (Authenticated users only) */}
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout onLogout={authService.logout} />}>
            <Route path="/" element={<Home />} />
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
