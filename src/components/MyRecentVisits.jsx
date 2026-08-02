import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function MyRecentVisits({ refreshKey }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/customers/mine')
      .then((res) => setRecords(res.data))
      .finally(() => setLoading(false));
  }, [refreshKey]);

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
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr className="empty-row">
                  <td colSpan={7}>No entries yet - add your first visit above.</td>
                </tr>
              )}
              {records.map((r) => (
                <tr key={r._id}>
                  <td>{r.name}</td>
                  <td>{r.phone}</td>
                  <td style={{ maxWidth: 220 }}>{r.liveLocation?.address || '-'}</td>
                  <td>{r.productName}</td>
                  <td>{new Date(r.visitDate).toLocaleDateString()}</td>
                  <td>{r.nextVisitDate ? new Date(r.nextVisitDate).toLocaleDateString() : '-'}</td>
                  <td>{r.visitType || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
