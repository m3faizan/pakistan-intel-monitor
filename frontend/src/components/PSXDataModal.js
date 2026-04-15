import React from 'react';
import { X, TrendingUp, TrendingDown, BarChart3, Clock, Activity } from 'lucide-react';

const PSXDataModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const isPositive = data.change >= 0;
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '--';
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const formatVolume = (vol) => {
    if (vol === null || vol === undefined) return '--';
    if (vol >= 1000000000) return (vol / 1000000000).toFixed(2) + 'B';
    if (vol >= 1000000) return (vol / 1000000).toFixed(2) + 'M';
    return vol.toLocaleString();
  };

  const isMarketOpenNow = () => {
    const karachiNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
    const day = karachiNow.getDay();
    const minutes = karachiNow.getHours() * 60 + karachiNow.getMinutes();
    const marketOpenMinutes = 9 * 60 + 30;
    const marketCloseMinutes = 15 * 60 + 30;
    const isWeekday = day >= 1 && day <= 5;
    return isWeekday && minutes >= marketOpenMinutes && minutes <= marketCloseMinutes;
  };

  const marketOpen = isMarketOpenNow();

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="psx-modal-overlay">
      <div 
        className="remittances-modal" 
        onClick={(e) => e.stopPropagation()}
        data-testid="psx-modal"
        style={{ maxWidth: '500px' }}
      >
        <div className="modal-header">
          <div className="modal-title">
            <BarChart3 size={20} />
            <span>KSE-100 Index</span>
          </div>
          <button 
            className="modal-close" 
            onClick={onClose}
            data-testid="psx-modal-close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-summary">
          <div className="summary-main">
            <div className="summary-value" style={{ fontSize: '2rem' }}>
              {formatNumber(data.value)}
            </div>
            <div className={`summary-change-large ${isPositive ? 'positive' : 'negative'}`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
              fontSize: '1.1rem'
            }}>
              {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              <span>{isPositive ? '+' : ''}{formatNumber(data.change)}</span>
              <span>({isPositive ? '+' : ''}{data.change_percent?.toFixed(2)}%)</span>
            </div>
            {data.timestamp && (
              <div className="summary-period" style={{ marginTop: '0.75rem' }}>
                <Clock size={14} />
                As of {data.timestamp}
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '1rem',
          padding: '1rem',
          background: 'var(--color-background)',
          borderRadius: '8px',
          margin: '1rem 0'
        }}>
          <div className="psx-stat-item">
            <div style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Day High</div>
            <div style={{ color: '#22C55E', fontWeight: '600' }}>{formatNumber(data.high)}</div>
          </div>
          <div className="psx-stat-item">
            <div style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Day Low</div>
            <div style={{ color: '#EF4444', fontWeight: '600' }}>{formatNumber(data.low)}</div>
          </div>
          <div className="psx-stat-item">
            <div style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Previous Close</div>
            <div style={{ color: 'var(--color-text)', fontWeight: '600' }}>{formatNumber(data.previous_close)}</div>
          </div>
          <div className="psx-stat-item">
            <div style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Volume</div>
            <div style={{ color: 'var(--color-text)', fontWeight: '600' }}>{formatVolume(data.volume)}</div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '1rem',
          padding: '1rem',
          background: 'var(--color-background)',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <div className="psx-stat-item">
            <div style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>YTD Change</div>
            <div style={{ 
              color: data.ytd_change >= 0 ? '#22C55E' : '#EF4444', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              {data.ytd_change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {data.ytd_change >= 0 ? '+' : ''}{data.ytd_change?.toFixed(2)}%
            </div>
          </div>
          <div className="psx-stat-item">
            <div style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>1-Year Change</div>
            <div style={{ 
              color: data.yoy_change >= 0 ? '#22C55E' : '#EF4444', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              {data.yoy_change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {data.yoy_change >= 0 ? '+' : ''}{data.yoy_change?.toFixed(2)}%
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.75rem',
          background: marketOpen ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <Activity size={16} style={{ color: marketOpen ? '#22C55E' : '#EF4444' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>
            Market {marketOpen ? 'Open' : 'Closed'}
          </span>
        </div>

        <div className="modal-footer">
          <span className="data-source">Source: Pakistan Stock Exchange</span>
          <span className="data-updated">
            Last updated: {new Date(data.updated || Date.now()).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PSXDataModal;
