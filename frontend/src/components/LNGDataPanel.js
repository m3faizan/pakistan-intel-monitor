import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Flame, BarChart3, Percent, Ship, FileText } from 'lucide-react';
import LNGDataModal from './LNGDataModal';

const formatVal = (v, dec = 2) => {
  if (v === null || v === undefined) return 'N/A';
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(dec)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(dec)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(dec)}K`;
  return v.toFixed(dec);
};

const pctChange = (curr, prev) => {
  if (!curr || !prev || prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const MetricCard = ({ icon: Icon, label, value, unit, change, sublabel, date, onClick }) => {
  const chg = change !== null && change !== undefined;
  const isPositive = chg && change > 0;
  return (
    <div
      className="economic-item clickable"
      onClick={onClick}
      data-testid={`lng-metric-${label.toLowerCase().replace(/\s+/g, '-')}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="economic-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        {Icon && <Icon size={10} style={{ color: '#22C55E' }} />}
        {label}
      </div>
      <div className="economic-value">{value}</div>
      {chg && (
        <div className={`economic-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {isPositive ? '+' : ''}{change.toFixed(2)}%
        </div>
      )}
      {sublabel && <div className="economic-sublabel">{sublabel}</div>}
      {date && <div className="economic-sublabel">{date}</div>}
    </div>
  );
};

const LNGDataPanel = ({ summary, history, loading }) => {
  const [modal, setModal] = useState(null);

  if (loading || !summary) {
    return (
      <div className="panel" data-testid="lng-data-panel">
        <div className="panel-header">
          <div className="panel-title"><Flame size={16} /> Pakistan LNG Metrics</div>
          <span className="panel-badge">PakESDA</span>
        </div>
        <div className="panel-content"><div className="loading"><div className="spinner"></div></div></div>
      </div>
    );
  }

  const s = summary;
  const metrics = [
    {
      icon: DollarSign, label: 'LNG Import Payment',
      value: s.import_payment ? `$${formatVal(s.import_payment.value * 1000, 1)}` : 'N/A',
      change: pctChange(s.import_payment?.value, s.import_payment?.prev),
      sublabel: s.import_payment?.unit === 'thousand USD' ? 'Thousand USD' : '',
      date: formatDate(s.import_payment?.date),
      modalKey: 'import_payment',
    },
    {
      icon: BarChart3, label: 'Avg Brent Price',
      value: s.brent_avg ? `$${s.brent_avg.value?.toFixed(2)}` : 'N/A',
      change: pctChange(s.brent_avg?.value, s.brent_avg?.prev),
      sublabel: s.brent_avg?.unit || '',
      date: formatDate(s.brent_avg?.date),
      modalKey: 'brent_avg',
    },
    {
      icon: Ship, label: 'Import Volume',
      value: s.import_volume ? formatVal(s.import_volume.value, 1) : 'N/A',
      change: pctChange(s.import_volume?.value, s.import_volume?.prev),
      sublabel: 'MMBtu',
      date: formatDate(s.import_volume?.date),
      modalKey: 'import_volume',
    },
    {
      icon: Flame, label: 'Power Gen (LNG)',
      value: s.power_generation ? `${s.power_generation.value?.toFixed(0)} GWh` : 'N/A',
      change: pctChange(s.power_generation?.value, s.power_generation?.prev),
      sublabel: s.power_generation?.rlng_share ? `${s.power_generation.rlng_share}% of total` : '',
      date: formatDate(s.power_generation?.date),
      modalKey: 'power_generation',
    },
    {
      icon: FileText, label: 'Cargo Distribution',
      value: s.cargo_distribution ? `${s.cargo_distribution.total || 0} cargoes` : 'N/A',
      change: null,
      sublabel: s.cargo_distribution ? `LT: ${s.cargo_distribution.long_term || 0} | Spot: ${s.cargo_distribution.spot || 0}` : '',
      date: formatDate(s.cargo_distribution?.date),
      modalKey: 'cargo_distribution',
    },
    {
      icon: DollarSign, label: 'LNG Price (wAvg DES)',
      value: s.lng_price ? `$${s.lng_price.value?.toFixed(2)}` : 'N/A',
      change: pctChange(s.lng_price?.value, s.lng_price?.prev),
      sublabel: s.lng_price ? `PSO: $${s.lng_price.pso?.toFixed(2) || 'N/A'} | PLL: $${s.lng_price.pll?.toFixed(2) || 'N/A'}` : '',
      date: formatDate(s.lng_price?.date),
      modalKey: 'lng_price',
    },
    {
      icon: Percent, label: 'DES Slope',
      value: s.des_slope ? `${s.des_slope.value?.toFixed(2)}%` : 'N/A',
      change: pctChange(s.des_slope?.value, s.des_slope?.prev),
      sublabel: '% of Brent',
      date: formatDate(s.des_slope?.date),
      modalKey: 'des_slope',
    },
    {
      icon: Ship, label: 'Contract Volume (LT)',
      value: s.contract_volume?.lt_volume ? formatVal(s.contract_volume.lt_volume, 1) : 'N/A',
      change: pctChange(s.contract_volume?.lt_volume, s.contract_volume?.prev_lt),
      sublabel: 'Long-Term MMBtu',
      date: formatDate(s.contract_volume?.date),
      modalKey: 'contract_volume',
    },
  ];

  return (
    <>
      <div className="panel" data-testid="lng-data-panel">
        <div className="panel-header">
          <div className="panel-title"><Flame size={16} /> Pakistan LNG Metrics</div>
          <span className="panel-badge">PakESDA</span>
        </div>
        <div className="panel-content" style={{ maxHeight: 'none', padding: '0.75rem' }}>
          <div className="economic-grid-8">
            {metrics.map((m) => (
              <MetricCard
                key={m.label}
                icon={m.icon}
                label={m.label}
                value={m.value}
                change={m.change}
                sublabel={m.sublabel}
                date={m.date}
                onClick={() => setModal(m.modalKey)}
              />
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <LNGDataModal
          modalKey={modal}
          summary={summary}
          history={history}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
};

export default LNGDataPanel;
