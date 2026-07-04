import React, { useEffect, useMemo, useState } from 'react';
import { X, Flame, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart,
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, Line, Cell
} from 'recharts';

const TIME_RANGES = [
  { key: '1Y',  label: '1Y',  months: 12  },
  { key: '2Y',  label: '2Y',  months: 24  },
  { key: '5Y',  label: '5Y',  months: 60  },
  { key: 'ALL', label: 'All', months: null },
];

const COLORS = ['#22C55E', '#38BDF8', '#F59E0B', '#A855F7', '#EC4899', '#14B8A6', '#F97316'];

const PolSalesModal = ({ isOpen, onClose, data, title }) => {
  const [selectedRange, setSelectedRange] = useState('ALL');
  const [showPct, setShowPct]             = useState(false);
  const [visibleSeries, setVisibleSeries] = useState({ total: true });

  const categories = data?.categories || [];

  useEffect(() => {
    if (!isOpen) return;
    setSelectedRange('ALL');
    setShowPct(false);
    const next = { total: true };
    categories.forEach(cat => { next[cat.key] = true; });
    setVisibleSeries(next);
  }, [isOpen, categories.length]); // eslint-disable-line

  const filteredData = useMemo(() => {
    if (!data?.history) return [];
    const history = [...data.history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const range = TIME_RANGES.find(r => r.key === selectedRange);
    if (!range?.months) return history;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - range.months);
    return history.filter(item => new Date(item.date) >= cutoff);
  }, [data, selectedRange]);

  // Compute MoM % change on total for % change view
  const pctData = useMemo(() =>
    filteredData.map((row, i) => {
      if (i === 0) return { ...row, pct_change: 0 };
      const prev = filteredData[i - 1].total ?? 0;
      const cur  = row.total ?? 0;
      return { ...row, pct_change: prev !== 0 ? parseFloat(((cur - prev) / prev * 100).toFixed(2)) : 0 };
    }),
    [filteredData]
  );

  if (!isOpen || !data) return null;

  const latest    = data?.latest;
  const momChange = data?.mom_change_pct;

  const fmtDate  = s => new Date(s).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  const fmtMonth = s => new Date(s).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const toggleSeries = key => {
    setVisibleSeries(prev => {
      const active = Object.values(prev).filter(Boolean).length;
      if (prev[key] && active === 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="remittances-tooltip" style={{ minWidth: 200 }}>
        <p className="tooltip-date">{fmtMonth(label)}</p>
        {showPct ? (
          <p style={{ color: (payload[0]?.value ?? 0) >= 0 ? '#22C55E' : '#EF4444', fontSize: '0.8rem' }}>
            MoM: {(payload[0]?.value ?? 0) >= 0 ? '+' : ''}{(payload[0]?.value ?? 0).toFixed(2)}%
          </p>
        ) : (
          payload.map(entry => (
            <p key={entry.dataKey} style={{ color: entry.fill || entry.color, fontSize: '0.78rem', margin: '1px 0' }}>
              {entry.name}: {(entry.value ?? 0).toLocaleString()} MT
            </p>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="pol-sales-modal-overlay">
      <div className="remittances-modal" onClick={e => e.stopPropagation()} data-testid="pol-sales-modal">

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title" data-testid="pol-sales-modal-title">
            <Flame size={20} />
            <span>{title || 'POL Sales'}</span>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: data?.stale ? '#F59E0B' : '#22C55E',
              display: 'inline-block', marginLeft: 6,
              animation: 'pulse 2s infinite'
            }} />
          </div>
          <button className="modal-close" onClick={onClose} data-testid="pol-sales-modal-close">
            <X size={20} />
          </button>
        </div>

        {/* Summary */}
        <div className="modal-summary">
          <div className="summary-main">
            <div className="summary-value" data-testid="pol-sales-summary-value">
              {(latest?.total || 0).toLocaleString()}
            </div>
            <div className="summary-period" data-testid="pol-sales-summary-period">
              <Calendar size={14} />
              {latest?.month || 'N/A'}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
              Metric Ton
            </div>
          </div>
          {momChange !== null && momChange !== undefined && (
            <div className="summary-changes">
              <div className={`summary-change ${momChange >= 0 ? 'positive' : 'negative'}`} data-testid="pol-sales-summary-change">
                {momChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{momChange >= 0 ? '+' : ''}{momChange.toFixed(2)}%</span>
                <span className="change-label">MoM</span>
              </div>
            </div>
          )}
        </div>

        {/* Time range + % Change toggle — one row */}
        <div className="time-range-selector" style={{ marginBottom: '0.35rem' }} data-testid="pol-sales-time-selector">
          {TIME_RANGES.map(range => (
            <button
              key={range.key}
              className={`range-btn ${selectedRange === range.key ? 'active' : ''}`}
              onClick={() => setSelectedRange(range.key)}
              data-testid={`pol-sales-range-${range.key}`}
            >
              {range.label}
            </button>
          ))}
          <button
            className={`range-btn ${showPct ? 'active' : ''}`}
            onClick={() => setShowPct(p => !p)}
            style={{ marginLeft: 'auto', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}
          >
            % Change
          </button>
        </div>

        {/* Series chips — same row style, below time selector */}
        {!showPct && (
          <div className="time-range-selector" style={{ flexWrap: 'wrap', marginBottom: '0.45rem', gap: '0.3rem' }}>
            <button
              onClick={() => toggleSeries('total')}
              className={`range-btn ${visibleSeries.total !== false ? 'active' : ''}`}
              style={{ opacity: visibleSeries.total !== false ? 1 : 0.4, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              data-testid="pol-sales-series-toggle-total"
            >
              <span style={{ width: 10, height: 2, background: '#FACC15', display: 'inline-block' }} />
              Total
            </button>
            {categories.map((series, idx) => {
              const active = visibleSeries[series.key] !== false;
              const color  = COLORS[idx % COLORS.length];
              return (
                <button
                  key={series.key}
                  onClick={() => toggleSeries(series.key)}
                  className={`range-btn ${active ? 'active' : ''}`}
                  style={{ opacity: active ? 1 : 0.4, display: 'inline-flex', alignItems: 'center', gap: '0.28rem' }}
                  data-testid={`pol-sales-series-toggle-${series.key}`}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                  {series.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Chart */}
        <div className="chart-container" data-testid="pol-sales-chart-container">
          <ResponsiveContainer width="100%" height={300}>
            {showPct ? (
              <ComposedChart data={pctData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} interval="preserveStartEnd" minTickGap={50} />
                <YAxis tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} domain={['auto', 'auto']} width={56} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pct_change" radius={[2, 2, 0, 0]} maxBarSize={28}>
                  {pctData.map((entry, i) => (
                    <Cell key={i} fill={entry.pct_change >= 0 ? '#22C55E' : '#EF4444'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </ComposedChart>
            ) : (
              <ComposedChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} interval="preserveStartEnd" minTickGap={50} />
                <YAxis tickFormatter={val => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} width={52} />
                <Tooltip content={<CustomTooltip />} />
                {categories.map((series, idx) => (
                  <Bar key={series.key} dataKey={series.key} name={series.label} stackId="a" fill={COLORS[idx % COLORS.length]} hide={visibleSeries[series.key] === false} />
                ))}
                <Line type="monotone" dataKey="total" name="Total" stroke="#FACC15" strokeWidth={2.5} dot={false} connectNulls hide={visibleSeries.total === false} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="modal-footer" data-testid="pol-sales-modal-footer">
          <span className="data-source">Source: {data?.source || 'State Bank of Pakistan / PBS'}</span>
          <span className="data-updated">
            <span style={{ marginRight: '0.8rem', color: 'var(--color-text-muted)' }}>Unit: Metric Ton</span>
            Last updated: {new Date(data?.updated || Date.now()).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PolSalesModal;
