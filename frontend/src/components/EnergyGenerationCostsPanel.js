import React, { useState, useEffect, useMemo } from 'react';
import { Coins, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import EnergyGenerationCostsModal from './EnergyGenerationCostsModal';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Ordered strictly as per user payload (excluding complex composite ones for simple grid display)
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

const EnergyGenerationCostsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActive] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/energy-generation-costs`);
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (e) {
        console.error('EnergyGenerationCosts error:', e);
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
    
    const result = {};
    
    // We also map the top PPP summary metrics directly for the modal reference
    const summaryMetrics = ['Requested PPP', 'Reference PPP', 'Allowed PPP'];
    
    [...FUEL_SOURCES, ...summaryMetrics].forEach(metric => {
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
        mom_change_pct = ((latest.value - previous.value) / Math.abs(previous.value)) * 100;
      } else if (previous && previous.value === 0 && latest.value === 0) {
        mom_change_pct = 0;
      }
      
      result[metric] = {
        history: sorted,
        latest,
        mom_change_pct,
        unit: 'PKR/kWh',
        color: SOURCE_COLORS[metric] || '#38BDF8'
      };
    });
    
    return result;
  }, [data]);

  if (loading) {
    return (
      <div className="panel" data-testid="energy-generation-costs-panel" style={{ gridColumn: 'span 2' }}>
        <div className="panel-header">
          <div className="panel-title"><Coins size={16} />Energy Generation Costs</div>
        </div>
        <div className="panel-content"><div className="loading"><div className="spinner"></div></div></div>
      </div>
    );
  }

  const fmtVal = (v) => {
    if (v === null || v === undefined) return '--';
    const n = Number(v);
    return n.toFixed(2);
  };
  
  const fmtDate = (d) => !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  // Top level card representation variables
  const reqPPP = formattedData['Requested PPP'];
  const refPPP = formattedData['Reference PPP'];
  const allPPP = formattedData['Allowed PPP'];

  return (
    <div className="panel" data-testid="energy-generation-costs-panel" style={{ gridColumn: 'span 2' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Coins size={16} />
          Energy Generation Costs
        </div>
        <div className="panel-badge">NEPRA</div>
      </div>

      <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {!formattedData || Object.keys(formattedData).length === 0 ? (
          <div style={{ color: '#475569', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>
            Data unavailable
          </div>
        ) : (
          <>
            {/* Top Level Summary Cards */}
            <div 
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', cursor: 'pointer' }}
              onClick={() => setActive('PPP_SUMMARY')}
            >
              {[
                { label: 'Reference PPP', data: refPPP, color: '#38bdf8' },
                { label: 'Requested PPP', data: reqPPP, color: '#f59e0b' },
                { label: 'Allowed PPP',   data: allPPP, color: '#22c55e' }
              ].map(card => (
                <div 
                  key={card.label} 
                  style={{ 
                    background: `rgba(${parseInt(card.color.slice(1,3), 16)}, ${parseInt(card.color.slice(3,5), 16)}, ${parseInt(card.color.slice(5,7), 16)}, 0.08)`, 
                    padding: '0.75rem', 
                    borderRadius: '6px', 
                    border: `1px solid ${card.color}40`,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = `rgba(${parseInt(card.color.slice(1,3), 16)}, ${parseInt(card.color.slice(3,5), 16)}, ${parseInt(card.color.slice(5,7), 16)}, 0.15)`}
                  onMouseLeave={e => e.currentTarget.style.background = `rgba(${parseInt(card.color.slice(1,3), 16)}, ${parseInt(card.color.slice(3,5), 16)}, ${parseInt(card.color.slice(5,7), 16)}, 0.08)`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                     <div style={{ fontSize: '0.65rem', color: card.color, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{card.label}</div>
                     <ExternalLink size={10} color={card.color} style={{ opacity: 0.5 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <div style={{ fontSize: '1.4rem', color: '#f8fafc', fontWeight: 'bold' }}>
                          {fmtVal(card.data?.latest?.value)} 
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400, marginLeft: '4px' }}>PKR/kWh</span>
                      </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '6px' }}>
                      {card.data?.mom_change_pct !== null && card.data?.mom_change_pct !== undefined ? (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: card.data.mom_change_pct > 0 ? '#ef4444' : '#22c55e', background: card.data.mom_change_pct > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                           {card.data.mom_change_pct > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                           {card.data.mom_change_pct > 0 ? '+' : ''}{card.data.mom_change_pct.toFixed(2)}%
                         </div>
                      ) : <div />}
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{fmtDate(card.data?.latest?.date)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sub-cards grid for specific fuel metrics */}
            <div className="minerals-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {FUEL_SOURCES.map(name => {
                const d = formattedData[name];
                if (!d) return null;
                
                const color = d.color;
                const spark = d.history.slice(-24);
                const pct = d.mom_change_pct;
                // An increase in cost is BAD (negative sentiment -> red)
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
          </>
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

export default EnergyGenerationCostsPanel;
