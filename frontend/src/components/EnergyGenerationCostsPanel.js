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
  'Coal-Imported': '#57534E',
  'Net Delivered': '#22C55E'
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
    const summaryMetrics = ['Requested PPP', 'Reference PPP', 'Allowed PPP', 'Net Delivered'];
    
    // Create derived delta series
    const reqDeltaHistory = [];
    const allDeltaHistory = [];
    
    data.forEach(d => {
        if (d['Requested PPP'] !== undefined && d['Reference PPP'] !== undefined) {
            reqDeltaHistory.push({ date: d.date, value: d['Requested PPP'] - d['Reference PPP'] });
        }
        if (d['Allowed PPP'] !== undefined && d['Reference PPP'] !== undefined) {
            allDeltaHistory.push({ date: d.date, value: d['Allowed PPP'] - d['Reference PPP'] });
        }
    });

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
        unit: 'PKR/kWh',
        color: color
      };
    };

    [...FUEL_SOURCES, ...summaryMetrics].forEach(metric => {
      const history = data.map(d => ({ date: d.date, value: d[metric] })).filter(d => d.value !== undefined && d.value !== null);
      processSeries(metric, history, SOURCE_COLORS[metric] || '#38BDF8');
    });
    
    processSeries('Requested Delta', reqDeltaHistory, '#f43f5e');
    processSeries('Allowed Delta', allDeltaHistory, '#10b981');
    
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

  // Calculate highest & lowest generation sources based on latest month
  let minFuel = { name: '--', value: Infinity, color: '#94a3b8' };
  let maxFuel = { name: '--', value: -Infinity, color: '#94a3b8' };
  
  if (data && data.length > 0) {
      const latestDataPoint = data[data.length - 1];
      FUEL_SOURCES.forEach(fuel => {
          const val = latestDataPoint[fuel];
          if (val !== undefined && val !== null) {
              if (val < minFuel.value) minFuel = { name: fuel, value: val, color: SOURCE_COLORS[fuel] };
              if (val > maxFuel.value) maxFuel = { name: fuel, value: val, color: SOURCE_COLORS[fuel] };
          }
      });
  }

  const reqPPP = formattedData['Requested PPP'];
  const allPPP = formattedData['Allowed PPP'];
  const reqDelta = formattedData['Requested Delta'];
  const allDelta = formattedData['Allowed Delta'];
  const netDelivered = formattedData['Net Delivered'];

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              
              {/* Card 1: Net Delivered */}
              <div 
                style={{ 
                    background: 'rgba(34, 197, 94, 0.08)', 
                    padding: '0.75rem', 
                    borderRadius: '6px', 
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                     <div style={{ fontSize: '0.65rem', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Net Delivered Power Cost</div>
                 </div>

                 {netDelivered?.history?.length > 1 && (
                    <div style={{ height: 28, margin: '4px 0 6px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={netDelivered.history.slice(-24)}>
                          <Line type="monotone" dataKey="value" stroke={netDelivered.mom_change_pct <= 0 ? '#22C55E' : '#EF4444'} strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                 )}

                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <div style={{ fontSize: '1.4rem', color: '#f8fafc', fontWeight: 'bold' }}>
                       {fmtVal(netDelivered?.latest?.value)} 
                       <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400, marginLeft: '4px' }}>PKR/kWh</span>
                    </div>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '6px' }}>
                     {netDelivered?.mom_change_pct !== null && netDelivered?.mom_change_pct !== undefined ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: netDelivered.mom_change_pct > 0 ? '#ef4444' : '#22c55e', background: netDelivered.mom_change_pct > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          {netDelivered.mom_change_pct > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {netDelivered.mom_change_pct > 0 ? '+' : ''}{netDelivered.mom_change_pct.toFixed(2)}%
                        </div>
                     ) : <div />}
                     <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{fmtDate(netDelivered?.latest?.date)}</div>
                 </div>
              </div>

              {/* Card 2: Highest & Lowest Sources */}
              <div 
                style={{ 
                    background: 'rgba(168, 85, 247, 0.08)', 
                    padding: '0.75rem', 
                    borderRadius: '6px', 
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}
              >
                 <div style={{ fontSize: '0.65rem', color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '6px' }}>
                    Generation Cost Range
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Highest <span style={{ color: maxFuel.color, fontWeight: 500 }}>({maxFuel.name})</span></span>
                       <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ef4444' }}>{fmtVal(maxFuel.value)} <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 400 }}>PKR</span></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Lowest <span style={{ color: minFuel.color, fontWeight: 500 }}>({minFuel.name})</span></span>
                       <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#22c55e' }}>{fmtVal(minFuel.value)} <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 400 }}>PKR</span></span>
                    </div>
                 </div>
              </div>

              {/* Card 3: Fuel Adjustments (PPP) */}
              <div 
                onClick={() => setActive('PPP_SUMMARY')}
                style={{ 
                    background: 'rgba(245, 158, 11, 0.08)', 
                    padding: '0.75rem', 
                    borderRadius: '6px', 
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)'}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontSize: '0.65rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Fuel Adjustments (PPP)</div>
                    <ExternalLink size={10} color="#f59e0b" style={{ opacity: 0.5 }} />
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                    <div>
                       <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '2px' }}>Requested</div>
                       <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f59e0b' }}>{fmtVal(reqPPP?.latest?.value)}</div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', height: '25px', margin: '0 10px' }} />
                    <div>
                       <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '2px' }}>Allowed</div>
                       <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#22c55e' }}>{fmtVal(allPPP?.latest?.value)}</div>
                    </div>
                 </div>
              </div>

              {/* Card 4: Fuel Adjustments Delta */}
              <div 
                style={{ 
                    background: 'rgba(244, 63, 94, 0.08)', 
                    padding: '0.75rem', 
                    borderRadius: '6px', 
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}
              >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontSize: '0.65rem', color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Adjustments Delta</div>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                    <div>
                       <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '2px' }}>Requested</div>
                       <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: reqDelta?.latest?.value > 0 ? '#ef4444' : '#22c55e' }}>{reqDelta?.latest?.value > 0 ? '+' : ''}{fmtVal(reqDelta?.latest?.value)}</div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', height: '25px', margin: '0 10px' }} />
                    <div>
                       <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '2px' }}>Allowed</div>
                       <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: allDelta?.latest?.value > 0 ? '#ef4444' : '#22c55e' }}>{allDelta?.latest?.value > 0 ? '+' : ''}{fmtVal(allDelta?.latest?.value)}</div>
                    </div>
                 </div>
              </div>

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
