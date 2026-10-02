import { useState } from 'react';
import Icon from '../common/Icons';

export default function NotificationPopover({ isOpen, onClose, notifications = [], onMarkRead, onDismiss }) {
  const [localList, setLocalList] = useState(null);
  const items = localList !== null ? localList : notifications;

  if (!isOpen) return null;

  const markAllAsRead = () => {
    if (onMarkRead) {
      onMarkRead();
    } else {
      setLocalList(items.map((n) => ({ ...n, unread: false })));
    }
  };

  const clearNotification = (id) => {
    if (onDismiss) {
      onDismiss(id);
    } else {
      setLocalList(items.filter((n) => n.id !== id));
    }
  };

  const getBadgeClass = (color) => {
    switch (color) {
      case 'red': return 'badge-notif-red';
      case 'orange': return 'badge-notif-orange';
      case 'blue': return 'badge-notif-blue';
      case 'green': return 'badge-notif-green';
      default: return 'badge-notif-blue';
    }
  };

  return (
    <div className="notif-popover">
      <div className="notif-header">
        <div className="notif-title">
          <h3>Notifications</h3>
          <span className="notif-count-badge">
            {items.filter((n) => n.unread).length} new
          </span>
        </div>
        <div className="notif-actions">
          <button type="button" className="btn-text-sm" onClick={markAllAsRead}>
            Mark all read
          </button>
          <button type="button" className="icon-btn-close" onClick={onClose} aria-label="Close notifications">
            <Icon name="x" size={16} />
          </button>
        </div>
      </div>

      <div className="notif-list">
        {items.length === 0 ? (
          <div className="notif-empty">No new notifications</div>
        ) : (
          items.map((n) => (
            <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`}>
              <span className={`notif-dot ${getBadgeClass(n.badgeColor)}`} />
              <div className="notif-body">
                <div className="notif-item-header">
                  <strong>{n.title}</strong>
                  <span className="notif-time">{n.timestamp}</span>
                </div>
                <p className="notif-msg">{n.message}</p>
              </div>
              <button
                type="button"
                className="notif-remove-btn"
                onClick={() => clearNotification(n.id)}
                title="Dismiss"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="notif-footer">
        <small className="fcm-status-text">Connected to FCM Realtime Engine</small>
      </div>
    </div>
  );
}
