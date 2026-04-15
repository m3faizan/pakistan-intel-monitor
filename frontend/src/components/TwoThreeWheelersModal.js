import React, { useMemo, useState } from 'react';
import { X, Bike, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart
} from 'recharts';

const TIME_RANGES = [
  { key: '1Y', label: '1Y', months: 12 },
  { key: '2Y', label: '2Y', months: 24 },
  { key: '5Y', label: '5Y', months: 60 },
  { key: 'ALL', label: 'All', months: null }
];

const TwoThreeWheelersModal = ({ isOpen, onClose, data, title }) => {
  const [mode, setMode] = useState('production');
  const [selectedRange, setSelectedRange] = useState('2Y');

  const modeData = data?.[mode];

  const filteredData = useMemo(() => {
    if (!modeData?.history) return [];
    const history = [...modeData.history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const range = TIME_RANGES.find((r) => r.key === selectedRange);
    if (selectedRange === 'ALL' || !range?.months) return history;
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - range.months);
    return history.filter((item) => new Date(item.date) >= cutoffDate);
  }, [modeData, selectedRange]);

  if (!isOpen || !data) return null;

  const latest = modeData?.latest;
  const momChange = modeData?.mom_change_pct;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="two-three-modal-overlay">
      <div className="remittances-modal" onClick={(e) => e.stopPropagation()} data-testid="two-three-modal">
        <div className="modal-header">
          <div className="modal-title" data-testid="two-three-modal-title">
            <Bike size={20} />
            <span>{title || '2 & 3 Wheelers'}</span>
            <span
              className="live-dot"
              data-testid="two-three-live-dot"
              style={{
                width: '6px',
                height: '6px',
                backgroundColor: data?.stale ? '#F59E0B' : '#22C55E',
                borderRadius: '50%',
                display: 'inline-block',
                marginLeft: '6px',
                animation: 'pulse 2s infinite'
              }}
            ></span>
          </div>
          <button className="modal-close" onClick={onClose} data-testid="two-three-modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-summary">
          <div className="summary-main">
            <div className="summary-value" data-testid="two-three-summary-value">{(latest?.total || 0).toLocaleString()}</div>
            <div className="summary-period" data-testid="two-three-summary-period">
              <Calendar size={14} />
              {latest?.month || data?.latest_month || 'N/A'}
            </div>
          </div>
          {momChange !== null && momChange !== undefined && (
            <div className="summary-changes">
              <div className={`summary-change ${momChange >= 0 ? 'positive' : 'negative'}`} data-testid="two-three-summary-change">
                {momChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{momChange >= 0 ? '+' : ''}{momChange.toFixed(2)}%</span>
                <span className="change-label">MoM</span>
              </div>
            </div>
          )}
        </div>

        <div className="time-range-selector" data-testid="two-three-time-selector">
          <button className={`range-btn ${mode === 'production' ? 'active' : ''}`} onClick={() => setMode('production')} data-testid="two-three-mode-production">Production</button>
          <button className={`range-btn ${mode === 'sales' ? 'active' : ''}`} onClick={() => setMode('sales')} data-testid="two-three-mode-sales">Sales</button>
          <div style={{ width: '1px', height: '22px', background: 'var(--color-border)', margin: '0 0.3rem' }}></div>
          {TIME_RANGES.map((range) => (
            <button
              key={range.key}
              className={`range-btn ${selectedRange === range.key ? 'active' : ''}`}
              onClick={() => setSelectedRange(range.key)}
              data-testid={`two-three-range-${range.key}`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="chart-container" data-testid="two-three-chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTwoThree" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} interval="preserveStartEnd" minTickGap={50} />
              <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}K`} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} width={45} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const date = new Date(label);
                    return (
                      <div className="remittances-tooltip">
                        <p className="tooltip-date">{date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                        <p className="tooltip-value" style={{ color: '#14B8A6' }}>{(payload[0].value || 0).toLocaleString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="total" stroke="#14B8A6" strokeWidth={2} fillOpacity={1} fill="url(#colorTwoThree)" />
              <Line type="monotone" dataKey="total" stroke="#14B8A6" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="modal-footer" data-testid="two-three-modal-footer">
          <span className="data-source">Source: {data?.source || 'State Bank of Pakistan / PBS'}</span>
          <span className="data-updated">Last updated: {new Date(data?.updated || Date.now()).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default TwoThreeWheelersModal;