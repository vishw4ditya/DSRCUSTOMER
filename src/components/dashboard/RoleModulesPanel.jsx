const MODULE_CARDS = [
  { id: 'users', title: 'Users', description: 'Manage users and access.' },
  { id: 'regional-manager', title: 'Regional Manager', description: 'Track region-level performance.' },
  { id: 'branch-head', title: 'Branch Head', description: 'Monitor branch operations.' },
  { id: 'technician', title: 'Technician', description: 'Handle service and support visits.' },
  { id: 'salesperson', title: 'Salesperson', description: 'Manage leads and sales follow-ups.' },
];

export default function RoleModulesPanel() {
  return (
    <section className="role-modules-panel">
      <div className="role-modules-header">
        <h3>Dashboard Modules</h3>
        <p>UI modules for Users, Regional Manager, Branch Head, Technician, and Salesperson.</p>
      </div>

      <div className="role-modules-grid">
        {MODULE_CARDS.map((module) => (
          <article key={module.id} className="role-module-card">
            <h4>{module.title}</h4>
            <p>{module.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
