import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, ROLES } from '../../roles';
import Icon from '../common/Icons';
import NotificationPopover from './NotificationPopover';

export default function Header({ pageTitle = 'Dashboard', onToggleMobileSidebar, notifications = [] }) {
  const { user, logout, isDevBypass, switchDevRole } = useAuth();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDevRoleChange = (e) => {
    switchDevRole(e.target.value);
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="saas-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-sidebar-toggle"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle Navigation Menu"
        >
          <Icon name="menu" size={22} />
        </button>
        <h1 className="header-title">{pageTitle}</h1>
      </div>

      <div className="header-search">
        <Icon name="search" size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search customers, visits, leads, phone numbers..."
          className="header-search-input"
        />
      </div>

      <div className="header-right">
        {/* Development Auth Bypass Role Switcher */}
        {isDevBypass && (
          <div className="dev-role-switcher-wrap" title="Development Mode: Switch Role">
            <span className="dev-tag">DEV BYPASS</span>
            <select
              value={user?.role || ROLES.SUPER_ADMIN}
              onChange={handleDevRoleChange}
              className="dev-role-select"
            >
              {Object.keys(ROLE_LABELS).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notifications Icon with FCM Badge */}
        <div className="header-icon-wrap">
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => setShowNotifs(!showNotifs)}
            aria-label="Notifications"
            title="Notifications"
          >
            <Icon name="bell" size={20} />
            {unreadCount > 0 && <span className="notif-badge-count">{unreadCount}</span>}
          </button>
          <NotificationPopover isOpen={showNotifs} onClose={() => setShowNotifs(false)} notifications={notifications} />
        </div>

        {/* User Profile & Avatar Dropdown */}
        <div className="header-profile-wrap" ref={profileRef}>
          <button
            type="button"
            className="header-profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="user-avatar">{userInitial}</div>
            <div className="user-details">
              <span className="user-name">{user?.name || 'Admin User'}</span>
              <span className="user-role-tag">{ROLE_LABELS[user?.role] || user?.role}</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-user-header">
                <strong>{user?.name}</strong>
                <small>{user?.userId} &middot; {user?.email}</small>
              </div>
              <hr />
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/profile');
                }}
              >
                <Icon name="user-check" size={16} /> My Profile
              </button>
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/settings');
                }}
              >
                <Icon name="settings" size={16} /> Settings
              </button>
              <hr />
              <button
                type="button"
                className="dropdown-item logout-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                  navigate('/login');
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
