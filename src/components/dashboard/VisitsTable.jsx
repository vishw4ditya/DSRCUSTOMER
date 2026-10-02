import { useState } from 'react';
import Icon from '../common/Icons';
import CopyableAddress from '../CopyableAddress';
import { customerTypeBadgeClass } from '../../customerTypes';

export default function VisitsTable({ visits = [], onSelectVisit }) {
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredVisits = filterStatus === 'All'
    ? visits
    : visits.filter((v) => v.status.toLowerCase() === filterStatus.toLowerCase());

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return 'status-badge-completed';
      case 'Pending': return 'status-badge-pending';
      case 'Follow-up': return 'status-badge-followup';
      case 'Cancelled': return 'status-badge-cancelled';
      default: return 'status-badge-pending';
    }
  };

  return (
    <div className="saas-panel">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Recent Customer Visits</h2>
          <p className="panel-sub">Real-time daily service and field sales visit logs</p>
        </div>

        <div className="table-filter-tabs">
          {['All', 'Completed', 'Pending', 'Follow-up', 'Cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              className={`filter-chip ${filterStatus === st ? 'active' : ''}`}
              onClick={() => setFilterStatus(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="table-scroll">
        <table className="saas-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Salesperson / Staff</th>
              <th>Branch</th>
              <th>Location</th>
              <th>Visit Status</th>
              <th>Lead Temperature</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisits.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={8}>
                  {visits.length === 0 ? 'No recent visits found.' : `No visits found matching status "${filterStatus}"`}
                </td>
              </tr>
            ) : (
              filteredVisits.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div className="customer-cell-info">
                      <strong>{v.customer}</strong>
                      <small>{v.phone}</small>
                    </div>
                  </td>
                  <td>
                    <div className="staff-cell-info">
                      <span>{v.salesperson}</span>
                      <small className="staff-role-badge">{v.salespersonRole}</small>
                    </div>
                  </td>
                  <td>{v.branch}</td>
                  <td style={{ maxWidth: 220 }}>
                    <CopyableAddress address={v.location} />
                  </td>
                  <td>
                    <span className={`status-pill ${getStatusBadge(v.status)}`}>
                      {v.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${customerTypeBadgeClass(v.leadTemperature)}`}>
                      {v.leadTemperature}
                    </span>
                  </td>
                  <td>{new Date(v.date).toLocaleDateString()}</td>
                  <td>
                    <div className="action-group">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => onSelectVisit && onSelectVisit(v)}
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
