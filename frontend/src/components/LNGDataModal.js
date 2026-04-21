import React, { useState, useMemo, useCallback } from 'react';
import { X, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

const RANGES = ['YTD', '6M', '1Y', '2Y', '3Y', 'ALL'];

const filterByRange = (data, range) => {
  if (range === 'ALL') return data;
  const now = new Date();
  let cutoff;
  if (range === 'YTD') {
    cutoff = new Date(now.getFullYear(), 0, 1);
  } else if (range === '6M') {
    cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - 6);
  } else {
    const years = parseInt(range);
    cutoff = new Date(now);
    cutoff.setFullYear(cutoff.getFullYear() - years);
  }
  return data.filter(d => new Date(d.date) >= cutoff);
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const fmtMonth = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const MODAL_CONFIG = {
  import_payment: {
    title: 'LNG Import Payment',
    dataKey: 'power_gen',
    valueKey: 'importPayment',
    fields: [{ key: 'importPayment', label: 'Import Payment', color: '#F59E0B', format: v => `$${(v/1000).toFixed(1)}M` }],
    chartType: 'area',
    unit: 'Million USD',
    hasPctChange: true,
    formatSummary: v => `$${(v/1000).toFixed(1)}M`,
  },
  brent_avg: {
    title: 'Average Brent Price',
    dataKey: 'power_gen',
    valueKey: 'brentAvg',
    fields: [{ key: 'brentAvg', label: 'Brent Avg', color: '#F59E0B', format: v => `$${v?.toFixed(2)}` }],
    chartType: 'area',
    unit: '$/bbl',
    hasPctChange: true,
    formatSummary: v => `$${v?.toFixed(2)}`,
  },
  import_volume: {
    title: 'LNG Import Volume',
    dataKey: 'information',
    valueKey: 'import_Volume',
    fields: [
      { key: 'import_Volume', label: 'Total Volume', color: '#F59E0B', format: v => `${(v/1e6).toFixed(1)}M` },
      { key: 'LT_Volume', label: 'Long-Term', color: '#3B82F6', format: v => `${(v/1e6).toFixed(1)}M` },
      { key: 'Spot_Volume', label: 'Spot', color: '#EF4444', format: v => v ? `${(v/1e6).toFixed(1)}M` : 'N/A' },
    ],
    chartType: 'bar',
    unit: 'MMBtu',
    hasPctChange: true,
    formatSummary: v => `${(v/1e6).toFixed(1)}M`,
  },
  power_generation: {
    title: 'Power Generation from LNG',
    dataKey: 'power_gen',
    valueKey: 'powerGeneration',
    fields: [
      { key: 'powerGeneration', label: 'LNG Gen', color: '#F59E0B', format: v => `${v?.toFixed(0)}` },
      { key: 'total_power_gen', label: 'Total Gen', color: '#3B82F6', format: v => `${v?.toFixed(0)}` },
    ],
    chartType: 'area',
    unit: 'GWh',
    hasPctChange: true,
    formatSummary: v => `${v?.toFixed(0)} GWh`,
  },
  cargo_distribution: {
    title: 'LNG Cargo Distribution',
    dataKey: 'information',
    valueKey: 'Total_Cargoes',
    fields: [
      { key: 'num_Long_Term_Cargoes', label: 'Long-Term', color: '#3B82F6', format: v => `${v}` },
      { key: 'num_Spot_Cargoes', label: 'Spot', color: '#EF4444', format: v => v ? `${v}` : '0' },
    ],
    chartType: 'bar',
    stacked: true,
    unit: 'Cargoes',
    hasPctChange: true,
    formatSummary: v => `${v}`,
  },
  lng_price: {
    title: 'LNG Price (DES)',
    dataKey: 'port_price',
    valueKey: 'wAvg_DES',
    fields: [
      { key: 'wAvg_DES', label: 'Weighted Avg DES', color: '#FACC15', format: v => `$${v?.toFixed(2)}`, type: 'line' },
      { key: 'Long_Term_DES', label: 'Long-Term DES', color: '#38BDF8', format: v => `$${v?.toFixed(2)}`, type: 'bar' },
      { key: 'Spot_DES', label: 'Spot DES', color: '#EF4444', format: v => v ? `$${v?.toFixed(2)}` : 'N/A', type: 'bar' },
    ],
    chartType: 'composed',
    unit: '$/MMBtu',
    formatSummary: v => `$${v?.toFixed(2)}`,
  },
  des_slope: {
    title: 'DES Slope',
    dataKey: 'port_price',
    valueKey: 'DES_Slope',
    fields: [
      { key: 'DES_Slope', label: 'Overall Slope', color: '#F59E0B', format: v => `${v?.toFixed(2)}%` },
    ],
    chartType: 'area',
    unit: '% of Brent',
    hasPriceTrend: true,
    formatSummary: v => `${v?.toFixed(2)}%`,
  },
  contract_volume: {
    title: 'Contract Volume',
    dataKey: 'information',
    valueKey: 'LT_Volume',
    fields: [
      { key: 'LT_Volume', label: 'Long-Term', color: '#3B82F6', format: v => v ? `${(v/1e6).toFixed(1)}M` : 'N/A' },
      { key: 'Spot_Volume', label: 'Spot', color: '#EF4444', format: v => v ? `${(v/1e6).toFixed(1)}M` : 'N/A' },
    ],
    chartType: 'bar',
    stacked: true,
    unit: 'MMBtu',
    formatSummary: v => v ? `${(v/1e6).toFixed(1)}M` : 'N/A',
  },
  terminal_cargoes: {
    title: 'Cargo Activity by Terminal',
    dataKey: 'information',
    valueKey: 'Total_Cargoes',
    fields: [
      { key: 'EETL_cargo', label: 'EETL', color: '#38BDF8', format: v => `${v}` },
      { key: 'PGPCL_cargo', label: 'PGPCL', color: '#A855F7', format: v => `${v}` },
    ],
    chartType: 'bar',
    stacked: true,
    unit: 'Cargoes',
    formatSummary: v => `${v}`,
  },
  port_charges: {
    title: 'Port Charges',
    dataKey: 'port_price',
    valueKey: 'wAvg_Port_Charges',
    fields: [
      { key: 'wAvg_Port_Charges', label: 'Avg Port Charges', color: '#F59E0B', format: v => `$${v?.toFixed(3)}` },
    ],
    chartType: 'area',
    unit: '$/MMBtu',
    formatSummary: v => `$${v?.toFixed(3)}`,
  },
};

const CustomTooltip = ({ active, payload, label, fields, showPct }) => {
  if (!active || !payload) return null;
  return (
    <div className="remittances-tooltip" style={{ minWidth: 180 }}>
      <p className="tooltip-date">{fmtMonth(label)}</p>
      {showPct ? (
        <p style={{ color: (payload[0]?.value ?? 0) >= 0 ? '#22C55E' : '#EF4444', fontSize: '0.8rem' }}>
          MoM: {(payload[0]?.value ?? 0) >= 0 ? '+' : ''}{(payload[0]?.value ?? 0).toFixed(2)}%
        </p>
      ) : (
        payload.filter(p => p.value !== null && p.value !== undefined).map((p, i) => {
          const field = fields?.find(f => f.key === p.dataKey);
          return (
            <div key={i} style={{ color: p.color || p.fill || p.stroke, fontSize: '0.8rem', fontWeight: 600 }}>
              {field?.label || p.name || p.dataKey}: {field?.format ? field.format(p.value) : p.value}
            </div>
          );
        })
      )}
    </div>
  );
};

const LegendChip = ({ field, hidden, onToggle }) => (
  <button
    onClick={() => onToggle(field.key)}
    className={`range-btn ${!hidden ? 'active' : ''}`}
    style={{ opacity: hidden ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
  >
    <span style={{
      width: field.type === 'line' ? 10 : 8,
      height: field.type === 'line' ? 2 : 8,
      borderRadius: field.type === 'line' ? 0 : '50%',
      background: field.color,
      display: 'inline-block',
    }} />
    {field.label}
  </button>
);

const LNGDataModal = ({ modalKey, summary, history, onClose }) => {
  const [range, setRange] = useState('ALL');
  const [hiddenSeries, setHiddenSeries] = useState(new Set());
  const [showPriceTrend, setShowPriceTrend] = useState(false);
  const [showPct, setShowPct] = useState(false);

  const config = MODAL_CONFIG[modalKey];
  const rawData = (config && history?.[config?.dataKey]) || [];
  const data = useMemo(() => filterByRange(rawData, range), [rawData, range]);

  const priceTrendData = useMemo(() => {
    if (!config?.hasPriceTrend) return [];
    const ppData = history?.port_price || [];
    return filterByRange(ppData, range);
  }, [config, history, range]);

  const pctData = useMemo(() => {
    if (!config?.hasPctChange || !config?.valueKey) return [];
    return data.map((row, i) => {
      if (i === 0) return { ...row, pct_change: 0 };
      const prev = data[i - 1][config.valueKey] ?? 0;
      const cur = row[config.valueKey] ?? 0;
      return { ...row, pct_change: prev !== 0 ? parseFloat(((cur - prev) / prev * 100).toFixed(2)) : 0 };
    });
  }, [data, config]);

  const toggleSeries = useCallback((key) => {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  if (!config) return null;

  // Get latest value from the raw data
  const latestRow = rawData.length > 0 ? rawData[rawData.length - 1] : {};
  const prevRow = rawData.length > 1 ? rawData[rawData.length - 2] : {};
  const latestVal = config.valueKey ? latestRow[config.valueKey] : null;
  const prevVal = config.valueKey ? prevRow[config.valueKey] : null;
  const momChange = latestVal && prevVal && prevVal !== 0 ? ((latestVal - prevVal) / Math.abs(prevVal)) * 100 : null;

  const visibleFields = config.fields.filter(f => !hiddenSeries.has(f.key));

  const priceTrendFields = [
    { key: 'Long_Term_DES', label: 'Long Term', color: '#38BDF8', format: v => `$${v?.toFixed(2)}` },
    { key: 'Spot_DES', label: 'Spot', color: '#EF4444', format: v => v ? `$${v?.toFixed(2)}` : 'N/A' },
  ];

  const renderChart = () => {
    // % Change view
    if (showPct && config.hasPctChange) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={pctData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={10} />
            <YAxis tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} stroke="#64748b" fontSize={10} width={56} />
            <Tooltip content={<CustomTooltip fields={config.fields} showPct={true} />} />
            <Bar dataKey="pct_change" radius={[2, 2, 0, 0]} maxBarSize={18}>
              {pctData.map((entry, i) => (
                <Cell key={i} fill={entry.pct_change >= 0 ? '#22C55E' : '#EF4444'} fillOpacity={0.85} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    // Price Trend (DES Slope modal)
    if (showPriceTrend && config.hasPriceTrend) {
      const visPT = priceTrendFields.filter(f => !hiddenSeries.has(f.key));
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={priceTrendData} barGap={1} barSize={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.6)" />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={10} angle={-45} textAnchor="end" height={50} />
            <YAxis stroke="#64748b" fontSize={10} tickFormatter={v => `$${v}`} />
            <Tooltip content={<CustomTooltip fields={priceTrendFields} />} />
            {visPT.map(f => (
              <Bar key={f.key} dataKey={f.key} name={f.label} fill={f.color} opacity={0.85} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // LNG Price composed chart: bars + line
    if (config.chartType === 'composed') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} barGap={1} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={10} />
            <YAxis stroke="#64748b" fontSize={10} tickFormatter={v => `$${v}`} />
            <Tooltip content={<CustomTooltip fields={config.fields} />} />
            {visibleFields.filter(f => f.type === 'bar').map(f => (
              <Bar key={f.key} dataKey={f.key} name={f.label} fill={f.color} opacity={0.85} maxBarSize={12} />
            ))}
            {visibleFields.filter(f => f.type === 'line').map(f => (
              <Line key={f.key} dataKey={f.key} name={f.label} stroke={f.color} strokeWidth={2.5} dot={false} connectNulls />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    // Standard charts
    const isStacked = config.stacked;
    if (config.chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} barGap={isStacked ? 0 : 2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.6)" />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={10} />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip content={<CustomTooltip fields={config.fields} />} />
            {visibleFields.map(f => (
              <Bar key={f.key} dataKey={f.key} name={f.label} fill={f.color} opacity={0.8} stackId={isStacked ? 'stack' : undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (config.chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.6)" />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={10} />
            <YAxis stroke="#64748b" fontSize={10} />
            <Tooltip content={<CustomTooltip fields={config.fields} />} />
            {visibleFields.map(f => (
              <Line key={f.key} dataKey={f.key} name={f.label} stroke={f.color} strokeWidth={2} dot={false} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // area
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.6)" />
          <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={10} />
          <YAxis stroke="#64748b" fontSize={10} />
          <Tooltip content={<CustomTooltip fields={config.fields} />} />
          {visibleFields.map(f => (
            <Area key={f.key} dataKey={f.key} name={f.label} stroke={f.color} fill={f.color} fillOpacity={0.15} strokeWidth={2} connectNulls />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const activeChipFields = showPriceTrend && config.hasPriceTrend ? priceTrendFields : config.fields;

  return (
    <div className="modal-overlay" onClick={onClose} data-testid={`lng-modal-${modalKey}`}>
      <div className="remittances-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            {showPriceTrend && config.hasPriceTrend ? 'Price Trend' : config.title}
          </div>
          <button className="modal-close" onClick={onClose} data-testid="lng-modal-close"><X size={18} /></button>
        </div>

        {/* Summary — always show latest value + unit */}
        {!showPct && latestVal !== undefined && latestVal !== null && !showPriceTrend && (
          <div className="modal-summary">
            <div className="summary-main">
              <div className="summary-value" data-testid="lng-modal-summary-value">
                {config.formatSummary ? config.formatSummary(latestVal) : latestVal}
              </div>
              <div className="summary-period">
                <Calendar size={14} />
                {fmtMonth(latestRow.date)}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                {config.unit}
              </div>
            </div>
            {momChange !== null && (
              <div className="summary-changes">
                <div className={`summary-change ${momChange >= 0 ? 'positive' : 'negative'}`}>
                  {momChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{momChange >= 0 ? '+' : ''}{momChange.toFixed(2)}%</span>
                  <span className="change-label">MoM</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DES Slope / Price Trend toggle */}
        {config.hasPriceTrend && (
          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
            <button
              className={`range-btn ${!showPriceTrend ? 'active' : ''}`}
              onClick={() => { setShowPriceTrend(false); setHiddenSeries(new Set()); setShowPct(false); }}
            >
              DES Slope
            </button>
            <button
              className={`range-btn ${showPriceTrend ? 'active' : ''}`}
              onClick={() => { setShowPriceTrend(true); setHiddenSeries(new Set()); setShowPct(false); }}
            >
              Price Trend
            </button>
          </div>
        )}

        {/* Range Selector + % Change toggle */}
        <div className="time-range-selector" style={{ marginBottom: '0.35rem' }}>
          {RANGES.map(r => (
            <button key={r} className={`range-btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r}</button>
          ))}
          {config.hasPctChange && !showPriceTrend && (
            <button
              className={`range-btn ${showPct ? 'active' : ''}`}
              onClick={() => setShowPct(p => !p)}
              style={{ marginLeft: 'auto', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}
            >
              % Change
            </button>
          )}
        </div>

        {/* Series legend chips */}
        {!showPct && (
          <div className="time-range-selector" style={{ flexWrap: 'wrap', marginBottom: '0.45rem', gap: '0.3rem' }}>
            {activeChipFields.map(f => (
              <LegendChip key={f.key} field={f} hidden={hiddenSeries.has(f.key)} onToggle={toggleSeries} />
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="chart-container" style={{ padding: '1rem' }}>
          {renderChart()}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span>Source: PakESDA</span>
          <span style={{ color: '#94a3b8' }}>Unit: {config.unit}</span>
        </div>
      </div>
    </div>
  );
};

export default LNGDataModal;
