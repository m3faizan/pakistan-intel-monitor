import React, { useEffect, useMemo, useState } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, ComposedChart
} from 'recharts';

const TIME_RANGES = [
  { key: '6M', label: '6M', months: 6 },
  { key: '1Y', label: '1Y', months: 12 },
  { key: '2Y', label: '2Y', months: 24 },
  { key: '5Y', label: '5Y', months: 60 },
  { key: 'ALL', label: 'All', months: null }
];

const SERIES_CONFIG = {
  value: { label: 'Combined', color: '#22C55E' },
  q1: { label: 'Q1', color: '#22d3ee' },
  q2: { label: 'Q2', color: '#6366f1' },
  q3: { label: 'Q3', color: '#f59e0b' },
  q4: { label: 'Q4', color: '#ec4899' },
  q5: { label: 'Q5', color: '#ef4444' }
};

const VIEW_MODES = [
  { key: 'index', label: 'Index' },
  { key: 'movement', label: 'Item Movement' },
  { key: 'quintiles', label: 'Quintiles' },
];

const SPIModal = ({ isOpen, onClose, data, title, frequency = 'Weekly' }) => {
  const [selectedRange, setSelectedRange] = useState('ALL');
  const [showPctChange, setShowPctChange] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState(['value']);
  const [viewMode, setViewMode] = useState('index');
  const [quintileWeekIdx, setQuintileWeekIdx] = useState(-1); // -1 = latest

  const modalFrequency = frequency || data?.frequency || 'Weekly';
  const isWeekly = modalFrequency.toLowerCase() === 'weekly';
  const availableSeries = data?.available_series || ['value'];
  const canToggleSeries = isWeekly && availableSeries.length > 1;

  useEffect(() => {
    if (canToggleSeries) setSelectedSeries(['value']);
    else setSelectedSeries(['value']);
  }, [canToggleSeries, data?.updated]);

  // Reset quintile index when data changes
  useEffect(() => {
    if (data?.history) setQuintileWeekIdx(data.history.length - 1);
  }, [data?.history]);

  const toggleSeries = (seriesKey) => {
    setSelectedSeries((current) => {
      if (current.includes(seriesKey)) {
        return current.length === 1 ? current : current.filter(k => k !== seriesKey);
      }
      return [...current, seriesKey];
    });
  };

  const sortedHistory = useMemo(() => {
    if (!data?.history) return [];
    return [...data.history].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data]);

  const filteredData = useMemo(() => {
    const range = TIME_RANGES.find(r => r.key === selectedRange);
    if (selectedRange === 'ALL' || !range?.months) return sortedHistory;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - range.months);
    return sortedHistory.filter(item => new Date(item.date) >= cutoff);
  }, [sortedHistory, selectedRange]);

  if (!isOpen) return null;

  const latest = data?.latest;
  const latestValue = latest?.value || 0;
  const primaryChange = data?.primary_change;
  const primaryChangePct = data?.primary_change_pct;
  const primaryLabel = data?.primary_change_label || 'Change';
  const isIncrease = (primaryChange || 0) >= 0;
  const isFavorable = (primaryChange || 0) <= 0;

  const fmtTick = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  const fmtTooltip = (d) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const valuesForDomain = filteredData.flatMap(row =>
    selectedSeries.map(k => row?.[k]).filter(v => v !== null && v !== undefined)
  );
  const minValue = valuesForDomain.length ? Math.min(...valuesForDomain, 0) : 0;
  const maxValue = valuesForDomain.length ? Math.max(...valuesForDomain, 0) : 0;

  // Quintile navigator data
  const qWeek = sortedHistory[quintileWeekIdx] || sortedHistory[sortedHistory.length - 1];
  const qData = qWeek ? [
    { name: 'Q1 (Lowest 20%)', value: qWeek.q1, color: '#22d3ee' },
    { name: 'Q2', value: qWeek.q2, color: '#6366f1' },
    { name: 'Q3', value: qWeek.q3, color: '#f59e0b' },
    { name: 'Q4', value: qWeek.q4, color: '#ec4899' },
    { name: 'Q5 (Highest 20%)', value: qWeek.q5, color: '#ef4444' },
  ] : [];

  const renderChart = () => {
    // === ITEM MOVEMENT VIEW ===
    if (viewMode === 'movement') {
      const movementData = filteredData.filter(r => (r.increase || 0) + (r.decrease || 0) + (r.stable || 0) > 0);
      return (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={movementData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
            <XAxis dataKey="date" tickFormatter={fmtTick} stroke='var(--color-muted)' fontSize={10} interval="preserveStartEnd" minTickGap={50} />
            <YAxis stroke='var(--color-muted)' fontSize={10} width={35} label={{ value: 'Items', angle: -90, position: 'insideLeft', style: { fill: 'var(--color-muted)', fontSize: 10 } }} />
            <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
              <div className="remittances-tooltip" style={{ minWidth: 180 }}>
                <p className="tooltip-date">{fmtTooltip(label)}</p>
                {payload.map((p, i) => (
                  <div key={i} style={{ color: p.fill, fontSize: '0.8rem', fontWeight: 600, margin: '0.15rem 0' }}>
                    {p.name}: {p.value}
                  </div>
                ))}
              </div>) : null} />
            <Bar dataKey="decrease" name="Decreased" fill="#22C55E" stackId="stack" />
            <Bar dataKey="stable" name="Stable" fill="#64748B" stackId="stack" />
            <Bar dataKey="increase" name="Increased" fill="#EF4444" stackId="stack" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // === QUINTILES VIEW ===
    if (viewMode === 'quintiles') {
      return (
        <div>
          {/* Week navigator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '0.5rem 0 1rem' }}>
            <button onClick={() => setQuintileWeekIdx(i => Math.max(0, i - 1))}
              disabled={quintileWeekIdx <= 0}
              style={{ background: 'none', border: '1px solid var(--color-border)', color: quintileWeekIdx <= 0 ? 'var(--color-border)' : '#E2E8F0', cursor: quintileWeekIdx <= 0 ? 'default' : 'pointer', padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={16} />
            </button>
            <div style={{ textAlign: 'center', minWidth: '200px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F8FAFC', fontFamily: 'var(--font-mono)' }}>
                {qWeek?.week} — {qWeek?.week_ending_formatted || new Date(qWeek?.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--color-muted)', marginTop: '0.15rem' }}>
                Combined: {qWeek?.value?.toFixed(2)}
              </div>
            </div>
            <button onClick={() => setQuintileWeekIdx(i => Math.min(sortedHistory.length - 1, i + 1))}
              disabled={quintileWeekIdx >= sortedHistory.length - 1}
              style={{ background: 'none', border: '1px solid var(--color-border)', color: quintileWeekIdx >= sortedHistory.length - 1 ? 'var(--color-border)' : '#E2E8F0', cursor: quintileWeekIdx >= sortedHistory.length - 1 ? 'default' : 'pointer', padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Quintile bar chart */}
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={qData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' horizontal={false} />
              <XAxis type="number" stroke='var(--color-muted)' fontSize={10} domain={[0, 'dataMax + 20']} />
              <YAxis type="category" dataKey="name" stroke='var(--color-muted)' fontSize={10} width={100} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div className="remittances-tooltip">
                  <p style={{ color: payload[0]?.payload?.color, fontSize: '0.85rem', fontWeight: 700 }}>
                    {payload[0]?.payload?.name}: {payload[0]?.value?.toFixed(2)}
                  </p>
                </div>) : null} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
                {qData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Item movement for this week */}
          {qWeek && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', padding: '0.5rem 0', borderTop: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#EF4444' }}>{qWeek.increase}</div>
                <div style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Increased</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#64748B' }}>{qWeek.stable}</div>
                <div style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Stable</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#22C55E' }}>{qWeek.decrease}</div>
                <div style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Decreased</div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // === INDEX VIEW (default) ===
    if (showPctChange) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
            <XAxis dataKey="date" tickFormatter={fmtTick} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} interval="preserveStartEnd" minTickGap={50} />
            <YAxis tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} domain={['auto', 'auto']} width={50} />
            <ReferenceLine y={0} stroke='var(--color-muted)' strokeDasharray="3 3" />
            <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
              <div className="remittances-tooltip">
                <p className="tooltip-date">{fmtTooltip(label)}</p>
                <p style={{ color: payload[0].value >= 0 ? '#EF4444' : '#22C55E', fontSize: '0.85rem' }}>
                  {payload[0].value >= 0 ? '+' : ''}{payload[0].value.toFixed(2)}%
                </p>
              </div>) : null} />
            <Bar dataKey="pct_change" radius={[2, 2, 0, 0]}>
              {filteredData.map((entry, i) => <Cell key={i} fill={entry.pct_change >= 0 ? '#EF4444' : '#22C55E'} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (canToggleSeries) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
            <XAxis dataKey="date" tickFormatter={fmtTick} stroke='var(--color-muted)' fontSize={11} interval="preserveStartEnd" minTickGap={50} />
            <YAxis stroke='var(--color-muted)' fontSize={11} domain={[Math.max(0, minValue * 0.98), maxValue * 1.02]} width={50} />
            <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
              <div className="remittances-tooltip" style={{ minWidth: 190 }}>
                <p className="tooltip-date">{fmtTooltip(label)}</p>
                {payload.map(e => (
                  <p key={e.dataKey} style={{ color: e.color, fontSize: '0.8rem', margin: '0.2rem 0' }}>
                    {SERIES_CONFIG[e.dataKey]?.label || e.name}: {(e.value || 0).toFixed(2)}
                  </p>
                ))}
              </div>) : null} />
            {selectedSeries.map(k => {
              const cfg = SERIES_CONFIG[k] || { label: k, color: '#22C55E' };
              return <Line key={k} type="monotone" dataKey={k} name={cfg.label} stroke={cfg.color} strokeWidth={k === 'value' ? 2.5 : 1.8} dot={false} connectNulls />;
            })}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs><linearGradient id="colorSPI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} /><stop offset="95%" stopColor="#22C55E" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
          <XAxis dataKey="date" tickFormatter={fmtTick} stroke='var(--color-muted)' fontSize={11} interval="preserveStartEnd" minTickGap={50} />
          <YAxis stroke='var(--color-muted)' fontSize={11} domain={[Math.max(0, minValue * 0.98), maxValue * 1.02]} width={50} />
          <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
            <div className="remittances-tooltip">
              <p className="tooltip-date">{fmtTooltip(label)}</p>
              <p style={{ color: '#22C55E', fontSize: '0.85rem' }}>{(payload[0]?.payload?.value || 0).toFixed(2)}</p>
              {payload[0]?.payload?.pct_change != null && (
                <p style={{ fontSize: '0.72rem', color: payload[0].payload.pct_change >= 0 ? '#EF4444' : '#22C55E', marginTop: 4 }}>
                  {payload[0].payload.pct_change >= 0 ? '+' : ''}{payload[0].payload.pct_change.toFixed(2)}%
                </p>
              )}
            </div>) : null} />
          <Area type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorSPI)" />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="spi-modal-overlay">
      <div className="remittances-modal" onClick={e => e.stopPropagation()} data-testid="spi-modal">
        <div className="modal-header">
          <div className="modal-title" data-testid="spi-modal-title">
            <Activity size={20} />
            <span>{title || data?.name || 'SPI Data'}</span>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Summary */}
        <div className="modal-summary">
          <div className="summary-main">
            <div className="summary-value">{latestValue.toFixed(2)}</div>
            <div className="summary-period">
              <Calendar size={14} />
              {latest?.week_ending_formatted || latest?.month || 'N/A'}
            </div>
          </div>
          {primaryChange != null && (
            <div className="summary-changes">
              <div className={`summary-change ${isFavorable ? 'positive' : 'negative'}`}>
                {isIncrease ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{isIncrease ? '+' : ''}{primaryChange.toFixed(2)} pts</span>
                {primaryChangePct != null && (
                  <span className="change-label">({isIncrease ? '+' : ''}{primaryChangePct.toFixed(2)}%) {primaryLabel}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* View Mode tabs */}
        {isWeekly && (
          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            {VIEW_MODES.map(m => (
              <button key={m.key} className={`range-btn ${viewMode === m.key ? 'active' : ''}`}
                onClick={() => { setViewMode(m.key); setShowPctChange(false); }}>
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Time range + toggles (for index and movement views) */}
        {viewMode !== 'quintiles' && (
          <div className="time-range-selector">
            {TIME_RANGES.map(r => (
              <button key={r.key} className={`range-btn ${selectedRange === r.key ? 'active' : ''}`}
                onClick={() => setSelectedRange(r.key)}>{r.label}</button>
            ))}
            {viewMode === 'index' && (
              <button className={`range-btn ${showPctChange ? 'active' : ''}`}
                onClick={() => setShowPctChange(!showPctChange)}
                style={{ marginLeft: '1rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}>
                {showPctChange ? 'Value' : '% Change'}
              </button>
            )}
          </div>
        )}

        {/* Series toggle (index view only) */}
        {viewMode === 'index' && canToggleSeries && !showPctChange && (
          <div className="time-range-selector" style={{ flexWrap: 'wrap', gap: '0.3rem' }}>
            {availableSeries.map(k => {
              const isActive = selectedSeries.includes(k);
              const cfg = SERIES_CONFIG[k] || { label: k, color: '#22C55E' };
              return (
                <button key={k} onClick={() => toggleSeries(k)} className={`range-btn ${isActive ? 'active' : ''}`}
                  style={{ opacity: isActive ? 1 : 0.4, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Item Movement legend */}
        {viewMode === 'movement' && (
          <div className="time-range-selector" style={{ gap: '0.3rem' }}>
            {[{ label: 'Decreased', color: '#22C55E' }, { label: 'Stable', color: '#64748B' }, { label: 'Increased', color: '#EF4444' }].map(l => (
              <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: l.color, padding: '0.4rem 0.6rem' }}>
                <span style={{ width: 10, height: 10, background: l.color, display: 'inline-block' }} />{l.label}
              </span>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="chart-container" style={{ padding: '1rem' }}>
          {renderChart()}
        </div>

        <div className="modal-footer">
          <span>
            Source: <a href="https://spi.pakesda.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>spi.pakesda.com</a>
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}>
            {data?.total_data_points || 0} weeks | {data?.date_range || ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SPIModal;
