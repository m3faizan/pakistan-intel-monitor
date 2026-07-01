import React, { useState, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, Activity } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const TIME_RANGES = [
  { key: 'YTD', label: 'YTD',  months: null },
  { key: '1Y',  label: '1Y',   months: 12   },
  { key: '2Y',  label: '2Y',   months: 24   },
  { key: '5Y',  label: '5Y',   months: 60   },
  { key: '10Y', label: '10Y',  months: 120  },
  { key: 'ALL', label: 'All',  months: null },
];

const PowerGridMetricsModal = ({ isOpen, onClose, metric, data }) => {
  const [selectedRange, setSelectedRange] = useState('ALL');
  const [showPctChange, setShowPctChange] = useState(false);

  const filteredData = useMemo(() => {
    if (!data?.history) return [];
    const history = [...data.history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const now   = new Date();
    const range = TIME_RANGES.find(r => r.key === selectedRange);

    let filtered;
    if (selectedRange === 'YTD') {
      const yr = now.getFullYear();
      filtered = history.filter(p => new Date(p.date).getFullYear() === yr);
    } else if (selectedRange === 'ALL' || !range?.months) {
      filtered = history;
    } else {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - range.months);
      filtered = history.filter(p => new Date(p.date) >= cutoff);
    }

    return filtered.map((item, idx) => {
      let pct = 0;
      if (idx > 0) {
        const prev = filtered[idx - 1].value;
        if (prev && prev !== 0) pct = ((item.value - prev) / Math.abs(prev)) * 100;
      }
      return { ...item, pct_change: parseFloat(pct.toFixed(2)) };
    });
  }, [data, selectedRange]);

  const yoyChange = useMemo(() => {
    if (!data?.history || data.history.length < 13) return null;
    const sorted = [...data.history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest     = sorted[sorted.length - 1];
    const latestDate = new Date(latest.date);
    const target     = new Date(latestDate);
    target.setFullYear(target.getFullYear() - 1);
    let best = null, bestDiff = Infinity;
    for (const p of sorted) {
      const diff = Math.abs(new Date(p.date) - target);
      if (diff < bestDiff) { bestDiff = diff; best = p; }
    }
    if (!best || !best.value) return null;
    return ((latest.value - best.value) / Math.abs(best.value)) * 100;
  }, [data]);

  if (!isOpen || !data) return null;

  const latest   = data.latest;
  const momPct   = data.mom_change_pct;

  const isPosMom = momPct !== null && momPct >= 0;
  const isPosYoy = yoyChange !== null && yoyChange >= 0;

  const fmtVal = (v) => {
    if (v === null || v === undefined) return '--';
    const n = Number(v);
    if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
    if (n >= 1000)  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return n.toFixed(1);
  };

  const chartColor = data.color || '#38BDF8';

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="power-grid-metrics-modal">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 850 }}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>

        <div className="modal-header" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text)' }}>
                {metric}
              </h2>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: chartColor, lineHeight: 1 }}>
                    {fmtVal(latest?.value)} <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 400 }}>{data.unit}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                    <Calendar size={13} />
                    {latest?.date ? new Date(latest.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '--'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {momPct !== null && (
                    <div style={{
                      background: isPosMom ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: isPosMom ? '#22c55e' : '#ef4444',
                      padding: '0.4rem 0.75rem', borderRadius: '6px',
                      display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600
                    }}>
                      {isPosMom ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {isPosMom ? '+' : ''}{momPct.toFixed(2)}% <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 400 }}>MoM</span>
                    </div>
                  )}
                  {yoyChange !== null && (
                    <div style={{
                      background: isPosYoy ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: isPosYoy ? '#22c55e' : '#ef4444',
                      padding: '0.4rem 0.75rem', borderRadius: '6px',
                      display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600
                    }}>
                      {isPosYoy ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {isPosYoy ? '+' : ''}{yoyChange.toFixed(2)}% <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 400 }}>YoY</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="panel-badge" style={{ alignSelf: 'flex-start' }}>NEPRA / NTDC</div>
          </div>
        </div>

        <div className="modal-body" style={{ paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {TIME_RANGES.map(r => (
                <button
                  key={r.key}
                  onClick={() => setSelectedRange(r.key)}
                  style={{
                    background: selectedRange === r.key ? '#22c55e' : 'transparent',
                    color: selectedRange === r.key ? '#000' : '#64748b',
                    border: `1px solid ${selectedRange === r.key ? '#22c55e' : '#334155'}`,
                    padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: selectedRange === r.key ? 600 : 400
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowPctChange(false)}
                style={{
                  background: !showPctChange ? '#1e293b' : 'transparent',
                  color: !showPctChange ? '#f8fafc' : '#64748b',
                  border: `1px solid ${!showPctChange ? '#475569' : '#334155'}`,
                  padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer'
                }}
              >
                Actuals
              </button>
              <button
                onClick={() => setShowPctChange(true)}
                style={{
                  background: showPctChange ? '#1e293b' : 'transparent',
                  color: showPctChange ? '#f8fafc' : '#64748b',
                  border: `1px solid ${showPctChange ? '#475569' : '#334155'}`,
                  padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer'
                }}
              >
                % Chg
              </button>
            </div>
          </div>

          <div style={{ height: 350 }}>
            {filteredData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No data for selected range</div>
            ) : showPctChange ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })} tickMargin={10} minTickGap={30} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => `${v}%`} width={50} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px' }}
                    labelFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    formatter={v => [`${v}%`, 'MoM Change']}
                  />
                  <ReferenceLine y={0} stroke="#475569" />
                  <Bar dataKey="pct_change" radius={[2, 2, 0, 0]}>
                    {filteredData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.pct_change >= 0 ? '#22c55e' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })} tickMargin={10} minTickGap={30} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} width={50} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px' }}
                    labelFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    formatter={v => [v.toLocaleString(), data.unit]}
                  />
                  <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} fillOpacity={1} fill={`url(#gradient-${metric})`} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerGridMetricsModal;
