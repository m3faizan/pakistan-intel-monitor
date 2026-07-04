import React, { useState, useEffect, useMemo } from 'react';
import { Zap, TrendingUp, TrendingDown, Calendar, X, DollarSign } from 'lucide-react';
import axios from 'axios';
import {
  AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';
const RANGES = ['YTD', '6M', '1Y', '2Y', '3Y', 'ALL'];

const filterByRange = (data, range) => {
  if (range === 'ALL') return data;
  const now = new Date();
  let cutoff;
  if (range === 'YTD') cutoff = new Date(now.getFullYear(), 0, 1);
  else if (range === '6M') { cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() - 6); }
  else { cutoff = new Date(now); cutoff.setFullYear(cutoff.getFullYear() - parseInt(range)); }
  return data.filter(d => new Date(d.date) >= cutoff);
};
const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
const fmtMonth = d => new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const GenModal = ({ title, genData, onClose }) => {
  const [range, setRange] = useState('ALL');
  const [showPct, setShowPct] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState(new Set());

  const history = genData?.history || [];
  const filtered = useMemo(() => filterByRange(history, range), [history, range]);
  const pctData = useMemo(() => filtered.map((r, i) => {
    if (i === 0) return { ...r, pct_change: 0 };
    const prev = filtered[i - 1].rlng ?? 0;
    const cur = r.rlng ?? 0;
    return { ...r, pct_change: prev !== 0 ? parseFloat(((cur - prev) / prev * 100).toFixed(2)) : 0 };
  }), [filtered]);

  const toggle = k => setHiddenSeries(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const fields = [
    { key: 'rlng', label: 'RLNG Generation', color: '#F59E0B' },
    { key: 'total', label: 'Total Generation', color: '#38BDF8' },
  ];
  const visible = fields.filter(f => !hiddenSeries.has(f.key));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="remittances-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        {!showPct && genData?.latest && (
          <div className="modal-summary">
            <div className="summary-main">
              <div className="summary-value">{genData.latest.rlng?.toLocaleString()} GWh</div>
              <div className="summary-period"><Calendar size={14} /> {fmtMonth(genData.latest.date)}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                {genData.latest.share}% of total mix
              </div>
            </div>
            {genData.mom_rlng !== null && (
              <div className="summary-changes">
                <div className={`summary-change ${genData.mom_rlng >= 0 ? 'positive' : 'negative'}`}>
                  {genData.mom_rlng >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{genData.mom_rlng >= 0 ? '+' : ''}{genData.mom_rlng.toFixed(2)}%</span>
                  <span className="change-label">MoM</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="time-range-selector" style={{ marginBottom: '0.35rem' }}>
          {RANGES.map(r => <button key={r} className={`range-btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r}</button>)}
          <button className={`range-btn ${showPct ? 'active' : ''}`} onClick={() => setShowPct(p => !p)} style={{ marginLeft: 'auto', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}>% Change</button>
        </div>
        {!showPct && (
          <div className="time-range-selector" style={{ flexWrap: 'wrap', marginBottom: '0.45rem', gap: '0.3rem' }}>
            {fields.map(f => (
              <button key={f.key} className={`range-btn ${!hiddenSeries.has(f.key) ? 'active' : ''}`} onClick={() => toggle(f.key)}
                style={{ opacity: hiddenSeries.has(f.key) ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, display: 'inline-block' }} />
                {f.label}
              </button>
            ))}
          </div>
        )}

        <div className="chart-container" style={{ padding: '1rem' }}>
          <ResponsiveContainer width="100%" height={300}>
            {showPct ? (
              <ComposedChart data={pctData}>
                <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke='var(--color-muted)' fontSize={10} />
                <YAxis tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} stroke='var(--color-muted)' fontSize={10} width={56} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="remittances-tooltip"><p className="tooltip-date">{fmtMonth(label)}</p>
                    <p style={{ color: payload[0]?.value >= 0 ? '#22C55E' : '#EF4444', fontSize: '0.8rem' }}>MoM: {payload[0]?.value >= 0 ? '+' : ''}{payload[0]?.value?.toFixed(2)}%</p>
                  </div>) : null} />
                <Bar dataKey="pct_change" radius={[2, 2, 0, 0]} maxBarSize={18}>
                  {pctData.map((e, i) => <Cell key={i} fill={e.pct_change >= 0 ? '#22C55E' : '#EF4444'} fillOpacity={0.85} />)}
                </Bar>
              </ComposedChart>
            ) : (
              <AreaChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.6)" />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke='var(--color-muted)' fontSize={10} />
                <YAxis stroke='var(--color-muted)' fontSize={10} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="remittances-tooltip"><p className="tooltip-date">{fmtMonth(label)}</p>
                    {payload.filter(p => p.value != null).map((p, i) => <div key={i} style={{ color: p.color || p.stroke, fontSize: '0.8rem', fontWeight: 600 }}>{p.name}: {p.value?.toLocaleString()} GWh</div>)}
                  </div>) : null} />
                {visible.map(f => <Area key={f.key} dataKey={f.key} name={f.label} stroke={f.color} fill={f.color} fillOpacity={0.12} strokeWidth={2} connectNulls />)}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="modal-footer"><span>Source: State Bank of Pakistan</span><span style={{ color: 'var(--color-text-muted)' }}>Unit: GWh</span></div>
      </div>
    </div>
  );
};

const PaymentModal = ({ pmtData, onClose }) => {
  const [range, setRange] = useState('ALL');
  const [showPct, setShowPct] = useState(false);

  const history = pmtData?.history || [];
  const filtered = useMemo(() => filterByRange(history, range), [history, range]);
  const pctData = useMemo(() => filtered.map((r, i) => {
    if (i === 0) return { ...r, pct_change: 0 };
    const prev = filtered[i - 1].value ?? 0;
    return { ...r, pct_change: prev !== 0 ? parseFloat(((r.value - prev) / prev * 100).toFixed(2)) : 0 };
  }), [filtered]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="remittances-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">LNG Import Payment (SBP)</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        {!showPct && pmtData?.latest && (
          <div className="modal-summary">
            <div className="summary-main">
              <div className="summary-value">${(pmtData.latest.value / 1000).toFixed(1)}M</div>
              <div className="summary-period"><Calendar size={14} /> {pmtData.latest.month}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>Million USD</div>
            </div>
            {pmtData.mom_change_pct !== null && (
              <div className="summary-changes">
                <div className={`summary-change ${pmtData.mom_change_pct >= 0 ? 'positive' : 'negative'}`}>
                  {pmtData.mom_change_pct >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{pmtData.mom_change_pct >= 0 ? '+' : ''}{pmtData.mom_change_pct.toFixed(2)}%</span>
                  <span className="change-label">MoM</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="time-range-selector" style={{ marginBottom: '0.35rem' }}>
          {RANGES.map(r => <button key={r} className={`range-btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r}</button>)}
          <button className={`range-btn ${showPct ? 'active' : ''}`} onClick={() => setShowPct(p => !p)} style={{ marginLeft: 'auto', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}>% Change</button>
        </div>
        {!showPct && (
          <div className="time-range-selector" style={{ flexWrap: 'wrap', marginBottom: '0.45rem', gap: '0.3rem' }}>
            <button className="range-btn active" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />LNG Payments
            </button>
          </div>
        )}
        <div className="chart-container" style={{ padding: '1rem' }}>
          <ResponsiveContainer width="100%" height={300}>
            {showPct ? (
              <ComposedChart data={pctData}>
                <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke='var(--color-muted)' fontSize={10} />
                <YAxis tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} stroke='var(--color-muted)' fontSize={10} width={56} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="remittances-tooltip"><p className="tooltip-date">{fmtMonth(label)}</p>
                    <p style={{ color: payload[0]?.value >= 0 ? '#22C55E' : '#EF4444', fontSize: '0.8rem' }}>MoM: {payload[0]?.value >= 0 ? '+' : ''}{payload[0]?.value?.toFixed(2)}%</p>
                  </div>) : null} />
                <Bar dataKey="pct_change" radius={[2, 2, 0, 0]} maxBarSize={18}>
                  {pctData.map((e, i) => <Cell key={i} fill={e.pct_change >= 0 ? '#22C55E' : '#EF4444'} fillOpacity={0.85} />)}
                </Bar>
              </ComposedChart>
            ) : (
              <AreaChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.6)" />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke='var(--color-muted)' fontSize={10} />
                <YAxis stroke='var(--color-muted)' fontSize={10} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="remittances-tooltip"><p className="tooltip-date">{fmtMonth(label)}</p>
                    {payload.filter(p => p.value != null).map((p, i) => <div key={i} style={{ color: p.color || p.stroke, fontSize: '0.8rem', fontWeight: 600 }}>{p.name}: ${(p.value / 1000).toFixed(1)}M</div>)}
                  </div>) : null} />
                <Area dataKey="value" name="LNG Payment" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} strokeWidth={2} connectNulls />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="modal-footer"><span>Source: State Bank of Pakistan</span><span style={{ color: 'var(--color-text-muted)' }}>Unit: Million USD</span></div>
      </div>
    </div>
  );
};

const LNGGenerationPanel = () => {
  const [genData, setGenData] = useState(null);
  const [pmtData, setPmtData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [genRes, pmtRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/lng/generation`),
          axios.get(`${API_BASE}/api/lng/import-payments`),
        ]);
        if (genRes.status === 'fulfilled') setGenData(genRes.value.data.data);
        if (pmtRes.status === 'fulfilled') setPmtData(pmtRes.value.data.data);
      } catch (e) {
        console.error('LNG Generation error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 3600000);
    return () => clearInterval(iv);
  }, []);

  const latest = genData?.latest;
  const costData = pmtData?.latest;

  const fmtDateShort = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

  const metrics = [
    {
      label: 'RLNG Generation',
      value: latest ? `${latest.rlng?.toLocaleString()} GWh` : 'N/A',
      change: genData?.mom_rlng,
      sub: fmtDateShort(latest?.date),
      icon: Zap,
      onClick: () => setModal('gen'),
    },
    {
      label: 'RLNG in Mix',
      value: latest?.share ? `${latest.share}%` : 'N/A',
      change: null,
      sub: `of ${latest?.total?.toLocaleString() || 'N/A'} GWh total`,
      icon: Zap,
      onClick: () => setModal('gen'),
    },
    {
      label: 'LNG Import Payment',
      value: costData ? `$${(costData.value / 1000).toFixed(1)}M` : 'N/A',
      change: pmtData?.mom_change_pct,
      sub: costData?.month || '',
      icon: DollarSign,
      onClick: () => setModal('pmt'),
    },
  ];

  return (
    <>
      <div className="panel" data-testid="lng-generation-panel">
        <div className="panel-header">
          <div className="panel-title"><Zap size={16} /> LNG Generation</div>
          <span className="panel-badge">SBP</span>
        </div>
        <div className="panel-content" style={{ maxHeight: 'none', padding: '0.75rem' }}>
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {metrics.map(m => {
                const chg = m.change !== null && m.change !== undefined;
                const pos = chg && m.change >= 0;
                return (
                  <div key={m.label} className="economic-item clickable" onClick={m.onClick}
                    data-testid={`lng-gen-${m.label.toLowerCase().replace(/\s+/g, '-')}`}
                    style={{ textAlign: 'center', padding: '0.7rem 0.5rem' }}>
                    <div className="economic-label" style={{ justifyContent: 'center', fontSize: '0.55rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <m.icon size={10} style={{ color: '#22C55E' }} />{m.label}
                    </div>
                    <div className="economic-value" style={{ fontSize: '1.15rem', justifyContent: 'center' }}>{m.value}</div>
                    {chg && (
                      <div className={`economic-change ${pos ? 'positive' : 'negative'}`} style={{ justifyContent: 'center' }}>
                        {pos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {pos ? '+' : ''}{m.change.toFixed(2)}%
                      </div>
                    )}
                    {m.sub && <div className="economic-sublabel" style={{ textAlign: 'center' }}>{m.sub}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {modal === 'gen' && genData && <GenModal title="RLNG Power Generation" genData={genData} onClose={() => setModal(null)} />}
      {modal === 'pmt' && pmtData && <PaymentModal pmtData={pmtData} onClose={() => setModal(null)} />}
    </>
  );
};

export default LNGGenerationPanel;
