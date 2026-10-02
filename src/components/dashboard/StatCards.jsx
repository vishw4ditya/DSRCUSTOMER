import Icon from '../common/Icons';

export default function StatCards({ stats = {} }) {
  const cards = [
    {
      id: 'totalCustomers',
      label: 'Total Customers',
      value: (stats.totalCustomers || 0).toLocaleString(),
      change: 'Active Accounts',
      trend: 'up',
      icon: 'customer-list',
      color: 'indigo',
    },
    {
      id: 'todaysVisits',
      label: "Today's Visits",
      value: (stats.todaysVisits || 0).toLocaleString(),
      change: 'Completed & Pending',
      trend: 'up',
      icon: 'clipboard',
      color: 'blue',
    },
    {
      id: 'dueToday',
      label: 'Pending Follow-ups',
      value: (stats.dueToday || 0).toLocaleString(),
      change: 'Requires Action',
      trend: 'warning',
      icon: 'clock',
      color: 'rose',
    },
    {
      id: 'activeStaff',
      label: 'Active Staff & Managers',
      value: (stats.activeStaff || 0).toLocaleString(),
      change: `${stats.totalSuperAdmins || 0} Admin, ${stats.totalRegionalManagers || 0} RM, ${stats.totalBranchHeads || 0} BH, ${stats.totalTechnicians || 0} Tech, ${stats.totalSalespersons || 0} Sales`,
      trend: 'up',
      icon: 'users',
      color: 'emerald',
    },
    {
      id: 'totalZones',
      label: 'Total Zones',
      value: (stats.totalZones || 0).toLocaleString(),
      change: `${stats.totalBranches || 0} Active Branches`,
      trend: 'neutral',
      icon: 'globe',
      color: 'amber',
    },
  ];

  return (
    <div className="saas-stat-grid">
      {cards.map((card) => (
        <div key={card.id} className={`saas-stat-card card-accent-${card.color}`}>
          <div className="stat-card-top">
            <span className="stat-card-label">{card.label}</span>
            <div className={`stat-card-icon icon-bg-${card.color}`}>
              <Icon name={card.icon} size={20} />
            </div>
          </div>
          <div className="stat-card-value">{card.value}</div>
          <div className="stat-card-bottom">
            <span className={`stat-trend trend-${card.trend}`}>{card.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
