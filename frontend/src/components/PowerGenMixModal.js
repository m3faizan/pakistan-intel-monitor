import React, { useState, useMemo, useEffect } from 'react';
import { X, Zap, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart,
  Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';

const SOURCES = ['Hydel', 'Gas', 'RLNG', 'Coal', 'HSD', 'RFO', 'Nuclear', 'Wind', 'Solar', 'Bagasse', 'Iran', 'Mixed'];

const SOURCE_COLORS = {
  Hydel:   '#38BDF8',
  Gas:     '#F59E0B',
  RLNG:    '#FB923C',
  Coal:    '#78716C',
  HSD:     '#F97316',
  RFO:     '#EF4444',
  Nuclear: '#A855F7',
  Wind:    '#6EE7B7',
  Solar:   '#FDE68A',
  Bagasse: '#10B981',
  Iran:    '#64748B',
  Mixed:   'var(--color-text-muted)',
};

const TIME_RANGES = [
  { key: 'YTD', label: 'YTD',  months: null, ytd: true },
  { key: '1Y',  label: '1Y',   months: 12  },
  { key: '2Y',  label: '2Y',   months: 24  },
  { key: '5Y',  label: '5Y',   months: 60  },
  { key: '10Y', label: '10Y',  months: 120 },
  { key: 'ALL', label: 'All',  months: null },
];

const PowerGenMixModal = ({ isOpen, onClose, allData }) => {
  const [range, setRange]     = useState('5Y');
  const [showPct, setShowPct] = useState(false);
  const [visible, setVisible] = useState({});

  const available = useMemo(() =>
    SOURCES.filter(s => allData?.[s]?.history?.length > 0),
    [allData]
  );

  useEffect(() => {
    const init = {};
    available.forEach(s => { init[s] = true; });
    setVisible(init);
  }, [available.join(',')]); // eslint-disable-line

  const chartData = useMemo(() => {
    if (!allData) return [];

    const dateSet = new Set();
    available.forEach(s => (allData[s]?.history || []).forEach(p => dateSet.add(p.date)));
    (allData['Total']?.history || []).forEach(p => dateSet.add(p.date));

    let dates = [...dateSet].sort();

    const r = TIME_RANGES.find(t => t.key === range);
    if (r?.ytd) {
      const latestDate = allData['Total']?.latest?.date
        ? new Date(allData['Total'].latest.date)
        : new Date();
      const ytdCutoff = new Date(latestDate.getFullYear(), 0, 1);
      dates = dates.filter(d => new Date(d) >= ytdCutoff);
    } else if (r?.months) {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - r.months);
      dates = dates.filter(d => new Date(d) >= cutoff);
    }

    const maps = {};
    available.forEach(s => {
      maps[s] = {};
      (allData[s]?.history || []).forEach(p => { maps[s][p.date] = p.value; });
    });
    const totalMap = {};
    (allData['Total']?.history || []).forEach(p => { totalMap[p.date] = p.value; });

    return dates.map((date, idx) => {
      const row = { date };
      available.forEach(s => { row[s] = maps[s][date] ?? null; });
      row.total = totalMap[date] ?? null;
      if (idx > 0) {
        const prev = totalMap[dates[idx - 1]] ?? 0;
        const cur  = row.total ?? 0;
        row.pct_change = prev !== 0 ? parseFloat(((cur - prev) / prev * 100).toFixed(2)) : 0;
      } else {
        row.pct_change = 0;
      }
      return row;
    });
  }, [allData, available, range]);

  if (!isOpen || !allData) return null;

  const totalLatest = allData['Total']?.latest;
  const totalMom    = allData['Total']?.mom_change_pct;
  const totalYoy    = allData['Total']?.yoy_change;

  const isMomPos  = totalMom !== null && totalMom !== undefined && totalMom > 0;
  const isMomZero = totalMom === 0;
  const isYoyPos  = totalYoy !== null && totalYoy !== undefined && totalYoy > 0;
  const isYoyZero = totalYoy === 0;

  const fmtDate  = d => !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  const fmtMonth = d => !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const fmtFull  = v => {
    if (v == null) return '--';
    return Number(v).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  const toggle = src => {
    setVisible(prev => {
      const active = Object.values(prev).filter(Boolean).length;
      if (prev[src] && active === 1) return prev;
      return { ...prev, [src]: !prev[src] };
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
          <>
            {payload.filter(p => p.dataKey !== 'total').map(p => (
              <p key={p.dataKey} style={{ color: p.fill || p.color, fontSize: '0.78rem', margin: '1px 0' }}>
                {p.dataKey}: {(p.value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} GWh
              </p>
            ))}
            {payload.find(p => p.dataKey === 'total') && (
              <p style={{ color: '#FACC15', fontSize: '0.78rem', marginTop: 3, borderTop: '1px solid #1e293b', paddingTop: 3 }}>
                Total: {(payload.find(p => p.dataKey === 'total')?.value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} GWh
              </p>
            )}
          </>
        )}
      </div>
    );
  };

  const changeBadge = (val, isZero, isPos, label) => {
    if (val === null || val === undefined) return null;
    return (
      <div
        className={`summary-change ${isZero ? '' : isPos ? 'positive' : 'negative'}`}
        style={isZero ? { color: 'var(--color-muted)' } : {}}
      >
        {isZero ? '=' : isPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        <span>{isPos && !isZero ? '+' : ''}{val.toFixed(2)}%</span>
        <span className="change-label">{label}</span>
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="remittances-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 880 }}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Zap size={20} />
            <span>Power Generation — Mix</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block', marginLeft: 6, animation: 'pulse 2s infinite' }} />
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Summary */}
        <div className="modal-summary">
          <div className="summary-main">
            <div className="summary-value">
              {fmtFull(totalLatest?.value)}
              <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 8 }}>GWh</span>
            </div>
            <div className="summary-period">
              <Calendar size={14} />
              {fmtMonth(totalLatest?.date)}
            </div>
          </div>
          <div className="summary-changes" style={{ display: 'flex', gap: '0.5rem' }}>
            {changeBadge(totalMom, isMomZero, isMomPos, 'MoM')}
            {changeBadge(totalYoy, isYoyZero, isYoyPos, 'YoY')}
          </div>
        </div>

        {/* Time range + % toggle — one row */}
        <div className="time-range-selector" style={{ marginBottom: '0.35rem' }}>
          {TIME_RANGES.map(r => (
            <button key={r.key} className={`range-btn ${range === r.key ? 'active' : ''}`} onClick={() => setRange(r.key)}>
              {r.label}
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

        {/* Source chips — same width/alignment as time row */}
        {!showPct && (
          <div className="time-range-selector" style={{ flexWrap: 'wrap', marginBottom: '0.45rem', gap: '0.3rem' }}>
            <span className="range-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', borderColor: '#FACC15', color: '#FACC15', background: 'rgba(250,204,21,0.12)', cursor: 'default' }}>
              <span style={{ width: 10, height: 2, background: '#FACC15', display: 'inline-block' }} />
              Total
            </span>
            {available.map(src => {
              const on = visible[src] !== false;
              return (
                <button key={src} onClick={() => toggle(src)}
                  className={`range-btn ${on ? 'active' : ''}`}
                  style={{ opacity: on ? 1 : 0.4, display: 'inline-flex', alignItems: 'center', gap: '0.28rem' }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: SOURCE_COLORS[src] || '#94A3B8', display: 'inline-block' }} />
                  {src}
                </button>
              );
            })}
          </div>
        )}

        {/* Chart */}
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={310}>
            {showPct ? (
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} interval="preserveStartEnd" minTickGap={50} />
                <YAxis tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} domain={['auto', 'auto']} width={56} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pct_change" radius={[2, 2, 0, 0]} maxBarSize={28}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.pct_change >= 0 ? '#22C55E' : '#EF4444'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </ComposedChart>
            ) : (
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} interval="preserveStartEnd" minTickGap={50} />
                <YAxis tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} domain={[0, 'auto']} width={42} />
                <Tooltip content={<CustomTooltip />} />
                {available.map(src => (
                  <Bar key={src} dataKey={src} stackId="mix" fill={SOURCE_COLORS[src] || '#94A3B8'} hide={visible[src] === false} maxBarSize={32} />
                ))}
                <Line type="monotone" dataKey="total" name="Total" stroke="#FACC15" strokeWidth={2.5} dot={false} connectNulls />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="data-source">Source: PakESDA / NEPRA</span>
          <span className="data-updated">Updated: {totalLatest?.date ? new Date(totalLatest.date).toLocaleDateString() : 'N/A'}</span>
        </div>

      </div>
    </div>
  );
};

export default PowerGenMixModal;
