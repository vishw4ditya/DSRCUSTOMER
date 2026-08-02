import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DASHBOARD_PATH } from '../roles';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(userId, password);
      navigate(DASHBOARD_PATH[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-mark">DSR</div>
          <div className="brand-name">DSR Customer Management System</div>
        </div>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Log in with the UserID you received after registration.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="form-grid" onSubmit={submit}>
          <div>
            <label>UserID</label>
            <input required placeholder="e.g. TC-0001" value={userId} onChange={(e) => setUserId(e.target.value)} />
          </div>
          <div>
            <label>Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log In'}
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
