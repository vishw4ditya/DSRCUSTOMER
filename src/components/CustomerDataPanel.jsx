import { useEffect, useState } from 'react';
import api from '../api/axios';
import RoleCustomerDataTable from './RoleCustomerDataTable';

// Technician and Salesperson data are kept as fully separate tabs/tables (separate
// filters, separate CSV exports) rather than one mixed table, per request - Super
// Admin, Regional Manager, and Branch Head dashboards all use this same panel.
export default function CustomerDataPanel({ showZoneBranchFilters }) {
  const [tab, setTab] = useState('Technician');
  const [zones, setZones] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    if (showZoneBranchFilters) {
      api.get('/zones').then((res) => setZones(res.data));
    }
    api.get('/branches').then((res) => setBranches(res.data));
  }, [showZoneBranchFilters]);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Customer Visit Data</h2>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'Technician' ? 'active' : ''}`} onClick={() => setTab('Technician')}>
          Technician Data
        </button>
        <button className={`tab-btn ${tab === 'Salesperson' ? 'active' : ''}`} onClick={() => setTab('Salesperson')}>
          Salesperson Data
        </button>
      </div>

      {/* Both tables stay mounted (just hidden) so each keeps its own filters/data
          when you switch tabs back and forth, instead of refetching every time. */}
      <div style={{ display: tab === 'Technician' ? 'block' : 'none' }}>
        <RoleCustomerDataTable role="Technician" showZoneBranchFilters={showZoneBranchFilters} zones={zones} branches={branches} />
      </div>
      <div style={{ display: tab === 'Salesperson' ? 'block' : 'none' }}>
        <RoleCustomerDataTable role="Salesperson" showZoneBranchFilters={showZoneBranchFilters} zones={zones} branches={branches} />
      </div>
    </div>
  );
}
