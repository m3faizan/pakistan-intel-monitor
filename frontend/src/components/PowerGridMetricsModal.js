import React, { useState, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, Activity } from 'lucide-react';
import {
  AreaChart, Area,
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const TIME_RANGES = [
  { key: 'YTD', label: 'YTD',  months: null },
  { key: '1Y',  label: '1Y',   months: 12   },
  { key: '3Y',  label: '3Y',   months: 36   },
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
  const unit     = data.unit || '';
  
  const isLoss = metric === 'Transmission Loss';
  
  // Inverse logic for Transmission Loss:
  // Transmission Loss MomPct < 0 means loss decreased (which is good -> positive).
  // Transmission Loss MomPct > 0 means loss increased (which is bad -> negative).
  const isMomPos = momPct !== null && momPct !== undefined && (isLoss ? momPct <= 0 : momPct >= 0);
  const isYoyPos = yoyChange !== null && yoyChange !== undefined && (isLoss ? yoyChange <= 0 : yoyChange >= 0);

  const fmt = (v) => {
    if (v === null || v === undefined) return '--';
    const n = Number(v);
    if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000)    return `${(n / 1000).toFixed(2)}k`;
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };
  const fmtDate     = (d) => !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  const fmtMonthYr  = (d) => !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const yAxisFmt    = (v) => {
    if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (Math.abs(v) >= 1000)    return `${(v / 1000).toFixed(0)}k`;
    return v.toFixed(0);
  };

  const chartColor = data.color || '#38BDF8';

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    
    let tooltipColor = chartColor;
    if (showPctChange) {
        const dPos = isLoss ? d.value <= 0 : d.value >= 0;
        tooltipColor = dPos ? '#22C55E' : '#EF4444';
    }
    
    return (
      <div className="remittances-tooltip">
        <p className="tooltip-date">{fmtMonthYr(d.payload.date)}</p>
        <p className="tooltip-value" style={{ color: tooltipColor }}>
          {showPctChange
            ? `${d.value > 0 ? '+' : ''}${d.value.toFixed(2)}%`
            : `${fmt(d.value)} ${unit}`}
        </p>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="remittances-modal" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-title">
            <Activity size={20} />
            <span style={{ textTransform: 'uppercase' }}>{metric} - POWER GRID METRICS</span>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-summary">
          <div className="summary-main">
            <div className="summary-value">
              {fmt(latest?.value)}
              <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 8 }}>{unit}</span>
            </div>
            <div className="summary-period">
              <Calendar size={14} />
              {fmtMonthYr(latest?.date)}
            </div>
          </div>
          <div className="summary-changes">
            {momPct !== null && momPct !== undefined && (
              <div className={`summary-change ${isMomPos ? 'positive' : 'negative'}`}>
                {isMomPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{momPct > 0 ? '+' : ''}{momPct.toFixed(2)}%</span>
                <span className="change-label">MoM</span>
              </div>
            )}
            {yoyChange !== null && yoyChange !== undefined && (
              <div className={`summary-change ${isYoyPos ? 'positive' : 'negative'}`}>
                {isYoyPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{yoyChange > 0 ? '+' : ''}{yoyChange.toFixed(2)}%</span>
                <span className="change-label">YoY</span>
              </div>
            )}
          </div>
        </div>

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
            {showPctChange ? '% Change' : '% Change'}
          </button>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            {showPctChange ? (
              <BarChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} interval="preserveStartEnd" minTickGap={50} />
                <YAxis tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} domain={['auto', 'auto']} width={55} />
                <ReferenceLine y={0} stroke='var(--color-muted)' strokeDasharray="3 3" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pct_change" radius={[2, 2, 0, 0]}>
                  {filteredData.map((entry, i) => {
                    const isBarPos = isLoss ? entry.pct_change <= 0 : entry.pct_change >= 0;
                    return <Cell key={i} fill={isBarPos ? '#22C55E' : '#EF4444'} fillOpacity={0.8} />
                  })}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`powerGridGrad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} interval="preserveStartEnd" minTickGap={50} />
                <YAxis tickFormatter={yAxisFmt} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} domain={[0, 'auto']} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} fillOpacity={1} fill={`url(#powerGridGrad-${metric})`} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="modal-footer">
          <span className="data-source">Source: NEPRA / NTDC</span>
          <span className="data-updated">
            Last updated: {latest?.date ? new Date(latest.date).toLocaleDateString() : 'N/A'}
          </span>
        </div>

      </div>
    </div>
  );
};

export default PowerGridMetricsModal;
