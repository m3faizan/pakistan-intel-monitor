import React from 'react';
import { Zap, Wifi, Activity, Signal } from 'lucide-react';

const InfrastructurePanel = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="panel" data-testid="infrastructure-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Zap size={16} />
            Infrastructure
          </div>
        </div>
        <div className="panel-content">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  const getIndicatorClass = (status) => {
    if (status === 'Operational' || status === 'Stable' || status === 'Normal Operations' || status === 'Clear') {
      return 'good';
    }
    if (status && status.includes('hours')) {
      return 'warning';
    }
    return 'good';
  };

  return (
    <div className="panel" data-testid="infrastructure-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Zap size={16} />
          Infrastructure
        </div>
        <span className="panel-badge" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }}>
          STABLE
        </span>
      </div>
      <div className="panel-content">
        {/* Power Section */}
        <div className="infra-section" style={{ marginBottom: '1rem' }}>
          <div className="infra-title" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '0.5rem',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Zap size={12} style={{ marginRight: '0.5rem', color: '#F59E0B' }} />
            Power Grid
          </div>
          
          <div style={{
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid var(--color-border)',
            padding: '0.75rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.55rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>
                  National Grid
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem' 
                }}>
                  <span className={`infra-indicator ${getIndicatorClass(data.power?.national_grid_status)}`}></span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{data.power?.national_grid_status}</span>
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.55rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>
                  Load Shedding (Urban)
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem' 
                }}>
                  <span className="infra-indicator warning"></span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#F59E0B' }}>{data.power?.load_shedding?.urban}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.55rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>
                  Generation Capacity
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#22C55E' }}>
                  {data.power?.generation_capacity}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.55rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>
                  Demand / Supply
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  <span style={{ color: '#EF4444' }}>{data.power?.demand}</span>
                  <span style={{ color: 'var(--color-muted)' }}> / </span>
                  <span style={{ color: '#22C55E' }}>{data.power?.supply}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Internet Section */}
        <div className="infra-section">
          <div className="infra-title" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '0.5rem',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Wifi size={12} style={{ marginRight: '0.5rem', color: '#3B82F6' }} />
            Internet
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid var(--color-border)',
            padding: '0.75rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.55rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>
                  National Status
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem' 
                }}>
                  <span className={`infra-indicator ${getIndicatorClass(data.internet?.national_status)}`}></span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{data.internet?.national_status}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.55rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>
                  Average Speed
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem' 
                }}>
                  <Signal size={12} color="#3B82F6" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#3B82F6' }}>{data.internet?.average_speed}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.55rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>
                  Outage Reports
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: data.internet?.outage_reports > 0 ? '#F59E0B' : '#22C55E' }}>
                  {data.internet?.outage_reports}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.55rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>
                  Affected Regions
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
                  {data.internet?.affected_regions?.length > 0 
                    ? data.internet.affected_regions.join(', ')
                    : 'None'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfrastructurePanel;
