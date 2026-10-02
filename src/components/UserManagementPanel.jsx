import { useEffect, useState, useCallback } from 'react';
import Modal from './Modal';
import { ROLE_LABELS, ALL_ROLES, ROLES } from '../roles';
import { useAuth } from '../context/AuthContext';
import {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  disableUser,
  enableUser,
  updateUserProfile,
  createNewUserByAdmin,
  getZones,
  getBranches,
  migrateExistingUsersUserIds,
} from '../services/firebase';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  password: '',
  role: '',
  status: 'pending',
  zone: '',
  branch: '',
};

export default function UserManagementPanel({ manageableRoles, targetRole = null }) {
  const { user: me } = useAuth();
  const isSuperAdmin = me?.role === ROLES.SUPER_ADMIN && me?.status === 'active';
  const isRegionalManager = me?.role === ROLES.REGIONAL_MANAGER && me?.status === 'active';
  const isBranchHead = me?.role === ROLES.BRANCH_HEAD && me?.status === 'active';

  // Allowed roles for user creation
  const availableRoles = isSuperAdmin
    ? ALL_ROLES
    : isRegionalManager
    ? [ROLES.BRANCH_HEAD, ROLES.TECHNICIAN, ROLES.SALESPERSON]
    : [ROLES.SALESPERSON, ROLES.TECHNICIAN];

  const [tab, setTab] = useState(isBranchHead || isRegionalManager ? 'approvals' : 'users');
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [roleFilter, setRoleFilter] = useState(targetRole || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (targetRole) {
      setRoleFilter(targetRole);
    } else {
      setRoleFilter('');
    }
  }, [targetRole]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {};
      if (roleFilter) filters.role = roleFilter;
      if (statusFilter) filters.status = statusFilter;

      // Scope filters according to caller role
      const effectiveZoneId = isRegionalManager || isBranchHead ? me?.zoneId : null;
      const effectiveBranchId = isBranchHead ? me?.branchId : null;

      if (effectiveBranchId) {
        filters.branchId = effectiveBranchId;
      } else if (effectiveZoneId) {
        filters.zoneId = effectiveZoneId;
      }

      const [pendingData, usersData, zonesData, branchesData] = await Promise.all([
        getPendingUsers(effectiveZoneId, effectiveBranchId),
        getAllUsers(filters),
        getZones(),
        getBranches(effectiveZoneId),
      ]);

      setPending(pendingData || []);
      setUsers(usersData || []);
      setZones(zonesData || []);
      setBranches(branchesData || []);

      if (isSuperAdmin) {
        migrateExistingUsersUserIds().catch(console.error);
      }
    } catch (err) {
      console.error('[UserManagementPanel] Load error:', err);
      setError(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, me, isRegionalManager, isBranchHead, isSuperAdmin]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4500);
  };

  const handleApprove = async (id) => {
    try {
      await approveUser(id, me);
      flash('Account approved successfully');
      await loadAll();
    } catch (err) {
      console.error('[UserManagementPanel] Approval error:', err);
      setError(err.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection (optional):') || '';
    try {
      await rejectUser(id, reason, me);
      flash('Account rejected');
      await loadAll();
    } catch (err) {
      console.error('[UserManagementPanel] Reject error:', err);
      setError(err.message || 'Rejection failed');
    }
  };

  const handleDisable = async (id, name) => {
    if (!window.confirm(`Disable account for "${name}"? They will lose application access immediately.`)) return;
    try {
      await disableUser(id, me);
      flash(`User account for "${name}" disabled.`);
      await loadAll();
    } catch (err) {
      console.error('[UserManagementPanel] Disable error:', err);
      setError(err.message || 'Disabling user failed');
    }
  };

  const handleEnable = async (id, name) => {
    try {
      await enableUser(id, me);
      flash(`User account for "${name}" enabled.`);
      await loadAll();
    } catch (err) {
      console.error('[UserManagementPanel] Enable error:', err);
      setError(err.message || 'Enabling user failed');
    }
  };

  const openCreate = () => {
    setEditingId(null);
    const initialRole = targetRole || availableRoles[0] || ROLES.SALESPERSON;
    setForm({
      ...emptyForm,
      role: initialRole,
      status: isSuperAdmin ? 'active' : 'pending',
      zone: isBranchHead || isRegionalManager ? me?.zoneId : '',
      branch: isBranchHead ? me?.branchId : '',
      password: '',
    });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditingId(u.uid || u.id);
    setForm({
      name: u.name || '',
      phone: u.phone || '',
      email: u.email || '',
      password: '',
      role: u.role || ROLES.SALESPERSON,
      status: u.status || 'active',
      zone: u.zoneId || (typeof u.zone === 'object' ? u.zone?._id : u.zone) || '',
      branch: u.branchId || (typeof u.branch === 'object' ? u.branch?._id : u.branch) || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    setForm((f) => ({
      ...f,
      role: selectedRole,
      zone: selectedRole === ROLES.SUPER_ADMIN ? '' : (isRegionalManager || isBranchHead ? me?.zoneId : f.zone),
      branch: selectedRole === ROLES.SUPER_ADMIN ? '' : (isBranchHead ? me?.branchId : f.branch),
    }));
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.role) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (!editingId && (!form.password || form.password.trim().length < 8)) {
      setFormError('Initial password is required (minimum 8 characters).');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // Updating existing profile
        const payload = {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          role: form.role,
          status: form.status,
          isActive: form.status === 'active',
          zoneId: form.role === ROLES.SUPER_ADMIN ? null : (isBranchHead || isRegionalManager ? me?.zoneId : (form.zone || null)),
          branchId: form.role === ROLES.SUPER_ADMIN ? null : (isBranchHead ? me?.branchId : (form.branch || null)),
        };
        await updateUserProfile(editingId, payload);
        flash(`User profile for "${form.name}" updated successfully.`);
      } else {
        // Creating new user safely via secondary auth instance
        const payload = {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          password: form.password.trim(),
          role: form.role,
          status: isSuperAdmin ? (form.status || 'active') : 'pending',
          zoneId: isBranchHead || isRegionalManager ? me?.zoneId : (form.zone || null),
          branchId: isBranchHead ? me?.branchId : (form.branch || null),
        };
        const result = await createNewUserByAdmin(payload, me);
        flash(
          `Staff member created successfully! User ID: ${result.userId || 'Generated'}`
        );
        setForm(emptyForm);
      }
      setShowForm(false);
      await loadAll();
    } catch (err) {
      console.error('[UserManagementPanel] Submit form error:', err);
      setFormError(err.message || 'Could not save user profile');
    } finally {
      setSaving(false);
    }
  };

  // Branches filtered strictly by zone for forms
  const activeZoneId = isRegionalManager || isBranchHead ? me?.zoneId : form.zone;
  const availableBranchesForZone = branches.filter((b) => {
    if (!activeZoneId) return true;
    const bZoneId = b.zoneId || (typeof b.zone === 'object' ? b.zone?._id : b.zone);
    return bZoneId === activeZoneId;
  });

  // Filter pending approvals by targetRole if specified
  const filteredPending = pending.filter((p) => {
    if (targetRole && p.role !== targetRole) return false;
    return true;
  });

  // Filter users list based on targetRole, status, search, zone, branch
  const filteredUsers = users.filter((u) => {
    if (targetRole && u.role !== targetRole) return false;
    if (isBranchHead && u.branchId !== me?.branchId) return false;
    if (isRegionalManager && u.zoneId !== me?.zoneId) return false;

    if (search) {
      const term = search.toLowerCase();
      const match =
        u.userId?.toLowerCase().includes(term) ||
        u.name?.toLowerCase().includes(term) ||
        u.phone?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term);
      if (!match) return false;
    }
    return true;
  });

  const branchObj = branches.find((b) => (b.id || b._id) === me?.branchId);
  const zoneObj = zones.find((z) => (z.id || z._id) === me?.zoneId);

  const isAuthOnlyModule = !targetRole;

  const panelTitle = targetRole
    ? `${ROLE_LABELS[targetRole] || targetRole} Module`
    : isBranchHead
    ? 'Branch Staff Authentication'
    : 'User Authentication Registry';

  const panelDescription = targetRole
    ? `Dedicated module to view, add, and manage ${ROLE_LABELS[targetRole] || targetRole} accounts separately.`
    : isBranchHead
    ? `Scoped to Branch: ${branchObj?.name || me?.branchId || 'Assigned Branch'} (${zoneObj?.name || me?.zoneId || 'Assigned Zone'})`
    : isRegionalManager
    ? `Scoped to Zone: ${zoneObj?.name || me?.zoneId || 'Assigned Zone'}`
    : 'System-wide authentication credentials (name, email, phone, role, authPassword, userId & status) for Firebase Authentication.';

  const addButtonText = targetRole
    ? `+ Add ${ROLE_LABELS[targetRole] || targetRole}`
    : '+ Add User Credentials';

  return (
    <div className="panel">
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>{panelTitle}</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
            {panelDescription}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={`btn btn-sm ${tab === 'approvals' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab('approvals')}
          >
            Pending Approvals ({filteredPending.length})
          </button>
          <button
            className={`btn btn-sm ${tab === 'users' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab('users')}
          >
            {targetRole ? ROLE_LABELS[targetRole] : isBranchHead ? 'Branch Staff' : isRegionalManager ? 'Zone Users' : 'All Users'} ({filteredUsers.length})
          </button>
          {(isSuperAdmin || isRegionalManager || isBranchHead) && (
            <button className="btn btn-primary btn-sm" onClick={openCreate}>
              {addButtonText}
            </button>
          )}
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {tab === 'approvals' ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Requested Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center' }}>
                    Loading pending applications...
                  </td>
                </tr>
              )}
              {!loading && pending.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={5}>
                    {isBranchHead
                      ? 'No pending approval requests in your branch.'
                      : 'No pending approval requests.'}
                  </td>
                </tr>
              )}
              {!loading &&
                pending.map((p) => {
                  const targetId = p.uid || p.id;
                  return (
                    <tr key={targetId}>
                      <td>
                        <strong>{p.name}</strong>
                      </td>
                      <td>{p.phone}</td>
                      <td>{p.email}</td>
                      <td>
                        <span className="user-role-tag">{ROLE_LABELS[p.role] || p.role}</span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button className="btn btn-primary btn-sm" onClick={() => handleApprove(targetId)}>
                            Approve
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleReject(targetId)}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <div className="table-toolbar" style={{ marginBottom: 16 }}>
            <input
              className="table-search-input"
              placeholder="Search by User ID, name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  {!isAuthOnlyModule && !isBranchHead && <th>Zone</th>}
                  {!isAuthOnlyModule && !isBranchHead && <th>Branch</th>}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={isAuthOnlyModule ? 6 : isBranchHead ? 6 : 8} style={{ textAlign: 'center' }}>
                      Loading user accounts...
                    </td>
                  </tr>
                )}
                {!loading && filteredUsers.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={isAuthOnlyModule ? 6 : isBranchHead ? 6 : 8}>No matching staff accounts found.</td>
                  </tr>
                )}
                {!loading &&
                  filteredUsers.map((u) => {
                    const targetId = u.uid || u.id;
                    const uZoneObj = zones.find((z) => (z.id || z._id) === (u.zoneId || u.zone));
                    const uBranchObj = branches.find((b) => (b.id || b._id) === (u.branchId || u.branch));
                    const isUserSuperAdmin = u.role === ROLES.SUPER_ADMIN;

                    return (
                      <tr key={targetId}>
                        <td>
                          <span className="user-id-badge" style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-primary, #2563eb)' }}>
                            {u.userId || '-'}
                          </span>
                        </td>
                        <td>
                          <strong>{u.name}</strong>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phone}</td>
                        <td>
                          <span className={`user-role-tag ${isUserSuperAdmin ? 'role-superadmin' : ''}`}>
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        </td>
                        {!isAuthOnlyModule && !isBranchHead && <td>{isUserSuperAdmin ? 'Global' : (uZoneObj?.name || u.zoneId || '-')}</td>}
                        {!isAuthOnlyModule && !isBranchHead && <td>{isUserSuperAdmin ? 'Global' : (uBranchObj?.name || u.branchId || '-')}</td>}
                        <td>
                          <span className={`status-pill ${u.status === 'active' ? 'active' : 'disabled'}`}>
                            {u.status || 'active'}
                          </span>
                        </td>
                        <td>
                          <div className="action-group">
                            <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>
                              Edit
                            </button>
                            {u.status === 'active' ? (
                              <button className="btn btn-danger btn-sm" onClick={() => handleDisable(targetId, u.name)}>
                                Disable
                              </button>
                            ) : (
                              <button className="btn btn-primary btn-sm" onClick={() => handleEnable(targetId, u.name)}>
                                Enable
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <Modal title={editingId ? 'Edit User Profile' : 'Add New Staff Member'} onClose={() => setShowForm(false)}>
          <form className="form-grid" onSubmit={submitForm}>
            {formError && <div className="alert alert-error">{formError}</div>}

            <div>
              <label>Full Name</label>
              <input
                required
                placeholder="e.g. Ramesh Kumar"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                disabled={saving}
              />
            </div>

            <div className="form-row-2">
              <div>
                <label>Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="e.g. ramesh@company.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <div>
                <label>Phone Number</label>
                <input
                  required
                  placeholder="e.g. +919876543210"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  disabled={saving}
                />
              </div>
            </div>

            {!editingId && (
              <div>
                <label>Initial Password (min 8 chars)</label>
                <input
                  required
                  type="password"
                  placeholder="Set account password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  disabled={saving}
                />
              </div>
            )}

            <div className="form-row-2">
              <div>
                <label>Role</label>
                <select
                  required
                  value={form.role}
                  onChange={handleRoleChange}
                  disabled={saving || Boolean(targetRole && !editingId)}
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Account Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  disabled={saving || !isSuperAdmin} // BranchHead and RegionalManager created users start as pending
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            {isBranchHead && (
              <div className="alert alert-info" style={{ fontSize: 13, padding: '8px 12px' }}>
                Branch: <strong>{branchObj?.name || me?.branchId}</strong> &middot; Zone: <strong>{zoneObj?.name || me?.zoneId}</strong> (Automatically assigned to your branch)
              </div>
            )}

            {!isAuthOnlyModule && !isBranchHead && !isRegionalManager && form.role !== ROLES.SUPER_ADMIN && (
              <div>
                <label>Zone</label>
                <select
                  required
                  value={form.zone}
                  onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value, branch: '' }))}
                  disabled={saving}
                >
                  <option value="">Select zone</option>
                  {zones.map((z) => (
                    <option key={z.id || z._id} value={z.id || z._id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!isAuthOnlyModule && !isBranchHead && form.role !== ROLES.SUPER_ADMIN && (
              <div>
                <label>Branch</label>
                <select
                  required
                  value={form.branch}
                  onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                  disabled={saving || (!isRegionalManager && !form.zone)}
                >
                  <option value="">Select branch</option>
                  {availableBranchesForZone.map((b) => (
                    <option key={b.id || b._id} value={b.id || b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
