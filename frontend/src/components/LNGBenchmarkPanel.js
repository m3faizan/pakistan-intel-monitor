import React, { useState, useEffect, useMemo } from 'react';
import { Globe, TrendingUp, TrendingDown, X, Calendar } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const BENCH_COLORS = {
  jkm: '#F59E0B',
  ttf: '#38BDF8',
  henry_hub: '#A855F7',
};

const BenchmarkModal = ({ benchmarks, history, onClose }) => {
  const [hiddenSeries, setHiddenSeries] = useState(new Set());
  const toggle = k => { setHiddenSeries(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; }); };

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

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', padding: '1rem 1.25rem' }}>
          {fields.map(f => {
            const b = benchmarks?.[f.key];
            if (!b) return null;
            return (
              <div key={f.key} style={{
                background: 'rgba(15,23,42,0.6)', border: '1px solid var(--color-border)',
                padding: '0.75rem', textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.55rem', color: f.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
                  {f.label}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#F8FAFC', fontFamily: 'var(--font-mono)' }}>
                  ${b.value?.toFixed(1)}
                </div>
                <div style={{ fontSize: '0.55rem', color: '#64748b', marginTop: '0.15rem' }}>
                  {b.region} • {b.delivery}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="time-range-selector" style={{ flexWrap: 'wrap', marginBottom: '0.45rem', gap: '0.3rem' }}>
          {fields.map(f => (
            <button key={f.key} className={`range-btn ${!hiddenSeries.has(f.key) ? 'active' : ''}`} onClick={() => toggle(f.key)}
              style={{ opacity: hiddenSeries.has(f.key) ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, display: 'inline-block' }} />
              {f.label}
            </button>
          ))}
        </div>

        {/* Chart */}
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/lng/benchmarks`);
        setData(res.data.data);
      } catch (e) {
        console.error('Benchmark error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 3600000);
    return () => clearInterval(iv);
  }, []);

  const benchmarks = data?.benchmarks;
  const history = data?.history || [];

  const cards = [
    { key: 'jkm', label: 'JKM (Asia)', color: BENCH_COLORS.jkm, flag: '🌏' },
    { key: 'ttf', label: 'TTF (Europe)', color: BENCH_COLORS.ttf, flag: '🌍' },
    { key: 'henry_hub', label: 'Henry Hub', color: BENCH_COLORS.henry_hub, flag: '🌎' },
  ];

  return (
    <>
      <div className="panel" data-testid="lng-benchmark-panel">
        <div className="panel-header">
          <div className="panel-title"><Globe size={16} /> World LNG Benchmarks</div>
          <span className="panel-badge">WEEKLY</span>
        </div>
        <div className="panel-content" style={{ maxHeight: 'none', padding: '0.75rem' }}>
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : !benchmarks ? (
            <div style={{ color: '#64748b', fontSize: '0.7rem', textAlign: 'center', padding: '1rem' }}>
              Benchmark data unavailable
            </div>
          ) : (
            <>
              {/* Price cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {cards.map(c => {
                  const b = benchmarks[c.key];
                  if (!b) return null;
                  // Compute WoW change from history
                  const prev = history.length > 1 ? history[history.length - 2]?.[c.key] : null;
                  const chg = b.value && prev && prev !== 0 ? ((b.value - prev) / prev * 100) : null;
                  const isPos = chg !== null && chg >= 0;
                  return (
                    <div
                      key={c.key}
                      className="economic-item clickable"
                      data-testid={`lng-bench-${c.key}`}
                      onClick={() => setShowModal(true)}
                      style={{ textAlign: 'center', padding: '0.65rem 0.4rem', borderLeft: `3px solid ${c.color}` }}
                    >
                      <div className="economic-label" style={{ justifyContent: 'center', fontSize: '0.55rem', color: c.color }}>
                        {c.label}
                      </div>
                      <div className="economic-value" style={{ fontSize: '1.3rem', justifyContent: 'center' }}>
                        ${b.value?.toFixed(1)}
                      </div>
                      {chg !== null && (
                        <div className={`economic-change ${isPos ? 'positive' : 'negative'}`} style={{ justifyContent: 'center' }}>
                          {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {isPos ? '+' : ''}{chg.toFixed(1)}% WoW
                        </div>
                      )}
                      <div className="economic-sublabel" style={{ textAlign: 'center' }}>$/MMBtu</div>
                    </div>
                  );
                })}
              </div>

              {/* Mini sparkline comparison */}
              {history.length > 1 && (
                <div style={{ height: 80 }}>
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

              {/* Footer */}
              <div style={{ fontSize: '0.5rem', color: '#475569', textAlign: 'right', marginTop: '0.3rem' }}>
                Updated: {data?.latest_date} • Source: Global LNG Hub
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
