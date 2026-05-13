import React, { useState, useEffect, useCallback } from 'react';
import { Globe, TrendingUp, TrendingDown, Droplets, Flame, X } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const BENCH_COLORS = {
  jkm: '#F59E0B',
  ttf: '#38BDF8',
  henry_hub: '#A855F7',
};

const OIL_META = {
  BRENT_CRUDE_USD: { label: 'Brent Crude', color: '#EF4444', icon: Droplets },
  WTI_USD:         { label: 'WTI Crude', color: '#F97316', icon: Droplets },
  NATURAL_GAS_USD: { label: 'Natural Gas (HH)', color: '#22C55E', icon: Flame },
  DIESEL_USD:      { label: 'Diesel', color: '#64748B', icon: Droplets },
  GASOLINE_USD:    { label: 'Gasoline', color: '#EC4899', icon: Droplets },
};

const BenchmarkModal = ({ benchmarks, history, onClose }) => {
  const [hiddenSeries, setHiddenSeries] = useState(new Set());
  const toggle = useCallback(k => { setHiddenSeries(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; }); }, []);
  const fields = [
    { key: 'jkm', label: 'JKM (Asia)', color: BENCH_COLORS.jkm },
    { key: 'ttf', label: 'TTF (Europe)', color: BENCH_COLORS.ttf },
    { key: 'henry_hub', label: 'Henry Hub (US)', color: BENCH_COLORS.henry_hub },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="remittances-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">World LNG Benchmark Prices</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', padding: '1rem 1.25rem' }}>
          {fields.map(f => {
            const b = benchmarks?.[f.key];
            if (!b) return null;
            return (
              <div key={f.key} style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--color-border)', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.55rem', color: f.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>{f.label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#F8FAFC', fontFamily: 'var(--font-mono)' }}>${b.value?.toFixed(1)}</div>
                <div style={{ fontSize: '0.55rem', color: '#64748b', marginTop: '0.15rem' }}>{b.region} - {b.delivery}</div>
              </div>
            );
          })}
        </div>
        <div className="time-range-selector" style={{ flexWrap: 'wrap', marginBottom: '0.45rem', gap: '0.3rem' }}>
          {fields.map(f => (
            <button key={f.key} className={`range-btn ${!hiddenSeries.has(f.key) ? 'active' : ''}`} onClick={() => toggle(f.key)}
              style={{ opacity: hiddenSeries.has(f.key) ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, display: 'inline-block' }} />{f.label}
            </button>
          ))}
        </div>
        <div className="chart-container" style={{ padding: '1rem' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={history} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.6)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={v => `$${v}`} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div className="remittances-tooltip">
                  <p className="tooltip-date">{label}</p>
                  {payload.filter(p => p.value != null).map((p, i) => (
                    <div key={i} style={{ color: p.fill, fontSize: '0.8rem', fontWeight: 600 }}>{p.name}: ${p.value?.toFixed(1)}/MMBtu</div>
                  ))}
                </div>) : null} />
              {!hiddenSeries.has('jkm') && <Bar dataKey="jkm" name="JKM (Asia)" fill={BENCH_COLORS.jkm} opacity={0.85} />}
              {!hiddenSeries.has('ttf') && <Bar dataKey="ttf" name="TTF (Europe)" fill={BENCH_COLORS.ttf} opacity={0.85} />}
              {!hiddenSeries.has('henry_hub') && <Bar dataKey="henry_hub" name="Henry Hub (US)" fill={BENCH_COLORS.henry_hub} opacity={0.85} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="modal-footer"><span>Source: Global LNG Hub</span><span style={{ color: '#94a3b8' }}>Unit: $/MMBtu</span></div>
      </div>
    </div>
  );
};

const LNGBenchmarkPanel = () => {
  const [benchData, setBenchData] = useState(null);
  const [oilData, setOilData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [benchRes, oilRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/lng/benchmarks`),
          axios.get(`${API_BASE}/api/lng/oil-prices`),
        ]);
        if (benchRes.status === 'fulfilled') setBenchData(benchRes.value.data.data);
        if (oilRes.status === 'fulfilled') setOilData(oilRes.value.data.data);
      } catch (e) {
        console.error('Benchmark error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 300000);
    return () => clearInterval(iv);
  }, []);

  const benchmarks = benchData?.benchmarks;
  const history = benchData?.history || [];

  const benchCards = [
    { key: 'jkm', label: 'JKM (Asia)', color: BENCH_COLORS.jkm },
    { key: 'ttf', label: 'TTF (Europe)', color: BENCH_COLORS.ttf },
    { key: 'henry_hub', label: 'Henry Hub', color: BENCH_COLORS.henry_hub },
  ];

  // Oil price cards - only show the key ones
  const oilCards = oilData ? ['BRENT_CRUDE_USD', 'WTI_USD', 'NATURAL_GAS_USD'].filter(k => oilData[k]).map(k => ({
    ...oilData[k],
    meta: OIL_META[k],
  })) : [];

  return (
    <>
      <div className="panel" data-testid="lng-benchmark-panel">
        <div className="panel-header">
          <div className="panel-title"><Globe size={16} /> World LNG & Oil Prices</div>
          <span className="panel-badge">LIVE</span>
        </div>
        <div className="panel-content" style={{ maxHeight: 'none', padding: '0.75rem' }}>
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <>
              {/* Oil Prices row */}
              {oilCards.length > 0 && (
                <div style={{ marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.5rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
                    Oil & Gas (OilPriceAPI)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${oilCards.length}, 1fr)`, gap: '0.4rem' }}>
                    {oilCards.map(c => {
                      const chg = c.changes_24h;
                      const isPos = chg && chg.percent >= 0;
                      const Icon = c.meta.icon;
                      return (
                        <div key={c.code} className="economic-item" data-testid={`oil-${c.code.toLowerCase()}`}
                          style={{ textAlign: 'center', padding: '0.5rem 0.3rem', borderLeft: `3px solid ${c.meta.color}` }}>
                          <div className="economic-label" style={{ justifyContent: 'center', fontSize: '0.5rem', color: c.meta.color, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Icon size={9} />{c.meta.label}
                          </div>
                          <div className="economic-value" style={{ fontSize: '1.1rem', justifyContent: 'center' }}>{c.formatted}</div>
                          {chg && (
                            <div className={`economic-change ${isPos ? 'positive' : 'negative'}`} style={{ justifyContent: 'center', fontSize: '0.55rem' }}>
                              {isPos ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                              {isPos ? '+' : ''}{chg.percent}%
                            </div>
                          )}
                          <div className="economic-sublabel" style={{ textAlign: 'center', fontSize: '0.45rem' }}>/{c.unit}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LNG Benchmarks row */}
              {benchmarks && (
                <div>
                  <div style={{ fontSize: '0.5rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
                    LNG Benchmarks (Weekly)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    {benchCards.map(c => {
                      const b = benchmarks[c.key];
                      if (!b) return null;
                      const prev = history.length > 1 ? history[history.length - 2]?.[c.key] : null;
                      const chg = b.value && prev && prev !== 0 ? ((b.value - prev) / prev * 100) : null;
                      const isPos = chg !== null && chg >= 0;
                      return (
                        <div key={c.key} className="economic-item clickable" data-testid={`lng-bench-${c.key}`} onClick={() => setShowModal(true)}
                          style={{ textAlign: 'center', padding: '0.5rem 0.3rem', borderLeft: `3px solid ${c.color}` }}>
                          <div className="economic-label" style={{ justifyContent: 'center', fontSize: '0.5rem', color: c.color }}>{c.label}</div>
                          <div className="economic-value" style={{ fontSize: '1.1rem', justifyContent: 'center' }}>${b.value?.toFixed(1)}</div>
                          {chg !== null && (
                            <div className={`economic-change ${isPos ? 'positive' : 'negative'}`} style={{ justifyContent: 'center', fontSize: '0.55rem' }}>
                              {isPos ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                              {isPos ? '+' : ''}{chg.toFixed(1)}% WoW
                            </div>
                          )}
                          <div className="economic-sublabel" style={{ textAlign: 'center', fontSize: '0.45rem' }}>$/MMBtu</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mini sparkline */}
                  {history.length > 1 && (
                    <div style={{ height: 60 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history}>
                          <XAxis dataKey="date" hide />
                          <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                          <Line dataKey="jkm" stroke={BENCH_COLORS.jkm} strokeWidth={2} dot={false} connectNulls />
                          <Line dataKey="ttf" stroke={BENCH_COLORS.ttf} strokeWidth={2} dot={false} connectNulls />
                          <Line dataKey="henry_hub" stroke={BENCH_COLORS.henry_hub} strokeWidth={2} dot={false} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div style={{ fontSize: '0.45rem', color: '#475569', textAlign: 'right', marginTop: '0.3rem' }}>
                Oil: OilPriceAPI (live) - LNG: Global LNG Hub ({benchData?.latest_date || 'weekly'})
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && benchmarks && (
        <BenchmarkModal benchmarks={benchmarks} history={history} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};

export default LNGBenchmarkPanel;
