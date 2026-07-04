import React, { useState, useMemo } from 'react';
import { X, Zap, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, AreaChart, Area,
  Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

const IMPORT_SOURCES = ['RLNG', 'Iran'];

const SOURCE_COLORS = {
  RLNG: '#FB923C',
  Iran: '#64748B',
};

const TIME_RANGES = [
  { key: 'YTD', label: 'YTD',  months: null, ytd: true },
  { key: '1Y',  label: '1Y',   months: 12   },
  { key: '2Y',  label: '2Y',   months: 24   },
  { key: '5Y',  label: '5Y',   months: 60   },
  { key: '10Y', label: '10Y',  months: 120  },
  { key: 'ALL', label: 'All',  months: null },
];

const ImportedSourcesModal = ({ isOpen, onClose, allData }) => {
  const [range, setRange]     = useState('5Y');
  const [showGwh, setShowGwh] = useState(false);
  const [visible, setVisible] = useState({ RLNG: true, Iran: true });

  const chartData = useMemo(() => {
    if (!allData) return [];

    const dateSet = new Set();
    IMPORT_SOURCES.forEach(s => (allData[s]?.history || []).forEach(p => dateSet.add(p.date)));
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
    IMPORT_SOURCES.forEach(s => {
      maps[s] = {};
      (allData[s]?.history || []).forEach(p => { maps[s][p.date] = p.value; });
    });
    const totalMap = {};
    (allData['Total']?.history || []).forEach(p => { totalMap[p.date] = p.value; });

    return dates.map(date => {
      const row = { date };
      const importSum = IMPORT_SOURCES.reduce((s, k) => s + (maps[k][date] ?? 0), 0);
      const total = totalMap[date] ?? 0;
      row.importShare = total > 0 ? parseFloat((importSum / total * 100).toFixed(2)) : null;
      IMPORT_SOURCES.forEach(s => { row[s] = maps[s][date] ?? null; });
      row.importTotal = importSum > 0 ? parseFloat(importSum.toFixed(1)) : null;
      return row;
    });
  }, [allData, range]);

  if (!isOpen || !allData) return null;

  // Current derived metrics
  const latestDate = allData['Total']?.latest?.date;
  const getAt = (src, date) => {
    const pts = allData[src]?.history || [];
    return pts.find(p => p.date === date)?.value ?? 0;
  };
  const hist = allData['Total']?.history || [];
  const prevDate = hist.length >= 2 ? hist[hist.length - 2]?.date : null;
  const totalNow  = allData['Total']?.latest?.value ?? 0;
  const totalPrev = prevDate ? getAt('Total', prevDate) : 0;
  const importNow  = IMPORT_SOURCES.reduce((s, k) => s + getAt(k, latestDate), 0);
  const importPrev = prevDate ? IMPORT_SOURCES.reduce((s, k) => s + getAt(k, prevDate), 0) : 0;
  const importShare     = totalNow  > 0 ? (importNow  / totalNow)  * 100 : 0;
  const importSharePrev = totalPrev > 0 ? (importPrev / totalPrev) * 100 : 0;
  const importMoM = importSharePrev !== 0
    ? ((importShare - importSharePrev) / importSharePrev) * 100
    : null;
  const importGwhMoM = importPrev !== 0 ? ((importNow - importPrev) / importPrev) * 100 : null;

  const isMomPos  = importMoM !== null && importMoM > 0;
  const isMomZero = importMoM === 0;

  const fmtDate  = d => !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  const fmtMonth = d => !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const fmtGwh   = v => v == null ? '--' : v >= 1000
    ? `${(v / 1000).toFixed(1)}k`
    : v.toLocaleString(undefined, { maximumFractionDigits: 1 });

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
      <div className="remittances-tooltip" style={{ minWidth: 180 }}>
        <p className="tooltip-date">{fmtMonth(label)}</p>
        {showGwh ? (
          <>
            {payload.filter(p => p.dataKey !== 'importTotal').map(p => (
              <p key={p.dataKey} style={{ color: p.fill || p.color, fontSize: '0.78rem', margin: '1px 0' }}>
                {p.dataKey}: {fmtGwh(p.value)} GWh
              </p>
            ))}
            {payload.find(p => p.dataKey === 'importTotal') && (
              <p style={{ color: '#FB923C', fontSize: '0.78rem', marginTop: 3, borderTop: '1px solid #1e293b', paddingTop: 3 }}>
                Total Imported: {fmtGwh(payload.find(p => p.dataKey === 'importTotal')?.value)} GWh
              </p>
            )}
          </>
        ) : (
          <p style={{ color: '#FB923C', fontSize: '0.85rem' }}>
            Imported Share: {(payload[0]?.value ?? 0).toFixed(1)}%
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="remittances-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 820 }}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Zap size={20} />
            <span>Imported Sources</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FB923C', display: 'inline-block', marginLeft: 6, animation: 'pulse 2s infinite' }} />
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Summary */}
        <div className="modal-summary">
          <div className="summary-main">
            <div className="summary-value">
              {showGwh
                ? <>{fmtGwh(importNow)}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 8 }}>GWh</span></>
                : <>{importShare.toFixed(1)}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 4 }}>%</span></>
              }
            </div>
            <div className="summary-period">
              <Calendar size={14} />
              {fmtMonth(latestDate)}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginTop: 2 }}>
              RLNG + Iran
            </div>
          </div>
          <div className="summary-changes" style={{ display: 'flex', gap: '0.5rem' }}>
            {importMoM !== null && (
              <div
                className={`summary-change ${isMomZero ? '' : isMomPos ? 'positive' : 'negative'}`}
                style={isMomZero ? { color: 'var(--color-muted)' } : {}}
              >
                {isMomZero ? '=' : isMomPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{isMomPos && !isMomZero ? '+' : ''}{importMoM.toFixed(2)}%</span>
                <span className="change-label">MoM</span>
              </div>
            )}
            {!showGwh && importGwhMoM !== null && (
              <div
                className={`summary-change ${importGwhMoM === 0 ? '' : importGwhMoM > 0 ? 'positive' : 'negative'}`}
                style={importGwhMoM === 0 ? { color: 'var(--color-muted)' } : {}}
              >
                {importGwhMoM === 0 ? '=' : importGwhMoM > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{importGwhMoM > 0 ? '+' : ''}{importGwhMoM.toFixed(2)}%</span>
                <span className="change-label">GWh MoM</span>
              </div>
            )}
          </div>
        </div>

        {/* Time range + GWh toggle */}
        <div className="time-range-selector" style={{ marginBottom: '0.35rem' }}>
          {TIME_RANGES.map(r => (
            <button key={r.key} className={`range-btn ${range === r.key ? 'active' : ''}`} onClick={() => setRange(r.key)}>
              {r.label}
            </button>
          ))}
          <button
            className={`range-btn ${showGwh ? 'active' : ''}`}
            onClick={() => setShowGwh(p => !p)}
            style={{ marginLeft: 'auto', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}
          >
            GWh
          </button>
        </div>

        {/* Source chips — only in GWh mode */}
        {showGwh && (
          <div className="time-range-selector" style={{ flexWrap: 'wrap', marginBottom: '0.45rem', gap: '0.3rem' }}>
            <span className="range-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', borderColor: '#FB923C', color: '#FB923C', background: 'rgba(251,146,60,0.10)', cursor: 'default' }}>
              <span style={{ width: 10, height: 2, background: '#FB923C', display: 'inline-block' }} />
              Total Imported
            </span>
            {IMPORT_SOURCES.map(src => {
              const on = visible[src] !== false;
              return (
                <button key={src} onClick={() => toggle(src)}
                  className={`range-btn ${on ? 'active' : ''}`}
                  style={{ opacity: on ? 1 : 0.4, display: 'inline-flex', alignItems: 'center', gap: '0.28rem' }}
                >
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
            {showGwh ? (
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} interval="preserveStartEnd" minTickGap={50} />
                <YAxis tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} domain={[0, 'auto']} width={42} />
                <Tooltip content={<CustomTooltip />} />
                {IMPORT_SOURCES.map(src => (
                  <Bar key={src} dataKey={src} stackId="imp" fill={SOURCE_COLORS[src]} hide={visible[src] === false} maxBarSize={32} />
                ))}
                <Line type="monotone" dataKey="importTotal" name="Total Imported" stroke="#FB923C" strokeWidth={2.5} dot={false} connectNulls />
              </ComposedChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="importGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#FB923C" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FB923C" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} interval="preserveStartEnd" minTickGap={50} />
                <YAxis tickFormatter={v => `${v.toFixed(0)}%`} stroke='var(--color-muted)' tick={{ fill: 'var(--color-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={{ stroke: 'var(--color-border)' }} domain={[0, 'auto']} width={42} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="importShare" stroke="#FB923C" strokeWidth={2.5} fill="url(#importGrad)" dot={false} connectNulls />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="data-source">Source: PakESDA / NEPRA via SBP</span>
          <span className="data-updated">Updated: {latestDate ? new Date(latestDate).toLocaleDateString() : 'N/A'}</span>
        </div>

      </div>
    </div>
  );
};

export default ImportedSourcesModal;
