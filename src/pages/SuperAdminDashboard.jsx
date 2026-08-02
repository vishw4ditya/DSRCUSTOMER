import { useState } from 'react';
import Navbar from '../components/Navbar';
import UserManagementPanel from '../components/UserManagementPanel';
import ZoneBranchPanel from '../components/ZoneBranchPanel';
import CustomerDataPanel from '../components/CustomerDataPanel';
import { ROLES } from '../roles';

const SECTIONS = ['Team & Approvals', 'Zones & Branches', 'Customer Data'];

export default function SuperAdminDashboard() {
  const [section, setSection] = useState(SECTIONS[0]);

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1>Super Admin Dashboard</h1>
            <p>Full control over zones, branches, and every role's accounts and data.</p>
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
            manageableRoles={[ROLES.REGIONAL_MANAGER, ROLES.BRANCH_HEAD, ROLES.TECHNICIAN, ROLES.SALESPERSON]}
            needsZoneField
            needsBranchField
          />
        )}
        {section === 'Zones & Branches' && <ZoneBranchPanel canCreateZones />}
        {section === 'Customer Data' && <CustomerDataPanel showZoneBranchFilters />}
      </div>
    </div>
  );
}
