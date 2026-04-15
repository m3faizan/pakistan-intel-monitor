import React from 'react';
import { Plane, PlaneLanding, PlaneTakeoff, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const AirTrafficPanel = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="panel" data-testid="air-traffic-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Plane size={16} />
            Air Traffic
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

  const airports = data.airport_status?.airports || {};
  
  // Determine operational status based on flight count
  const getOperationalStatus = (airport) => {
    const total = airport.departures + airport.arrivals;
    if (total >= 40) return { status: 'High Traffic', color: '#22C55E', icon: CheckCircle };
    if (total >= 20) return { status: 'Normal', color: '#22C55E', icon: CheckCircle };
    if (total >= 5) return { status: 'Low Traffic', color: '#F59E0B', icon: AlertCircle };
    return { status: 'Minimal', color: '#64748b', icon: XCircle };
  };

  const totalFlights = Object.values(airports).reduce((sum, a) => sum + a.departures + a.arrivals, 0);

  return (
    <div className="panel" data-testid="air-traffic-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Plane size={16} />
          Air Traffic
        </div>
        <span className="panel-badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }}>
          {totalFlights} FLIGHTS
        </span>
      </div>
      <div className="panel-content">
        <div className="air-traffic-note" style={{
          fontSize: '0.6rem',
          color: 'var(--color-muted)',
          marginBottom: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Live data from FlightStats</span>
          <span>{data.airport_status?.note || '24 hours'}</span>
        </div>

        <div className="airports-grid" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {Object.entries(airports).map(([key, airport]) => {
            const opStatus = getOperationalStatus(airport);
            const StatusIcon = opStatus.icon;
            
            return (
              <div 
                key={key} 
                className="airport-card"
                style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--color-border)',
                  padding: '0.6rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '0.5rem',
                  alignItems: 'center'
                }}
                data-testid={`airport-${key}`}
              >
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ 
                      fontWeight: 600, 
                      fontSize: '0.8rem',
                      color: 'var(--color-text)'
                    }}>
                      {airport.name}
                    </span>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      color: 'var(--color-muted)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {airport.code}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.25rem',
                    fontSize: '0.6rem'
                  }}>
                    <StatusIcon size={10} color={opStatus.color} />
                    <span style={{ color: opStatus.color }}>{opStatus.status}</span>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '0.75rem'
                }}>
                  <a 
                    href={airport.departures_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.15rem'
                    }}
                    title="View Departures"
                    data-testid={`${key}-departures`}
                  >
                    <PlaneTakeoff size={14} color="#22C55E" />
                    <span style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 700, 
                      color: '#22C55E',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {airport.departures}
                    </span>
                    <span style={{ fontSize: '0.5rem', color: 'var(--color-muted)' }}>DEP</span>
                  </a>
                  
                  <a 
                    href={airport.arrivals_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.15rem'
                    }}
                    title="View Arrivals"
                    data-testid={`${key}-arrivals`}
                  >
                    <PlaneLanding size={14} color="#3B82F6" />
                    <span style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 700, 
                      color: '#3B82F6',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {airport.arrivals}
                    </span>
                    <span style={{ fontSize: '0.5rem', color: 'var(--color-muted)' }}>ARR</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AirTrafficPanel;
