import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import authService from "../services/auth.service";

export const GuestGuard: React.FC = () => {
  const user = authService.getCurrentUser();

  if (user) {
    // Redirect logged-in users to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
