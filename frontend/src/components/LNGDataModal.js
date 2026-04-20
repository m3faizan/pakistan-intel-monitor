import React, { useState, useMemo } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const RANGES = ['1Y', '2Y', '3Y', 'ALL'];

const filterByRange = (data, range) => {
  if (range === 'ALL') return data;
  const years = parseInt(range);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);
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
    yLabel: 'Thousand USD',
  },
  brent_avg: {
    title: 'Average Brent Price',
    dataKey: 'power_gen',
    fields: [{ key: 'brentAvg', label: 'Brent Avg', color: '#F59E0B', format: v => `$${v?.toFixed(2)}` }],
    chartType: 'area',
    yLabel: '$/bbl',
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
    yLabel: 'MMBtu',
  },
  power_generation: {
    title: 'Power Generation from LNG',
    dataKey: 'power_gen',
    fields: [
      { key: 'powerGeneration', label: 'LNG Gen (GWh)', color: '#22C55E', format: v => `${v?.toFixed(0)}` },
      { key: 'total_power_gen', label: 'Total Gen (GWh)', color: '#3B82F6', format: v => `${v?.toFixed(0)}` },
    ],
    chartType: 'area',
    yLabel: 'GWh',
  },
  cargo_distribution: {
    title: 'LNG Cargo Distribution',
    dataKey: 'information',
    fields: [
      { key: 'Total_Cargoes', label: 'Total Cargoes', color: '#22C55E', format: v => `${v}` },
      { key: 'num_Long_Term_Cargoes', label: 'Long-Term', color: '#3B82F6', format: v => `${v}` },
      { key: 'num_Spot_Cargoes', label: 'Spot', color: '#EF4444', format: v => v ? `${v}` : '0' },
    ],
    chartType: 'bar',
    yLabel: 'Cargoes',
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
    yLabel: '$/MMBtu',
  },
  des_slope: {
    title: 'DES Slope (% of Brent)',
    dataKey: 'port_price',
    fields: [
      { key: 'DES_Slope', label: 'Overall Slope', color: '#22C55E', format: v => `${v?.toFixed(2)}%` },
      { key: 'Long_Term_Slope', label: 'Long-Term Slope', color: '#3B82F6', format: v => `${v?.toFixed(2)}%` },
      { key: 'Spot_Slope', label: 'Spot Slope', color: '#EF4444', format: v => v ? `${v?.toFixed(2)}%` : 'N/A' },
    ],
    chartType: 'line',
    yLabel: '%',
  },
  contract_volume: {
    title: 'Contract Volume',
    dataKey: 'information',
    fields: [
      { key: 'LT_Volume', label: 'Long-Term', color: '#3B82F6', format: v => v ? `${(v/1e6).toFixed(1)}M` : 'N/A' },
      { key: 'Spot_Volume', label: 'Spot', color: '#EF4444', format: v => v ? `${(v/1e6).toFixed(1)}M` : 'N/A' },
    ],
    chartType: 'bar',
    yLabel: 'MMBtu',
  },
};

const CustomTooltip = ({ active, payload, label, config }) => {
  if (!active || !payload) return null;
  return (
    <div className="remittances-tooltip">
      <div className="tooltip-date">{formatDate(label)}</div>
      {payload.map((p, i) => {
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

const LNGDataModal = ({ modalKey, summary, history, onClose }) => {
  const [range, setRange] = useState('ALL');
  const config = MODAL_CONFIG[modalKey];

  const rawData = (config && history?.[config?.dataKey]) || [];
  const data = useMemo(() => filterByRange(rawData, range), [rawData, range]);

  if (!config) return null;

  const latestMeta = summary?.[modalKey];
  const latestVal = latestMeta?.value;
  const prevVal = latestMeta?.prev;
  const change = latestVal && prevVal && prevVal !== 0 ? ((latestVal - prevVal) / Math.abs(prevVal)) * 100 : null;

  const ChartComponent = config.chartType === 'bar' ? BarChart : config.chartType === 'line' ? LineChart : AreaChart;

  return (
    <div className="modal-overlay" onClick={onClose} data-testid={`lng-modal-${modalKey}`}>
      <div className="remittances-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">{config.title}</div>
          <button className="modal-close" onClick={onClose} data-testid="lng-modal-close"><X size={18} /></button>
        </div>

        {/* Summary */}
        {latestVal !== undefined && latestVal !== null && (
          <div className="modal-summary">
            <div className="summary-main">
              <div className="summary-value">
                {config.fields[0]?.format ? config.fields[0].format(latestVal) : latestVal}
              </div>
              <div className="summary-period">
                <span>Latest: {formatDate(latestMeta?.date)}</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{latestMeta?.unit || ''}</span>
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

        {/* Range Selector */}
        <div className="time-range-selector">
          {RANGES.map(r => (
            <button key={r} className={`range-btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>

        {/* Chart */}
        <div className="chart-container" style={{ padding: '1rem' }}>
          <ResponsiveContainer width="100%" height={300}>
            <ChartComponent data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.6)" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip content={<CustomTooltip config={config} />} />
              <Legend wrapperStyle={{ fontSize: '0.7rem' }} />
              {config.fields.map(f => {
                if (config.chartType === 'bar') {
                  return <Bar key={f.key} dataKey={f.key} name={f.label} fill={f.color} opacity={0.8} />;
                }
                if (config.chartType === 'line') {
                  return <Line key={f.key} dataKey={f.key} name={f.label} stroke={f.color} strokeWidth={2} dot={false} connectNulls />;
                }
                return (
                  <Area key={f.key} dataKey={f.key} name={f.label} stroke={f.color} fill={f.color} fillOpacity={0.15} strokeWidth={2} connectNulls />
                );
              })}
            </ChartComponent>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span>Source: Supabase / Pakistan LNG Data</span>
          <span>{data.length} data points</span>
        </div>
      </div>
    </div>
  );
};

export default LNGDataModal;
