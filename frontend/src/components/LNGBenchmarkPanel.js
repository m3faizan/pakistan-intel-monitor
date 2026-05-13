import React, { useState, useEffect, useCallback } from 'react';
import { Globe, TrendingUp, TrendingDown, Droplets, Flame, X } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const BENCH_COLORS = {
  jkm: '#F59E0B',
  ttf: '#38BDF8',
  henry_hub: '#A855F7',
};

const OIL_META = {
  BRENT_CRUDE_USD: { label: 'Brent Crude', color: '#EF4444', icon: Droplets },
  WTI_USD:         { label: 'WTI Crude', color: '#F97316', icon: Droplets },
  NATURAL_GAS_USD: { label: 'Nat Gas (HH)', color: '#22C55E', icon: Flame },
};

const PriceCard = ({ label, value, unit, change, color, icon: Icon, onClick }) => {
  const chg = change !== null && change !== undefined;
  const isPos = chg && change >= 0;
  return (
    <div
      className={`economic-item ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ textAlign: 'center', padding: '0.6rem 0.35rem', borderLeft: `3px solid ${color}` }}
    >
      <div className="economic-label" style={{
        justifyContent: 'center', fontSize: '0.5rem', color,
        display: 'flex', alignItems: 'center', gap: '0.2rem',
      }}>
        {Icon && <Icon size={9} />}
        {label}
      </div>
      <div className="economic-value" style={{ fontSize: '1.1rem', justifyContent: 'center' }}>
        {value}
      </div>
      {chg && (
        <div className={`economic-change ${isPos ? 'positive' : 'negative'}`} style={{ justifyContent: 'center', fontSize: '0.55rem' }}>
          {isPos ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {isPos ? '+' : ''}{typeof change === 'number' ? change.toFixed(1) : change}%
        </div>
      )}
      <div className="economic-sublabel" style={{ textAlign: 'center', fontSize: '0.45rem' }}>{unit}</div>
    </div>
  );
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

  const oilCards = oilData
    ? ['BRENT_CRUDE_USD', 'WTI_USD', 'NATURAL_GAS_USD'].filter(k => oilData[k]).map(k => ({
        ...oilData[k],
        meta: OIL_META[k],
      }))
    : [];

  const benchCards = [
    { key: 'jkm', label: 'JKM (Asia)', color: BENCH_COLORS.jkm },
    { key: 'ttf', label: 'TTF (Europe)', color: BENCH_COLORS.ttf },
    { key: 'henry_hub', label: 'Henry Hub', color: BENCH_COLORS.henry_hub },
  ];

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
              {/* Oil & Gas section */}
              {oilCards.length > 0 && (
                <div style={{ marginBottom: '0.65rem' }}>
                  <div style={{ fontSize: '0.5rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                    Oil & Gas (OilPriceAPI)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                    {oilCards.map(c => (
                      <PriceCard
                        key={c.code}
                        label={c.meta.label}
                        value={c.formatted}
                        unit={`/${c.unit}`}
                        change={c.changes_24h?.percent}
                        color={c.meta.color}
                        icon={c.meta.icon}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* LNG Benchmarks section */}
              {benchmarks && (
                <div>
                  <div style={{ fontSize: '0.5rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                    LNG Benchmarks (Weekly)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                    {benchCards.map(c => {
                      const b = benchmarks[c.key];
                      if (!b) return null;
                      const prev = history.length > 1 ? history[history.length - 2]?.[c.key] : null;
                      const chg = b.value && prev && prev !== 0 ? ((b.value - prev) / prev * 100) : null;
                      return (
                        <PriceCard
                          key={c.key}
                          label={c.label}
                          value={`$${b.value?.toFixed(1)}`}
                          unit="$/MMBtu"
                          change={chg}
                          color={c.color}
                          onClick={() => setShowModal(true)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Source footer */}
              <div style={{ fontSize: '0.45rem', color: '#475569', textAlign: 'right', marginTop: '0.5rem', lineHeight: 1.6 }}>
                Oil: OilPriceAPI (live) | LNG: Global LNG Hub ({benchData?.latest_date || 'weekly'})
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
