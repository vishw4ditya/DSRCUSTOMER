import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import Modal from './Modal';

export default function ZoneBranchPanel({ canCreateZones }) {
  const [zones, setZones] = useState([]);
  const [branches, setBranches] = useState([]);
  const [zoneName, setZoneName] = useState('');
  const [zoneCode, setZoneCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchZone, setBranchZone] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Rename modal state - shared for both zones and branches, distinguished by `type`
  const [renaming, setRenaming] = useState(null); // { type: 'zone' | 'branch', id, name, code }
  const [renameError, setRenameError] = useState('');
  const [renameSaving, setRenameSaving] = useState(false);

  const load = useCallback(async () => {
    const [zonesRes, branchesRes] = await Promise.all([api.get('/zones'), api.get('/branches')]);
    setZones(zonesRes.data);
    setBranches(branchesRes.data);
    if (!branchZone && zonesRes.data.length) setBranchZone(zonesRes.data[0]._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const createZone = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/zones', { name: zoneName, code: zoneCode });
      setZoneName('');
      setZoneCode('');
      flash('Zone created');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create zone');
    }
  };

  const createBranch = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/branches', { name: branchName, code: branchCode, zone: branchZone || undefined });
      setBranchName('');
      setBranchCode('');
      flash('Branch created');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create branch');
    }
  };

  const openRename = (type, entity) => {
    setRenameError('');
    setRenaming({ type, id: entity._id, name: entity.name, code: entity.code || '' });
  };

  const submitRename = async (e) => {
    e.preventDefault();
    setRenameError('');
    setRenameSaving(true);
    try {
      const endpoint = renaming.type === 'zone' ? `/zones/${renaming.id}` : `/branches/${renaming.id}`;
      await api.put(endpoint, { name: renaming.name, code: renaming.code });
      setRenaming(null);
      flash(`${renaming.type === 'zone' ? 'Zone' : 'Branch'} updated`);
      load();
    } catch (err) {
      setRenameError(err.response?.data?.message || 'Could not save changes');
    } finally {
      setRenameSaving(false);
    }
  };

  const deleteZone = async (zone) => {
    if (
      !window.confirm(
        `Delete zone "${zone.name}"? Any branches, managers, or staff still assigned to it will remain in the system but the zone will no longer be selectable.`
      )
    )
      return;
    setError('');
    try {
      await api.delete(`/zones/${zone._id}`);
      flash('Zone deleted');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete zone');
    }
  };

  const deleteBranch = async (branch) => {
    if (
      !window.confirm(
        `Delete branch "${branch.name}"? Any staff still assigned to it will remain in the system but the branch will no longer be selectable.`
      )
    )
      return;
    setError('');
    try {
      await api.delete(`/branches/${branch._id}`);
      flash('Branch deleted');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete branch');
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Zones &amp; Branches</h2>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-row-2" style={{ alignItems: 'start' }}>
        {canCreateZones && (
          <form onSubmit={createZone} className="form-grid">
            <strong>New Zone</strong>
            <div>
              <label>Zone Name</label>
              <input required value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="e.g. North Zone" />
            </div>
            <div>
              <label>Code (optional)</label>
              <input value={zoneCode} onChange={(e) => setZoneCode(e.target.value)} placeholder="e.g. NZ" />
            </div>
            <button className="btn btn-primary btn-sm" type="submit">
              Create Zone
            </button>
          </form>
        )}

        <form onSubmit={createBranch} className="form-grid">
          <strong>New Branch</strong>
          {canCreateZones && (
            <div>
              <label>Zone</label>
              <select required value={branchZone} onChange={(e) => setBranchZone(e.target.value)}>
                {zones.map((z) => (
                  <option key={z._id} value={z._id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label>Branch Name</label>
            <input required value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="e.g. Jaipur Branch" />
          </div>
          <div>
            <label>Code (optional)</label>
            <input value={branchCode} onChange={(e) => setBranchCode(e.target.value)} placeholder="e.g. JPR" />
          </div>
          <button className="btn btn-primary btn-sm" type="submit">
            Create Branch
          </button>
        </form>
      </div>

      <hr style={{ margin: '22px 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />

      {canCreateZones && (
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
                    <td colSpan={3}>No zones yet.</td>
                  </tr>
                )}
                {zones.map((z) => (
                  <tr key={z._id}>
                    <td>{z.name}</td>
                    <td>{z.code || '-'}</td>
                    <td>
                      <div className="action-group">
                        <button className="btn btn-outline btn-sm" onClick={() => openRename('zone', z)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteZone(z)}>
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

      <h3 style={{ fontSize: 15, margin: '0 0 12px' }}>Branches</h3>
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
                <td colSpan={4}>No branches yet.</td>
              </tr>
            )}
            {branches.map((b) => (
              <tr key={b._id}>
                <td>{b.zone?.name}</td>
                <td>{b.name}</td>
                <td>{b.code || '-'}</td>
                <td>
                  <div className="action-group">
                    <button className="btn btn-outline btn-sm" onClick={() => openRename('branch', b)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteBranch(b)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
              />
            </div>
            <div>
              <label>Code (optional)</label>
              <input value={renaming.code} onChange={(e) => setRenaming((r) => ({ ...r, code: e.target.value }))} />
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
