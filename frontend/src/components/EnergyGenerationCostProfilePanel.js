import React, { useState, useEffect, useMemo } from 'react';
import { Coins, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import EnergyGenerationCostsModal from './EnergyGenerationCostsModal';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Ordered strictly as per user payload
const FUEL_SOURCES = [
  'Hydel', 'Coal-Local', 'HSD', 'RFO', 'Gas', 'RLNG', 'Nuclear', 'Import Iran', 'Mixed', 'Wind', 'Baggasse', 'Solar', 'Coal-Imported'
];

const SOURCE_COLORS = {
  'Hydel':         '#38BDF8',
  'Coal-Local':    '#78716C',
  'HSD':           '#F97316',
  'RFO':           '#EF4444',
  'Gas':           '#F59E0B',
  'RLNG':          '#FB923C',
  'Nuclear':       '#A855F7',
  'Import Iran':   '#64748B',
  'Mixed':         '#475569',
  'Wind':          '#6EE7B7',
  'Baggasse':      '#10B981',
  'Solar':         '#FDE68A',
  'Coal-Imported': '#57534E'
};

const EnergyGenerationCostProfilePanel = () => {
  const [dataPkrKwh, setDataPkrKwh] = useState(null);
  const [dataMlnPkr, setDataMlnPkr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActive] = useState(null);
  const [mode, setMode] = useState('PKR_KWH'); // 'PKR_KWH' or 'MLN_PKR'

  useEffect(() => {
    const load = async () => {
      try {
        const [resPkrKwh, resMlnPkr] = await Promise.all([
            axios.get(`${API_BASE}/api/energy-generation-costs`),
            axios.get(`${API_BASE}/api/energy-generation-costs-mln-pkr`)
        ]);
        if (resPkrKwh.data?.data) setDataPkrKwh(resPkrKwh.data.data);
        if (resMlnPkr.data?.data) setDataMlnPkr(resMlnPkr.data.data);
      } catch (e) {
        console.error('EnergyGenerationCostProfile error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 300000);
    return () => clearInterval(iv);
  }, []);

  const activeData = mode === 'PKR_KWH' ? dataPkrKwh : dataMlnPkr;
  const activeUnit = mode === 'PKR_KWH' ? 'PKR/kWh' : 'Mln PKR';

  const formattedData = useMemo(() => {
    if (!activeData || activeData.length === 0) return null;
    
    const result = {};
    
    const processSeries = (metricName, history, color) => {
      if (!history || history.length === 0) return;
      const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
      const latest = sorted[sorted.length - 1];
      const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
      let mom_change_pct = null;
      if (previous && previous.value !== 0) {
        mom_change_pct = ((latest.value - previous.value) / Math.abs(previous.value)) * 100;
      } else if (previous && previous.value === 0 && latest.value === 0) {
        mom_change_pct = 0;
      }
      result[metricName] = {
        history: sorted,
        latest,
        mom_change_pct,
        unit: activeUnit,
        color: color
      };
    };

    FUEL_SOURCES.forEach(metric => {
      const history = activeData.map(d => ({ date: d.date, value: d[metric] })).filter(d => d.value !== undefined && d.value !== null);
      processSeries(metric, history, SOURCE_COLORS[metric] || '#38BDF8');
    });
    
    return result;
  }, [activeData, activeUnit]);

  if (loading) {
    return (
      <div className="panel" data-testid="energy-cost-profile-panel" style={{ gridColumn: 'span 2' }}>
        <div className="panel-header">
          <div className="panel-title"><Coins size={16} />Energy Generation Cost Profile</div>
        </div>
        <div className="panel-content"><div className="loading"><div className="spinner"></div></div></div>
      </div>
    );
  }

  const fmtVal = (v) => {
    if (v === null || v === undefined) return '--';
    const n = Number(v);
    if (mode === 'MLN_PKR') {
        if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
        return n.toFixed(0);
    }
    return n.toFixed(2);
  };

  const fmtDate = (d) => !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="panel" data-testid="energy-cost-profile-panel" style={{ gridColumn: 'span 2' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Coins size={16} />
          Energy Generation Cost Profile
        </div>
        
        <div style={{ display: 'flex', gap: '0.2rem', marginLeft: 'auto', marginRight: '0.5rem' }}>
          <button
            onClick={() => setMode('PKR_KWH')}
            style={{
              fontSize: '0.6rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: 3,
              border: `1px solid ${mode === 'PKR_KWH' ? '#22C55E' : 'var(--color-border)'}`,
              background: mode === 'PKR_KWH' ? 'rgba(34,197,94,0.12)' : 'transparent',
              color: mode === 'PKR_KWH' ? '#22C55E' : '#64748b', cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            PKR/kWh
          </button>
          <button
            onClick={() => setMode('MLN_PKR')}
            style={{
              fontSize: '0.6rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em',
              textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: 3,
              border: `1px solid ${mode === 'MLN_PKR' ? '#38BDF8' : 'var(--color-border)'}`,
              background: mode === 'MLN_PKR' ? 'rgba(56,189,248,0.12)' : 'transparent',
              color: mode === 'MLN_PKR' ? '#38BDF8' : '#64748b', cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            Mln PKR
          </button>
        </div>

        <div className="panel-badge">PakESDA</div>
      </div>

      <div className="panel-content">
        {!formattedData || Object.keys(formattedData).length === 0 ? (
          <div style={{ color: '#475569', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>
            Data unavailable
          </div>
        ) : (
          <div className="minerals-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {FUEL_SOURCES.map(name => {
              const d = formattedData[name];
              if (!d) return null;
              
              const color = d.color;
              const spark = d.history.slice(-24);
              const pct = d.mom_change_pct;
              // Cost increase is BAD (red)
              const isPos = pct !== null && pct !== undefined && pct <= 0;

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
                        {!isPos ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        {pct > 0 ? '+' : ''}{pct.toFixed(2)}%
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

      <EnergyGenerationCostsModal
        isOpen={!!activeMetric}
        onClose={() => setActive(null)}
        metric={activeMetric}
        data={formattedData}
      />
    </div>
  );
};

export default EnergyGenerationCostProfilePanel;
