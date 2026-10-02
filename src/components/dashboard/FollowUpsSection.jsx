import { useState } from 'react';
import Icon from '../common/Icons';
import { customerTypeBadgeClass } from '../../customerTypes';

export default function FollowUpsSection({ followUps = [] }) {
  const [activeTab, setActiveTab] = useState('Due Today');

  const groups = ['Due Today', 'Due Tomorrow', 'Overdue'];

  const filteredItems = followUps.filter((item) => item.timeGroup === activeTab);
  const dueTodayCount = followUps.filter((item) => item.timeGroup === 'Due Today').length;

  return (
    <div className="saas-panel followups-panel">
      <div className="panel-head">
        <div className="title-with-badge">
          <h2 className="panel-title">Today's Follow-ups</h2>
          {dueTodayCount > 0 && (
            <span className="due-urgent-badge">
              <Icon name="bell" size={12} /> {dueTodayCount} Urgent Due Today
            </span>
          )}
        </div>

        <div className="table-filter-tabs">
          {groups.map((group) => (
            <button
              key={group}
              type="button"
              className={`filter-chip ${group === 'Due Today' ? 'chip-due-today' : ''} ${activeTab === group ? 'active' : ''}`}
              onClick={() => setActiveTab(group)}
            >
              {group} ({followUps.filter((i) => i.timeGroup === group).length})
            </button>
          ))}
        </div>
      </div>

      <div className="followup-cards-grid">
        {filteredItems.length === 0 ? (
          <div className="followup-empty">
            <Icon name="check-circle" size={32} />
            <p>{activeTab === 'Due Today' ? 'No follow-ups due today.' : `No follow-ups listed under "${activeTab}"`}</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`followup-card ${item.timeGroup === 'Due Today' ? 'card-urgent-due' : ''}`}
            >
              <div className="followup-card-header">
                <div>
                  <h3 className="followup-customer-name">{item.customer}</h3>
                  <span className="followup-phone">{item.phone}</span>
                </div>
                <span className={`badge ${customerTypeBadgeClass(item.leadTemperature)}`}>
                  {item.leadTemperature} Lead
                </span>
              </div>

              <p className="followup-notes">{item.notes}</p>

              <div className="followup-meta-grid">
                <div>
                  <small>Assigned Staff</small>
                  <strong>{item.assignedTo}</strong>
                </div>
                <div>
                  <small>Branch</small>
                  <strong>{item.branch}</strong>
                </div>
                <div>
                  <small>Due Date</small>
                  <strong className={item.timeGroup === 'Due Today' ? 'text-due-today' : ''}>
                    {new Date(item.dueDate).toLocaleDateString()}
                  </strong>
                </div>
                <div>
                  <small>Status</small>
                  <span className={`followup-status-pill ${item.status === 'Action Required' ? 'pill-action-req' : 'pill-pending'}`}>
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="followup-card-actions">
                <a href={`tel:${item.phone.replace(/\s+/g, '')}`} className="btn btn-primary btn-sm">
                  Call Customer
                </a>
                <button type="button" className="btn btn-outline btn-sm">
                  Log Result
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
