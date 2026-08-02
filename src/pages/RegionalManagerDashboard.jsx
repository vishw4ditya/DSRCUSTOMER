import { useState } from 'react';
import Navbar from '../components/Navbar';
import UserManagementPanel from '../components/UserManagementPanel';
import ZoneBranchPanel from '../components/ZoneBranchPanel';
import CustomerDataPanel from '../components/CustomerDataPanel';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../roles';

const SECTIONS = ['Team & Approvals', 'Branches', 'Customer Data'];

export default function RegionalManagerDashboard() {
  const { user } = useAuth();
  const [section, setSection] = useState(SECTIONS[0]);

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1>Regional Manager Dashboard</h1>
            <p>Zone: {user.zone?.name || 'N/A'}</p>
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
            manageableRoles={[ROLES.BRANCH_HEAD, ROLES.TECHNICIAN, ROLES.SALESPERSON]}
            needsZoneField={false}
            needsBranchField
          />
        )}
        {section === 'Branches' && <ZoneBranchPanel canCreateZones={false} />}
        {section === 'Customer Data' && <CustomerDataPanel showZoneBranchFilters={false} />}
      </div>
    </div>
  );
}
