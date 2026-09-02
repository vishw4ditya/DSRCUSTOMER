import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { isDueToday, sortDueTodayFirst } from '../utils/dateUtils';
import { customerTypeBadgeClass } from '../customerTypes';
import CustomerEditModal from './CustomerEditModal';
import CopyableAddress from './CopyableAddress';

export default function MyRecentVisits({ refreshKey }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    return api
      .get('/customers/mine')
      .then((res) => setRecords(sortDueTodayFirst(res.data)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>My Recent Entries</h2>
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
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={8}>No entries yet - add your first visit above.</td>
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
                  <td>
                    {r.addedByRole === 'Salesperson' && r.customerType ? (
                      <span className={`badge ${customerTypeBadgeClass(r.customerType)}`}>{r.customerType}</span>
                    ) : (
                      r.visitType || '-'
                    )}
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditingRecord(r)}>
                      Edit
                    </button>
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
            load();
          }}
        />
      )}
    </div>
  );
}
