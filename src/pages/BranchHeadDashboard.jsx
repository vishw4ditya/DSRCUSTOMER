import { useState } from 'react';
import Navbar from '../components/Navbar';
import UserManagementPanel from '../components/UserManagementPanel';
import CustomerDataPanel from '../components/CustomerDataPanel';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../roles';

const SECTIONS = ['Team & Approvals', 'Customer Data'];

export default function BranchHeadDashboard() {
  const { user } = useAuth();
  const [section, setSection] = useState(SECTIONS[0]);

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <p className="dashboard-kicker">Branch Manager Dashboard</p>
            <h1 className="dashboard-welcome-name">{user.name}</h1>
            <p className="dashboard-subtitle">
              {user.userId} &middot; Branch: {user.branch?.name || 'N/A'} ({user.zone?.name || 'N/A'})
            </p>
          </div>
        </div>

        <div className="tabs">
          {SECTIONS.map((s) => (
            <button key={s} className={`tab-btn ${section === s ? 'active' : ''}`} onClick={() => setSection(s)}>
              {s}
            </button>
          ))}
        </div>

        {section === 'Team & Approvals' && (
          <UserManagementPanel
            manageableRoles={[ROLES.TECHNICIAN, ROLES.SALESPERSON]}
            needsZoneField={false}
            needsBranchField={false}
          />
        )}
        {section === 'Customer Data' && <CustomerDataPanel showZoneBranchFilters={false} />}
      </div>
    </div>
  );
}
