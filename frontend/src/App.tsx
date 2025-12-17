import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateCampaign from './pages/CreateCampaign';
import MyCampaigns from './pages/MyCampaigns';
import CampaignDetail from './pages/CampaignDetail';
import PublicCampaign from './pages/PublicCampaign';
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

        {/* Public Campaign View (No auth required) */}
        <Route path="/c/:slug" element={<PublicCampaign />} />

        {/* Protected Routes (Authenticated users only) */}
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout onLogout={authService.logout} />}>
            <Route path="/" element={<Home />} />
            <Route path="/campaigns/create" element={<CreateCampaign />} />
            <Route path="/dashboard" element={<MyCampaigns />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
