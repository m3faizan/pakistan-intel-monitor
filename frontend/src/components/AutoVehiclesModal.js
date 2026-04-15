import React, { useEffect, useMemo, useState } from 'react';
import { X, Car, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line
} from 'recharts';

const TIME_RANGES = [
  { key: '1Y', label: '1Y', months: 12 },
  { key: '2Y', label: '2Y', months: 24 },
  { key: '5Y', label: '5Y', months: 60 },
  { key: 'ALL', label: 'All', months: null }
];

const COLORS = ['#22C55E', '#38BDF8', '#F59E0B', '#A855F7', '#EC4899', '#14B8A6'];

const AutoVehiclesModal = ({ isOpen, onClose, data, title }) => {
  const [mode, setMode] = useState('production');
  const [selectedRange, setSelectedRange] = useState('2Y');
  const [visibleSeries, setVisibleSeries] = useState({});

  const modeData = data?.[mode];
  const stackCategories = useMemo(
    () => (modeData?.categories || []).filter((cat) => cat.key !== 'two_three_wheelers'),
    [modeData]
  );

  useEffect(() => {
    const next = {};
    stackCategories.forEach((cat) => {
      next[cat.key] = true;
    });
    setVisibleSeries(next);
  }, [mode, stackCategories.length]);

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

  const toggleSeries = (key) => {
    setVisibleSeries((prev) => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (prev[key] && activeCount === 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="auto-vehicles-modal-overlay">
      <div className="remittances-modal" onClick={(e) => e.stopPropagation()} data-testid="auto-vehicles-modal">
        <div className="modal-header">
          <div className="modal-title" data-testid="auto-vehicles-modal-title">
            <Car size={20} />
            <span>{title || 'Production and Sale of Auto Vehicles'}</span>
            <span
              className="live-dot"
              data-testid="auto-vehicles-live-dot"
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
          <button className="modal-close" onClick={onClose} data-testid="auto-vehicles-modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-summary">
          <div className="summary-main">
            <div className="summary-value" data-testid="auto-vehicles-summary-value">
              {(latest?.total || 0).toLocaleString()}
            </div>
            <div className="summary-period" data-testid="auto-vehicles-summary-period">
              <Calendar size={14} />
              {latest?.month || data?.latest_month || 'N/A'}
            </div>
          </div>
          {momChange !== null && momChange !== undefined && (
            <div className="summary-changes">
              <div className={`summary-change ${momChange >= 0 ? 'positive' : 'negative'}`} data-testid="auto-vehicles-summary-change">
                {momChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{momChange >= 0 ? '+' : ''}{momChange.toFixed(2)}%</span>
                <span className="change-label">MoM</span>
              </div>
            </div>
          )}
        </div>

        <div className="time-range-selector" data-testid="auto-vehicles-time-range-selector">
          <button
            className={`range-btn ${mode === 'production' ? 'active' : ''}`}
            onClick={() => setMode('production')}
            data-testid="auto-vehicles-mode-production"
          >
            Production
          </button>
          <button
            className={`range-btn ${mode === 'sales' ? 'active' : ''}`}
            onClick={() => setMode('sales')}
            data-testid="auto-vehicles-mode-sales"
          >
            Sales
          </button>
          <div style={{ width: '1px', height: '22px', background: 'var(--color-border)', margin: '0 0.3rem' }}></div>
          {TIME_RANGES.map((range) => (
            <button
              key={range.key}
              className={`range-btn ${selectedRange === range.key ? 'active' : ''}`}
              onClick={() => setSelectedRange(range.key)}
              data-testid={`auto-vehicles-range-${range.key}`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div
          style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.45rem' }}
          data-testid="auto-vehicles-series-toggle-row"
        >
          <span
            className="range-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              borderColor: '#FACC15',
              color: '#FACC15',
              background: 'rgba(250, 204, 21, 0.12)',
              cursor: 'default'
            }}
            data-testid="auto-vehicles-series-total-label"
          >
            <span style={{ width: '10px', height: '2px', background: '#FACC15', display: 'inline-block' }}></span>
            Total
          </span>
          {stackCategories.map((category, idx) => {
            const active = visibleSeries[category.key] !== false;
            return (
              <button
                key={category.key}
                onClick={() => toggleSeries(category.key)}
                data-testid={`auto-vehicles-series-toggle-${category.key}`}
                className={`range-btn ${active ? 'active' : ''}`}
                style={{ opacity: active ? 1 : 0.42, display: 'inline-flex', alignItems: 'center', gap: '0.28rem' }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[idx % COLORS.length], display: 'inline-block' }}></span>
                {category.label}
              </button>
            );
          })}
        </div>

        <div className="chart-container" data-testid="auto-vehicles-chart-container">
          <ResponsiveContainer width="100%" height={300}>
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
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}K`}
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={{ stroke: '#1e293b' }}
                width={45}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const date = new Date(label);
                    const formattedDate = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    return (
                      <div className="remittances-tooltip" style={{ minWidth: '210px' }}>
                        <p className="tooltip-date">{formattedDate}</p>
                        {payload.map((entry) => (
                          <p key={entry.dataKey} style={{ color: entry.color, fontSize: '0.8rem', margin: '0.15rem 0' }}>
                            {entry.name}: {(entry.value || 0).toLocaleString()}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {stackCategories.map((category, idx) => (
                <Bar
                  key={category.key}
                  dataKey={category.key}
                  name={category.label}
                  stackId="a"
                  fill={COLORS[idx % COLORS.length]}
                  hide={visibleSeries[category.key] === false}
                />
              ))}
              <Line type="monotone" dataKey="total" name="Total" stroke="#FACC15" strokeWidth={3} dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="modal-footer" data-testid="auto-vehicles-modal-footer">
          <span className="data-source">Source: {data?.source || 'State Bank of Pakistan / PBS'}</span>
          <span className="data-updated">
            Last updated: {new Date(data?.updated || Date.now()).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AutoVehiclesModal;