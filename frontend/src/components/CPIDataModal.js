import React, { useState, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, Percent } from 'lucide-react';
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
  ReferenceLine
} from 'recharts';

const TIME_RANGES = [
  { key: 'YTD', label: 'YTD', months: null },
  { key: '1Y', label: '1Y', months: 12 },
  { key: '2Y', label: '2Y', months: 24 },
  { key: '5Y', label: '5Y', months: 60 },
  { key: '10Y', label: '10Y', months: 120 },
  { key: '20Y', label: '20Y', months: 240 },
  { key: 'ALL', label: 'All', months: null }
];

const CPIDataModal = ({ isOpen, onClose, data, title, type }) => {
  const [selectedRange, setSelectedRange] = useState('5Y');

  const filteredData = useMemo(() => {
    if (!data?.history) return [];
    
    // Ensure history is sorted oldest to newest
    const history = [...data.history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const now = new Date();
    const currentYear = now.getFullYear();
    
    const range = TIME_RANGES.find(r => r.key === selectedRange);
    
    if (selectedRange === 'YTD') {
      return history.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getFullYear() === currentYear;
      });
    }
    
    if (selectedRange === 'ALL' || !range?.months) {
      return history;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - range.months);
    
    return history.filter(item => new Date(item.date) >= cutoffDate);
  }, [data, selectedRange]);

  // Get base year markers within the selected range, mapped to actual data points
  const baseYearMarkers = useMemo(() => {
    if (!data?.base_year_markers || filteredData.length === 0) return [];
    
    const startDate = new Date(filteredData[0].date);
    const endDate = new Date(filteredData[filteredData.length - 1].date);
    
    // Filter markers within range and find closest data point for each
    return data.base_year_markers
      .filter(marker => {
        const markerDate = new Date(marker.date);
        return markerDate >= startDate && markerDate <= endDate;
      })
      .map(marker => {
        // Find the closest data point date to this marker
        const markerTime = new Date(marker.date).getTime();
        let closestDate = filteredData[0].date;
        let minDiff = Math.abs(new Date(filteredData[0].date).getTime() - markerTime);
        
        for (const dataPoint of filteredData) {
          const diff = Math.abs(new Date(dataPoint.date).getTime() - markerTime);
          if (diff < minDiff) {
            minDiff = diff;
            closestDate = dataPoint.date;
          }
        }
        
        return {
          ...marker,
          chartDate: closestDate  // Use the actual data point date for the chart
        };
      });
  }, [data, filteredData]);

  const formatValue = (value) => {
    if (value === null || value === undefined) return '--';
    return `${value >= 0 ? '' : ''}${value.toFixed(1)}%`;
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
        year: 'numeric' 
      });
      const value = payload[0].value;
      const baseYear = payload[0].payload?.base_year;
      return (
        <div className="remittances-tooltip">
          <p className="tooltip-date">{formattedDate}</p>
          <p className="tooltip-value" style={{ 
            color: type === 'mom' 
              ? (value >= 0 ? '#EF4444' : '#22C55E')
              : (value > 10 ? '#EF4444' : value > 5 ? '#F59E0B' : '#22C55E')
          }}>
            {formatValue(value)}
          </p>
          {baseYear && (
            <p className="tooltip-base" style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
              Base Year: {baseYear}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (!isOpen) return null;

  const latest = data?.latest;
  const latestValue = latest?.value || 0;
  const momChange = data?.mom_change;
  const yoyComparison = data?.yoy_comparison;

  // Calculate Y-axis domain
  const values = filteredData.map(d => d.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);

  // Determine status color
  const getStatusColor = (value) => {
    if (type === 'mom') {
      return value >= 0 ? '#EF4444' : '#22C55E';
    }
    if (value > 10) return '#EF4444';
    if (value > 5) return '#F59E0B';
    return '#22C55E';
  };

  const statusColor = getStatusColor(latestValue);

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="cpi-modal-overlay">
      <div 
        className="remittances-modal" 
        onClick={(e) => e.stopPropagation()}
        data-testid="cpi-modal"
      >
        <div className="modal-header">
          <div className="modal-title">
            <Percent size={20} />
            <span>{title || data?.name || 'CPI Data'}</span>
          </div>
          <button 
            className="modal-close" 
            onClick={onClose}
            data-testid="cpi-modal-close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-summary">
          <div className="summary-main">
            <div className="summary-value" style={{ color: statusColor }}>
              {formatValue(latestValue)}
            </div>
            <div className="summary-period">
              <Calendar size={14} />
              {latest?.month || 'N/A'}
            </div>
          </div>
          <div className="summary-changes">
            {momChange !== null && momChange !== undefined && (
              <div className={`summary-change ${momChange >= 0 ? 'negative' : 'positive'}`}>
                {momChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{momChange >= 0 ? '+' : ''}{momChange.toFixed(1)} pts</span>
                <span className="change-label">vs prev month</span>
              </div>
            )}
            {yoyComparison !== null && yoyComparison !== undefined && type === 'yoy' && (
              <div className="summary-change" style={{ color: 'var(--color-muted)' }}>
                <span>Year ago: {yoyComparison.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>

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
        </div>

        <div className="chart-container" data-testid="cpi-chart">
          <ResponsiveContainer width="100%" height={300}>
            {type === 'mom' ? (
              // Bar chart for MoM (shows positive/negative better)
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
                  tickFormatter={(val) => `${val}%`}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  domain={[Math.min(minValue * 1.2, -1), Math.max(maxValue * 1.2, 1)]}
                  width={45}
                />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                {/* Base year change markers */}
                {baseYearMarkers.map((marker, idx) => (
                  <ReferenceLine 
                    key={`base-${idx}`}
                    x={marker.chartDate} 
                    stroke="#6366f1" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ 
                      value: marker.base_year, 
                      fill: '#6366f1', 
                      fontSize: 10,
                      position: 'insideTopRight',
                      offset: 5
                    }}
                  />
                ))}
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {filteredData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value >= 0 ? '#EF4444' : '#22C55E'} 
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              // Area chart for YoY
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCPI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
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
                  tickFormatter={(val) => `${val}%`}
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={{ stroke: '#1e293b' }}
                  domain={[0, 'auto']}
                  width={45}
                />
                <ReferenceLine y={5} stroke="#F59E0B" strokeDasharray="5 5" label={{ value: '5% Target', fill: '#F59E0B', fontSize: 10 }} />
                {/* Base year change markers */}
                {baseYearMarkers.map((marker, idx) => (
                  <ReferenceLine 
                    key={`base-${idx}`}
                    x={marker.chartDate} 
                    stroke="#6366f1" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{ 
                      value: marker.base_year, 
                      fill: '#6366f1', 
                      fontSize: 10,
                      position: 'insideTopRight',
                      offset: 5
                    }}
                  />
                ))}
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCPI)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="modal-footer">
          <span className="data-source">Source: State Bank of Pakistan</span>
          <span className="data-updated">
            {data?.total_data_points && (
              <span style={{ marginRight: '1rem', color: '#64748b' }}>
                {data.total_data_points} data points
              </span>
            )}
            Last updated: {new Date(data?.updated || Date.now()).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CPIDataModal;
