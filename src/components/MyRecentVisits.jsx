import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCustomers } from '../services/firebase';
import { isDueToday, sortDueTodayFirst } from '../utils/dateUtils';
import { customerTypeBadgeClass } from '../customerTypes';
import CustomerEditModal from './CustomerEditModal';
import CopyableAddress from './CopyableAddress';

export default function MyRecentVisits({ refreshKey }) {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      let filtered = data || [];

      if (user?.uid) {
        const userSpecific = filtered.filter((r) => r.addedByUserId === user.uid);
        if (userSpecific.length > 0) {
          filtered = userSpecific;
        }
      }

      setRecords(sortDueTodayFirst(filtered));
    } catch (err) {
      console.error('[MyRecentVisits] Error loading entries:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>My Recent Entries</h2>
      </div>
      {loading ? (
        <p>Loading recent entries...</p>
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
              {records.map((r) => {
                const recId = r.id || r._id;
                const custName = r.customer || r.name;
                const custAddr = r.location || r.address || r.liveLocation?.address;
                const vDate = r.date || r.visitDate;
                return (
                  <tr key={recId} className={isDueToday(r.nextVisitDate) ? 'row-due-today' : ''}>
                    <td>{custName}</td>
                    <td>{r.phone}</td>
                    <td style={{ maxWidth: 220 }}>
                      <CopyableAddress address={custAddr} />
                    </td>
                    <td>{r.productName || 'Purifier'}</td>
                    <td>{vDate ? new Date(vDate).toLocaleDateString() : '-'}</td>
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
                );
              })}
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
