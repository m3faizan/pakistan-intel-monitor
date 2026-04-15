import React, { useState, useEffect } from 'react';
import { AlertTriangle, Cloud, Construction, Car, MapPin, Clock, ExternalLink, ChevronRight } from 'lucide-react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const RoadAdvisoryPanel = ({ loading: parentLoading }) => {
  const [advisories, setAdvisories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdvisories = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/road-advisory`);
        setAdvisories(response.data.advisories || []);
      } catch (err) {
        console.error('Error fetching road advisories:', err);
        setError('Unable to fetch advisories');
      } finally {
        setLoading(false);
      }
    };

    fetchAdvisories();
  }, []);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Weather Alert':
        return <Cloud size={12} />;
      case 'Road Maintenance':
      case 'Construction':
        return <Construction size={12} />;
      case 'Traffic':
        return <Car size={12} />;
      default:
        return <AlertTriangle size={12} />;
    }
  };

  const getTypeColor = (type, subType) => {
    if (type === 'Weather Alert') {
      if (subType?.includes('Fog') && subType?.includes('0 to 50')) return '#EF4444'; // Severe fog
      if (subType?.includes('Fog')) return '#F59E0B'; // Moderate fog
      if (subType?.includes('Rain') || subType?.includes('Snow')) return '#3B82F6';
      return '#64748b';
    }
    if (type === 'Road Maintenance' || type === 'Construction') return '#F59E0B';
    if (type === 'Accident') return '#EF4444';
    return '#64748b';
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || parentLoading) {
    return (
      <div className="panel" data-testid="road-advisory-panel">
        <div className="panel-header">
          <div className="panel-title">
            <AlertTriangle size={16} />
            Road Advisory
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

  // Group advisories by type
  const groupedByType = advisories.reduce((acc, adv) => {
    const type = adv.type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(adv);
    return acc;
  }, {});

  const totalAlerts = advisories.length;
  const weatherAlerts = groupedByType['Weather Alert']?.length || 0;

  return (
    <div className="panel" data-testid="road-advisory-panel">
      <div className="panel-header">
        <div className="panel-title">
          <AlertTriangle size={16} />
          Road Advisory
        </div>
        <a 
          href="http://cpo.nhmp.gov.pk:6789/TravelAdvisory/TravelAdvisory"
          target="_blank"
          rel="noopener noreferrer"
          className="panel-badge"
          style={{ 
            background: totalAlerts > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)', 
            color: totalAlerts > 0 ? '#EF4444' : '#22C55E',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          {totalAlerts} ALERTS
          <ExternalLink size={10} />
        </a>
      </div>
      <div className="panel-content">
        <div style={{
          fontSize: '0.6rem',
          color: 'var(--color-muted)',
          marginBottom: '0.5rem',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>NHMP Travel Advisory • Last 15 days</span>
          <span>{weatherAlerts} Weather</span>
        </div>

        {advisories.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem 1rem',
            color: 'var(--color-muted)'
          }}>
            <AlertTriangle size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <div style={{ fontSize: '0.8rem' }}>No active advisories</div>
            <div style={{ fontSize: '0.65rem', marginTop: '0.25rem' }}>Roads are clear</div>
          </div>
        ) : (
          <div className="advisories-list" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            maxHeight: '280px',
            overflowY: 'auto'
          }}>
            {advisories.slice(0, 8).map((adv, index) => (
              <div 
                key={adv.id || index}
                className="advisory-card"
                style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--color-border)',
                  borderLeft: `3px solid ${getTypeColor(adv.type, adv.subType)}`,
                  padding: '0.5rem 0.6rem'
                }}
                data-testid={`advisory-${index}`}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.3rem'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem'
                  }}>
                    <span style={{ color: getTypeColor(adv.type, adv.subType) }}>
                      {getTypeIcon(adv.type)}
                    </span>
                    <span style={{ 
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: getTypeColor(adv.type, adv.subType)
                    }}>
                      {adv.subType || adv.type}
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: '0.55rem',
                    color: 'var(--color-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}>
                    <Clock size={9} />
                    {formatTime(adv.recordTime)}
                  </span>
                </div>

                <div style={{ 
                  fontSize: '0.7rem',
                  color: 'var(--color-text)',
                  marginBottom: '0.2rem'
                }}>
                  {adv.route || adv.road}
                </div>

                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.6rem',
                  color: 'var(--color-muted)'
                }}>
                  <MapPin size={9} />
                  <span>{adv.fromPlace}</span>
                  <ChevronRight size={9} />
                  <span>{adv.toPlace}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {advisories.length > 8 && (
          <div style={{
            textAlign: 'center',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--color-border)',
            marginTop: '0.5rem'
          }}>
            <a 
              href="http://cpo.nhmp.gov.pk:6789/TravelAdvisory/TravelAdvisory"
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                fontSize: '0.6rem',
                color: '#3B82F6',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}
            >
              View all {advisories.length} advisories <ExternalLink size={9} />
            </a>
          </div>
        )}

        {/* Source Attribution */}
        <div style={{
          marginTop: '0.5rem',
          paddingTop: '0.4rem',
          borderTop: '1px solid var(--color-border)',
          fontSize: '0.55rem',
          color: 'var(--color-muted)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Source: NHMP</span>
          <span>Refreshed every 30 min</span>
        </div>
      </div>
    </div>
  );
};

export default RoadAdvisoryPanel;
