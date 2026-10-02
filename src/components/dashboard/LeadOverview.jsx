import Icon from '../common/Icons';

const emptyLeadOverview = {
  hot: { count: 0, percentage: 0 },
  warm: { count: 0, percentage: 0 },
  cold: { count: 0, percentage: 0 },
  total: 0,
};

export default function LeadOverview({ data = emptyLeadOverview }) {
  const safeData = data || emptyLeadOverview;
  const { hot = { count: 0, percentage: 0 }, warm = { count: 0, percentage: 0 }, cold = { count: 0, percentage: 0 }, total = 0 } = safeData;

  return (
    <div className="saas-panel lead-overview-panel">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Lead Overview</h2>
          <p className="panel-sub">Temperature breakdown of active customer leads</p>
        </div>
        <div className="total-lead-badge">
          <Icon name="flame" size={16} /> <strong>{total} Active Leads</strong>
        </div>
      </div>

      <div className="lead-bars-grid">
        {/* Hot Leads */}
        <div className="lead-temp-card lead-hot-box">
          <div className="lead-temp-header">
            <div className="lead-temp-tag">
              <span className="lead-dot dot-hot" />
              <strong>Hot Leads</strong>
            </div>
            <span className="lead-count-value">{hot.count}</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill fill-hot" style={{ width: `${hot.percentage}%` }} />
          </div>
          <div className="lead-temp-footer">
            <span>High conversion probability</span>
            <strong>{hot.percentage}% of total</strong>
          </div>
        </div>

        {/* Warm Leads */}
        <div className="lead-temp-card lead-warm-box">
          <div className="lead-temp-header">
            <div className="lead-temp-tag">
              <span className="lead-dot dot-warm" />
              <strong>Warm Leads</strong>
            </div>
            <span className="lead-count-value">{warm.count}</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill fill-warm" style={{ width: `${warm.percentage}%` }} />
          </div>
          <div className="lead-temp-footer">
            <span>Follow-up scheduled</span>
            <strong>{warm.percentage}% of total</strong>
          </div>
        </div>

        {/* Cold Leads */}
        <div className="lead-temp-card lead-cold-box">
          <div className="lead-temp-header">
            <div className="lead-temp-tag">
              <span className="lead-dot dot-cold" />
              <strong>Cold Leads</strong>
            </div>
            <span className="lead-count-value">{cold.count}</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill fill-cold" style={{ width: `${cold.percentage}%` }} />
          </div>
          <div className="lead-temp-footer">
            <span>Nurturing stage</span>
            <strong>{cold.percentage}% of total</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
