import React, { useState } from 'react';
import { Anchor, Ship, TrendingUp, TrendingDown } from 'lucide-react';
import LNGDataModal from './LNGDataModal';

const pctChange = (curr, prev) => {
  if (!curr || !prev || prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const LNGTerminalPanel = ({ summary, history, loading }) => {
  const [modal, setModal] = useState(null);

  if (loading || !summary || !summary.cargo_distribution) {
    return (
      <div className="panel" data-testid="lng-terminal-panel">
        <div className="panel-header">
          <div className="panel-title"><Anchor size={16} /> Terminal Activity</div>
          <span className="panel-badge">PakESDA</span>
        </div>
        <div className="panel-content"><div className="loading"><div className="spinner"></div></div></div>
      </div>
    );
  }

  const cd = summary.cargo_distribution;
  const info = history?.information || [];
  const pp = history?.port_price || [];
  const latest = info.length > 0 ? info[info.length - 1] : {};
  const prev = info.length > 1 ? info[info.length - 2] : {};
  const latestPP = pp.length > 0 ? pp[pp.length - 1] : {};
  const prevPP = pp.length > 1 ? pp[pp.length - 2] : {};

  const totalCargoes = cd.total || 0;
  const eetlShare = totalCargoes > 0 ? ((cd.eetl || 0) / totalCargoes * 100) : 0;
  const pgpclShare = totalCargoes > 0 ? ((cd.pgpcl || 0) / totalCargoes * 100) : 0;

  const cargoChg = pctChange(latest.Total_Cargoes, prev.Total_Cargoes);
  const portChargesChg = pctChange(latestPP.wAvg_Port_Charges, prevPP.wAvg_Port_Charges);

  const metrics = [
    {
      label: 'Total Cargoes',
      value: totalCargoes,
      change: cargoChg,
      icon: Ship,
      sub: formatDate(cd.date),
      modalKey: 'terminal_cargoes',
    },
    {
      label: 'EETL Share',
      value: `${eetlShare.toFixed(0)}%`,
      rawValue: cd.eetl || 0,
      icon: Anchor,
      sub: `${cd.eetl || 0} cargoes`,
      modalKey: 'terminal_cargoes',
    },
    {
      label: 'PGPCL Share',
      value: `${pgpclShare.toFixed(0)}%`,
      rawValue: cd.pgpcl || 0,
      icon: Anchor,
      sub: `${cd.pgpcl || 0} cargoes`,
      modalKey: 'terminal_cargoes',
    },
    {
      label: 'Port Charges',
      value: `$${latestPP.wAvg_Port_Charges?.toFixed(3) || 'N/A'}`,
      change: portChargesChg,
      icon: null,
      sub: formatDate(latestPP.date),
      modalKey: 'port_charges',
    },
  ];

  return (
    <>
      <div className="panel" data-testid="lng-terminal-panel">
        <div className="panel-header">
          <div className="panel-title"><Anchor size={16} /> Terminal Activity</div>
          <span className="panel-badge">PakESDA</span>
        </div>
        <div className="panel-content" style={{ maxHeight: 'none', padding: '0.75rem' }}>
          {/* Metric cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {metrics.map((m) => {
              const chg = m.change !== null && m.change !== undefined;
              const isPos = chg && m.change > 0;
              return (
                <div
                  key={m.label}
                  className="economic-item clickable"
                  data-testid={`lng-terminal-${m.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setModal(m.modalKey)}
                >
                  <div className="economic-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {m.icon && <m.icon size={10} style={{ color: '#22C55E' }} />}
                    {m.label}
                  </div>
                  <div className="economic-value">{m.value}</div>
                  {chg && (
                    <div className={`economic-change ${isPos ? 'positive' : 'negative'}`}>
                      {isPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {isPos ? '+' : ''}{m.change.toFixed(2)}%
                    </div>
                  )}
                  {m.sub && <div className="economic-sublabel">{m.sub}</div>}
                </div>
              );
            })}
          </div>

          {/* Terminal share bar */}
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
              Terminal Share
            </div>
            <div style={{ display: 'flex', height: '20px', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <div style={{ width: `${eetlShare}%`, background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: '#020617' }}>
                {eetlShare > 15 ? `EETL ${eetlShare.toFixed(0)}%` : ''}
              </div>
              <div style={{ width: `${pgpclShare}%`, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: '#020617' }}>
                {pgpclShare > 15 ? `PGPCL ${pgpclShare.toFixed(0)}%` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.3rem', fontSize: '0.55rem', color: '#94A3B8' }}>
              <span><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#22C55E', marginRight: 4 }}></span>EETL ({cd.eetl || 0})</span>
              <span><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#3B82F6', marginRight: 4 }}></span>PGPCL ({cd.pgpcl || 0})</span>
            </div>
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

export default LNGTerminalPanel;
