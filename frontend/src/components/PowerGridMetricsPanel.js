import React, { useState, useEffect, useMemo } from 'react';
import { Activity, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import PowerGridMetricsModal from './PowerGridMetricsModal';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const METRICS_ORDER = [
  'Dependable Capacity', 'Net Delivered', 'Transmission Loss', 'Sale to IPPs'
];

const METRICS_CONFIG = {
  'Dependable Capacity': { color: '#38BDF8', unit: 'MW' },
  'Net Delivered':       { color: '#22C55E', unit: 'GWh' },
  'Transmission Loss':   { color: '#F97316', unit: 'GWh' },
  'Sale to IPPs':        { color: '#A855F7', unit: 'GWh' },
};

const PowerGridMetricsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActive] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/power-grid-metrics`);
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (e) {
        console.error('PowerGridMetrics error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 300000);
    return () => clearInterval(iv);
  }, []);

  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    // Convert array of objects to map of { [metricName]: { latest: {}, mom_change_pct, history: [] } }
    const result = {};
    
    METRICS_ORDER.forEach(metric => {
      const history = data.map(d => ({
        date: d.date,
        value: d[metric]
      })).filter(d => d.value !== undefined && d.value !== null);
      
      if (history.length === 0) return;
      
      const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
      const latest = sorted[sorted.length - 1];
      const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
      
      let mom_change_pct = null;
      if (previous && previous.value !== 0) {
        mom_change_pct = ((latest.value - previous.value) / previous.value) * 100;
      } else if (previous && previous.value === 0 && latest.value === 0) {
        mom_change_pct = 0;
      }
      
      result[metric] = {
        history: sorted,
        latest,
        mom_change_pct,
        unit: METRICS_CONFIG[metric]?.unit || '',
        color: METRICS_CONFIG[metric]?.color || '#38BDF8'
      };
    });
    
    return result;
  }, [data]);

  if (loading) {
    return (
      <div className="panel" data-testid="power-grid-metrics-panel">
        <div className="panel-header">
          <div className="panel-title"><Activity size={16} />Grid Metrics & Deliveries</div>
        </div>
        <div className="panel-content"><div className="loading"><div className="spinner"></div></div></div>
      </div>
    );
  }

  const fmtVal = (v) => {
    if (v === null || v === undefined) return '--';
    const n = Number(v);
    if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
    if (n >= 1000)  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return n.toFixed(1);
  };
  const fmtDate = (d) => !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="panel" data-testid="power-grid-metrics-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Activity size={16} />
          Grid Metrics & Deliveries
        </div>
        <div className="panel-badge">NEPRA / NTDC</div>
      </div>

      <div className="panel-content" style={{ overflowY: 'hidden' }}>
        {!formattedData || Object.keys(formattedData).length === 0 ? (
          <div style={{ color: '#475569', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>
            Data unavailable
          </div>
        ) : (
          <div className="minerals-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {METRICS_ORDER.map(name => {
              const d = formattedData[name];
              if (!d) return null;
              
              const color = d.color;
              const spark = d.history.slice(-24);
              const pct = d.mom_change_pct;
              const isLoss = name === 'Transmission Loss';
              const isPos = pct !== null && pct !== undefined && (isLoss ? pct <= 0 : pct >= 0);

              return (
                <div
                  key={name}
                  className="mineral-item"
                  onClick={() => setActive(name)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="mineral-label" style={{ color: color }}>
                    {name}
                    <ExternalLink size={9} style={{ marginLeft: 3, opacity: 0.5 }} />
                  </div>

                  {spark.length > 1 && (
                    <div style={{ height: 28, margin: '4px 0 2px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={spark}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={isPos ? '#22C55E' : '#EF4444'}
                            strokeWidth={1.2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="mineral-value">
                    {fmtVal(d.latest?.value)}
                  </div>
                  <div className="mineral-unit">{d.unit}</div>
                  
                  {pct !== null && pct !== undefined ? (
                    pct === 0 ? (
                      <div className="mineral-change" style={{ color: '#64748b' }}>= 0.00%</div>
                    ) : (
                      <div className={`mineral-change ${isPos ? 'positive' : 'negative'}`}>
                        {isPos ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        {isPos ? '+' : ''}{pct.toFixed(2)}%
                      </div>
                    )
                  ) : (
                    <div className="mineral-change" style={{ color: '#64748b' }}>—</div>
                  )}

                  <div className="mineral-sublabel">{fmtDate(d.latest?.date)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PowerGridMetricsModal
        isOpen={!!activeMetric}
        onClose={() => setActive(null)}
        metric={activeMetric}
        data={activeMetric ? formattedData[activeMetric] : null}
      />
    </div>
  );
};

export default PowerGridMetricsPanel;
