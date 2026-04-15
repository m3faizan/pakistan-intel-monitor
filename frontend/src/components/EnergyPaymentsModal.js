import React, { useState, useMemo } from 'react';
import { X, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, AreaChart, Area, ReferenceLine,
  BarChart, Bar, Cell, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const SERIES_ORDER = ['LNG', 'LPG', 'Crude Oil', 'Petroleum Products'];
const ALL_SERIES   = ['Petroleum Group', ...SERIES_ORDER];

const SOURCE_COLORS = {
  'Petroleum Group':    '#F97316',
  'LNG':                '#38BDF8',
  'LPG':                '#A855F7',
  'Crude Oil':          '#78716C',
  'Petroleum Products': '#F59E0B',
};

const TIME_RANGES = [
  { key: 'YTD', label: 'YTD',  months: null, ytd: true },
  { key: '1Y',  label: '1Y',   months: 12   },
  { key: '2Y',  label: '2Y',   months: 24   },
  { key: '5Y',  label: '5Y',   months: 60   },
  { key: '10Y', label: '10Y',  months: 120  },
  { key: 'ALL', label: 'All',  months: null },
];

// Convert Thousand USD to display string
const fmtM = (v, compact = false) => {
  if (v == null) return '--';
  const m = v / 1000;
  if (compact) {
    if (m >= 1000) return `$${(m / 1000).toFixed(2)}B`;
    return `$${m.toFixed(0)}M`;
  }
  if (m >= 1000) return `$${(m / 1000).toFixed(3)}B`;
  return `$${m.toFixed(1)}M`;
};

const fmtDate  = d => !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
const fmtMonth = d => !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

// chart modes
const MODES = {
  TIME:    'time',
  PCT_CHG: 'pctChg',
  USD_CHG: 'usdChg',
};

const EnergyPaymentsModal = ({ isOpen, onClose, allData, initialSeries = 'Petroleum Group' }) => {
  const [activeSeries, setActiveSeries] = useState(initialSeries);
  const [range, setRange]               = useState('5Y');
  const [showPct, setShowPct]           = useState(false);
  const [chartMode, setChartMode]       = useState(MODES.TIME);
  const [visible, setVisible]           = useState({
    LNG: true, LPG: true, 'Crude Oil': true, 'Petroleum Products': true,
  });

  const isGroup = activeSeries === 'Petroleum Group';

  // Build time-series chart data
  const chartData = useMemo(() => {
    if (!allData) return [];

    const r = TIME_RANGES.find(t => t.key === range);
    const petroHist = allData['Petroleum Group']?.history || [];
    const totalHist = allData['Total Imports']?.history || [];

    const dates = [...new Set(
      isGroup
        ? [
            ...SERIES_ORDER.flatMap(s => (allData[s]?.history || []).map(p => p.date)),
            ...petroHist.map(p => p.date),
          ]
        : (allData[activeSeries]?.history || []).map(p => p.date)
    )].sort();

    const latestDate = petroHist.length ? petroHist[petroHist.length - 1]?.date : null;
    let filtered = dates;
    if (r?.ytd && latestDate) {
      const year = new Date(latestDate).getFullYear();
      filtered = dates.filter(d => new Date(d).getFullYear() === year);
    } else if (r?.months) {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - r.months);
      filtered = dates.filter(d => new Date(d) >= cutoff);
    }

    const maps = {};
    [...SERIES_ORDER, 'Petroleum Group'].forEach(s => {
      maps[s] = {};
      (allData[s]?.history || []).forEach(p => { maps[s][p.date] = p.value; });
    });
    const totalMap = {};
    totalHist.forEach(p => { totalMap[p.date] = p.value; });

    return filtered.map(date => {
      const row = { date };
      if (isGroup) {
        SERIES_ORDER.forEach(s => { row[s] = maps[s][date] ?? null; });
        const petVal = maps['Petroleum Group'][date] ?? 0;
        const totVal = totalMap[date] ?? 0;
        row.petroTotal    = petVal > 0 ? petVal : null;
        row.pctOfImports  = totVal > 0 ? parseFloat((petVal / totVal * 100).toFixed(2)) : null;
      } else {
        const serVal      = maps[activeSeries]?.[date] ?? null;
        const totVal      = totalMap[date] ?? 0;
        row.value         = serVal;
        row.pctOfImports  = serVal != null && totVal > 0 ? parseFloat((serVal / totVal * 100).toFixed(2)) : null;
      }
      return row;
    });
  }, [allData, range, activeSeries, isGroup]);

  // Build time-series MoM change data from chartData (one row per month)
  const changeTimeData = useMemo(() => {
    if (chartData.length < 2) return [];
    // Need one extra previous point for the first visible month — fetch from full history
    const buildMap = s => {
      const m = {};
      (allData?.[s]?.history || []).forEach(p => { m[p.date] = p.value; });
      return m;
    };
    const maps = {};
    [...SERIES_ORDER, 'Petroleum Group'].forEach(s => { maps[s] = buildMap(s); });
    // All dates in full history for prev-lookup
    const allDates = [...new Set(
      [...SERIES_ORDER, 'Petroleum Group'].flatMap(s => Object.keys(maps[s]))
    )].sort();

    return chartData.map(row => {
      const di    = allDates.indexOf(row.date);
      const prevDate = di > 0 ? allDates[di - 1] : null;
      const newRow = { date: row.date };
      if (isGroup) {
        SERIES_ORDER.forEach(s => {
          const curr = maps[s][row.date] ?? 0;
          const prev = prevDate ? (maps[s][prevDate] ?? 0) : 0;
          newRow[`${s}_pct`] = prev > 0 ? parseFloat(((curr - prev) / prev * 100).toFixed(2)) : null;
          newRow[`${s}_usd`] = parseFloat(((curr - prev) / 1000).toFixed(1));
        });
      } else {
        const curr = maps[activeSeries]?.[row.date] ?? 0;
        const prev = prevDate ? (maps[activeSeries]?.[prevDate] ?? 0) : 0;
        newRow.pct = prev > 0 ? parseFloat(((curr - prev) / prev * 100).toFixed(2)) : null;
        newRow.usd = parseFloat(((curr - prev) / 1000).toFixed(1));
      }
      return newRow;
    });
  }, [chartData, allData, isGroup, activeSeries]);

  if (!isOpen || !allData) return null;

  const d           = allData[activeSeries];
  const totalD      = allData['Total Imports'];
  const latestVal   = d?.latest?.value;
  const latestDate  = d?.latest?.date;
  const momPct      = d?.mom_change_pct;
  const yoyPct      = d?.yoy_change;
  const totalNow    = totalD?.latest?.value;
  const petroShare  = isGroup && latestVal && totalNow ? (latestVal / totalNow * 100) : null;
  const isMoMPos    = momPct !== null && momPct !== undefined && momPct > 0;
  const isYoYPos    = yoyPct !== null && yoyPct !== undefined && yoyPct > 0;

  const toggle = src => {
    setVisible(prev => ({ ...prev, [src]: !prev[src] }));
  };

  const setMode = m => {
    setShowPct(false); // % Imports and change modes are mutually exclusive
    setChartMode(c => c === m ? MODES.TIME : m);
  };

  const handleShowPct = () => {
    setChartMode(MODES.TIME); // exit change mode when switching to % Imports
    setShowPct(p => !p);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="remittances-tooltip" style={{ minWidth: 200 }}>
        <p className="tooltip-date">{fmtMonth(label)}</p>
        {isGroup ? (
          showPct ? (
            <p style={{ color: '#22C55E', fontSize: '0.85rem' }}>
              % of Total Imports: {(payload[0]?.value ?? 0).toFixed(2)}%
            </p>
          ) : (
            <>
              {payload.filter(p => p.dataKey !== 'petroTotal').map(p => (
                <p key={p.dataKey} style={{ color: p.fill || p.color, fontSize: '0.78rem', margin: '1px 0' }}>
                  {p.dataKey}: {fmtM(p.value)}
                </p>
              ))}
              {payload.find(p => p.dataKey === 'petroTotal') && (
                <p style={{ color: '#F97316', fontSize: '0.78rem', marginTop: 3, borderTop: '1px solid #1e293b', paddingTop: 3 }}>
                  Total Petroleum: {fmtM(payload.find(p => p.dataKey === 'petroTotal')?.value)}
                </p>
              )}
            </>
          )
        ) : (
          showPct ? (
            <p style={{ color: SOURCE_COLORS[activeSeries] || '#F97316', fontSize: '0.85rem' }}>
              % of Total Imports: {(payload[0]?.value ?? 0).toFixed(2)}%
            </p>
          ) : (
            <p style={{ color: SOURCE_COLORS[activeSeries] || '#F97316', fontSize: '0.85rem' }}>
              {activeSeries}: {fmtM(payload[0]?.value)}
            </p>
          )
        )}
      </div>
    );
  };

  const ChangeTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const isPct = chartMode === MODES.PCT_CHG;
    return (
      <div className="remittances-tooltip" style={{ minWidth: 180 }}>
        <p className="tooltip-date">{fmtMonth(label)}</p>
        {payload.map((p, i) => {
          const val = p.value;
          if (val == null) return null;
          const isUp = val > 0;
          return (
            <p key={i} style={{ color: isUp ? '#EF4444' : '#22C55E', fontSize: '0.78rem', margin: '1px 0' }}>
              {p.name && isGroup ? <span style={{ color: SOURCE_COLORS[p.name.replace(/_pct|_usd/, '')] || '#94a3b8', marginRight: 4 }}>●</span> : null}
              {isPct
                ? `${isUp ? '+' : ''}${val?.toFixed(2)}% MoM`
                : `${isUp ? '+$' : '-$'}${Math.abs(val ?? 0).toFixed(1)}M MoM`
              }
            </p>
          );
        })}
      </div>
    );
  };

  const color  = SOURCE_COLORS[activeSeries] || '#F97316';
  const gradId = `epGrad_${activeSeries.replace(/\s+/g, '')}`;
  const isChangeMode = chartMode === MODES.PCT_CHG || chartMode === MODES.USD_CHG;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="remittances-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 860 }}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <DollarSign size={20} />
            <span>Energy Payments</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', marginLeft: 6, animation: 'pulse 2s infinite' }} />
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Series tabs */}
        <div className="time-range-selector" style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem' }}>
          {ALL_SERIES.map(s => (
            <button
              key={s}
              className={`range-btn ${activeSeries === s ? 'active' : ''}`}
              onClick={() => setActiveSeries(s)}
              style={activeSeries === s ? { borderColor: SOURCE_COLORS[s], color: SOURCE_COLORS[s], background: `${SOURCE_COLORS[s]}1a` } : {}}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="modal-summary">
          <div className="summary-main">
            <div className="summary-value">
              {showPct && petroShare !== null && !isChangeMode
                ? <>{petroShare.toFixed(1)}<span style={{ fontSize: '1rem', fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>%</span></>
                : <>{fmtM(latestVal)}</>
              }
            </div>
            <div className="summary-period">
              <Calendar size={14} />
              {fmtMonth(latestDate)}
            </div>
            <div style={{ fontSize: '0.63rem', color: '#64748b', marginTop: 2 }}>
              {activeSeries}
            </div>
          </div>
          <div className="summary-changes" style={{ display: 'flex', gap: '0.5rem' }}>
            {momPct !== null && momPct !== undefined && (
              <div className={`summary-change ${momPct === 0 ? '' : isMoMPos ? 'negative' : 'positive'}`}
                style={momPct === 0 ? { color: '#64748b' } : {}}>
                {momPct === 0 ? '=' : isMoMPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{isMoMPos ? '+' : ''}{momPct.toFixed(2)}%</span>
                <span className="change-label">MoM</span>
              </div>
            )}
            {yoyPct !== null && yoyPct !== undefined && (
              <div className={`summary-change ${yoyPct === 0 ? '' : isYoYPos ? 'negative' : 'positive'}`}
                style={yoyPct === 0 ? { color: '#64748b' } : {}}>
                {yoyPct === 0 ? '=' : isYoYPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{isYoYPos ? '+' : ''}{yoyPct.toFixed(2)}%</span>
                <span className="change-label">YoY</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls row */}
        <div className="time-range-selector" style={{ marginBottom: '0.35rem' }}>
          {/* Time range buttons — always visible */}
          {TIME_RANGES.map(r => (
            <button key={r.key} className={`range-btn ${range === r.key ? 'active' : ''}`} onClick={() => setRange(r.key)}>
              {r.label}
            </button>
          ))}
          {/* Right-side toggles */}
          <div style={{ display: 'flex', gap: '0.3rem', marginLeft: 'auto', borderLeft: '1px solid var(--color-border)', paddingLeft: '0.75rem' }}>
            <button
              className={`range-btn ${showPct ? 'active' : ''}`}
              onClick={handleShowPct}
            >
              % Imports
            </button>
            <button
              className={`range-btn ${chartMode === MODES.PCT_CHG ? 'active' : ''}`}
              onClick={() => setMode(MODES.PCT_CHG)}
              style={chartMode === MODES.PCT_CHG ? { borderColor: '#22C55E', color: '#22C55E', background: 'rgba(34,197,94,0.10)' } : {}}
            >
              % Chg
            </button>
            <button
              className={`range-btn ${chartMode === MODES.USD_CHG ? 'active' : ''}`}
              onClick={() => setMode(MODES.USD_CHG)}
              style={chartMode === MODES.USD_CHG ? { borderColor: '#38BDF8', color: '#38BDF8', background: 'rgba(56,189,248,0.10)' } : {}}
            >
              $ Chg
            </button>
          </div>
        </div>

        {/* Source chips — group mode (always show for series toggling) */}
        {isGroup && (!showPct || isChangeMode) && (
          <div className="time-range-selector" style={{ flexWrap: 'wrap', marginBottom: '0.45rem', gap: '0.3rem' }}>
            <span className="range-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', borderColor: '#F97316', color: '#F97316', background: 'rgba(249,115,22,0.10)', cursor: 'default' }}>
              <span style={{ width: 10, height: 2, background: '#F97316', display: 'inline-block' }} />
              Total Petroleum
            </span>
            {SERIES_ORDER.map(src => {
              const on = visible[src] !== false;
              return (
                <button key={src} onClick={() => toggle(src)}
                  className={`range-btn ${on ? 'active' : ''}`}
                  style={{ opacity: on ? 1 : 0.4, display: 'inline-flex', alignItems: 'center', gap: '0.28rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: SOURCE_COLORS[src], display: 'inline-block' }} />
                  {src}
                </button>
              );
            })}
          </div>
        )}

        {/* Chart */}
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            {isChangeMode ? (
              /* Time-series MoM change bar chart */
              <BarChart
                data={changeTimeData}
                margin={{ top: 12, right: 10, left: 0, bottom: 0 }}
                barCategoryGap="15%"
                barGap={1}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  interval="preserveStartEnd"
                  minTickGap={45}
                />
                <YAxis
                  tickFormatter={v => chartMode === MODES.PCT_CHG
                    ? `${v > 0 ? '+' : ''}${v}%`
                    : `${v >= 0 ? '' : '-'}$${Math.abs(v)}M`}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  width={52}
                />
                <ReferenceLine y={0} stroke="#334155" strokeWidth={1} />
                <Tooltip content={<ChangeTooltip />} />
                {isGroup ? (
                  SERIES_ORDER.filter(s => visible[s] !== false).map(src => {
                    const dk = chartMode === MODES.PCT_CHG ? `${src}_pct` : `${src}_usd`;
                    return (
                      <Bar key={src} dataKey={dk} name={dk} maxBarSize={10} radius={[1, 1, 0, 0]}>
                        {changeTimeData.map((entry, idx) => {
                          const val = entry[dk] ?? 0;
                          return <Cell key={idx} fill={val > 0 ? '#EF4444' : '#22C55E'} fillOpacity={0.85} />;
                        })}
                      </Bar>
                    );
                  })
                ) : (
                  <Bar
                    dataKey={chartMode === MODES.PCT_CHG ? 'pct' : 'usd'}
                    maxBarSize={16}
                    radius={[2, 2, 0, 0]}
                  >
                    {changeTimeData.map((entry, idx) => {
                      const val = chartMode === MODES.PCT_CHG ? (entry.pct ?? 0) : (entry.usd ?? 0);
                      return <Cell key={idx} fill={val > 0 ? '#EF4444' : '#22C55E'} fillOpacity={0.85} />;
                    })}
                  </Bar>
                )}
              </BarChart>
            ) : isGroup && !showPct ? (
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} interval="preserveStartEnd" minTickGap={50} />
                <YAxis tickFormatter={v => fmtM(v, true)} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} domain={[0, 'auto']} width={56} />
                <Tooltip content={<CustomTooltip />} />
                {SERIES_ORDER.map(src => (
                  <Bar key={src} dataKey={src} stackId="pmt" fill={SOURCE_COLORS[src]} hide={visible[src] === false} maxBarSize={28} />
                ))}
                <Line type="monotone" dataKey="petroTotal" stroke="#F97316" strokeWidth={2.5} dot={false} connectNulls />
              </ComposedChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={isGroup && showPct ? '#22C55E' : color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={isGroup && showPct ? '#22C55E' : color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} interval="preserveStartEnd" minTickGap={50} />
                <YAxis
                  tickFormatter={showPct ? v => `${v.toFixed(1)}%` : v => fmtM(v, true)}
                  stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} domain={[0, 'auto']} width={56}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={showPct ? 'pctOfImports' : 'value'}
                  stroke={isGroup && showPct ? '#22C55E' : color}
                  strokeWidth={2.5}
                  fill={`url(#${gradId})`}
                  dot={false}
                  connectNulls
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="data-source">Source: SBP — Import Payments by Commodities &amp; Groups (BOP)</span>
          <span className="data-updated">Updated: {latestDate ? new Date(latestDate).toLocaleDateString() : 'N/A'}</span>
        </div>

      </div>
    </div>
  );
};

export default EnergyPaymentsModal;
