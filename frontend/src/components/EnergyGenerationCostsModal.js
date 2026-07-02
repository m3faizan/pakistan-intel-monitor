import React, { useState, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, Coins } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, LineChart, Line
} from 'recharts';

const TIME_RANGES = [
  { key: 'YTD', label: 'YTD',  months: null },
  { key: '1Y',  label: '1Y',   months: 12   },
  { key: '3Y',  label: '3Y',   months: 36   },
  { key: '5Y',  label: '5Y',   months: 60   },
  { key: '10Y', label: '10Y',  months: 120  },
  { key: 'ALL', label: 'All',  months: null },
];

const EnergyGenerationCostsModal = ({ isOpen, onClose, metric, data }) => {
  const [selectedRange, setSelectedRange] = useState('ALL');
  const [showPctChange, setShowPctChange] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState([]);

  // If metric is PPP_SUMMARY, we render a combined chart of Reference, Requested, Allowed
  const isCombined = metric === 'PPP_SUMMARY';
  const targetData = isCombined ? data['Allowed PPP'] : data[metric];

  const filteredData = useMemo(() => {
    if (!targetData?.history) return [];
    
    // Base timeline filtering off the targetData (or Allowed PPP if combined)
    const history = [...targetData.history].sort((a, b) => new Date(a.date) - new Date(b.date));
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

    // Map logic 
    return filtered.map((item, idx) => {
      let pct = 0;
      if (idx > 0) {
        const prev = filtered[idx - 1].value;
        if (prev && prev !== 0) pct = ((item.value - prev) / Math.abs(prev)) * 100;
      }
      
      // If combined, stitch all three together
      if (isCombined) {
         const dateMatch = (historyArr) => historyArr.find(h => h.date === item.date)?.value || 0;
         return {
            date: item.date,
            "Allowed PPP": dateMatch(data['Allowed PPP'].history),
            "Requested PPP": dateMatch(data['Requested PPP'].history),
            "Reference PPP": dateMatch(data['Reference PPP'].history)
         };
      }
      
      return { ...item, pct_change: parseFloat(pct.toFixed(2)) };
    });
  }, [targetData, selectedRange, isCombined, data]);

  const yoyChange = useMemo(() => {
    if (isCombined || !targetData?.history || targetData.history.length < 13) return null;
    const sorted = [...targetData.history].sort((a, b) => new Date(a.date) - new Date(b.date));
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
  }, [targetData, isCombined]);

  if (!isOpen || !data) return null;

  const latest   = targetData.latest;
  const momPct   = targetData.mom_change_pct;
  const unit     = targetData.unit || 'PKR/kWh';
  
  // Cost increases are bad (red), cost decreases are good (green)
  const isMomPos = momPct !== null && momPct !== undefined && momPct <= 0;
  const isYoyPos = yoyChange !== null && yoyChange !== undefined && yoyChange <= 0;

  const fmt = (v) => {
    if (v === null || v === undefined) return '--';
    const n = Number(v);
    return n.toFixed(2);
  };
  
  const fmtDate     = (d) => !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  const fmtMonthYr  = (d) => !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const chartColor = targetData.color || '#38BDF8';

  const toggleSeries = (e) => {
    const { dataKey } = e;
    setHiddenSeries(prev => 
      prev.includes(dataKey) ? prev.filter(k => k !== dataKey) : [...prev, dataKey]
    );
  };

  const renderLegendText = (value, entry) => {
    const isHidden = hiddenSeries.includes(value);
    return (
      <span style={{ 
        color: isHidden ? '#64748b' : '#f8fafc', 
        textDecoration: isHidden ? 'line-through' : 'none',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}>
        {value}
      </span>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    
    if (isCombined) {
      // Filter out hidden series from the tooltip payload
      const visiblePayload = payload.filter(p => !hiddenSeries.includes(p.dataKey));
      
      if (visiblePayload.length === 0) return null;

      return (
        <div className="remittances-tooltip" style={{ minWidth: 150 }}>
           <p className="tooltip-date" style={{ marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #334155' }}>{fmtMonthYr(d.payload.date)}</p>
           {visiblePayload.map(p => (
               <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: '0.8rem' }}>
                   <span style={{ color: p.color }}>{p.dataKey}:</span>
                   <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{fmt(p.value)} {unit}</span>
               </div>
           ))}
        </div>
      );
    }
    
    let tooltipColor = chartColor;
    if (showPctChange) {
        tooltipColor = d.value <= 0 ? '#22C55E' : '#EF4444';
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
            <Coins size={20} />
            <span style={{ textTransform: 'uppercase' }}>
              {isCombined ? 'Fuel Price Adjustments (PPP)' : `${metric} - GENERATION COST`}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-summary">
          <div className="summary-main">
            <div className="summary-value">
              {fmt(latest?.value)}
              <span style={{ fontSize: '1rem', fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>{unit}</span>
            </div>
            <div className="summary-period">
              <Calendar size={14} />
              {fmtMonthYr(latest?.date)}
            </div>
          </div>
          {!isCombined && (
              <div className="summary-changes">
                {momPct !== null && momPct !== undefined && (
                  <div className={`summary-change ${isMomPos ? 'positive' : 'negative'}`}>
                    {isMomPos ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                    <span>{momPct > 0 ? '+' : ''}{momPct.toFixed(2)}%</span>
                    <span className="change-label">MoM</span>
                  </div>
                )}
                {yoyChange !== null && yoyChange !== undefined && (
                  <div className={`summary-change ${isYoyPos ? 'positive' : 'negative'}`}>
                    {isYoyPos ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                    <span>{yoyChange > 0 ? '+' : ''}{yoyChange.toFixed(2)}%</span>
                    <span className="change-label">YoY</span>
                  </div>
                )}
              </div>
          )}
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
          {!isCombined && (
              <button
                className={`range-btn ${showPctChange ? 'active' : ''}`}
                onClick={() => setShowPctChange(p => !p)}
                style={{ marginLeft: '1rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}
              >
                {showPctChange ? '% Change' : '% Change'}
              </button>
          )}
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            {isCombined ? (
                <LineChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} interval="preserveStartEnd" minTickGap={50} />
                    <YAxis tickFormatter={v => v.toFixed(1)} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} domain={['auto', 'auto']} width={45} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      onClick={toggleSeries} 
                      formatter={renderLegendText} 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px', cursor: 'pointer' }} 
                    />
                    <Line type="monotone" dataKey="Reference PPP" stroke={hiddenSeries.includes("Reference PPP") ? "#334155" : "#38bdf8"} strokeWidth={2} dot={hiddenSeries.includes("Reference PPP") ? false : { r: 3 }} hide={hiddenSeries.includes("Reference PPP")} />
                    <Line type="monotone" dataKey="Requested PPP" stroke={hiddenSeries.includes("Requested PPP") ? "#334155" : "#f59e0b"} strokeWidth={2} dot={hiddenSeries.includes("Requested PPP") ? false : { r: 3 }} hide={hiddenSeries.includes("Requested PPP")} />
                    <Line type="monotone" dataKey="Allowed PPP" stroke={hiddenSeries.includes("Allowed PPP") ? "#334155" : "#22c55e"} strokeWidth={3} dot={hiddenSeries.includes("Allowed PPP") ? false : { r: 4 }} hide={hiddenSeries.includes("Allowed PPP")} />
                </LineChart>
            ) : showPctChange ? (
              <BarChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} interval="preserveStartEnd" minTickGap={50} />
                <YAxis tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} domain={['auto', 'auto']} width={55} />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pct_change" radius={[2, 2, 0, 0]}>
                  {filteredData.map((entry, i) => (
                    <Cell key={i} fill={entry.pct_change <= 0 ? '#22C55E' : '#EF4444'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`powerCostGrad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} interval="preserveStartEnd" minTickGap={50} />
                <YAxis tickFormatter={v => v.toFixed(0)} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={{ stroke: '#1e293b' }} domain={['auto', 'auto']} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} fillOpacity={1} fill={`url(#powerCostGrad-${metric})`} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="modal-footer">
          <span className="data-source">Source: NEPRA</span>
          <span className="data-updated">
            Last updated: {latest?.date ? new Date(latest.date).toLocaleDateString() : 'N/A'}
          </span>
        </div>

      </div>
    </div>
  );
};

export default EnergyGenerationCostsModal;
