import { useAuth } from '../../context/AuthContext';
import { ROLE_PERMISSIONS } from '../../constants/permissions';
import { ROLES } from '../../roles';
import Icon from '../common/Icons';

export default function Sidebar({ activeTab, onSelectTab, isMobileOpen, onCloseMobile }) {
  const { user } = useAuth();
  const userRole = user?.role || ROLES.SUPER_ADMIN;
  const menuItems = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS[ROLES.SUPER_ADMIN];

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      {isMobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}

      <aside className={`saas-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/company-logo.jpg" alt="Logo" className="sidebar-logo" />
          <div className="brand-title">
            <strong>DSR CMS</strong>
            <small>Karnali Krishna</small>
          </div>
          <button type="button" className="sidebar-close-btn" onClick={onCloseMobile} aria-label="Close menu">
            <Icon name="x" size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            const isSelected = activeTab === item.id || (activeTab === '' && index === 0);
            const showSection = item.section && (index === 0 || menuItems[index - 1]?.section !== item.section);

            return (
              <div key={item.id}>
                {showSection && <div className="sidebar-section-header">{item.section}</div>}
                <button
                  type="button"
                  className={`sidebar-item ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                >
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                </button>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-version">v1.0.0 &middot; Enterprise SaaS</div>
        </div>
      </aside>
    </>
  );
}
