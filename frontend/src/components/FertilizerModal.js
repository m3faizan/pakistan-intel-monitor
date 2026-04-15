import React, { useMemo, useState } from 'react';
import { X, Wheat, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
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

const SERIES_COLORS = {
  total: '#FACC15',
  urea: '#22C55E',
  dap: '#38BDF8'
};

const FertilizerModal = ({ isOpen, onClose, data, title }) => {
  const [selectedRange, setSelectedRange] = useState('2Y');
  const [visibleSeries, setVisibleSeries] = useState({ total: true, urea: true, dap: true });

  const filteredData = useMemo(() => {
    if (!data?.history) return [];
    const history = [...data.history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const range = TIME_RANGES.find((r) => r.key === selectedRange);
    if (selectedRange === 'ALL' || !range?.months) return history;

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - range.months);
    return history.filter((item) => new Date(item.date) >= cutoffDate);
  }, [data, selectedRange]);

  if (!isOpen || !data) return null;

  const latest = data?.latest;
  const momChange = data?.mom_change_pct;

  const toggleSeries = (key) => {
    setVisibleSeries((prev) => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (prev[key] && activeCount === 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="fertilizer-modal-overlay">
      <div className="remittances-modal" onClick={(e) => e.stopPropagation()} data-testid="fertilizer-modal">
        <div className="modal-header">
          <div className="modal-title" data-testid="fertilizer-modal-title">
            <Wheat size={20} />
            <span>{title || 'Fertilizer Sales/Offtake'}</span>
          </div>
          <button className="modal-close" onClick={onClose} data-testid="fertilizer-modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-summary">
          <div className="summary-main">
            <div className="summary-value" data-testid="fertilizer-summary-value">{(latest?.total || 0).toLocaleString()}</div>
            <div className="summary-period" data-testid="fertilizer-summary-period">
              <Calendar size={14} />
              {latest?.month || 'N/A'}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.15rem' }} data-testid="fertilizer-unit-label">
              Thousand Metric Ton
            </div>
          </div>
          {momChange !== null && momChange !== undefined && (
            <div className="summary-changes">
              <div className={`summary-change ${momChange >= 0 ? 'positive' : 'negative'}`} data-testid="fertilizer-summary-change">
                {momChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{momChange >= 0 ? '+' : ''}{momChange.toFixed(2)}%</span>
                <span className="change-label">MoM</span>
              </div>
            </div>
          )}
        </div>

        <div className="time-range-selector" data-testid="fertilizer-time-selector">
          {TIME_RANGES.map((range) => (
            <button
              key={range.key}
              className={`range-btn ${selectedRange === range.key ? 'active' : ''}`}
              onClick={() => setSelectedRange(range.key)}
              data-testid={`fertilizer-range-${range.key}`}
            >
              {range.label}
            </button>
          ))}
          <div style={{ width: '1px', height: '22px', background: 'var(--color-border)', margin: '0 0.3rem' }}></div>
          {[
            { key: 'total', label: 'Total' },
            { key: 'urea', label: 'Urea' },
            { key: 'dap', label: 'DAP' }
          ].map((series) => {
            const active = visibleSeries[series.key] !== false;
            return (
              <button
                key={series.key}
                onClick={() => toggleSeries(series.key)}
                className={`range-btn ${active ? 'active' : ''}`}
                style={{ opacity: active ? 1 : 0.42, display: 'inline-flex', alignItems: 'center', gap: '0.28rem' }}
                data-testid={`fertilizer-series-toggle-${series.key}`}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: SERIES_COLORS[series.key], display: 'inline-block' }}></span>
                {series.label}
              </button>
            );
          })}
        </div>

        <div className="chart-container" data-testid="fertilizer-chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} interval="preserveStartEnd" minTickGap={50} />
              <YAxis tickFormatter={(val) => `${val.toFixed(0)}`} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} width={45} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const date = new Date(label);
                    return (
                      <div className="remittances-tooltip" style={{ minWidth: '180px' }}>
                        <p className="tooltip-date">{date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                        {payload.map((entry) => (
                          <p key={entry.dataKey} style={{ color: entry.color, fontSize: '0.8rem', margin: '0.15rem 0' }}>
                            {entry.name}: {(entry.value || 0).toLocaleString()} Thousand Metric Ton
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="urea" name="Urea" stackId="a" fill={SERIES_COLORS.urea} hide={visibleSeries.urea === false} />
              <Bar dataKey="dap" name="DAP" stackId="a" fill={SERIES_COLORS.dap} hide={visibleSeries.dap === false} />
              <Line type="monotone" dataKey="total" name="Total" stroke={SERIES_COLORS.total} strokeWidth={3} dot={false} connectNulls hide={visibleSeries.total === false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="modal-footer" data-testid="fertilizer-modal-footer">
          <span className="data-source">Source: {data?.source || 'State Bank of Pakistan / PBS'}</span>
          <span className="data-updated">
            <span style={{ marginRight: '0.8rem', color: '#94a3b8' }}>Unit: Thousand Metric Ton</span>
            Last updated: {new Date(data?.updated || Date.now()).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FertilizerModal;