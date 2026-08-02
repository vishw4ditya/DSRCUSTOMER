import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import Modal from './Modal';
import { ROLE_LABELS } from '../roles';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', phone: '', email: '', password: '', role: '', zone: '', branch: '' };

export default function UserManagementPanel({ manageableRoles, needsZoneField, needsBranchField }) {
  const { user: me } = useAuth();
  const [tab, setTab] = useState('approvals');
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const [pendingRes, usersRes, zonesRes, branchesRes] = await Promise.all([
        api.get('/users/pending'),
        api.get('/users', { params }),
        api.get('/zones'),
        api.get('/branches', me?.zone ? { params: { zone: typeof me.zone === 'object' ? me.zone._id : me.zone } } : {}),
      ]);
      setPending(pendingRes.data);
      setUsers(usersRes.data);
      setZones(zonesRes.data);
      setBranches(branchesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter, search]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3500);
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/users/${id}/approve`);
      flash('Account approved');
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection (optional):') || '';
    try {
      await api.put(`/users/${id}/reject`, { reason });
      flash('Account rejected');
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Rejection failed');
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}? They will no longer be able to log in.`)) return;
    try {
      await api.delete(`/users/${id}`);
      flash('User deactivated');
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Deactivation failed');
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, role: manageableRoles[0] || '' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditingId(u._id);
    setForm({
      name: u.name,
      phone: u.phone,
      email: u.email,
      password: '',
      role: u.role,
      zone: u.zone?._id || u.zone || '',
      branch: u.branch?._id || u.branch || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editingId) {
        const payload = { name: form.name, phone: form.phone, email: form.email };
        if (form.password) payload.password = form.password;
        if (needsZoneField) payload.zone = form.zone;
        if (needsBranchField) payload.branch = form.branch;
        await api.put(`/users/${editingId}`, payload);
        flash('User updated');
      } else {
        if (!form.password) {
          setFormError('Password is required for new accounts');
          return;
        }
        const payload = { ...form };
        if (!needsZoneField) delete payload.zone;
        if (!needsBranchField) delete payload.branch;
        await api.post('/users', payload);
        flash('User created and approved');
      }
      setShowForm(false);
      loadAll();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Save failed');
    }
  };

  const branchesForZone = (zoneId) => branches.filter((b) => (b.zone?._id || b.zone) === zoneId);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Team &amp; Approvals</h2>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          + Add User Directly
        </button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button className={`tab-btn ${tab === 'approvals' ? 'active' : ''}`} onClick={() => setTab('approvals')}>
          Pending Approvals {pending.length > 0 && `(${pending.length})`}
        </button>
        <button className={`tab-btn ${tab === 'manage' ? 'active' : ''}`} onClick={() => setTab('manage')}>
          Manage Users
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : tab === 'approvals' ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>UserID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Zone / Branch</th>
                <th>Requested</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={7}>No pending approvals right now.</td>
                </tr>
              )}
              {pending.map((p) => (
                <tr key={p._id}>
                  <td>{p.userId}</td>
                  <td>{p.name}</td>
                  <td>
                    <span className="badge badge-role">{ROLE_LABELS[p.role] || p.role}</span>
                  </td>
                  <td>
                    {p.phone}
                    <br />
                    <small>{p.email}</small>
                  </td>
                  <td>
                    {p.zone?.name || '-'} {p.branch?.name ? `/ ${p.branch.name}` : ''}
                  </td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-group">
                      <button className="btn btn-success btn-sm" onClick={() => handleApprove(p._id)}>
                        Approve
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleReject(p._id)}>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="filter-bar">
            <div className="filter-field">
              <label>Role</label>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All</option>
                {manageableRoles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="filter-field">
              <label>Search</label>
              <input placeholder="Name, UserID, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>UserID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Contact</th>
                  <th>Zone / Branch</th>
                  <th>Status</th>
                  <th>Active</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={8}>No users found.</td>
                  </tr>
                )}
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.userId}</td>
                    <td>{u.name}</td>
                    <td>
                      <span className="badge badge-role">{ROLE_LABELS[u.role] || u.role}</span>
                    </td>
                    <td>
                      {u.phone}
                      <br />
                      <small>{u.email}</small>
                    </td>
                    <td>
                      {u.zone?.name || '-'} {u.branch?.name ? `/ ${u.branch.name}` : ''}
                    </td>
                    <td>
                      <span className={`badge badge-${u.status}`}>{u.status}</span>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-approved' : 'badge-inactive'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>
                          Edit
                        </button>
                        {u.isActive && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(u._id, u.name)}>
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <Modal title={editingId ? 'Edit User' : 'Add User (auto-approved)'} onClose={() => setShowForm(false)}>
          <form className="form-grid" onSubmit={submitForm}>
            {formError && <div className="alert alert-error">{formError}</div>}
            <div>
              <label>Full Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-row-2">
              <div>
                <label>Phone</label>
                <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label>Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label>{editingId ? 'New Password (leave blank to keep current)' : 'Password'}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {!editingId && (
              <div>
                <label>Role</label>
                <select required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {manageableRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {needsZoneField && (
              <div>
                <label>Zone</label>
                <select
                  required
                  value={form.zone}
                  onChange={(e) => setForm({ ...form, zone: e.target.value, branch: '' })}
                >
                  <option value="">Select zone</option>
                  {zones.map((z) => (
                    <option key={z._id} value={z._id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {needsBranchField && form.role !== 'RegionalManager' && (
              <div>
                <label>Branch</label>
                <select required value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                  <option value="">Select branch</option>
                  {(needsZoneField ? branchesForZone(form.zone) : branches).map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
