import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const BusinessEnvironmentPanel = ({ loading: parentLoading }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSectorView, setSelectedSectorView] = useState('snapshot');
  const [visibleBciSeries, setVisibleBciSeries] = useState({ bci: true, cbci: true, ebci: true });
  const [visibleSectorSeries, setVisibleSectorSeries] = useState({
    manufacturing: true,
    construction: true,
    wholesale_retail: true,
    other_services: true
  });

  useEffect(() => {
    const fetchBusinessEnvironment = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/business-environment`);
        setData(response.data?.data || null);
      } catch (error) {
        console.error('Error fetching business environment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessEnvironment();
  }, []);

  const confidenceHistory = useMemo(() => data?.confidence?.history || [], [data]);
  const epuHistory = useMemo(() => data?.epu?.history || [], [data]);
  const cciHistory = useMemo(() => data?.consumer_confidence?.history || [], [data]);
  const sectorTrendHistory = useMemo(() => data?.confidence?.history || [], [data]);

  const formatRange = (history) => {
    if (!history || history.length === 0) return 'N/A';
    const start = new Date(history[0].date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const end = new Date(history[history.length - 1].date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return `${start} - ${end}`;
  };

  const formatDateTick = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const renderCompactTooltip = (unit = '') => ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    const date = new Date(label);
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    return (
      <div
        data-testid="business-chart-tooltip"
        style={{
          background: 'rgba(11, 18, 32, 0.96)',
          border: '1px solid rgba(51, 65, 85, 0.9)',
          borderRadius: '8px',
          padding: '8px 10px',
          minWidth: '130px',
          boxShadow: '0 6px 18px rgba(2, 6, 23, 0.45)'
        }}
      >
        <div style={{ fontSize: '0.63rem', color: '#cbd5e1', marginBottom: '5px' }}>{formattedDate}</div>
        {payload.map((entry) => (
          <div
            key={`${entry.dataKey}-${entry.value}`}
            style={{ display: 'flex', justifyContent: 'space-between', gap: '0.45rem', fontSize: '0.7rem', color: '#e2e8f0' }}
          >
            <span style={{ color: entry.color }}>{entry.name || entry.dataKey}</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {Number(entry.value || 0).toFixed(2)}{unit}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const InteractiveLegend = ({ payload, seriesState, onToggle, testIdPrefix }) => {
    if (!payload || payload.length === 0) return null;

    return (
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '4px' }} data-testid={`${testIdPrefix}-container`}>
        {payload.map((entry) => {
          const key = entry.dataKey;
          const isActive = seriesState[key] !== false;
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              data-testid={`${testIdPrefix}-${key}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '0.12rem 0.42rem',
                background: 'rgba(2, 6, 23, 0.45)',
                cursor: 'pointer',
                opacity: isActive ? 1 : 0.42,
                color: 'var(--color-text)',
                fontSize: '0.64rem'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color, display: 'inline-block' }}></span>
              <span>{entry.value}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const toggleSeries = (setter) => (key) => {
    setter((prev) => {
      const currentlyActive = Object.values(prev).filter(Boolean).length;
      if (prev[key] && currentlyActive === 1) {
        return prev;
      }
      return { ...prev, [key]: !prev[key] };
    });
  };

  const getSignal = (change, inverse = false) => {
    if (change === null || change === undefined) return { cls: 'neutral', good: false, increase: false };
    const increase = change >= 0;
    const good = inverse ? !increase : increase;
    return { cls: good ? 'positive' : 'negative', good, increase };
  };

  if (parentLoading || loading) {
    return (
      <div className="panel" data-testid="business-environment-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Briefcase size={16} />
            Business Environment
          </div>
        </div>
        <div className="panel-content">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  const epuHeadline = data?.epu?.headline || {};
  const bciOverall = data?.confidence?.headline?.overall || {};
  const bciCurrent = data?.confidence?.headline?.current || {};
  const bciExpected = data?.confidence?.headline?.expected || {};
  const cciHeadline = data?.consumer_confidence?.headline || {};
  const sectors = data?.confidence?.sectors?.latest || [];
  const drivers = data?.confidence?.drivers || {};

  const sectorSeriesMap = {
    manufacturing: 'Manufacturing',
    construction: 'Construction',
    wholesale_retail: 'Wholesale & Retail',
    other_services: 'Other Services'
  };

  const selectedSectorLabel = sectorSeriesMap[selectedSectorView] || 'Sector';
  const sectorTrendAllData = sectorTrendHistory.filter((item) => (
    item?.manufacturing !== null || item?.construction !== null || item?.wholesale_retail !== null || item?.other_services !== null
  ));

  const selectedSectorHistory = selectedSectorView === 'snapshot'
    ? []
    : selectedSectorView === 'all_trends'
      ? sectorTrendAllData
    : sectorTrendHistory
      .filter((item) => item?.[selectedSectorView] !== null && item?.[selectedSectorView] !== undefined)
      .map((item) => ({ date: item.date, value: item[selectedSectorView] }));

  const bciDateRange = formatRange(confidenceHistory);
  const epuDateRange = formatRange(epuHistory);
  const cciDateRange = formatRange(cciHistory);
  const sectorDateRange = formatRange(selectedSectorView === 'all_trends' ? sectorTrendAllData : selectedSectorHistory);

  const epuSignal = getSignal(epuHeadline?.mom_change, true);
  const currentSignal = getSignal(bciCurrent?.mom_change, false);
  const expectedSignal = getSignal(bciExpected?.mom_change, false);
  const cciSignal = getSignal(cciHeadline?.mom_change, false);

  const metricCards = [
    {
      key: 'epu',
      label: 'EPU Index (4 Newspapers)',
      value: epuHeadline?.latest?.value,
      change: epuHeadline?.mom_change,
      month: epuHeadline?.latest?.month,
      signal: epuSignal,
      inverse: true,
      tab: 'epu'
    },
    {
      key: 'cci',
      label: 'Consumer Confidence Index',
      value: cciHeadline?.latest?.value,
      change: cciHeadline?.mom_change,
      month: cciHeadline?.latest?.month,
      signal: cciSignal,
      inverse: false,
      tab: 'cci'
    },
    {
      key: 'current-bci',
      label: 'Current BCI',
      value: bciCurrent?.latest?.value,
      change: bciCurrent?.mom_change,
      month: bciCurrent?.latest?.month,
      signal: currentSignal,
      inverse: false
    },
    {
      key: 'expected-bci',
      label: 'Expected BCI',
      value: bciExpected?.latest?.value,
      change: bciExpected?.mom_change,
      month: bciExpected?.latest?.month,
      signal: expectedSignal,
      inverse: false
    }
  ];

  return (
    <div className="panel" data-testid="business-environment-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Briefcase size={16} />
          Business Environment
        </div>
        <span className="panel-badge" data-testid="business-environment-badge">
          {data?.latest_month || 'LIVE'}
        </span>
      </div>

      <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '0.5rem' }} data-testid="business-kpi-grid">
          {metricCards.map((metric) => {
            const isClickable = Boolean(metric.tab);
            const isActive = metric.tab && activeTab === metric.tab;
            return (
              <div
                key={metric.key}
                onClick={isClickable ? () => setActiveTab(metric.tab) : undefined}
                style={{
                  border: '1px solid var(--color-border)',
                  background: isActive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(15, 23, 42, 0.5)',
                  padding: '0.5rem',
                  minHeight: '74px',
                  cursor: isClickable ? 'pointer' : 'default',
                  boxShadow: isActive ? '0 0 0 1px rgba(34, 197, 94, 0.4)' : 'none'
                }}
                data-testid={`business-kpi-${metric.key}`}
              >
                <div style={{ fontSize: '0.56rem', color: 'var(--color-muted)', marginBottom: '0.2rem' }}>{metric.label}</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>
                  {metric.value !== null && metric.value !== undefined ? metric.value.toFixed(2) : '--'}
                </div>
                {metric.change !== null && metric.change !== undefined && (
                  <div
                    style={{
                      marginTop: '0.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      fontSize: '0.62rem',
                      color: metric.signal.cls === 'positive' ? '#22C55E' : '#EF4444'
                    }}
                    data-testid={`business-kpi-change-${metric.key}`}
                  >
                    {metric.signal.increase ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(2)}%
                  </div>
                )}
                {metric.month && (
                  <div style={{ marginTop: '0.2rem', fontSize: '0.55rem', color: '#94a3b8' }} data-testid={`business-kpi-month-${metric.key}`}>
                    {metric.month}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }} data-testid="business-tabs">
          {['overview', 'sectors', 'drivers', 'cci', 'epu'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="range-btn"
              data-testid={`business-tab-${tab}`}
              style={{
                textTransform: 'capitalize',
                borderColor: activeTab === tab ? 'var(--color-primary)' : 'var(--color-border)',
                color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-muted)',
                background: activeTab === tab ? 'rgba(34, 197, 94, 0.15)' : 'transparent'
              }}
            >
              {tab === 'epu' ? 'EPU' : tab === 'cci' ? 'CCI' : tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div style={{ border: '1px solid var(--color-border)', padding: '0.4rem', background: 'rgba(2, 6, 23, 0.45)' }} data-testid="business-overview-view">
            <div style={{ fontSize: '0.62rem', color: 'var(--color-muted)', marginBottom: '0.35rem' }}>Business Confidence Trend (All Data)</div>
            <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginBottom: '0.2rem' }} data-testid="bci-date-range-label">{bciDateRange}</div>
            <ResponsiveContainer width="100%" height={175}>
              <LineChart data={confidenceHistory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fill: '#64748b', fontSize: 10 }} stroke="#64748b" minTickGap={35} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} stroke="#64748b" width={34} domain={[0, 100]} />
                <Tooltip content={renderCompactTooltip()} />
                <Legend
                  content={(props) => (
                    <InteractiveLegend
                      {...props}
                      seriesState={visibleBciSeries}
                      onToggle={toggleSeries(setVisibleBciSeries)}
                      testIdPrefix="bci-series-legend"
                    />
                  )}
                />
                <Line type="monotone" dataKey="bci" name="Overall" stroke="#22C55E" dot={false} strokeWidth={2} hide={!visibleBciSeries.bci} />
                <Line type="monotone" dataKey="cbci" name="Current" stroke="#38BDF8" dot={false} strokeWidth={1.8} hide={!visibleBciSeries.cbci} />
                <Line type="monotone" dataKey="ebci" name="Expected" stroke="#F59E0B" dot={false} strokeWidth={1.8} hide={!visibleBciSeries.ebci} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'sectors' && (
          <div style={{ border: '1px solid var(--color-border)', padding: '0.4rem', background: 'rgba(2, 6, 23, 0.45)' }} data-testid="business-sectors-view">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--color-muted)' }}>
                {selectedSectorView === 'snapshot' ? 'Sector Confidence Snapshot (Current Month)' : `${selectedSectorLabel} Trend (All Data)`}
              </div>
              <select
                value={selectedSectorView}
                onChange={(e) => setSelectedSectorView(e.target.value)}
                data-testid="sector-series-selector"
                style={{
                  background: 'rgba(11, 18, 32, 0.92)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontSize: '0.68rem',
                  padding: '0.25rem 0.4rem',
                  borderRadius: '4px'
                }}
              >
                <option value="snapshot">Current Snapshot (All Sectors)</option>
                <option value="all_trends">All Sectors Trend</option>
                {Object.entries(sectorSeriesMap).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginBottom: '0.2rem' }} data-testid="sector-date-range-label">
              {selectedSectorView === 'snapshot' ? 'Current month snapshot' : sectorDateRange}
            </div>

            {selectedSectorView === 'snapshot' ? (
              <ResponsiveContainer width="100%" height={185}>
                <BarChart data={sectors} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} stroke="#64748b" interval={0} angle={-10} textAnchor="end" height={40} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} stroke="#64748b" width={34} domain={[0, 100]} />
                  <Tooltip content={renderCompactTooltip()} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {sectors.map((entry, idx) => (
                      <Cell key={`sector-cell-${idx}`} fill={(entry.value || 0) >= 50 ? '#22C55E' : '#F59E0B'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : selectedSectorView === 'all_trends' ? (
              <ResponsiveContainer width="100%" height={185}>
                <LineChart data={selectedSectorHistory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fill: '#64748b', fontSize: 10 }} stroke="#64748b" minTickGap={35} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} stroke="#64748b" width={34} domain={[0, 100]} />
                  <Tooltip content={renderCompactTooltip()} />
                  <Legend
                    content={(props) => (
                      <InteractiveLegend
                        {...props}
                        seriesState={visibleSectorSeries}
                        onToggle={toggleSeries(setVisibleSectorSeries)}
                        testIdPrefix="sector-series-legend"
                      />
                    )}
                  />
                  <Line type="monotone" dataKey="manufacturing" name="Manufacturing" stroke="#22C55E" dot={false} strokeWidth={2} hide={!visibleSectorSeries.manufacturing} />
                  <Line type="monotone" dataKey="construction" name="Construction" stroke="#38BDF8" dot={false} strokeWidth={1.8} hide={!visibleSectorSeries.construction} />
                  <Line type="monotone" dataKey="wholesale_retail" name="Wholesale & Retail" stroke="#F59E0B" dot={false} strokeWidth={1.8} hide={!visibleSectorSeries.wholesale_retail} />
                  <Line type="monotone" dataKey="other_services" name="Other Services" stroke="#A855F7" dot={false} strokeWidth={1.8} hide={!visibleSectorSeries.other_services} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={185}>
                <LineChart data={selectedSectorHistory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fill: '#64748b', fontSize: 10 }} stroke="#64748b" minTickGap={35} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} stroke="#64748b" width={34} domain={[0, 100]} />
                  <Tooltip content={renderCompactTooltip()} />
                  <Line type="monotone" dataKey="value" name={selectedSectorLabel} stroke="#22C55E" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {activeTab === 'drivers' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '0.45rem' }} data-testid="business-drivers-view">
            {[
              ['General Economic', drivers?.general_economic],
              ['Employment', drivers?.employment],
              ['Demand for Credit', drivers?.demand_for_credit],
              ['Inflation Expectation', drivers?.inflation_expectation]
            ].map(([label, payload]) => (
              <div key={label} style={{ border: '1px solid var(--color-border)', padding: '0.45rem', background: 'rgba(2, 6, 23, 0.45)' }} data-testid={`business-driver-${label.toLowerCase().replace(/\s+/g, '-')}`}>
                <div style={{ fontSize: '0.63rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>{label}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                  <span style={{ color: '#94a3b8' }}>Current</span>
                  <span style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>{payload?.current?.latest?.value?.toFixed(2) || '--'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                  <span style={{ color: '#94a3b8' }}>Expected</span>
                  <span style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>{payload?.expected?.latest?.value?.toFixed(2) || '--'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'cci' && (
          <div style={{ border: '1px solid var(--color-border)', padding: '0.4rem', background: 'rgba(2, 6, 23, 0.45)' }} data-testid="business-cci-view">
            <div style={{ fontSize: '0.62rem', color: 'var(--color-muted)', marginBottom: '0.35rem' }}>Consumer Confidence Index Trend (Headline)</div>
            <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginBottom: '0.2rem' }} data-testid="cci-date-range-label">{cciDateRange}</div>
            <ResponsiveContainer width="100%" height={175}>
              <LineChart data={cciHistory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fill: '#64748b', fontSize: 10 }} stroke="#64748b" minTickGap={35} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} stroke="#64748b" width={34} domain={[0, 100]} />
                <Tooltip content={renderCompactTooltip()} />
                <Line type="monotone" dataKey="cci" name="Headline CCI" stroke="#22C55E" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'epu' && (
          <div style={{ border: '1px solid var(--color-border)', padding: '0.4rem', background: 'rgba(2, 6, 23, 0.45)' }} data-testid="business-epu-view">
            <div style={{ fontSize: '0.62rem', color: 'var(--color-muted)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <AlertTriangle size={12} /> EPU Trend (All Data)
            </div>
            <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginBottom: '0.2rem' }} data-testid="epu-date-range-label">{epuDateRange}</div>
            <ResponsiveContainer width="100%" height={175}>
              <LineChart data={epuHistory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDateTick} tick={{ fill: '#64748b', fontSize: 10 }} stroke="#64748b" minTickGap={35} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} stroke="#64748b" width={34} domain={['auto', 'auto']} />
                <Tooltip content={renderCompactTooltip()} />
                <Legend wrapperStyle={{ fontSize: '0.65rem' }} />
                <Line type="monotone" dataKey="epu4" name="4 Newspapers" stroke="#EF4444" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="epu2" name="2 Newspapers" stroke="#A855F7" dot={false} strokeWidth={1.6} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{
          marginTop: '0.15rem',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.5rem',
          fontSize: '0.55rem',
          color: 'var(--color-muted)',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '0.35rem'
        }} data-testid="business-environment-footer">
          <span>
            {`Coverage: ${data?.coverage?.series_used_in_panel || 0}/${data?.coverage?.bci_series_available || 0} BCI series + EPU`}
          </span>
          <a
            href={data?.methodology_url}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
            data-testid="business-methodology-link"
          >
            BCS Methodology
          </a>
        </div>
      </div>
    </div>
  );
};

export default BusinessEnvironmentPanel;