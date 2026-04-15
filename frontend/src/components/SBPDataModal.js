import React, { useState, useMemo, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { 
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Line,
  Legend
} from 'recharts';

const TIME_RANGES = [
  { key: 'YTD', label: 'YTD', months: null },
  { key: '6M', label: '6M', months: 6 },
  { key: '1Y', label: '1Y', months: 12 },
  { key: '5Y', label: '5Y', months: 60 },
  { key: '10Y', label: '10Y', months: 120 },
  { key: 'ALL', label: 'All', months: null }
];

const SBPDataModal = ({ isOpen, onClose, data, title, icon: Icon = DollarSign, isCurrentAccount = false, isPkrUsd = false, isForexReserves = false, isLiquidForex = false, isGovDebt = false, isFDI = false }) => {
  const [selectedRange, setSelectedRange] = useState('1Y');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showPctChange, setShowPctChange] = useState(false);
  const isBreakdownSeries = isForexReserves || isLiquidForex || isGovDebt;

  const breakdownLabels = isGovDebt
    ? {
        primary: 'Internal Debt',
        secondary: 'External Debt'
      }
    : isLiquidForex
      ? {
          primary: 'Net Reserves with SBP',
          secondary: 'Net Reserves with Banks'
        }
      : {
          primary: 'SBP Reserves',
          secondary: 'Bank Reserves'
        };

  const breakdownKeys = isGovDebt
    ? { primary: 'internal_debt', secondary: 'external_debt' }
    : { primary: 'sbp_reserves', secondary: 'bank_reserves' };

  useEffect(() => {
    if (!isOpen) return;
    setSelectedRange(isFDI ? 'ALL' : '1Y');
    setShowBreakdown(false);
    setShowPctChange(false);
  }, [isOpen, isFDI, title]);

  const filteredData = useMemo(() => {
    if (!data?.history) return [];
    
    const history = [...data.history].reverse();
    const now = new Date();
    const currentYear = now.getFullYear();
    
    const range = TIME_RANGES.find(r => r.key === selectedRange);
    
    let filtered;
    if (selectedRange === 'YTD') {
      filtered = history.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === currentYear;
      });
    } else if (selectedRange === 'ALL' || !range?.months) {
      filtered = history;
    } else {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - range.months);
      filtered = history.filter(item => new Date(item.date) >= cutoffDate);
    }
    
    // Calculate % change for each data point
    const withPctChange = filtered.map((item, idx) => {
      let pctChange = 0;
      if (idx > 0) {
        const prevValue = filtered[idx - 1].value;
        if (prevValue && prevValue !== 0) {
          pctChange = ((item.value - prevValue) / Math.abs(prevValue)) * 100;
        }
      }
      return {
        ...item,
        pct_change: parseFloat(pctChange.toFixed(2))
      };
    });
    
    return withPctChange;
  }, [data, selectedRange]);

  const formatValue = (value) => {
    if (isFDI) {
      const abs = Math.abs(Number(value));
      return `${value >= 0 ? '+' : '-'}$${abs.toFixed(0)}M`;
    }
    if (isGovDebt) {
      return `₨${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}B`;
    }
    if (isPkrUsd) {
      return `₨${value.toFixed(2)}`;
    }
    if (isCurrentAccount) {
      const prefix = value >= 0 ? '+' : '';
      if (Math.abs(value) >= 1000) {
        return `${prefix}$${(value / 1000).toFixed(2)}B`;
      }
      return `${prefix}$${value.toFixed(0)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}B`;
    }
    return `$${value.toFixed(0)}M`;
  };

  const formatChange = (value) => {
    if (isGovDebt) {
      const prefix = value >= 0 ? '+' : '';
      return `${prefix}${value.toFixed(2)}%`;
    }
    if (isCurrentAccount) {
      const prefix = value >= 0 ? '+' : '';
      return `${prefix}$${value.toFixed(0)}M`;
    }
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: (isPkrUsd || isLiquidForex) ? 'numeric' : undefined,
        year: 'numeric' 
      });
      const value = payload[0].value;
      return (
        <div className="remittances-tooltip">
          <p className="tooltip-date">{formattedDate}</p>
          <p className="tooltip-value" style={{ color: isCurrentAccount ? (value >= 0 ? '#22C55E' : '#EF4444') : '#22C55E' }}>
            {formatValue(value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!isOpen) return null;

  const latest = data?.latest;
  const latestValue = latest?.value || 0;
  const momChange = isPkrUsd
    ? data?.daily_change
    : isLiquidForex
      ? data?.wow_change_pct
      : data?.mom_change;
  const yoyChange = data?.yoy_change;
  const hasMomChange = momChange !== null && momChange !== undefined;
  const isMomIncrease = (momChange || 0) >= 0;
  const isYoyIncrease = (yoyChange || 0) >= 0;
  const isMomPositive = isGovDebt ? !isMomIncrease : isMomIncrease;
  const isYoyPositive = isGovDebt ? !isYoyIncrease : isYoyIncrease;

  const formatBreakdownValue = (value) => {
    if (value === null || value === undefined) {
      return isGovDebt ? '₨--' : '$--';
    }

    if (isGovDebt) {
      return `₨${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}B`;
    }

    return `$${(value / 1000).toFixed(2)}B`;
  };

  // Calculate Y-axis domain
  const values = filteredData.map(d => d.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="sbp-modal-overlay">
      <div 
        className="remittances-modal" 
        onClick={(e) => e.stopPropagation()}
        data-testid="sbp-modal"
      >
        <div className="modal-header">
          <div className="modal-title">
            <Icon size={20} />
            <span>{title || data?.name || 'SBP Data'}</span>
          </div>
          <button 
            className="modal-close" 
            onClick={onClose}
            data-testid="sbp-modal-close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-summary">
          <div className="summary-main">
            <div className="summary-value">
              {formatValue(latestValue)}
            </div>
            <div className="summary-period">
              <Calendar size={14} />
              {(isPkrUsd || isLiquidForex) ? latest?.dateFormatted : latest?.month || 'N/A'}
            </div>
          </div>
          <div className="summary-changes">
            {hasMomChange && (
              <div className={`summary-change ${isMomPositive ? 'positive' : 'negative'}`} data-testid="primary-change-summary">
                {isMomIncrease ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{formatChange(momChange)}</span>
                <span className="change-label">{isPkrUsd ? 'Daily' : isLiquidForex ? 'WoW' : 'MoM'}</span>
              </div>
            )}
            {yoyChange !== null && yoyChange !== undefined && (
              <div className={`summary-change ${isYoyPositive ? 'positive' : 'negative'}`}>
                {isYoyIncrease ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{formatChange(yoyChange)}</span>
                <span className="change-label">YoY</span>
              </div>
            )}
          </div>
        </div>

        {isBreakdownSeries && data?.breakdown && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <div style={{
              padding: '0.75rem',
              background: 'var(--color-background)',
              borderRadius: '6px',
              borderLeft: '3px solid #22C55E'
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                {breakdownLabels.primary}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text)', fontFamily: "'JetBrains Mono', monospace" }}>
                {formatBreakdownValue(data.breakdown[breakdownKeys.primary]?.latest_value)}
              </div>
            </div>
            <div style={{
              padding: '0.75rem',
              background: 'var(--color-background)',
              borderRadius: '6px',
              borderLeft: '3px solid #6366f1'
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                {breakdownLabels.secondary}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text)', fontFamily: "'JetBrains Mono', monospace" }}>
                {formatBreakdownValue(data.breakdown[breakdownKeys.secondary]?.latest_value)}
              </div>
            </div>
          </div>
        )}

        <div className="time-range-selector" data-testid="time-range-selector">
          {TIME_RANGES.map((range) => (
            <button
              key={range.key}
              className={`range-btn ${selectedRange === range.key ? 'active' : ''}`}
              onClick={() => setSelectedRange(range.key)}
              data-testid={`range-btn-${range.key}`}
            >
              {range.label}
            </button>
          ))}
          
          {/* Chart type toggle for Forex Reserves or Liquid Forex */}
          {isBreakdownSeries && (
            <button
              className={`range-btn ${showBreakdown ? 'active' : ''}`}
              onClick={() => {
                const nextShowBreakdown = !showBreakdown;
                setShowBreakdown(nextShowBreakdown);
                if (nextShowBreakdown) {
                  setShowPctChange(false);
                }
              }}
              style={{ marginLeft: '1rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}
              data-testid="breakdown-toggle"
            >
              {showBreakdown ? 'Total' : 'Breakdown'}
            </button>
          )}
          
          {/* % Change toggle for all charts */}
          {!isCurrentAccount && (
            <button
              className={`range-btn ${showPctChange ? 'active' : ''}`}
              onClick={() => {
                const nextShowPct = !showPctChange;
                setShowPctChange(nextShowPct);
                if (nextShowPct && isBreakdownSeries) {
                  setShowBreakdown(false);
                }
              }}
              style={{ marginLeft: isBreakdownSeries ? '0.5rem' : '1rem', borderLeft: isBreakdownSeries ? 'none' : '1px solid var(--color-border)', paddingLeft: isBreakdownSeries ? '0.5rem' : '1rem' }}
              data-testid="pct-change-toggle"
            >
              {showPctChange ? 'Value' : '% Change'}
            </button>
          )}
        </div>

        <div className="chart-container" data-testid="sbp-chart">
          <ResponsiveContainer width="100%" height={300}>
            {isBreakdownSeries && showBreakdown ? (
              // Stacked bar chart with line for total
              <ComposedChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis 
                  tickFormatter={(val) => {
                    if (isGovDebt) {
                      return `₨${(val / 1000).toFixed(0)}T`;
                    }
                    return `$${(val / 1000).toFixed(0)}B`;
                  }}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  domain={[0, 'auto']}
                  width={50}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const date = new Date(label);
                      const formattedDate = date.toLocaleDateString('en-US', {
                        month: 'long',
                        day: isLiquidForex ? 'numeric' : undefined,
                        year: 'numeric'
                      });
                      return (
                        <div className="remittances-tooltip" style={{ minWidth: '180px' }}>
                          <p className="tooltip-date">{formattedDate}</p>
                          {payload.map((entry, idx) => (
                            <p key={idx} style={{ color: entry.color, fontSize: '0.85rem', margin: '0.25rem 0' }}>
                              {entry.name}: {isGovDebt ? `₨${Number(entry.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}B` : `$${(entry.value / 1000).toFixed(2)}B`}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{value}</span>}
                />
                <Bar dataKey={breakdownKeys.primary} name={breakdownLabels.primary} stackId="a" fill="#22C55E" radius={[0, 0, 0, 0]} />
                <Bar dataKey={breakdownKeys.secondary} name={breakdownLabels.secondary} stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name={isGovDebt ? 'Total Debt' : 'Total'} 
                  stroke="#F59E0B" 
                  strokeWidth={2} 
                  dot={false}
                />
              </ComposedChart>
            ) : isCurrentAccount ? (
              // Bar chart for Current Account Balance
              <BarChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis 
                  tickFormatter={(val) => {
                    const prefix = val >= 0 ? '' : '-';
                    return `${prefix}$${Math.abs(val/1000).toFixed(1)}B`;
                  }}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  domain={[minValue * 1.1, maxValue * 1.1]}
                  width={60}
                />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {filteredData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value >= 0 ? '#22C55E' : '#EF4444'} 
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : showPctChange ? (
              // % Change Bar Chart
              <BarChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
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
                      const date = new Date(label);
                      const formattedDate = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      const pctChange = payload[0].value;
                      return (
                        <div className="remittances-tooltip">
                          <p className="tooltip-date">{formattedDate}</p>
                          <p className="tooltip-value" style={{ 
                            color: isGovDebt ? (pctChange >= 0 ? '#EF4444' : '#22C55E') : (pctChange >= 0 ? '#22C55E' : '#EF4444')
                          }}>
                            {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(2)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="pct_change" radius={[2, 2, 0, 0]}>
                  {filteredData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isGovDebt ? (entry.pct_change >= 0 ? '#EF4444' : '#22C55E') : (entry.pct_change >= 0 ? '#22C55E' : '#EF4444')} 
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              // Area chart for other indicators
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDefault" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis 
                  tickFormatter={(val) => {
                    if (isPkrUsd) {
                      return `₨${val.toFixed(0)}`;
                    }
                    if (isFDI) {
                      return `$${val.toFixed(0)}M`;
                    }
                    if (isGovDebt) {
                      return `₨${(val / 1000).toFixed(1)}T`;
                    }
                    return `$${(val / 1000).toFixed(1)}B`;
                  }}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  domain={(isPkrUsd || isFDI) ? ['auto', 'auto'] : [0, 'auto']}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#22C55E" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDefault)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="modal-footer">
          <span className="data-source">Source: State Bank of Pakistan</span>
          <span className="data-updated">
            Last updated: {new Date(data?.updated || Date.now()).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SBPDataModal;
