import { useState } from 'react';
import Navbar from '../components/Navbar';
import CustomerEntryForm from '../components/CustomerEntryForm';
import MyRecentVisits from '../components/MyRecentVisits';
import { useAuth } from '../context/AuthContext';

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        <div className="page-header">
          <div>
            <p className="dashboard-kicker">Technician Dashboard</p>
            <h1 className="dashboard-welcome-name">{user.name}</h1>
            <p className="dashboard-subtitle">
              {user.userId} &middot; {user.branch?.name || 'N/A'} ({user.zone?.name || 'N/A'}) &middot; Record
              installation and service visits.
            </p>
          </div>
        </div>

        <CustomerEntryForm onSaved={() => setRefreshKey((k) => k + 1)} />
        <MyRecentVisits refreshKey={refreshKey} />
      </div>
    </div>
  );
}
