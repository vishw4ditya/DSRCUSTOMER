import { useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../roles';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone, email: user.email, password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password && form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const payload = { name: form.name, phone: form.phone, email: form.email };
      if (form.password) payload.password = form.password;
      await api.put('/users/me', payload);
      await refreshUser();
      setSuccess('Profile updated successfully');
      setForm((f) => ({ ...f, password: '', confirmPassword: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
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
              {user.userId} &middot; {ROLE_LABELS[user.role] || user.role}
            </p>
          </div>
        </div>

        <div className="panel" style={{ maxWidth: 520 }}>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form className="form-grid" onSubmit={submit}>
            <div>
              <label>Full Name</label>
              <input required value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label>Phone</label>
              <input required value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label>Email</label>
              <input required type="email" value={form.email} onChange={set('email')} />
            </div>
            <div className="form-row-2">
              <div>
                <label>New Password (optional)</label>
                <input type="password" value={form.password} onChange={set('password')} />
              </div>
              <div>
                <label>Confirm New Password</label>
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} />
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
