import React, { useEffect, useMemo, useState } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, Activity } from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
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

const SPIModal = ({ isOpen, onClose, data, title, frequency = 'Weekly' }) => {
  const [selectedRange, setSelectedRange] = useState('ALL');
  const [showPctChange, setShowPctChange] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState(['value']);

  const modalFrequency = frequency || data?.frequency || 'Weekly';
  const isWeekly = modalFrequency.toLowerCase() === 'weekly';
  const availableSeries = data?.available_series || ['value'];
  const canToggleSeries = isWeekly && availableSeries.length > 1;

  useEffect(() => {
    if (canToggleSeries) {
      setSelectedSeries(['value']);
    } else {
      setSelectedSeries(['value']);
    }
  }, [canToggleSeries, data?.updated]);

  const toggleSeries = (seriesKey) => {
    setSelectedSeries((current) => {
      if (current.includes(seriesKey)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((key) => key !== seriesKey);
      }

      return [...current, seriesKey];
    });
  };

  const filteredData = useMemo(() => {
    if (!data?.history) return [];

    const history = [...data.history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const range = TIME_RANGES.find(r => r.key === selectedRange);

    if (selectedRange === 'ALL' || !range?.months) {
      return history;
    }

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - range.months);
    return history.filter(item => new Date(item.date) >= cutoffDate);
  }, [data, selectedRange]);

  if (!isOpen) return null;

  const latest = data?.latest;
  const latestValue = latest?.value || 0;
  const primaryChange = data?.primary_change;
  const primaryChangePct = data?.primary_change_pct;
  const primaryLabel = data?.primary_change_label || 'Change';
  const isIncrease = (primaryChange || 0) >= 0;
  const isFavorable = (primaryChange || 0) <= 0;

  const formatTickDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isWeekly) {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit'
    });
  };

  const formatTooltipDate = (dateStr) => {
    const date = new Date(dateStr);

    if (isWeekly) {
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const valuesForDomain = filteredData.flatMap((row) => (
    selectedSeries
      .map((seriesKey) => row?.[seriesKey])
      .filter((value) => value !== null && value !== undefined)
  ));

  const minValue = valuesForDomain.length ? Math.min(...valuesForDomain, 0) : 0;
  const maxValue = valuesForDomain.length ? Math.max(...valuesForDomain, 0) : 0;

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="spi-modal-overlay">
      <div className="remittances-modal" onClick={(e) => e.stopPropagation()} data-testid="spi-modal">
        <div className="modal-header">
          <div className="modal-title" data-testid="spi-modal-title">
            <Activity size={20} />
            <span>{title || data?.name || 'SPI Data'}</span>
          </div>
          <button className="modal-close" onClick={onClose} data-testid="spi-modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-summary" data-testid="spi-modal-summary">
          <div className="summary-main">
            <div className="summary-value" data-testid="spi-summary-value">
              {latestValue.toFixed(2)}
            </div>
            <div className="summary-period" data-testid="spi-summary-period">
              <Calendar size={14} />
              {latest?.week_ending_formatted || latest?.month || 'N/A'}
            </div>
          </div>

          {(primaryChange !== null && primaryChange !== undefined) && (
            <div className="summary-changes">
              <div className={`summary-change ${isFavorable ? 'positive' : 'negative'}`} data-testid="spi-summary-change">
                {isIncrease ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{isIncrease ? '+' : ''}{primaryChange.toFixed(2)} pts</span>
                {(primaryChangePct !== null && primaryChangePct !== undefined) && (
                  <span className="change-label">({isIncrease ? '+' : ''}{primaryChangePct.toFixed(2)}%) {primaryLabel}</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="time-range-selector" data-testid="spi-time-range-selector">
          {TIME_RANGES.map((range) => (
            <button
              key={range.key}
              className={`range-btn ${selectedRange === range.key ? 'active' : ''}`}
              onClick={() => setSelectedRange(range.key)}
              data-testid={`spi-range-btn-${range.key}`}
            >
              {range.label}
            </button>
          ))}

          <button
            className={`range-btn ${showPctChange ? 'active' : ''}`}
            onClick={() => setShowPctChange(!showPctChange)}
            style={{ marginLeft: '1rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}
            data-testid="spi-pct-toggle"
          >
            {showPctChange ? 'Value' : '% Change'}
          </button>
        </div>

        {canToggleSeries && !showPctChange && (
          <div
            className="spi-series-toggle-group"
            data-testid="spi-series-toggle-group"
          >
            {availableSeries.map((seriesKey) => {
              const isActive = selectedSeries.includes(seriesKey);
              const config = SERIES_CONFIG[seriesKey] || { label: seriesKey.toUpperCase(), color: '#22C55E' };
              return (
                <button
                  key={seriesKey}
                  onClick={() => toggleSeries(seriesKey)}
                  className="range-btn"
                  data-testid={`spi-series-toggle-${seriesKey}`}
                  style={{
                    borderColor: isActive ? config.color : 'var(--color-border)',
                    color: isActive ? config.color : 'var(--color-muted)',
                    background: isActive ? `${config.color}22` : 'transparent'
                  }}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="chart-container" data-testid="spi-chart-container">
          <ResponsiveContainer width="100%" height={300}>
            {showPctChange ? (
              <BarChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatTickDate}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  tickFormatter={(val) => `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  domain={['auto', 'auto']}
                  width={50}
                />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const formattedDate = formatTooltipDate(label);
                      const pct = payload[0].value || 0;
                      const pctColor = pct >= 0 ? '#EF4444' : '#22C55E';
                      return (
                        <div className="remittances-tooltip">
                          <p className="tooltip-date">{formattedDate}</p>
                          <p className="tooltip-value" style={{ color: pctColor }}>
                            {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="pct_change" radius={[2, 2, 0, 0]}>
                  {filteredData.map((entry, index) => (
                    <Cell key={`spi-pct-cell-${index}`} fill={entry.pct_change >= 0 ? '#EF4444' : '#22C55E'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            ) : canToggleSeries ? (
              <LineChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatTickDate}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  tickFormatter={(val) => val.toFixed(0)}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  domain={[Math.max(0, minValue * 0.98), maxValue * 1.02]}
                  width={50}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const formattedDate = formatTooltipDate(label);
                      return (
                        <div className="remittances-tooltip" style={{ minWidth: '190px' }}>
                          <p className="tooltip-date">{formattedDate}</p>
                          {payload.map((entry) => (
                            <p key={entry.dataKey} style={{ color: entry.color, fontSize: '0.8rem', margin: '0.2rem 0' }}>
                              {(SERIES_CONFIG[entry.dataKey]?.label || entry.name)}: {(entry.value || 0).toFixed(2)}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '8px' }}
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{value}</span>}
                />
                {selectedSeries.map((seriesKey) => {
                  const config = SERIES_CONFIG[seriesKey] || { label: seriesKey.toUpperCase(), color: '#22C55E' };
                  return (
                    <Line
                      key={seriesKey}
                      type="monotone"
                      dataKey={seriesKey}
                      name={config.label}
                      stroke={config.color}
                      strokeWidth={seriesKey === 'value' ? 2.5 : 1.8}
                      dot={false}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            ) : (
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSPI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatTickDate}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  tickFormatter={(val) => val.toFixed(0)}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  domain={[Math.max(0, minValue * 0.98), maxValue * 1.02]}
                  width={50}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const point = payload[0]?.payload;
                      const formattedDate = formatTooltipDate(label);
                      return (
                        <div className="remittances-tooltip">
                          <p className="tooltip-date">{formattedDate}</p>
                          <p className="tooltip-value" style={{ color: '#22C55E' }}>{(point?.value || 0).toFixed(2)}</p>
                          {(point?.pct_change !== null && point?.pct_change !== undefined) && (
                            <p style={{ fontSize: '0.72rem', color: point.pct_change >= 0 ? '#EF4444' : '#22C55E', marginTop: '4px' }}>
                              {point.pct_change >= 0 ? '+' : ''}{point.pct_change.toFixed(2)}%
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#colorSPI)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="modal-footer" data-testid="spi-modal-footer">
          <span className="data-source">
            Source:{' '}
            <a
              href="https://spi.pakesda.com/"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
              data-testid="spi-source-link"
            >
              spi.pakesda.com
            </a>
          </span>
          <span className="data-updated">
            Last updated: {new Date(data?.updated || Date.now()).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SPIModal;