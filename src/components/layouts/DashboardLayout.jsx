import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import StatCards from '../dashboard/StatCards';
import LeadOverview from '../dashboard/LeadOverview';
import VisitsTable from '../dashboard/VisitsTable';
import FollowUpsSection from '../dashboard/FollowUpsSection';

import CustomerDataPanel from '../CustomerDataPanel';
import UserManagementPanel from '../UserManagementPanel';
import ZoneBranchPanel from '../ZoneBranchPanel';
import CustomerEntryForm from '../CustomerEntryForm';
import MyRecentVisits from '../MyRecentVisits';

import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { ROLES } from '../../roles';
import { ROLE_PERMISSIONS } from '../../constants/permissions';

export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  const userRole = user?.role || ROLES.SUPER_ADMIN;
  const menuItems = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS[ROLES.SUPER_ADMIN];

  const { stats, leadOverview, visits, followUps, notifications, loading, error } = useDashboardData(user);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [visitRefreshKey, setVisitRefreshKey] = useState(0);

  const currentItem = menuItems.find((m) => m.id === activeTab) || menuItems[0];
  const pageTitle = currentItem?.label || 'Dashboard';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-home-grid">
            {loading ? (
              <div className="dash-loading-state" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                <p>Loading real-time dashboard analytics...</p>
              </div>
            ) : error ? (
              <div className="alert alert-error" style={{ margin: 20 }}>
                {error}
              </div>
            ) : (
              <>
                <StatCards stats={stats} />
                <div className="dash-two-col">
                  <LeadOverview data={leadOverview} />
                  <FollowUpsSection followUps={followUps} />
                </div>
                {/* Field Staff rapid entry form integration on main dashboard */}
                {(userRole === ROLES.TECHNICIAN || userRole === ROLES.SALESPERSON) && (
                  <div style={{ marginBottom: 20 }}>
                    <CustomerEntryForm onSaved={() => setVisitRefreshKey((k) => k + 1)} />
                  </div>
                )}
                <VisitsTable visits={visits} key={visitRefreshKey} />
              </>
            )}
          </div>
        );

      case 'users':
        return <UserManagementPanel />;
      case 'super-admins':
        return <UserManagementPanel targetRole={ROLES.SUPER_ADMIN} />;
      case 'regional-managers':
        return <UserManagementPanel targetRole={ROLES.REGIONAL_MANAGER} />;
      case 'branch-heads':
        return <UserManagementPanel targetRole={ROLES.BRANCH_HEAD} />;
      case 'salespersons':
        return <UserManagementPanel targetRole={ROLES.SALESPERSON} />;
      case 'technicians':
        return <UserManagementPanel targetRole={ROLES.TECHNICIAN} />;

      case 'zones':
      case 'branches':
        return <ZoneBranchPanel canCreateZones={userRole === ROLES.SUPER_ADMIN} />;

      case 'customers':
      case 'my-customers':
        return <CustomerDataPanel showZoneBranchFilters={userRole === ROLES.SUPER_ADMIN} />;

      case 'visits':
      case 'my-visits':
      case 'customer-visits':
        return (
          <div>
            {(userRole === ROLES.TECHNICIAN || userRole === ROLES.SALESPERSON) && (
              <div style={{ marginBottom: 20 }}>
                <CustomerEntryForm onSaved={() => setVisitRefreshKey((k) => k + 1)} />
                <MyRecentVisits refreshKey={visitRefreshKey} />
              </div>
            )}
            {userRole !== ROLES.TECHNICIAN && userRole !== ROLES.SALESPERSON && (
              <CustomerDataPanel showZoneBranchFilters={userRole === ROLES.SUPER_ADMIN} />
            )}
          </div>
        );

      case 'leads':
        return <LeadOverview data={leadOverview} />;

      case 'follow-ups':
      case 'todays-followups':
      case 'todays-tasks':
        return <FollowUpsSection followUps={followUps} />;

      case 'reports':
        return <CustomerDataPanel showZoneBranchFilters={userRole === ROLES.SUPER_ADMIN} />;

      case 'notifications':
        return <FollowUpsSection followUps={followUps} />;

      default:
        return children || <div className="panel"><p>Select a menu item from the left sidebar.</p></div>;
    }
  };

  return (
    <div className="saas-app-shell">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      <div className="saas-main-viewport">
        <Header
          pageTitle={pageTitle}
          onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
          notifications={notifications}
        />

        <main className="saas-content-area">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
