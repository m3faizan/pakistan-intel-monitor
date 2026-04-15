import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Percent, ExternalLink } from 'lucide-react';
import axios from 'axios';
import CPIDataModal from './CPIDataModal';
import SPIModal from './SPIModal';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const InflationPanel = ({ loading: parentLoading }) => {
  const [cpiYoyData, setCpiYoyData] = useState(null);
  const [cpiMomData, setCpiMomData] = useState(null);
  const [spiWeeklyData, setSpiWeeklyData] = useState(null);
  const [spiMonthlyData, setSpiMonthlyData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [yoyRes, momRes, yoyHistRes, momHistRes, spiWeeklyRes, spiMonthlyRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/cpi-yoy`),
          axios.get(`${API_BASE}/api/cpi-mom`),
          axios.get(`${API_BASE}/api/cpi-yoy-historical`),
          axios.get(`${API_BASE}/api/cpi-mom-historical`),
          axios.get(`${API_BASE}/api/spi-weekly`),
          axios.get(`${API_BASE}/api/spi-monthly`)
        ]);

        if (yoyRes.status === 'fulfilled') {
          const payload = yoyRes.value.data;
          if (payload?.data) {
            setCpiYoyData({
              ...payload.data,
              stale: payload.stale,
              updated: payload.updated || payload.data.updated
            });
          }
        }
        if (momRes.status === 'fulfilled') {
          const payload = momRes.value.data;
          if (payload?.data) {
            setCpiMomData({
              ...payload.data,
              stale: payload.stale,
              updated: payload.updated || payload.data.updated
            });
          }
        }
        // Merge historical data with latest data
        if (yoyHistRes.status === 'fulfilled' && yoyHistRes.value.data.data) {
          setCpiYoyData(prev => ({
            ...(prev || {}),
            ...yoyHistRes.value.data.data,
            // Keep latest from regular endpoint if available
            latest: prev?.latest || yoyHistRes.value.data.data.latest
          }));
        }
        if (momHistRes.status === 'fulfilled' && momHistRes.value.data.data) {
          setCpiMomData(prev => ({
            ...(prev || {}),
            ...momHistRes.value.data.data,
            latest: prev?.latest || momHistRes.value.data.data.latest
          }));
        }
        if (spiWeeklyRes.status === 'fulfilled') {
          setSpiWeeklyData(spiWeeklyRes.value.data.data);
        }
        if (spiMonthlyRes.status === 'fulfilled') {
          setSpiMonthlyData(spiMonthlyRes.value.data.data);
        }
      } catch (error) {
        console.error('Error fetching CPI data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  if (parentLoading || dataLoading) {
    return (
      <div className="panel" data-testid="inflation-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Percent size={16} />
            Inflation Monitor
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

  const indicators = [
    {
      label: 'CPI (YoY)',
      value: cpiYoyData?.latest?.value,
      subLabel: cpiYoyData?.latest?.month || '',
      change: cpiYoyData?.mom_change,
      description: 'Year-on-Year Inflation',
      clickable: true,
      modalKey: 'yoy',
      isLive: cpiYoyData !== null,
      isStale: cpiYoyData?.stale,
      isPercent: true,
      changeIsPercent: false
    },
    {
      label: 'CPI (MoM)',
      value: cpiMomData?.latest?.value,
      subLabel: cpiMomData?.latest?.month || '',
      change: null,
      description: 'Month-on-Month Inflation',
      clickable: true,
      modalKey: 'mom',
      isLive: cpiMomData !== null,
      isStale: cpiMomData?.stale,
      isPercent: true,
      changeIsPercent: false
    },
    {
      label: 'SPI (Weekly)',
      value: spiWeeklyData?.latest?.value,
      subLabel: spiWeeklyData?.latest?.week_ending_formatted || '',
      change: spiWeeklyData?.primary_change_pct,
      description: 'Combined Sensitivity Price Index (WoW)',
      movement: {
        increase: spiWeeklyData?.latest?.increase,
        decrease: spiWeeklyData?.latest?.decrease,
        stable: spiWeeklyData?.latest?.stable
      },
      clickable: true,
      modalKey: 'spiWeekly',
      isLive: spiWeeklyData !== null,
      isStale: false,
      isPercent: false,
      changeIsPercent: true
    },
    {
      label: 'SPI (Monthly)',
      value: spiMonthlyData?.latest?.value,
      subLabel: spiMonthlyData?.latest?.month || '',
      change: spiMonthlyData?.primary_change_pct,
      description: 'Monthly SPI (Q1) Index',
      clickable: true,
      modalKey: 'spiMonthly',
      isLive: spiMonthlyData !== null,
      isStale: false,
      isPercent: false,
      changeIsPercent: true
    }
  ];

  const handleItemClick = (item) => {
    if (item.clickable && item.modalKey) {
      setActiveModal(item.modalKey);
    }
  };

  const getModalData = () => {
    switch (activeModal) {
      case 'yoy':
        return { data: cpiYoyData, title: 'CPI Inflation (Year-on-Year)', type: 'yoy' };
      case 'mom':
        return { data: cpiMomData, title: 'CPI Inflation (Month-on-Month)', type: 'mom' };
      case 'spiWeekly':
        return { data: spiWeeklyData, title: 'SPI Weekly (Combined)', type: 'spi', frequency: 'Weekly', isSpi: true };
      case 'spiMonthly':
        return { data: spiMonthlyData, title: 'SPI Monthly (Q1)', type: 'spi', frequency: 'Monthly', isSpi: true };
      default:
        return null;
    }
  };

  const modalInfo = getModalData();

  const formatDisplayValue = (item) => {
    if (item.value === null || item.value === undefined) {
      return '--';
    }

    if (item.isPercent) {
      return `${Number(item.value).toFixed(1)}%`;
    }

    return Number(item.value).toFixed(2);
  };

  // Determine if inflation is high (above 10% is concerning)
  const getInflationStatus = (value) => {
    if (value === null || value === undefined) return 'neutral';
    if (value > 10) return 'critical';
    if (value > 5) return 'warning';
    return 'good';
  };

  return (
    <div className="panel" data-testid="inflation-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Percent size={16} />
          Inflation Monitor
        </div>
        <span className="panel-badge">LIVE</span>
      </div>
      <div className="panel-content">
        <div className="inflation-grid">
          {indicators.map((item, index) => {
            const status = getInflationStatus(item.value);
            
            return (
              <div
                key={index}
                className={`inflation-item ${item.clickable ? 'clickable' : ''}`}
                data-testid={`inflation-item-${index}`}
                onClick={() => handleItemClick(item)}
                style={item.clickable ? { cursor: 'pointer' } : {}}
              >
                <div className="inflation-header">
                  <span className="inflation-label">
                    {item.label}
                    {item.clickable && (
                      <ExternalLink size={10} style={{ marginLeft: '4px', opacity: 0.6 }} />
                    )}
                    {item.isLive && (
                      <span className="live-dot" data-testid={`inflation-live-indicator-${index}`} style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: item.isStale ? '#F59E0B' : '#22C55E',
                        borderRadius: '50%',
                        display: 'inline-block',
                        marginLeft: '6px',
                        animation: 'pulse 2s infinite'
                      }}></span>
                    )}
                  </span>
                </div>
                <div className="inflation-value-container">
                  <span 
                    className={`inflation-value ${status}`}
                    style={{
                      color: 'var(--color-text)'
                    }}
                  >
                    {formatDisplayValue(item)}
                  </span>
                  {item.change !== null && item.change !== undefined && (
                    <span className={`inflation-change ${item.change >= 0 ? 'up' : 'down'}`}>
                      {item.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {item.change >= 0 ? '+' : ''}{item.change.toFixed(item.changeIsPercent ? 2 : 1)}{item.changeIsPercent ? '%' : ''}
                    </span>
                  )}
                </div>
                <div className="inflation-sublabel">
                  {item.subLabel}
                </div>
                <div className="inflation-description">
                  {item.description}
                </div>
                {item.movement && (
                  <div
                    style={{ display: 'flex', gap: '0.3rem', marginTop: '0.35rem', flexWrap: 'wrap' }}
                    data-testid={`inflation-item-movement-${index}`}
                  >
                    <span
                      style={{
                        fontSize: '0.58rem',
                        color: '#ef4444',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        padding: '0.12rem 0.32rem',
                        borderRadius: '999px'
                      }}
                      data-testid={`inflation-item-increase-count-${index}`}
                    >
                      ↑ {item.movement.increase ?? 0}
                    </span>
                    <span
                      style={{
                        fontSize: '0.58rem',
                        color: '#22C55E',
                        background: 'rgba(34, 197, 94, 0.12)',
                        border: '1px solid rgba(34, 197, 94, 0.35)',
                        padding: '0.12rem 0.32rem',
                        borderRadius: '999px'
                      }}
                      data-testid={`inflation-item-decrease-count-${index}`}
                    >
                      ↓ {item.movement.decrease ?? 0}
                    </span>
                    <span
                      style={{
                        fontSize: '0.58rem',
                        color: '#94A3B8',
                        background: 'rgba(148, 163, 184, 0.12)',
                        border: '1px solid rgba(148, 163, 184, 0.35)',
                        padding: '0.12rem 0.32rem',
                        borderRadius: '999px'
                      }}
                      data-testid={`inflation-item-stable-count-${index}`}
                    >
                      = {item.movement.stable ?? 0}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {modalInfo && !modalInfo.isSpi && (
        <CPIDataModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          data={modalInfo.data}
          title={modalInfo.title}
          type={modalInfo.type}
        />
      )}

      {modalInfo && modalInfo.isSpi && (
        <SPIModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          data={modalInfo.data}
          title={modalInfo.title}
          frequency={modalInfo.frequency}
        />
      )}
    </div>
  );
};

export default InflationPanel;
