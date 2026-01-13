import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import authService from "../services/auth.service";

export const AuthGuard: React.FC = () => {
  const user = authService.getCurrentUser();
  const token = localStorage.getItem("token");
  const location = useLocation();

  // Check if both user and token exist
  if (!user || !token) {
    // Clear any stale data
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
