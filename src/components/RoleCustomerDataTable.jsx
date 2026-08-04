import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { isDueToday, sortDueTodayFirst } from '../utils/dateUtils';
import CustomerEditModal from './CustomerEditModal';
import CopyableAddress from './CopyableAddress';

export default function RoleCustomerDataTable({ role, showZoneBranchFilters, zones, branches }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);

  const [filters, setFilters] = useState({
    zone: '',
    branch: '',
    productName: '',
    visitType: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { addedByRole: role };
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const res = await api.get('/customers', { params });
      setRecords(sortDueTodayFirst(res.data));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customer data');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async () => {
    const params = { addedByRole: role };
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    const res = await api.get('/customers/export', { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${role.toLowerCase()}-data-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete the visit record for "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/customers/${id}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this record');
    }
  };

  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const isTechnician = role === 'Technician';

  return (
    <div>
      <div className="panel-header">
        <h2>{role} Visit Records</h2>
        <button className="btn btn-primary btn-sm" onClick={handleExport}>
          Download {role} CSV
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filter-bar">
        {showZoneBranchFilters && (
          <div className="filter-field">
            <label>Zone</label>
            <select value={filters.zone} onChange={set('zone')}>
              <option value="">All</option>
              {zones.map((z) => (
                <option key={z._id} value={z._id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="filter-field">
          <label>Branch</label>
          <select value={filters.branch} onChange={set('branch')}>
            <option value="">All</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        {isTechnician && (
          <div className="filter-field">
            <label>Visit Type</label>
            <select value={filters.visitType} onChange={set('visitType')}>
              <option value="">All</option>
              <option value="Installation">Installation</option>
              <option value="Service">Service</option>
            </select>
          </div>
        )}
        <div className="filter-field">
          <label>Product</label>
          <input placeholder="Product name" value={filters.productName} onChange={set('productName')} />
        </div>
        <div className="filter-field">
          <label>From</label>
          <input type="date" value={filters.dateFrom} onChange={set('dateFrom')} />
        </div>
        <div className="filter-field">
          <label>To</label>
          <input type="date" value={filters.dateTo} onChange={set('dateTo')} />
        </div>
        <div className="filter-field">
          <label>Search</label>
          <input placeholder="Customer name / phone" value={filters.search} onChange={set('search')} />
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Product</th>
                <th>Visit Date</th>
                <th>Next Visit</th>
                {isTechnician && <th>Type</th>}
                <th>Added By</th>
                <th>Zone / Branch</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={isTechnician ? 10 : 9}>No {role.toLowerCase()} records match these filters.</td>
                </tr>
              )}
              {records.map((r) => (
                <tr key={r._id} className={isDueToday(r.nextVisitDate) ? 'row-due-today' : ''}>
                  <td>{r.name}</td>
                  <td>{r.phone}</td>
                  <td style={{ maxWidth: 220 }}>
                    <CopyableAddress address={r.liveLocation?.address} />
                  </td>
                  <td>{r.productName}</td>
                  <td>{new Date(r.visitDate).toLocaleDateString()}</td>
                  <td>
                    {r.nextVisitDate ? new Date(r.nextVisitDate).toLocaleDateString() : '-'}
                    {isDueToday(r.nextVisitDate) && <span className="due-today-badge">Due Today</span>}
                  </td>
                  {isTechnician && <td>{r.visitType || '-'}</td>}
                  <td>
                    {r.addedBy?.name} <small>({r.addedBy?.userId})</small>
                  </td>
                  <td>
                    {r.zone?.name} / {r.branch?.name}
                  </td>
                  <td>
                    <div className="action-group">
                      <button className="btn btn-outline btn-sm" onClick={() => setEditingRecord(r)}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id, r.name)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingRecord && (
        <CustomerEditModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaved={() => {
            setEditingRecord(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
