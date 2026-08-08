import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { userId, phone, newPassword });
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password');
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
        <h1>Reset your password</h1>
        <p className="auth-subtitle">
          Enter your UserID and the phone number registered on your account. If they match, you can set a new
          password right away.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="form-grid" onSubmit={submit}>
          <div>
            <label>UserID</label>
            <input required placeholder="e.g. TC-0001" value={userId} onChange={(e) => setUserId(e.target.value)} />
          </div>
          <div>
            <label>Registered Phone Number</label>
            <input required placeholder="e.g. 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label>New Password</label>
            <input required type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label>Confirm New Password</label>
            <input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">Back to login</Link>
          <br />
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
