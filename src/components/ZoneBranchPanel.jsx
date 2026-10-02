import { useEffect, useState, useCallback } from 'react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../roles';
import {
  getZones,
  getBranches,
  addZone,
  addBranch,
  updateZone,
  updateBranch,
  deleteZone,
  deleteBranch,
} from '../services/firebase';

export default function ZoneBranchPanel({ canCreateZones }) {
  const { user: me } = useAuth();
  const isSuperAdmin = me?.role === ROLES.SUPER_ADMIN && me?.status === 'active';
  const isRegionalManager = me?.role === ROLES.REGIONAL_MANAGER && me?.status === 'active';

  const showZoneCreation = canCreateZones || isSuperAdmin;
  const effectiveZoneId = isRegionalManager ? me?.zoneId : null;

  const [zones, setZones] = useState([]);
  const [branches, setBranches] = useState([]);
  const [zoneName, setZoneName] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchZone, setBranchZone] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [renaming, setRenaming] = useState(null);
  const [renameError, setRenameError] = useState('');
  const [renameSaving, setRenameSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [zonesData, branchesData] = await Promise.all([
        getZones(),
        getBranches(effectiveZoneId),
      ]);
      const fetchedZones = zonesData || [];
      const fetchedBranches = branchesData || [];

      setZones(fetchedZones);
      setBranches(fetchedBranches);

      if (effectiveZoneId) {
        setBranchZone(effectiveZoneId);
      } else if (fetchedZones.length > 0) {
        setBranchZone((prev) => prev || (fetchedZones[0].id || fetchedZones[0]._id));
      }
    } catch (err) {
      console.error('[ZoneBranchPanel] Failed to load data:', err);
      setError('Could not fetch zones and branches from database.');
    }
  }, [effectiveZoneId]);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3500);
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    if (!showZoneCreation) {
      setError('Permission denied: Only SuperAdmins can create zones.');
      return;
    }
    setError('');

    const trimmedName = zoneName.trim();
    if (!trimmedName) {
      setError('Please enter a valid Zone name.');
      return;
    }

    setSubmitting(true);
    try {
      await addZone({
        name: trimmedName,
        code: zoneCode.trim() || '',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      setZoneName('');
      setZoneCode('');
      flash(`Zone "${trimmedName}" created successfully!`);
      await load();
    } catch (err) {
      console.error('[ZoneBranchPanel] Create Zone error:', err);
      setError(err.message || 'Could not create zone.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = branchName.trim();
    if (!trimmedName) {
      setError('Please enter a valid Branch name.');
      return;
    }

    const selectedZoneId = isRegionalManager ? me?.zoneId : (branchZone || (zones.length > 0 ? (zones[0].id || zones[0]._id) : null));

    if (!selectedZoneId) {
      setError('Zone is required for creating a branch.');
      return;
    }

    setSubmitting(true);
    try {
      await addBranch({
        name: trimmedName,
        code: branchCode.trim() || '',
        zoneId: selectedZoneId,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      setBranchName('');
      setBranchCode('');
      flash(`Branch "${trimmedName}" created successfully!`);
      await load();
    } catch (err) {
      console.error('[ZoneBranchPanel] Create Branch error:', err);
      setError(err.message || 'Could not create branch.');
    } finally {
      setSubmitting(false);
    }
  };

  const openRename = (type, entity) => {
    if (type === 'zone' && !isSuperAdmin) {
      setError('Permission denied: Only SuperAdmins can edit zones.');
      return;
    }
    setRenameError('');
    setRenaming({
      type,
      id: entity.id || entity._id,
      name: entity.name,
      code: entity.code || '',
    });
  };

  const submitRename = async (e) => {
    e.preventDefault();
    setRenameError('');
    setRenameSaving(true);
    try {
      if (renaming.type === 'zone') {
        if (!isSuperAdmin) throw new Error('Only SuperAdmin can update zones.');
        await updateZone(renaming.id, {
          name: renaming.name.trim(),
          code: renaming.code.trim(),
        });
      } else {
        await updateBranch(renaming.id, {
          name: renaming.name.trim(),
          code: renaming.code.trim(),
        });
      }
      setRenaming(null);
      flash(`${renaming.type === 'zone' ? 'Zone' : 'Branch'} updated successfully!`);
      await load();
    } catch (err) {
      console.error('[ZoneBranchPanel] Rename error:', err);
      setRenameError(err.message || 'Could not save changes.');
    } finally {
      setRenameSaving(false);
    }
  };

  const handleDeleteZone = async (zone) => {
    if (!isSuperAdmin) {
      setError('Permission denied: Only SuperAdmins can delete zones.');
      return;
    }
    const targetId = zone.id || zone._id;
    if (!window.confirm(`Delete zone "${zone.name}"?`)) return;

    setError('');
    try {
      await deleteZone(targetId);
      flash(`Zone "${zone.name}" deleted.`);
      await load();
    } catch (err) {
      console.error('[ZoneBranchPanel] Delete Zone error:', err);
      setError(err.message || 'Could not delete zone.');
    }
  };

  const handleDeleteBranch = async (branch) => {
    const targetId = branch.id || branch._id;
    if (!window.confirm(`Delete branch "${branch.name}"?`)) return;

    setError('');
    try {
      await deleteBranch(targetId);
      flash(`Branch "${branch.name}" deleted.`);
      await load();
    } catch (err) {
      console.error('[ZoneBranchPanel] Delete Branch error:', err);
      setError(err.message || 'Could not delete branch.');
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>{isRegionalManager ? 'Zone Branches' : 'Zones & Branches'}</h2>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-row-2" style={{ alignItems: 'start' }}>
        {showZoneCreation && (
          <form onSubmit={handleCreateZone} className="form-grid">
            <strong>New Zone</strong>
            <div>
              <label>Zone Name</label>
              <input
                required
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g. North Zone"
                disabled={submitting}
              />
            </div>
            <div>
              <label>Code (optional)</label>
              <input
                value={zoneCode}
                onChange={(e) => setZoneCode(e.target.value)}
                placeholder="e.g. NZ"
                disabled={submitting}
              />
            </div>
            <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Zone'}
            </button>
          </form>
        )}

        <form onSubmit={handleCreateBranch} className="form-grid">
          <strong>New Branch</strong>
          {!isRegionalManager && (
            <div>
              <label>Zone</label>
              <select
                required
                value={branchZone}
                onChange={(e) => setBranchZone(e.target.value)}
                disabled={submitting}
              >
                {zones.length === 0 && <option value="">No zones available</option>}
                {zones.map((z) => (
                  <option key={z.id || z._id} value={z.id || z._id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {isRegionalManager && (
            <div className="alert alert-info" style={{ fontSize: 13, padding: '8px 12px' }}>
              Assigning to Zone: <strong>{zones.find((z) => (z.id || z._id) === me?.zoneId)?.name || me?.zoneId}</strong>
            </div>
          )}
          <div>
            <label>Branch Name</label>
            <input
              required
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="e.g. Jaipur Main Branch"
              disabled={submitting}
            />
          </div>
          <div>
            <label>Code (optional)</label>
            <input
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              placeholder="e.g. JPR"
              disabled={submitting}
            />
          </div>
          <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Branch'}
          </button>
        </form>
      </div>

      <hr style={{ margin: '22px 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />

      {showZoneCreation && (
        <>
          <h3 style={{ fontSize: 15, margin: '0 0 12px' }}>Zones</h3>
          <div className="table-scroll" style={{ marginBottom: 24 }}>
            <table>
              <thead>
                <tr>
                  <th>Zone Name</th>
                  <th>Code</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {zones.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={3}>No zones yet. Create a zone above.</td>
                  </tr>
                )}
                {zones.map((z) => (
                  <tr key={z.id || z._id}>
                    <td>{z.name}</td>
                    <td>{z.code || '-'}</td>
                    <td>
                      <div className="action-group">
                        <button className="btn btn-outline btn-sm" onClick={() => openRename('zone', z)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteZone(z)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h3 style={{ fontSize: 15, margin: '0 0 12px' }}>
        {isRegionalManager ? 'Branches in Your Assigned Zone' : 'Branches'}
      </h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Zone</th>
              <th>Branch</th>
              <th>Code</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 && (
              <tr className="empty-row">
                <td colSpan={4}>No branches found. Create a branch above.</td>
              </tr>
            )}
            {branches.map((b) => {
              const parentZone = zones.find(
                (z) => (z.id || z._id) === (b.zoneId || b.zone?._id || b.zone)
              );
              return (
                <tr key={b.id || b._id}>
                  <td>{parentZone?.name || (typeof b.zone === 'object' ? b.zone?.name : b.zone) || '-'}</td>
                  <td>{b.name}</td>
                  <td>{b.code || '-'}</td>
                  <td>
                    <div className="action-group">
                      <button className="btn btn-outline btn-sm" onClick={() => openRename('branch', b)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBranch(b)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {renaming && (
        <Modal title={`Edit ${renaming.type === 'zone' ? 'Zone' : 'Branch'}`} onClose={() => setRenaming(null)}>
          <form className="form-grid" onSubmit={submitRename}>
            {renameError && <div className="alert alert-error">{renameError}</div>}
            <div>
              <label>{renaming.type === 'zone' ? 'Zone' : 'Branch'} Name</label>
              <input
                required
                value={renaming.name}
                onChange={(e) => setRenaming((r) => ({ ...r, name: e.target.value }))}
                disabled={renameSaving}
              />
            </div>
            <div>
              <label>Code (optional)</label>
              <input
                value={renaming.code}
                onChange={(e) => setRenaming((r) => ({ ...r, code: e.target.value }))}
                disabled={renameSaving}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setRenaming(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={renameSaving}>
                {renameSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
