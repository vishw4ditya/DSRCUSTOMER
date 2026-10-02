import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layouts/DashboardLayout';
import { ROLES } from './roles';

import HomePage from './pages/HomePage';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import RegionalManagerDashboard from './pages/RegionalManagerDashboard';
import BranchHeadDashboard from './pages/BranchHeadDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import SalespersonDashboard from './pages/SalespersonDashboard';

export default function App() {
  return (
    <Routes>
      {/* Public Home Page */}
      <Route path="/" element={<HomePage />} />

      {/* Main Role-Based Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />

      {/* Auth Routes */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Profile Route */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Specific Role Dashboard Routes */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/regional-manager"
        element={
          <ProtectedRoute allowedRoles={[ROLES.REGIONAL_MANAGER]}>
            <RegionalManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/branch-head"
        element={
          <ProtectedRoute allowedRoles={[ROLES.BRANCH_HEAD]}>
            <BranchHeadDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technician"
        element={
          <ProtectedRoute allowedRoles={[ROLES.TECHNICIAN]}>
            <TechnicianDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/salesperson"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SALESPERSON]}>
            <SalespersonDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
