import { useEffect, useState, useCallback } from 'react';
import { getCustomers, deleteCustomer } from '../services/firebase';
import { isDueToday, sortDueTodayFirst } from '../utils/dateUtils';
import { CUSTOMER_TYPES, customerTypeBadgeClass } from '../customerTypes';
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
    customerType: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCustomers();
      let filtered = data || [];

      if (role) {
        filtered = filtered.filter((r) => !r.addedByRole || r.addedByRole === role || r.salespersonRole === role);
      }

      if (filters.search) {
        const term = filters.search.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.customer?.toLowerCase().includes(term) ||
            r.phone?.toLowerCase().includes(term) ||
            r.location?.toLowerCase().includes(term)
        );
      }

      setRecords(sortDueTodayFirst(filtered));
    } catch (err) {
      console.error('[RoleCustomerDataTable] Error loading customer data:', err);
      setError('Failed to load customer visit data');
    } finally {
      setLoading(false);
    }
  }, [filters, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const downloadBlob = (data, mimeType, filename) => {
    const url = window.URL.createObjectURL(new Blob([data], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportCsv = () => {
    const header = 'Customer,Phone,Role,Branch,Location,Status,Date\n';
    const rows = records.map((r) => `"${r.customer}","${r.phone}","${r.addedByRole || role}","${r.branch}","${r.location}","${r.status}","${r.date}"`).join('\n');
    downloadBlob(header + rows, 'text/csv', `${role.toLowerCase()}-data-${Date.now()}.csv`);
  };

  const handleExportPdf = () => {
    const text = `${role} Customer Visit Report\nGenerated on ${new Date().toLocaleDateString()}\n\n` +
      records.map((r) => `${r.customer} (${r.phone}) - ${r.location} | Status: ${r.status}`).join('\n');
    downloadBlob(text, 'text/plain', `${role.toLowerCase()}-report-${Date.now()}.txt`);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete the visit record for "${name}"? This cannot be undone.`)) return;
    try {
      await deleteCustomer(id);
      await loadData();
    } catch (err) {
      console.error('[RoleCustomerDataTable] Delete error:', err);
      setError('Could not delete this record');
    }
  };

  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const isTechnician = role === 'Technician';
  const isSalesperson = role === 'Salesperson';
  const extraColumnCount = isTechnician || isSalesperson ? 1 : 0;

  return (
    <div>
      <div className="panel-header">
        <h2>{role} Visit Records</h2>
        <div className="action-group">
          <button className="btn btn-outline btn-sm" onClick={handleExportCsv}>
            Download CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExportPdf}>
            Download PDF
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-toolbar">
        <input
          className="table-search-input"
          placeholder="Search by customer name, phone, address..."
          value={filters.search}
          onChange={set('search')}
        />
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Branch</th>
              <th>Location</th>
              <th>Visit Details</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>
                  Loading visit records...
                </td>
              </tr>
            )}
            {!loading && records.length === 0 && (
              <tr className="empty-row">
                <td colSpan={7}>No customer visit records found.</td>
              </tr>
            )}
            {!loading &&
              records.map((r) => {
                const recId = r.id || r._id;
                return (
                  <tr key={recId}>
                    <td>
                      <strong>{r.customer}</strong>
                    </td>
                    <td>{r.phone}</td>
                    <td>{r.branch}</td>
                    <td>
                      <CopyableAddress address={r.location} />
                    </td>
                    <td>{r.visitType || r.notes || 'Routine Visit'}</td>
                    <td>{r.date}</td>
                    <td>
                      <div className="action-group">
                        <button className="btn btn-outline btn-sm" onClick={() => setEditingRecord(r)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(recId, r.customer)}>
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
