import React, { useState, useMemo, useCallback } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Flame, BarChart3, Percent, Ship, FileText, PieChart, Zap, X, Calendar } from 'lucide-react';
import {
  AreaChart, Area, ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import LNGDataModal from './LNGDataModal';

const formatVal = (v, dec = 2) => {
  if (v === null || v === undefined) return 'N/A';
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(dec)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(dec)}K`;
  return v.toFixed(dec);
};

const pctChange = (curr, prev) => {
  if (!curr || !prev || prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};
const fmtMonth = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
const fmtDateShort = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

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

const MetricCard = ({ icon: Icon, label, value, change, sublabel, date, onClick }) => {
  const chg = change !== null && change !== undefined;
  const isPositive = chg && change > 0;
  return (
    <div
      className="economic-item clickable"
      onClick={onClick}
      data-testid={`lng-metric-${label.toLowerCase().replace(/\s+/g, '-')}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="economic-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        {Icon && <Icon size={10} style={{ color: '#22C55E' }} />}
        {label}
      </div>
      <div className="economic-value">{value}</div>
      {chg && (
        <div className={`economic-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {isPositive ? '+' : ''}{change.toFixed(2)}%
        </div>
      )}
      {sublabel && <div className="economic-sublabel">{sublabel}</div>}
      {date && <div className="economic-sublabel">{date}</div>}
    </div>
  );
};

/* ── LNG % of Imports Modal ───────────────────────────────────────── */
const LNGImportPctModal = ({ sbpPayments, onClose }) => {
  const [range, setRange] = useState('ALL');
  const [hiddenSeries, setHiddenSeries] = useState(new Set());
  const [viewMode, setViewMode] = useState('pct'); // 'pct' | 'absolute'

  const toggle = useCallback((k) => {
    setHiddenSeries(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  }, []);

  // Build combined history: merge LNG + Total by date
  const combined = useMemo(() => {
    const lngHist = sbpPayments?.history || [];
    const totalHist = sbpPayments?.total_history || [];
    const totalMap = {};
    for (const pt of totalHist) totalMap[pt.date] = pt.value;
    return lngHist.map(pt => {
      const total = totalMap[pt.date] || null;
      const pct = total && total > 0 ? parseFloat(((pt.value / total) * 100).toFixed(3)) : null;
      return { date: pt.date, lng: pt.value, total, pct };
    }).filter(r => r.total != null);
  }, [sbpPayments]);

  const filtered = useMemo(() => filterByRange(combined, range), [combined, range]);

  const latest = filtered.length > 0 ? filtered[filtered.length - 1] : null;

  const pctFields = [
    { key: 'pct', label: 'LNG % of Imports', color: '#F59E0B', type: 'area' },
  ];
  const absFields = [
    { key: 'lng', label: 'LNG Import', color: '#F59E0B', type: 'area' },
    { key: 'total', label: 'Total Import', color: '#38BDF8', type: 'line' },
  ];
  const activeFields = viewMode === 'pct' ? pctFields : absFields;

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="lng-modal-import-pct">
      <div className="remittances-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">LNG % of Total Imports</div>
          <button className="modal-close" onClick={onClose} data-testid="lng-modal-close"><X size={18} /></button>
        </div>

        {/* Summary */}
        {latest && viewMode === 'pct' && (
          <div className="modal-summary">
            <div className="summary-main">
              <div className="summary-value">{latest.pct?.toFixed(2)}%</div>
              <div className="summary-period"><Calendar size={14} /> {fmtMonth(latest.date)}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>of total Pakistan imports</div>
            </div>
            {sbpPayments?.mom_change_pct != null && (
              <div className="summary-changes">
                <div className={`summary-change ${sbpPayments.mom_change_pct >= 0 ? 'positive' : 'negative'}`}>
                  {sbpPayments.mom_change_pct >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{sbpPayments.mom_change_pct >= 0 ? '+' : ''}{sbpPayments.mom_change_pct.toFixed(2)}%</span>
                  <span className="change-label">MoM (LNG value)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          <button className={`range-btn ${viewMode === 'pct' ? 'active' : ''}`} onClick={() => { setViewMode('pct'); setHiddenSeries(new Set()); }}>
            % of Imports
          </button>
          <button className={`range-btn ${viewMode === 'absolute' ? 'active' : ''}`} onClick={() => { setViewMode('absolute'); setHiddenSeries(new Set()); }}>
            Total Import vs LNG
          </button>
        </div>

        {/* Range */}
        <div className="time-range-selector" style={{ marginBottom: '0.35rem' }}>
          {RANGES.map(r => <button key={r} className={`range-btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r}</button>)}
        </div>

        {/* Legend */}
        <div className="time-range-selector" style={{ flexWrap: 'wrap', marginBottom: '0.45rem', gap: '0.3rem' }}>
          {activeFields.map(f => (
            <button key={f.key} className={`range-btn ${!hiddenSeries.has(f.key) ? 'active' : ''}`} onClick={() => toggle(f.key)}
              style={{ opacity: hiddenSeries.has(f.key) ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{
                width: f.type === 'line' ? 12 : 8, height: f.type === 'line' ? 2 : 8,
                borderRadius: f.type === 'line' ? 0 : '50%', background: f.color, display: 'inline-block',
              }} />
              {f.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="chart-container" style={{ padding: '1rem' }}>
          <ResponsiveContainer width="100%" height={300}>
            {viewMode === 'pct' ? (
              <AreaChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.6)" />
                <XAxis dataKey="date" tickFormatter={fmtDateShort} stroke='var(--color-muted)' fontSize={10} />
                <YAxis tickFormatter={v => `${v.toFixed(1)}%`} stroke='var(--color-muted)' fontSize={10} width={48} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="remittances-tooltip">
                    <p className="tooltip-date">{fmtMonth(label)}</p>
                    {payload.filter(p => p.value != null).map((p, i) => (
                      <div key={i} style={{ color: p.color || p.stroke, fontSize: '0.8rem', fontWeight: 600 }}>LNG Share: {p.value?.toFixed(2)}%</div>
                    ))}
                  </div>) : null} />
                {!hiddenSeries.has('pct') && (
                  <Area dataKey="pct" name="LNG % of Imports" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} strokeWidth={2} connectNulls />
                )}
              </AreaChart>
            ) : (
              <ComposedChart data={filtered}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.6)" />
                <XAxis dataKey="date" tickFormatter={fmtDateShort} stroke='var(--color-muted)' fontSize={10} />
                <YAxis stroke='var(--color-muted)' fontSize={10} tickFormatter={v => `$${(v/1e6).toFixed(0)}B`} width={50} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="remittances-tooltip">
                    <p className="tooltip-date">{fmtMonth(label)}</p>
                    {payload.filter(p => p.value != null).map((p, i) => (
                      <div key={i} style={{ color: p.color || p.stroke || p.fill, fontSize: '0.8rem', fontWeight: 600 }}>
                        {p.name}: ${(p.value / 1000).toFixed(0)}M
                      </div>
                    ))}
                  </div>) : null} />
                {!hiddenSeries.has('lng') && (
                  <Area dataKey="lng" name="LNG Import" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} strokeWidth={2} connectNulls />
                )}
                {!hiddenSeries.has('total') && (
                  <Line dataKey="total" name="Total Import" stroke="#38BDF8" strokeWidth={2} dot={false} connectNulls />
                )}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="modal-footer"><span>Source: State Bank of Pakistan</span><span style={{ color: 'var(--color-text-muted)' }}>Unit: {viewMode === 'pct' ? '%' : 'Thousand USD'}</span></div>
      </div>
    </div>
  );
};

/* ── SBP Import Payment Modal ─────────────────────────────────────── */
const SbpPaymentModal = ({ sbpPayments, onClose }) => {
  const [range, setRange] = useState('ALL');
  const [showPct, setShowPct] = useState(false);

  const history = sbpPayments?.history || [];
  const filtered = useMemo(() => filterByRange(history, range), [history, range]);
  const pctData = useMemo(() => filtered.map((r, i) => {
    if (i === 0) return { ...r, pct_change: 0 };
    const prev = filtered[i - 1].value ?? 0;
    return { ...r, pct_change: prev !== 0 ? parseFloat(((r.value - prev) / prev * 100).toFixed(2)) : 0 };
  }), [filtered]);

  const latest = sbpPayments?.latest;

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="lng-modal-sbp-payment">
      <div className="remittances-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">LNG Import Payment</div>
          <button className="modal-close" onClick={onClose} data-testid="lng-modal-close"><X size={18} /></button>
        </div>
        {!showPct && latest && (
          <div className="modal-summary">
            <div className="summary-main">
              <div className="summary-value">${(latest.value / 1000).toFixed(1)}M</div>
              <div className="summary-period"><Calendar size={14} /> {latest.month}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>Million USD</div>
            </div>
            {sbpPayments.mom_change_pct != null && (
              <div className="summary-changes">
                <div className={`summary-change ${sbpPayments.mom_change_pct >= 0 ? 'positive' : 'negative'}`}>
                  {sbpPayments.mom_change_pct >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{sbpPayments.mom_change_pct >= 0 ? '+' : ''}{sbpPayments.mom_change_pct.toFixed(2)}%</span>
                  <span className="change-label">MoM</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="time-range-selector" style={{ marginBottom: '0.35rem' }}>
          {RANGES.map(r => <button key={r} className={`range-btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r}</button>)}
          <button className={`range-btn ${showPct ? 'active' : ''}`} onClick={() => setShowPct(p => !p)}
            style={{ marginLeft: 'auto', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}>% Change</button>
        </div>
        {!showPct && (
          <div className="time-range-selector" style={{ flexWrap: 'wrap', marginBottom: '0.45rem', gap: '0.3rem' }}>
            <button className="range-btn active" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />LNG Payment
            </button>
          </div>
        )}
        <div className="chart-container" style={{ padding: '1rem' }}>
          <ResponsiveContainer width="100%" height={300}>
            {showPct ? (
              <ComposedChart data={pctData}>
                <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDateShort} stroke='var(--color-muted)' fontSize={10} />
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
                <XAxis dataKey="date" tickFormatter={fmtDateShort} stroke='var(--color-muted)' fontSize={10} />
                <YAxis stroke='var(--color-muted)' fontSize={10} tickFormatter={v => `$${(v/1000).toFixed(0)}M`} width={56} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="remittances-tooltip"><p className="tooltip-date">{fmtMonth(label)}</p>
                    {payload.filter(p => p.value != null).map((p, i) => <div key={i} style={{ color: p.stroke, fontSize: '0.8rem', fontWeight: 600 }}>{p.name}: ${(p.value / 1000).toFixed(1)}M</div>)}
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

/* ── SBP Generation Modal ─────────────────────────────────────────── */
const SbpGenModal = ({ sbpGen, onClose }) => {
  const [range, setRange] = useState('ALL');
  const [hiddenSeries, setHiddenSeries] = useState(new Set());
  const [showPct, setShowPct] = useState(false);

  const toggle = useCallback((k) => {
    setHiddenSeries(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  }, []);

  const history = sbpGen?.history || [];
  const filtered = useMemo(() => filterByRange(history, range), [history, range]);
  const pctData = useMemo(() => filtered.map((r, i) => {
    if (i === 0) return { ...r, pct_change: 0 };
    const prev = filtered[i - 1].rlng ?? 0;
    return { ...r, pct_change: prev !== 0 ? parseFloat(((r.rlng - prev) / prev * 100).toFixed(2)) : 0 };
  }), [filtered]);

  const fields = [
    { key: 'rlng', label: 'RLNG Generation', color: '#F59E0B', type: 'area' },
    { key: 'total', label: 'Total Generation', color: '#38BDF8', type: 'area' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="lng-modal-sbp-gen">
      <div className="remittances-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">RLNG Power Generation</div>
          <button className="modal-close" onClick={onClose} data-testid="lng-modal-close"><X size={18} /></button>
        </div>
        {!showPct && sbpGen?.latest && (
          <div className="modal-summary">
            <div className="summary-main">
              <div className="summary-value">{sbpGen.latest.rlng?.toLocaleString()} GWh</div>
              <div className="summary-period"><Calendar size={14} /> {fmtMonth(sbpGen.latest.date)}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{sbpGen.latest.share}% of total mix</div>
            </div>
            {sbpGen.mom_rlng != null && (
              <div className="summary-changes">
                <div className={`summary-change ${sbpGen.mom_rlng >= 0 ? 'positive' : 'negative'}`}>
                  {sbpGen.mom_rlng >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{sbpGen.mom_rlng >= 0 ? '+' : ''}{sbpGen.mom_rlng.toFixed(2)}%</span>
                  <span className="change-label">MoM</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="time-range-selector" style={{ marginBottom: '0.35rem' }}>
          {RANGES.map(r => <button key={r} className={`range-btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r}</button>)}
          <button className={`range-btn ${showPct ? 'active' : ''}`} onClick={() => setShowPct(p => !p)}
            style={{ marginLeft: 'auto', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}>% Change</button>
        </div>
        {!showPct && (
          <div className="time-range-selector" style={{ flexWrap: 'wrap', marginBottom: '0.45rem', gap: '0.3rem' }}>
            {fields.map(f => (
              <button key={f.key} className={`range-btn ${!hiddenSeries.has(f.key) ? 'active' : ''}`} onClick={() => toggle(f.key)}
                style={{ opacity: hiddenSeries.has(f.key) ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, display: 'inline-block' }} />{f.label}
              </button>
            ))}
          </div>
        )}
        <div className="chart-container" style={{ padding: '1rem' }}>
          <ResponsiveContainer width="100%" height={300}>
            {showPct ? (
              <ComposedChart data={pctData}>
                <CartesianGrid strokeDasharray="3 3" stroke='var(--color-border)' vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDateShort} stroke='var(--color-muted)' fontSize={10} />
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
                <XAxis dataKey="date" tickFormatter={fmtDateShort} stroke='var(--color-muted)' fontSize={10} />
                <YAxis stroke='var(--color-muted)' fontSize={10} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="remittances-tooltip"><p className="tooltip-date">{fmtMonth(label)}</p>
                    {payload.filter(p => p.value != null).map((p, i) => <div key={i} style={{ color: p.color || p.stroke, fontSize: '0.8rem', fontWeight: 600 }}>{p.name}: {p.value?.toLocaleString()} GWh</div>)}
                  </div>) : null} />
                {!hiddenSeries.has('rlng') && <Area dataKey="rlng" name="RLNG Generation" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.12} strokeWidth={2} connectNulls />}
                {!hiddenSeries.has('total') && <Area dataKey="total" name="Total Generation" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.08} strokeWidth={2} connectNulls />}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="modal-footer"><span>Source: State Bank of Pakistan</span><span style={{ color: 'var(--color-text-muted)' }}>Unit: GWh</span></div>
      </div>
    </div>
  );
};

/* ── Main Panel ───────────────────────────────────────────────────── */
const LNGDataPanel = ({ summary, history, loading, sbpPayments, sbpGeneration }) => {
  const [modal, setModal] = useState(null);

  if (loading || !summary) {
    return (
      <div className="panel" data-testid="lng-data-panel">
        <div className="panel-header">
          <div className="panel-title"><Flame size={16} /> Pakistan LNG Metrics</div>
          <span className="panel-badge">PakESDA</span>
        </div>
        <div className="panel-content"><div className="loading"><div className="spinner"></div></div></div>
      </div>
    );
  }

  const s = summary;
  const genLatest = sbpGeneration?.latest;
  const pmtLatest = sbpPayments?.latest;

  const metrics = [
    {
      icon: DollarSign, label: 'LNG Import Payment',
      value: pmtLatest ? `$${(pmtLatest.value / 1000).toFixed(1)}M` : 'N/A',
      change: sbpPayments?.mom_change_pct ?? null,
      sublabel: 'Million USD (SBP)',
      date: pmtLatest?.month || '',
      modalKey: 'sbp_payment',
    },
    {
      icon: PieChart, label: 'LNG % of Imports',
      value: sbpPayments?.lng_pct_of_imports != null ? `${sbpPayments.lng_pct_of_imports}%` : 'N/A',
      change: sbpPayments?.lng_pct_of_imports != null && sbpPayments?.prev_lng_pct_of_imports != null
        ? pctChange(sbpPayments.lng_pct_of_imports, sbpPayments.prev_lng_pct_of_imports) : null,
      sublabel: 'of total Pakistan imports',
      date: pmtLatest?.month || '',
      modalKey: 'import_pct',
    },
    {
      icon: Zap, label: 'RLNG Generation',
      value: genLatest ? `${genLatest.rlng?.toLocaleString()} GWh` : 'N/A',
      change: sbpGeneration?.mom_rlng ?? null,
      sublabel: 'SBP',
      date: genLatest ? formatDate(genLatest.date) : '',
      modalKey: 'sbp_gen',
    },
    {
      icon: Zap, label: 'RLNG in Mix',
      value: genLatest?.share ? `${genLatest.share}%` : 'N/A',
      change: null,
      sublabel: `of ${genLatest?.total?.toLocaleString() || 'N/A'} GWh total`,
      date: genLatest ? formatDate(genLatest.date) : '',
      modalKey: 'sbp_gen',
    },
    {
      icon: BarChart3, label: 'Avg Brent Price',
      value: s.brent_avg ? `$${s.brent_avg.value?.toFixed(2)}` : 'N/A',
      change: pctChange(s.brent_avg?.value, s.brent_avg?.prev),
      sublabel: s.brent_avg?.unit || '',
      date: formatDate(s.brent_avg?.date),
      modalKey: 'brent_avg',
    },
    {
      icon: Ship, label: 'Import Volume',
      value: s.import_volume ? formatVal(s.import_volume.value, 1) : 'N/A',
      change: pctChange(s.import_volume?.value, s.import_volume?.prev),
      sublabel: 'MMBtu',
      date: formatDate(s.import_volume?.date),
      modalKey: 'import_volume',
    },
    {
      icon: FileText, label: 'Cargo Distribution',
      value: s.cargo_distribution ? `${s.cargo_distribution.total || 0} cargoes` : 'N/A',
      change: null,
      sublabel: s.cargo_distribution ? `LT: ${s.cargo_distribution.long_term || 0} | Spot: ${s.cargo_distribution.spot || 0}` : '',
      date: formatDate(s.cargo_distribution?.date),
      modalKey: 'cargo_distribution',
    },
    {
      icon: DollarSign, label: 'LNG Price (wAvg DES)',
      value: s.lng_price ? `$${s.lng_price.value?.toFixed(2)}` : 'N/A',
      change: pctChange(s.lng_price?.value, s.lng_price?.prev),
      sublabel: s.lng_price ? `PSO: $${s.lng_price.pso?.toFixed(2) || 'N/A'} | PLL: $${s.lng_price.pll?.toFixed(2) || 'N/A'}` : '',
      date: formatDate(s.lng_price?.date),
      modalKey: 'lng_price',
    },
    {
      icon: Percent, label: 'DES Slope',
      value: s.des_slope ? `${s.des_slope.value?.toFixed(2)}%` : 'N/A',
      change: pctChange(s.des_slope?.value, s.des_slope?.prev),
      sublabel: '% of Brent',
      date: formatDate(s.des_slope?.date),
      modalKey: 'des_slope',
    },
    {
      icon: Ship, label: 'Contract Volume (LT)',
      value: s.contract_volume?.lt_volume ? formatVal(s.contract_volume.lt_volume, 1) : 'N/A',
      change: pctChange(s.contract_volume?.lt_volume, s.contract_volume?.prev_lt),
      sublabel: 'Long-Term MMBtu',
      date: formatDate(s.contract_volume?.date),
      modalKey: 'contract_volume',
    },
  ];

  const supabaseModalKeys = ['brent_avg', 'import_volume', 'power_generation', 'cargo_distribution', 'lng_price', 'des_slope', 'contract_volume', 'import_payment'];

  return (
    <>
      <div className="panel" data-testid="lng-data-panel">
        <div className="panel-header">
          <div className="panel-title"><Flame size={16} /> Pakistan LNG Metrics</div>
          <span className="panel-badge">PakESDA</span>
        </div>
        <div className="panel-content" style={{ maxHeight: 'none', padding: '0.75rem' }}>
          <div className="economic-grid-8">
            {metrics.map((m) => (
              <MetricCard
                key={m.label}
                icon={m.icon}
                label={m.label}
                value={m.value}
                change={m.change}
                sublabel={m.sublabel}
                date={m.date}
                onClick={() => setModal(m.modalKey)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Supabase modals */}
      {modal && supabaseModalKeys.includes(modal) && (
        <LNGDataModal modalKey={modal} summary={summary} history={history} onClose={() => setModal(null)} />
      )}

      {/* SBP modals */}
      {modal === 'sbp_payment' && sbpPayments && <SbpPaymentModal sbpPayments={sbpPayments} onClose={() => setModal(null)} />}
      {modal === 'import_pct' && sbpPayments && <LNGImportPctModal sbpPayments={sbpPayments} onClose={() => setModal(null)} />}
      {modal === 'sbp_gen' && sbpGeneration && <SbpGenModal sbpGen={sbpGeneration} onClose={() => setModal(null)} />}
    </>
  );
};

export default LNGDataPanel;
