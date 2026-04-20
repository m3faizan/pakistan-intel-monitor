import React, { useState, useMemo, useCallback } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

const MODAL_CONFIG = {
  import_payment: {
    title: 'LNG Import Payment',
    dataKey: 'power_gen',
    fields: [{ key: 'importPayment', label: 'Import Payment', color: '#22C55E', format: v => `$${(v/1000).toFixed(1)}M` }],
    chartType: 'area',
  },
  brent_avg: {
    title: 'Average Brent Price',
    dataKey: 'power_gen',
    fields: [{ key: 'brentAvg', label: 'Brent Avg', color: '#F59E0B', format: v => `$${v?.toFixed(2)}` }],
    chartType: 'area',
  },
  import_volume: {
    title: 'LNG Import Volume',
    dataKey: 'information',
    fields: [
      { key: 'import_Volume', label: 'Total Volume', color: '#22C55E', format: v => `${(v/1e6).toFixed(1)}M` },
      { key: 'LT_Volume', label: 'Long-Term', color: '#3B82F6', format: v => `${(v/1e6).toFixed(1)}M` },
      { key: 'Spot_Volume', label: 'Spot', color: '#EF4444', format: v => v ? `${(v/1e6).toFixed(1)}M` : 'N/A' },
    ],
    chartType: 'bar',
  },
  power_generation: {
    title: 'Power Generation from LNG',
    dataKey: 'power_gen',
    fields: [
      { key: 'powerGeneration', label: 'LNG Gen (GWh)', color: '#22C55E', format: v => `${v?.toFixed(0)}` },
      { key: 'total_power_gen', label: 'Total Gen (GWh)', color: '#3B82F6', format: v => `${v?.toFixed(0)}` },
    ],
    chartType: 'area',
  },
  cargo_distribution: {
    title: 'LNG Cargo Distribution',
    dataKey: 'information',
    fields: [
      { key: 'num_Long_Term_Cargoes', label: 'Long-Term', color: '#3B82F6', format: v => `${v}` },
      { key: 'num_Spot_Cargoes', label: 'Spot', color: '#EF4444', format: v => v ? `${v}` : '0' },
    ],
    chartType: 'bar',
    stacked: true,
  },
  lng_price: {
    title: 'LNG Price (DES)',
    dataKey: 'port_price',
    fields: [
      { key: 'wAvg_DES', label: 'Weighted Avg DES', color: '#22C55E', format: v => `$${v?.toFixed(2)}` },
      { key: 'Long_Term_DES', label: 'Long-Term DES', color: '#3B82F6', format: v => `$${v?.toFixed(2)}` },
      { key: 'Spot_DES', label: 'Spot DES', color: '#EF4444', format: v => v ? `$${v?.toFixed(2)}` : 'N/A' },
    ],
    chartType: 'line',
  },
  des_slope: {
    title: 'DES Slope',
    dataKey: 'port_price',
    fields: [
      { key: 'DES_Slope', label: 'Overall Slope (%)', color: '#22C55E', format: v => `${v?.toFixed(2)}%` },
    ],
    chartType: 'area',
    hasPriceTrend: true,
  },
  contract_volume: {
    title: 'Contract Volume',
    dataKey: 'information',
    fields: [
      { key: 'LT_Volume', label: 'Long-Term', color: '#3B82F6', format: v => v ? `${(v/1e6).toFixed(1)}M` : 'N/A' },
      { key: 'Spot_Volume', label: 'Spot', color: '#EF4444', format: v => v ? `${(v/1e6).toFixed(1)}M` : 'N/A' },
    ],
    chartType: 'bar',
    stacked: true,
  },
  terminal_cargoes: {
    title: 'Cargo Activity by Terminal',
    dataKey: 'information',
    fields: [
      { key: 'EETL_cargo', label: 'EETL', color: '#22C55E', format: v => `${v}` },
      { key: 'PGPCL_cargo', label: 'PGPCL', color: '#3B82F6', format: v => `${v}` },
    ],
    chartType: 'bar',
    stacked: true,
  },
  port_charges: {
    title: 'Port Charges',
    dataKey: 'port_price',
    fields: [
      { key: 'wAvg_Port_Charges', label: 'Avg Port Charges', color: '#F59E0B', format: v => `$${v?.toFixed(3)}` },
    ],
    chartType: 'area',
  },
};

const CustomTooltip = ({ active, payload, label, config }) => {
  if (!active || !payload) return null;
  return (
    <div className="remittances-tooltip">
      <div className="tooltip-date">{formatDate(label)}</div>
      {payload.filter(p => p.value !== null && p.value !== undefined).map((p, i) => {
        const field = config.fields.find(f => f.key === p.dataKey);
        return (
          <div key={i} style={{ color: p.color, fontSize: '0.85rem', fontWeight: 600 }}>
            {field?.label || p.dataKey}: {field?.format ? field.format(p.value) : p.value}
          </div>
        );
      })}
    </div>
  );
};

const PriceTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="remittances-tooltip">
      <div className="tooltip-date">{formatDate(label)}</div>
      {payload.filter(p => p.value !== null && p.value !== undefined).map((p, i) => (
        <div key={i} style={{ color: p.color || p.fill, fontSize: '0.85rem', fontWeight: 600 }}>
          {p.name}: ${p.value?.toFixed(2)}
        </div>
      ))}
    </div>
  );
};

const ClickableLegend = ({ fields, hiddenSeries, onToggle }) => (
  <>
    {fields.map(f => {
      const hidden = hiddenSeries.has(f.key);
      return (
        <button
          key={f.key}
          onClick={() => onToggle(f.key)}
          style={{
            background: hidden ? 'transparent' : 'var(--color-primary)',
            border: hidden ? '1px solid var(--color-border)' : '1px solid var(--color-primary)',
            color: hidden ? 'var(--color-muted)' : 'var(--color-background)',
            padding: '0.5rem 1rem',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s',
            fontWeight: 600,
          }}
        >
          <span style={{
            width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
            background: f.color,
            border: hidden ? `1px solid ${f.color}` : 'none',
          }} />
          {f.label}
        </button>
      );
    })}
  </>
);

const LNGDataModal = ({ modalKey, summary, history, onClose }) => {
  const [range, setRange] = useState('ALL');
  const [hiddenSeries, setHiddenSeries] = useState(new Set());
  const [showPriceTrend, setShowPriceTrend] = useState(false);

  const config = MODAL_CONFIG[modalKey];
  const rawData = (config && history?.[config?.dataKey]) || [];
  const data = useMemo(() => filterByRange(rawData, range), [rawData, range]);

  const priceTrendData = useMemo(() => {
    if (!config?.hasPriceTrend) return [];
    const ppData = history?.port_price || [];
    return filterByRange(ppData, range);
  }, [config, history, range]);

  const toggleSeries = useCallback((key) => {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  if (!config) return null;

  const latestMeta = summary?.[modalKey];
  const latestVal = latestMeta?.value;
  const prevVal = latestMeta?.prev;
  const change = latestVal && prevVal && prevVal !== 0 ? ((latestVal - prevVal) / Math.abs(prevVal)) * 100 : null;

  const visibleFields = config.fields.filter(f => !hiddenSeries.has(f.key));

  // Price Trend fields for DES Slope modal
  const priceTrendFields = [
    { key: 'Long_Term_DES', label: 'Long Term', color: '#22C55E', format: v => `$${v?.toFixed(2)}` },
    { key: 'Spot_DES', label: 'Spot', color: '#3B82F6', format: v => v ? `$${v?.toFixed(2)}` : 'N/A' },
  ];

  const activeFields = showPriceTrend && config.hasPriceTrend ? priceTrendFields : config.fields;

  const renderChart = () => {
    if (showPriceTrend && config.hasPriceTrend) {
      // Price Trend: grouped bar chart of Long Term vs Spot DES prices
      const visiblePT = priceTrendFields.filter(f => !hiddenSeries.has(f.key));
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={priceTrendData} barGap={1} barSize={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.6)" />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={10} angle={-45} textAnchor="end" height={50} />
            <YAxis stroke="#64748b" fontSize={10} tickFormatter={v => `$${v}`} />
            <Tooltip content={<PriceTrendTooltip />} />
            {visiblePT.map(f => (
              <Bar key={f.key} dataKey={f.key} name={f.label} fill={f.color} opacity={0.85} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    const ChartComp = config.chartType === 'bar' ? BarChart : config.chartType === 'line' ? LineChart : AreaChart;
    const isStacked = config.stacked;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <ChartComp data={data} barGap={isStacked ? 0 : 2}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.6)" />
          <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={10} />
          <YAxis stroke="#64748b" fontSize={10} />
          <Tooltip content={<CustomTooltip config={{ fields: activeFields }} />} />
          {visibleFields.map(f => {
            if (config.chartType === 'bar') {
              return <Bar key={f.key} dataKey={f.key} name={f.label} fill={f.color} opacity={0.8} stackId={isStacked ? 'stack' : undefined} />;
            }
            if (config.chartType === 'line') {
              return <Line key={f.key} dataKey={f.key} name={f.label} stroke={f.color} strokeWidth={2} dot={false} connectNulls />;
            }
            return (
              <Area key={f.key} dataKey={f.key} name={f.label} stroke={f.color} fill={f.color} fillOpacity={0.15} strokeWidth={2} connectNulls />
            );
          })}
        </ChartComp>
      </ResponsiveContainer>
    );
  };

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

        {/* Summary */}
        {latestVal !== undefined && latestVal !== null && !showPriceTrend && (
          <div className="modal-summary">
            <div className="summary-main">
              <div className="summary-value">
                {config.fields[0]?.format ? config.fields[0].format(latestVal) : latestVal}
              </div>
              <div className="summary-period">
                <span>Latest: {formatDate(latestMeta?.date)}</span>
              </div>
            </div>
            {change !== null && (
              <div className="summary-changes">
                <div className={`summary-change ${change >= 0 ? 'positive' : 'negative'}`}>
                  {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
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
              onClick={() => { setShowPriceTrend(false); setHiddenSeries(new Set()); }}
            >
              DES Slope
            </button>
            <button
              className={`range-btn ${showPriceTrend ? 'active' : ''}`}
              onClick={() => { setShowPriceTrend(true); setHiddenSeries(new Set()); }}
            >
              Price Trend
            </button>
          </div>
        )}

        {/* Range Selector + Clickable Legend — same row */}
        <div className="time-range-selector" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          {RANGES.map(r => (
            <button key={r} className={`range-btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r}</button>
          ))}
          <span style={{ width: '1px', height: '24px', background: 'var(--color-border)', margin: '0 0.25rem' }} />
          <ClickableLegend
            fields={showPriceTrend && config.hasPriceTrend ? priceTrendFields : config.fields}
            hiddenSeries={hiddenSeries}
            onToggle={toggleSeries}
          />
        </div>

        {/* Chart */}
        <div className="chart-container" style={{ padding: '1rem' }}>
          {renderChart()}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span>Source: PakESDA</span>
        </div>
      </div>
    </div>
  );
};

export default LNGDataModal;
