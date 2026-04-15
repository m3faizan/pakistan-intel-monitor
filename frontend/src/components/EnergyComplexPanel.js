import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import MineralsDetailModal from './MineralsDetailModal';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const ENERGY_ITEMS = [
  { key: 'Crude Oil',    label: 'CRUDE OIL',    icon: '🛢️'  },
  { key: 'Natural Gas',  label: 'NATURAL GAS',  icon: '🔥'  },
  { key: 'Electricity',  label: 'ELECTRICITY',  icon: '⚡'  },
];

const EnergyComplexPanel = ({ loading: parentLoading }) => {
  const [allData, setAllData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/minerals-metals`);
        if (res.data?.data) setAllData(res.data.data);
      } catch (err) {
        console.error('EnergyComplexPanel fetch error:', err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  if (parentLoading || dataLoading) {
    return (
      <div className="panel" data-testid="energy-complex-panel">
        <div className="panel-header">
          <div className="panel-title"><Zap size={16} />Energy Complex</div>
        </div>
        <div className="panel-content">
          <div className="loading"><div className="spinner"></div></div>
        </div>
      </div>
    );
  }

  const formatVal = (v) => {
    if (v === null || v === undefined) return '--';
    const n = Number(v);
    if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
    if (n >= 1000)  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
    return n.toFixed(n < 10 ? 2 : 1);
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const activeData = activeItem ? allData?.[activeItem] : null;

  return (
    <div className="panel" data-testid="energy-complex-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Zap size={16} />
          Energy Complex
        </div>
        <div className="panel-badge">PBS</div>
      </div>

      <div className="panel-content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {ENERGY_ITEMS.map(({ key, label, icon }) => {
            const d = allData?.[key];
            const pct = d?.mom_change_pct;
            const isPos = pct !== null && pct !== undefined && pct >= 0;
            const sparkData = d?.history?.slice(-36) || [];

            return (
              <div
                key={key}
                className="energy-row"
                onClick={() => d && setActiveItem(key)}
                style={{ cursor: d ? 'pointer' : 'default' }}
              >
                {/* Left: label + date */}
                <div className="energy-row-left">
                  <div className="energy-row-label">
                    {label}
                    {d && <ExternalLink size={9} style={{ marginLeft: 3, opacity: 0.5 }} />}
                  </div>
                  <div className="energy-row-date">{formatDate(d?.latest?.date)}</div>
                </div>

                {/* Middle: sparkline */}
                <div className="energy-row-spark">
                  {sparkData.length > 1 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparkData}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={isPos ? '#22C55E' : '#EF4444'}
                          strokeWidth={1.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Right: value + change */}
                <div className="energy-row-right">
                  <div className="energy-row-value">
                    {formatVal(d?.latest?.value)}
                  </div>
                  <div className="energy-row-unit">{d?.unit || ''}</div>
                  {pct !== null && pct !== undefined ? (
                    <div className={`energy-row-change ${isPos ? 'positive' : 'negative'}`}>
                      {isPos ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                      {isPos ? '+' : ''}{pct.toFixed(2)}%
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Tape */}
        <div className="energy-live-tape">
          <div className="energy-tape-label">LIVE TAPE</div>
          <div className="energy-tape-grid">
            {ENERGY_ITEMS.map(({ key, label }) => {
              const d = allData?.[key];
              const pct = d?.mom_change_pct;
              const isPos = pct !== null && pct !== undefined && pct >= 0;
              return (
                <div key={key} className="energy-tape-card" onClick={() => d && setActiveItem(key)}>
                  <div className="energy-tape-card-label">{label}</div>
                  <div className="energy-tape-card-value">{d ? `${Number(d.latest?.value).toLocaleString(undefined, { maximumFractionDigits: 1 })}` : '--'}</div>
                  <div className={`energy-tape-card-unit`}>{d?.unit || ''}</div>
                  {pct !== null && pct !== undefined && (
                    <div className={`energy-tape-card-change ${isPos ? 'positive' : 'negative'}`}>
                      {isPos ? '+' : ''}{pct.toFixed(2)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <MineralsDetailModal
        isOpen={!!activeItem}
        onClose={() => setActiveItem(null)}
        mineral={activeItem}
        data={activeData}
      />
    </div>
  );
};

export default EnergyComplexPanel;
