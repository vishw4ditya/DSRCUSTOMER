import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getZones, getBranches } from '../services/firebase';
import { REGISTERABLE_ROLES, ROLE_LABELS, ROLES } from '../roles';

const initialForm = {
  name: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  zone: '',
  branch: '',
};

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [zones, setZones] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Load active Zones on mount
  useEffect(() => {
    console.log('[Register] Loading zones...');
    setLoadingZones(true);
    getZones()
      .then((data) => {
        const activeZones = (data || []).filter(
          (z) => z.status === 'active' || (z.status !== 'inactive' && z.status !== 'disabled' && z.isActive !== false)
        );
        console.log(`[Register] Zones loaded: ${activeZones.length}`);
        setZones(activeZones);
      })
      .catch((err) => {
        console.error('[Register] Failed to load zones:', err);
        if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
          setError('Permission denied reading zones. Please publish the updated firestore.rules in Firebase Console.');
        } else {
          setError('Unable to load zones. Please try again.');
        }
        setZones([]);
      })
      .finally(() => setLoadingZones(false));
  }, []);

  // 2. Load active Branches when Zone selection changes
  useEffect(() => {
    if (form.zone) {
      console.log(`[Register] Selected zone: ${form.zone}`);
      console.log('[Register] Loading branches...');
      setLoadingBranches(true);
      getBranches(form.zone)
        .then((data) => {
          const zoneBranches = (data || []).filter(
            (b) => b.status === 'active' || (b.status !== 'inactive' && b.status !== 'disabled' && b.isActive !== false)
          );
          console.log(`[Register] Branches loaded: ${zoneBranches.length}`);
          setBranches(zoneBranches);
        })
        .catch((err) => {
          console.error('[Register] Failed to load branches:', err);
          if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
            setError('Permission denied reading branches. Please publish the updated firestore.rules in Firebase Console.');
          } else {
            setError('Unable to load branches. Please try again.');
          }
          setBranches([]);
        })
        .finally(() => setLoadingBranches(false));
    } else {
      setBranches([]);
    }
  }, [form.zone]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    setForm((f) => ({
      ...f,
      role: selectedRole,
      zone: '',
      branch: '',
    }));
  };

  const handleZoneChange = (e) => {
    const selectedZone = e.target.value;
    setForm((f) => ({
      ...f,
      zone: selectedZone,
      branch: '', // Automatically reset Branch when Zone changes
    }));
  };

  const needsZone = !!form.role && form.role !== ROLES.SUPER_ADMIN;
  const needsBranch = [ROLES.BRANCH_HEAD, ROLES.TECHNICIAN, ROLES.SALESPERSON].includes(form.role);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.role) {
      setError('Please select a role.');
      return;
    }

    if (form.role === ROLES.SUPER_ADMIN) {
      setError('SuperAdmin accounts cannot be created via public registration.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (needsZone && !form.zone) {
      setError('Zone is required for the selected role.');
      return;
    }

    if (needsBranch && !form.branch) {
      setError('Branch is required for the selected role.');
      return;
    }

    if (needsBranch && form.branch) {
      const validBranch = branches.some((b) => (b.id || b._id) === form.branch);
      if (!validBranch) {
        setError('Selected branch does not belong to the selected zone.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        zoneId: form.zone || null,
        branchId: needsBranch ? form.branch : null,
      });

      setSuccess(
        'Registration submitted successfully! Your account is awaiting administrative approval before you can log in.'
      );
      setForm(initialForm);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card wide">
        <div className="brand">
          <img src="/logo.jpg" alt="DSR Customer Management" className="auth-logo" />
          <div className="brand-name">DSR Customer Management System</div>
        </div>
        <h1>Create your account</h1>
        <p className="auth-subtitle">
          Register as a Regional Manager, Branch Manager, Technician, or Salesperson. Your account will need approval
          before you can log in.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="form-grid" onSubmit={submit}>
          <div>
            <label>Full Name</label>
            <input required placeholder="e.g. Rahul Sharma" value={form.name} onChange={set('name')} disabled={submitting} />
          </div>
          <div className="form-row-2">
            <div>
              <label>Phone Number</label>
              <input required placeholder="e.g. +919876543210" value={form.phone} onChange={set('phone')} disabled={submitting} />
            </div>
            <div>
              <label>Email Address</label>
              <input required type="email" placeholder="e.g. rahul@example.com" value={form.email} onChange={set('email')} disabled={submitting} />
            </div>
          </div>
          <div className="form-row-2">
            <div>
              <label>Password</label>
              <input required type="password" placeholder="At least 8 characters" value={form.password} onChange={set('password')} disabled={submitting} />
            </div>
            <div>
              <label>Confirm Password</label>
              <input required type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={set('confirmPassword')} disabled={submitting} />
            </div>
          </div>

          <div>
            <label>Role</label>
            <select
              required
              value={form.role}
              onChange={handleRoleChange}
              disabled={submitting}
            >
              <option value="">Select role</option>
              {REGISTERABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row-2">
            <div>
              <label>Zone</label>
              <select
                required={needsZone}
                value={form.zone}
                onChange={handleZoneChange}
                disabled={!form.role || submitting || loadingZones}
              >
                {!form.role ? (
                  <option value="">Select role first</option>
                ) : loadingZones ? (
                  <option value="">Loading zones...</option>
                ) : zones.length === 0 ? (
                  <option value="">No active zones available.</option>
                ) : (
                  <>
                    <option value="">Select zone</option>
                    {zones.map((z) => (
                      <option key={z.id || z._id} value={z.id || z._id}>
                        {z.name || z.zoneName}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div>
              <label>Branch</label>
              <select
                required={needsBranch}
                value={form.branch}
                onChange={set('branch')}
                disabled={!needsBranch || !form.zone || submitting || loadingBranches}
              >
                {!needsBranch ? (
                  <option value="">
                    {form.role === ROLES.REGIONAL_MANAGER
                      ? 'Not required for Regional Manager'
                      : 'Select role first'}
                  </option>
                ) : !form.zone ? (
                  <option value="">Select zone first</option>
                ) : loadingBranches ? (
                  <option value="">Loading branches...</option>
                ) : branches.length === 0 ? (
                  <option value="">No active branches available for this zone.</option>
                ) : (
                  <>
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b.id || b._id} value={b.id || b._id}>
                        {b.name || b.branchName}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Submitting registration...' : 'Register'}
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
