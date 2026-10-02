import { useEffect, useState } from 'react';
import { getZones, getBranches } from '../services/firebase';
import RoleCustomerDataTable from './RoleCustomerDataTable';

export default function CustomerDataPanel({ showZoneBranchFilters }) {
  const [tab, setTab] = useState('Technician');
  const [zones, setZones] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    if (showZoneBranchFilters) {
      getZones().then((data) => setZones(data || [])).catch(() => setZones([]));
    }
    getBranches().then((data) => setBranches(data || [])).catch(() => setBranches([]));
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

      <div style={{ display: tab === 'Technician' ? 'block' : 'none' }}>
        <RoleCustomerDataTable role="Technician" showZoneBranchFilters={showZoneBranchFilters} zones={zones} branches={branches} />
      </div>
      <div style={{ display: tab === 'Salesperson' ? 'block' : 'none' }}>
        <RoleCustomerDataTable role="Salesperson" showZoneBranchFilters={showZoneBranchFilters} zones={zones} branches={branches} />
      </div>
    </div>
  );
}
