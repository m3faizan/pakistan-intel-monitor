import React from 'react';
import { Anchor, Ship, ArrowDown, ArrowUp, Clock, MapPin } from 'lucide-react';

const MarineTrafficPanel = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="panel" data-testid="marine-traffic-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Anchor size={16} />
            Marine Traffic
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

  const ports = data.port_status?.ports || {};
  
  const totalInPort = Object.values(ports).reduce((sum, p) => sum + p.in_port, 0);
  const totalExpected = Object.values(ports).reduce((sum, p) => sum + p.expected, 0);

  return (
    <div className="panel" data-testid="marine-traffic-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Anchor size={16} />
          Marine Traffic
        </div>
        <span className="panel-badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6' }}>
          {totalInPort} IN PORT
        </span>
      </div>
      <div className="panel-content">
        <div className="marine-traffic-note" style={{
          fontSize: '0.6rem',
          color: 'var(--color-muted)',
          marginBottom: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Live data from MyShipTracking</span>
          <span>{data.port_status?.note || '24 hours'}</span>
        </div>

        <div className="ports-grid" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {Object.entries(ports).map(([key, port]) => (
            <div 
              key={key} 
              className="port-card"
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--color-border)',
                padding: '0.75rem'
              }}
              data-testid={`port-${key}`}
            >
              <a 
                href={port.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}
                data-testid={`${key}-port-link`}
              >
                <Ship size={14} color="#8B5CF6" />
                <span style={{ 
                  fontWeight: 600, 
                  fontSize: '0.85rem',
                  color: 'var(--color-text)'
                }}>
                  {port.name}
                </span>
                <span style={{ 
                  fontSize: '0.6rem', 
                  color: 'var(--color-muted)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {port.code}
                </span>
              </a>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '0.5rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.25rem',
                    marginBottom: '0.25rem'
                  }}>
                    <MapPin size={10} color="var(--color-muted)" />
                    <span style={{ fontSize: '0.55rem', color: 'var(--color-muted)' }}>In Port</span>
                  </div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    color: '#22C55E',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {port.in_port}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.25rem',
                    marginBottom: '0.25rem'
                  }}>
                    <ArrowDown size={10} color="var(--color-muted)" />
                    <span style={{ fontSize: '0.55rem', color: 'var(--color-muted)' }}>Arrivals</span>
                  </div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    color: '#3B82F6',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {port.arrivals}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.25rem',
                    marginBottom: '0.25rem'
                  }}>
                    <ArrowUp size={10} color="var(--color-muted)" />
                    <span style={{ fontSize: '0.55rem', color: 'var(--color-muted)' }}>Departures</span>
                  </div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    color: '#F59E0B',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {port.departures}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.25rem',
                    marginBottom: '0.25rem'
                  }}>
                    <Clock size={10} color="var(--color-muted)" />
                    <span style={{ fontSize: '0.55rem', color: 'var(--color-muted)' }}>Expected</span>
                  </div>
                  <div style={{ 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    color: '#8B5CF6',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {port.expected}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{
          marginTop: '0.75rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.6rem',
          color: 'var(--color-muted)'
        }}>
          <span>Total vessels in Pakistan ports: <strong style={{ color: '#22C55E' }}>{totalInPort}</strong></span>
          <span>Expected arrivals: <strong style={{ color: '#8B5CF6' }}>{totalExpected}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default MarineTrafficPanel;
