import { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/firebase/users';
import { auth } from '../services/firebase/config';
import { ROLE_LABELS } from '../roles';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password && form.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setSaving(true);
    try {
      if (user?.uid) {
        await updateUserProfile(user.uid, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
        });
      }

      if (form.password && auth?.currentUser) {
        await updatePassword(auth.currentUser, form.password);
      }

      if (refreshUser) {
        await refreshUser();
      }

      setSuccess('Profile updated successfully');
      setForm((f) => ({ ...f, password: '', confirmPassword: '' }));
    } catch (err) {
      setError(err.message || 'Profile update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1>My Profile</h1>
            <p>
              <strong>User ID: {user?.userId || 'N/A'}</strong> &middot; Role: {ROLE_LABELS[user?.role] || user?.role} &middot; Phone: {user?.phone || 'N/A'}
            </p>
          </div>
        </div>

        <div className="panel" style={{ maxWidth: 520 }}>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form className="form-grid" onSubmit={submit}>
            <div>
              <label>Full Name</label>
              <input required value={form.name} onChange={set('name')} disabled={saving} />
            </div>
            <div>
              <label>Phone Number</label>
              <input required value={form.phone} onChange={set('phone')} disabled={saving} />
            </div>
            <div>
              <label>Email Address</label>
              <input required type="email" value={form.email} onChange={set('email')} disabled={saving} />
            </div>
            <div className="form-row-2">
              <div>
                <label>New Password (optional)</label>
                <input type="password" value={form.password} onChange={set('password')} disabled={saving} />
              </div>
              <div>
                <label>Confirm New Password</label>
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} disabled={saving} />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
