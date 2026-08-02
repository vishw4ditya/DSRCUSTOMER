import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

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

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Zone</th>
              <th>Branch</th>
              <th>Code</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 && (
              <tr className="empty-row">
                <td colSpan={3}>No branches yet.</td>
              </tr>
            )}
            {branches.map((b) => (
              <tr key={b._id}>
                <td>{b.zone?.name}</td>
                <td>{b.name}</td>
                <td>{b.code || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
