import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, userProfile, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div className="brand" style={{ justifyContent: 'center', marginBottom: 16 }}>
            <img src="/company-logo.jpg" alt="Logo" className="auth-logo" style={{ width: 80, height: 80 }} />
          </div>
          <div className="loading-spinner" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: 18, margin: '0 0 8px 0', color: 'var(--color-text)' }}>
            Authenticating...
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
            Verifying your account details and permissions.
          </p>
        </div>
      </div>
    );
  }

  // Check if authenticated with active account status
  if (!isAuthenticated || !user || !userProfile || userProfile.status !== 'active') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization if specified
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
