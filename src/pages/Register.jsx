import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { REGISTERABLE_ROLES, ROLE_LABELS, ROLES } from '../roles';

const initialForm = { name: '', phone: '', email: '', password: '', confirmPassword: '', role: '', zone: '', branch: '' };

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [zones, setZones] = useState([]);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/zones').then((res) => setZones(res.data));
  }, []);

  useEffect(() => {
    if (form.zone) {
      api.get('/branches', { params: { zone: form.zone } }).then((res) => setBranches(res.data));
    } else {
      setBranches([]);
    }
  }, [form.zone]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const needsZone = !!form.role;
  const needsBranch = [ROLES.BRANCH_HEAD, ROLES.TECHNICIAN, ROLES.SALESPERSON].includes(form.role);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/register', {
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        role: form.role,
        zone: form.zone || undefined,
        branch: needsBranch ? form.branch : undefined,
      });
      setSuccess(
        `Registration submitted! Your UserID is ${res.data.userId} - save this, it's needed only to reset your password later (you'll log in with your phone number). Your account is pending approval.`
      );
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card wide">
        <div className="brand">
          <div className="brand-mark">DSR</div>
          <div className="brand-name">DSR Customer Management System</div>
        </div>
        <h1>Create your account</h1>
        <p className="auth-subtitle">
          Register as a Regional Manager, Branch Head, Technician, or Salesperson. Your account will need approval
          before you can log in.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="form-grid" onSubmit={submit}>
          <div>
            <label>Full Name</label>
            <input required value={form.name} onChange={set('name')} />
          </div>
          <div className="form-row-2">
            <div>
              <label>Phone</label>
              <input required value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label>Email</label>
              <input required type="email" value={form.email} onChange={set('email')} />
            </div>
          </div>
          <div className="form-row-2">
            <div>
              <label>Password</label>
              <input required type="password" value={form.password} onChange={set('password')} />
            </div>
            <div>
              <label>Confirm Password</label>
              <input required type="password" value={form.confirmPassword} onChange={set('confirmPassword')} />
            </div>
          </div>
          <div>
            <label>Role</label>
            <select required value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value, zone: '', branch: '' }))}>
              <option value="">Select role</option>
              {REGISTERABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          {needsZone && (
            <div className="form-row-2">
              <div>
                <label>Zone</label>
                <select required value={form.zone} onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value, branch: '' }))}>
                  <option value="">Select zone</option>
                  {zones.map((z) => (
                    <option key={z._id} value={z._id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
              {needsBranch && (
                <div>
                  <label>Branch</label>
                  <select required value={form.branch} onChange={set('branch')} disabled={!form.zone}>
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an approved account? <Link to="/login">Log in</Link>
          <br />
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
