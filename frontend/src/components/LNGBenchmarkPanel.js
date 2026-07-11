import React, { useState, useEffect, useCallback } from 'react';
import { Globe, TrendingUp, TrendingDown, X } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const BENCH_COLORS = {
  jkm: '#F59E0B',
  ttf: '#38BDF8',
  henry_hub: '#A855F7',
};

const OIL_META = {
  BRENT_CRUDE_USD: { label: 'Brent', color: '#EF4444' },
  WTI_USD:         { label: 'WTI', color: '#F97316' },
  NATURAL_GAS_USD: { label: 'Nat Gas', color: '#22C55E' },
};

const BenchmarkModal = ({ benchmarks, history, onClose }) => {
  const [hiddenSeries, setHiddenSeries] = useState(new Set());
  const toggle = useCallback(k => { setHiddenSeries(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; }); }, []);
  const fields = [
    { key: 'jkm', label: 'JKM', color: BENCH_COLORS.jkm },
    { key: 'ttf', label: 'TTF', color: BENCH_COLORS.ttf },
    { key: 'henry_hub', label: 'US Henry Hub', color: BENCH_COLORS.henry_hub },
    { key: 'nbp', label: 'UK (NBP)', color: '#22C55E' },
    { key: 'jkm_hh_spread', label: 'JKM-HH Spread', color: '#EF4444' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="remittances-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">World LNG Benchmark Prices</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', padding: '1rem 1.25rem' }}>
          {fields.map(f => {
            const b = benchmarks?.[f.key];
            if (!b) return null;
            return (
              <div key={f.key} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.55rem', color: f.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>{f.label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>${b.value?.toFixed(2)}</div>
                <div style={{ fontSize: '0.55rem', color: 'var(--color-muted)', marginTop: '0.15rem' }}>{b.region}</div>
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
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--color-muted)" fontSize={10} />
              <YAxis stroke="var(--color-muted)" fontSize={10} tickFormatter={v => `$${v}`} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div className="remittances-tooltip">
                  <p className="tooltip-date">{label}</p>
                  {payload.filter(p => p.value != null).map((p, i) => (
                    <div key={i} style={{ color: p.fill, fontSize: '0.8rem', fontWeight: 600 }}>{p.name}: ${p.value?.toFixed(2)}/MMBtu</div>
                  ))}
                </div>) : null} />
              {!hiddenSeries.has('jkm') && <Bar dataKey="jkm" name="JKM" fill={BENCH_COLORS.jkm} opacity={0.85} />}
              {!hiddenSeries.has('ttf') && <Bar dataKey="ttf" name="TTF" fill={BENCH_COLORS.ttf} opacity={0.85} />}
              {!hiddenSeries.has('henry_hub') && <Bar dataKey="henry_hub" name="US Henry Hub" fill={BENCH_COLORS.henry_hub} opacity={0.85} />}
              {!hiddenSeries.has('nbp') && <Bar dataKey="nbp" name="UK (NBP)" fill="#22C55E" opacity={0.85} />}
              {!hiddenSeries.has('jkm_hh_spread') && <Bar dataKey="jkm_hh_spread" name="JKM-HH Spread" fill="#EF4444" opacity={0.85} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="modal-footer"><span>Source: lngpriceindex.com</span><span style={{ color: 'var(--color-text-muted)' }}>$/MMBtu</span></div>
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

  const oilCodes = ['BRENT_CRUDE_USD', 'WTI_USD', 'NATURAL_GAS_USD'];
  const benchKeys = [
    { key: 'jkm', label: 'JKM', color: BENCH_COLORS.jkm },
    { key: 'ttf', label: 'TTF', color: BENCH_COLORS.ttf },
    { key: 'henry_hub', label: 'US Henry Hub', color: BENCH_COLORS.henry_hub },
    { key: 'nbp', label: 'UK (NBP)', color: '#22C55E' },
    { key: 'jkm_hh_spread', label: 'JKM-HH Spread', color: '#EF4444' },
  ];

  const renderChange = (pct) => {
    if (pct === null || pct === undefined) return null;
    const isPos = pct >= 0;
    return (
      <span style={{ color: isPos ? 'var(--color-primary)' : '#EF4444', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
        {isPos ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
        {isPos ? '+' : ''}{typeof pct === 'number' ? pct.toFixed(1) : pct}%
      </span>
    );
  };

  return (
    <>
      <div className="panel" data-testid="lng-benchmark-panel">
        <div className="panel-header">
          <div className="panel-title"><Globe size={16} /> World LNG & Oil Prices</div>
          <span className="panel-badge">LIVE</span>
        </div>
        <div className="panel-content" style={{ maxHeight: 'none', padding: '0' }}>
          {loading ? (
            <div className="loading" style={{ padding: '2rem' }}><div className="spinner"></div></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#64748b', fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Commodity</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#64748b', fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Price</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#64748b', fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Change</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: '#64748b', fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Unit</th>
                </tr>
              </thead>
              <tbody>
                {/* Oil & Gas rows */}
                {oilData && oilCodes.map(code => {
                  const d = oilData[code];
                  if (!d) return null;
                  const meta = OIL_META[code];
                  const chg = d.changes_24h;
                  return (
                    <tr key={code} style={{ borderBottom: '1px solid rgba(30,41,59,0.5)' }}>
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ width: 4, height: 16, background: meta.color, borderRadius: 1, flexShrink: 0 }} />
                          <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{meta.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>
                        <span style={{ color: '#F8FAFC', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem' }}>
                          {d.formatted}
                        </span>
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>
                        {renderChange(chg?.percent)}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', color: '#64748b', fontSize: '0.6rem' }}>
                        /{d.unit}
                      </td>
                    </tr>
                  );
                })}

                {/* Separator */}
                <tr>
                  <td colSpan={4} style={{ padding: '0.15rem 0.75rem' }}>
                    <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.1rem' }} />
                    <div style={{ fontSize: '0.45rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '0.35rem' }}>
                      LNG Benchmarks (Weekly)
                    </div>
                  </td>
                </tr>

                {/* LNG Benchmark rows */}
                {benchmarks && benchKeys.map(bk => {
                  const b = benchmarks[bk.key];
                  if (!b) return null;
                  const chg = b.change_pct;
                  return (
                    <tr key={bk.key} style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }} onClick={() => setShowModal(true)}>
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ width: 4, height: 16, background: bk.color, borderRadius: 1, flexShrink: 0 }} />
                          <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{bk.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>
                        <span style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem' }}>
                          ${b.value?.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right' }}>
                        {renderChange(chg)}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', textAlign: 'right', color: 'var(--color-muted)', fontSize: '0.6rem' }}>
                        /MMBtu
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
