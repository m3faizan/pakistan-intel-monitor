import React from 'react';
import { Shield, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const SecurityPanel = ({ alerts, loading }) => {
  const bucketOrder = ['security', 'political', 'diplomatic', 'economic', 'energy'];
  const bucketLabels = {
    security: 'Security',
    political: 'Political',
    diplomatic: 'Diplomatic',
    economic: 'Economic',
    energy: 'Energy'
  };

  const groupedAlerts = bucketOrder
    .map((bucket) => ({
      bucket,
      label: bucketLabels[bucket],
      items: alerts.filter((a) => (a.type || '').toLowerCase() === bucket)
    }))
    .filter((group) => group.items.length > 0);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertCircle size={14} color="#EF4444" />;
      case 'medium':
        return <AlertTriangle size={14} color="#F59E0B" />;
      case 'low':
        return <Info size={14} color="#22C55E" />;
      default:
        return <Info size={14} color="#3B82F6" />;
    }
  };

  return (
    <div className="panel" data-testid="security-panel" style={{ minHeight: '400px' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Shield size={16} />
          Alerts
        </div>
        <span className="panel-badge">{alerts.length} alerts</span>
      </div>
      <div className="panel-content" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="loading">No alerts</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {groupedAlerts.map((group) => (
              <div key={group.bucket} data-testid={`security-bucket-${group.bucket}`}>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.35rem'
                  }}
                >
                  {group.label}
                </div>
                {group.items.map((alert, index) => (
                  <div
                    key={`${group.bucket}-${index}`}
                    className={`security-alert ${alert.severity}`}
                    data-testid={`security-alert-${group.bucket}-${index}`}
                  >
                    <div className="alert-type" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getSeverityIcon(alert.severity)}
                      {alert.type}
                    </div>
                    <div className="alert-title">{alert.title}</div>
                    <div className="alert-region">
                      {alert.region}
                      {alert.source ? ` • ${alert.source}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityPanel;
