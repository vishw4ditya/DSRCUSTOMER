import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DASHBOARD_PATH } from '../roles';

export default function Login() {
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard automatically
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname || DASHBOARD_PATH[user.role] || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setError('Please enter your phone number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const loggedUser = await login(trimmedPhone, password);
      if (loggedUser && loggedUser.role) {
        const dest = DASHBOARD_PATH[loggedUser.role] || '/dashboard';
        navigate(dest, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid phone number or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand">
          <img src="/company-logo.jpg" alt="Karnali Krishna Purifier Pvt. Ltd." className="auth-logo" />
          <div className="brand-name">DSR Customer Management System</div>
        </div>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in with your registered phone number and password.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="form-grid" onSubmit={submit}>
          <div>
            <label>Phone Number</label>
            <input
              required
              type="text"
              placeholder="e.g. +91 9876543210 or +977 98XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={submitting}
              autoComplete="username"
            />
          </div>
          <div>
            <label>Password</label>
            <input
              required
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              autoComplete="current-password"
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Authenticating...' : 'Log In'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/forgot-password">Forgot password?</Link>
          <span> &middot; </span>
          <Link to="/register">Create an account</Link>
          <br />
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
