import React, { useState, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, Gem } from 'lucide-react';
import {
  AreaChart, Area,
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const TIME_RANGES = [
  { key: 'YTD', label: 'YTD', months: null },
  { key: '1Y',  label: '1Y',  months: 12 },
  { key: '3Y',  label: '3Y',  months: 36 },
  { key: '5Y',  label: '5Y',  months: 60 },
  { key: '10Y', label: '10Y', months: 120 },
  { key: 'ALL', label: 'All', months: null },
];

const MineralsDetailModal = ({ isOpen, onClose, mineral, data }) => {
  const [selectedRange, setSelectedRange] = useState('ALL');
  const [showPctChange, setShowPctChange] = useState(false);

  const filteredData = useMemo(() => {
    if (!data?.history) return [];
    const history = [...data.history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const now = new Date();
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

  // Compute YoY change: compare latest to 12-months-ago point in full history
  const yoyChange = useMemo(() => {
    if (!data?.history || data.history.length < 13) return null;
    const sorted = [...data.history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sorted[sorted.length - 1];
    const latestDate = new Date(latest.date);
    const targetDate = new Date(latestDate);
    targetDate.setFullYear(targetDate.getFullYear() - 1);
    // Find closest point to 12 months ago
    let best = null, bestDiff = Infinity;
    for (const p of sorted) {
      const diff = Math.abs(new Date(p.date) - targetDate);
      if (diff < bestDiff) { bestDiff = diff; best = p; }
    }
    if (!best || !best.value) return null;
    return ((latest.value - best.value) / Math.abs(best.value)) * 100;
  }, [data]);

  if (!isOpen || !data) return null;

  const latest    = data.latest;
  const momPct    = data.mom_change_pct;
  const unit      = data.unit || '';
  const isMomPos  = momPct !== null && momPct !== undefined && momPct >= 0;
  const isYoyPos  = yoyChange !== null && yoyChange !== undefined && yoyChange >= 0;

  const formatVal = (v) => {
    if (v === null || v === undefined) return '--';
    const n = Number(v);
    if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000)    return `${(n / 1000).toFixed(2)}k`;
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const formatMonthYear = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const yAxisFormatter = (v) => {
    if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (Math.abs(v) >= 1000)    return `${(v / 1000).toFixed(0)}k`;
    return v.toFixed(0);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div className="remittances-tooltip">
        <p className="tooltip-date">{formatMonthYear(d.payload.date)}</p>
        <p className="tooltip-value" style={{ color: showPctChange ? (d.value >= 0 ? '#22C55E' : '#EF4444') : '#22C55E' }}>
          {showPctChange
            ? `${d.value >= 0 ? '+' : ''}${d.value.toFixed(2)}%`
            : `${formatVal(d.value)} ${unit}`}
        </p>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="remittances-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Gem size={20} />
            <span>{mineral}</span>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Summary */}
        <div className="modal-summary">
          <div className="summary-main">
            <div className="summary-value">
              {formatVal(latest?.value)}
              <span style={{ fontSize: '1rem', fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>{unit}</span>
            </div>
            <div className="summary-period">
              <Calendar size={14} />
              {formatMonthYear(latest?.date)}
            </div>
          </div>
          <div className="summary-changes">
            {momPct !== null && momPct !== undefined && (
              <div className={`summary-change ${isMomPos ? 'positive' : 'negative'}`}>
                {isMomPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{isMomPos ? '+' : ''}{momPct.toFixed(2)}%</span>
                <span className="change-label">MoM</span>
              </div>
            )}
            {yoyChange !== null && yoyChange !== undefined && (
              <div className={`summary-change ${isYoyPos ? 'positive' : 'negative'}`}>
                {isYoyPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{isYoyPos ? '+' : ''}{yoyChange.toFixed(2)}%</span>
                <span className="change-label">YoY</span>
              </div>
            )}
          </div>
        </div>

        {/* Time range selector */}
        <div className="time-range-selector">
          {TIME_RANGES.map(r => (
            <button
              key={r.key}
              className={`range-btn ${selectedRange === r.key ? 'active' : ''}`}
              onClick={() => setSelectedRange(r.key)}
            >
              {r.label}
            </button>
          ))}
          <button
            className={`range-btn ${showPctChange ? 'active' : ''}`}
            onClick={() => setShowPctChange(p => !p)}
            style={{ marginLeft: '1rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}
          >
            {showPctChange ? 'Value' : '% Change'}
          </button>
        </div>

        {/* Chart */}
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            {showPctChange ? (
              <BarChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  domain={['auto', 'auto']}
                  width={55}
                />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pct_change" radius={[2, 2, 0, 0]}>
                  {filteredData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.pct_change >= 0 ? '#22C55E' : '#EF4444'}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mineralAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  tickFormatter={yAxisFormatter}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  domain={[0, 'auto']}
                  width={55}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#22C55E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#mineralAreaGrad)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="data-source">Source: Pakistan Bureau of Statistics</span>
          <span className="data-updated">
            Last updated: {latest?.date ? new Date(latest.date).toLocaleDateString() : 'N/A'}
          </span>
        </div>

      </div>
    </div>
  );
};

export default MineralsDetailModal;
