import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { verifyUserIdAndPhone, resetPasswordWithUserToken } from '../services/firebase/auth';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Verification, Step 2: Set New Password

  const [userId, setUserId] = useState('');
  const [phone, setPhone] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Verify User ID + Registered Phone Number
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedId = userId.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedId) {
      setError('Please enter your User ID.');
      return;
    }
    if (!trimmedPhone) {
      setError('Please enter your registered phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await verifyUserIdAndPhone(trimmedId, trimmedPhone);
      if (result.success && result.resetToken) {
        setResetToken(result.resetToken);
        setSuccess('Identity verified! Please set your new password below.');
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'User ID or registered phone number is incorrect.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Reset Password with verified token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPasswordWithUserToken(resetToken, newPassword);
      setSuccess('Password updated successfully! Redirecting to login page...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1800);
    } catch (err) {
      setError(err.message || 'Password reset failed. Please try again.');
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

        {step === 1 ? (
          <p className="auth-subtitle">
            Enter your unique <strong>User ID</strong> (e.g. SA-0001, SP-0001) and your <strong>Registered Phone Number</strong> to verify your account.
          </p>
        ) : (
          <p className="auth-subtitle">
            Identity verified for <strong>{userId.toUpperCase()}</strong>. Enter your new password below.
          </p>
        )}

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {step === 1 ? (
          <form className="form-grid" onSubmit={handleVerify}>
            <div>
              <label>User ID</label>
              <input
                required
                placeholder="e.g. SA-0001, SP-0001, BH-0001"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={submitting}
                autoComplete="off"
              />
            </div>
            <div>
              <label>Registered Phone Number</label>
              <input
                required
                placeholder="e.g. 9876543210 or +919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
                autoComplete="tel"
              />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? 'Verifying Identity...' : 'Verify Details'}
            </button>
          </form>
        ) : (
          <form className="form-grid" onSubmit={handleResetPassword}>
            <div>
              <label>New Password (min 8 characters)</label>
              <input
                required
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={submitting}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label>Confirm New Password</label>
              <input
                required
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                autoComplete="new-password"
              />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login">Back to login</Link>
          <br />
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
