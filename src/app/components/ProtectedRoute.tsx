import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import DashboardLayout from './DashboardLayout';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard instead of login if they are just unauthorized
    return <Navigate to={`/${user.role}`} replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default ProtectedRoute;
