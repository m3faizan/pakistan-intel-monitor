import React, { useState } from 'react';
import { Anchor, TrendingUp, TrendingDown } from 'lucide-react';
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
  const pp = history?.port_price || [];
  const latestPP = pp.length > 0 ? pp[pp.length - 1] : {};
  const prevPP = pp.length > 1 ? pp[pp.length - 2] : {};

  const totalCargoes = cd.total || 0;
  const eetlCount = cd.eetl || 0;
  const pgpclCount = cd.pgpcl || 0;
  const eetlShare = totalCargoes > 0 ? (eetlCount / totalCargoes * 100) : 0;
  const pgpclShare = totalCargoes > 0 ? (pgpclCount / totalCargoes * 100) : 0;
  const portChargesChg = pctChange(latestPP.wAvg_Port_Charges, prevPP.wAvg_Port_Charges);

  return (
    <>
      <div className="panel" data-testid="lng-terminal-panel">
        <div className="panel-header">
          <div className="panel-title"><Anchor size={16} /> Terminal Activity</div>
          <span className="panel-badge">PakESDA</span>
        </div>
        <div className="panel-content" style={{ maxHeight: 'none', padding: '0.75rem' }}>
          {/* Total Cargoes hero */}
          <div
            className="economic-item clickable"
            data-testid="lng-terminal-total-cargoes"
            onClick={() => setModal('terminal_cargoes')}
            style={{ marginBottom: '0.6rem', textAlign: 'center', padding: '0.75rem' }}
          >
            <div className="economic-label" style={{ justifyContent: 'center', fontSize: '0.55rem' }}>Total Cargoes</div>
            <div className="economic-value" style={{ fontSize: '1.5rem' }}>{totalCargoes}</div>
            <div className="economic-sublabel" style={{ textAlign: 'center' }}>{formatDate(cd.date)}</div>
          </div>

          {/* 3-column: EETL Share, PGPCL Share, Port Charges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div
              className="economic-item clickable"
              data-testid="lng-terminal-eetl-share"
              onClick={() => setModal('terminal_cargoes')}
              style={{ textAlign: 'center', padding: '0.65rem 0.4rem' }}
            >
              <div className="economic-label" style={{ justifyContent: 'center', fontSize: '0.55rem' }}>EETL Share</div>
              <div className="economic-value" style={{ fontSize: '1.2rem', justifyContent: 'center' }}>{eetlShare.toFixed(0)}%</div>
              <div className="economic-sublabel" style={{ textAlign: 'center' }}>{eetlCount} cargoes</div>
            </div>

            <div
              className="economic-item clickable"
              data-testid="lng-terminal-pgpcl-share"
              onClick={() => setModal('terminal_cargoes')}
              style={{ textAlign: 'center', padding: '0.65rem 0.4rem' }}
            >
              <div className="economic-label" style={{ justifyContent: 'center', fontSize: '0.55rem' }}>PGPCL Share</div>
              <div className="economic-value" style={{ fontSize: '1.2rem', justifyContent: 'center' }}>{pgpclShare.toFixed(0)}%</div>
              <div className="economic-sublabel" style={{ textAlign: 'center' }}>{pgpclCount} cargoes</div>
            </div>

            <div
              className="economic-item clickable"
              data-testid="lng-terminal-port-charges"
              onClick={() => setModal('port_charges')}
              style={{ textAlign: 'center', padding: '0.65rem 0.4rem' }}
            >
              <div className="economic-label" style={{ justifyContent: 'center', fontSize: '0.55rem' }}>Port Charges</div>
              <div className="economic-value" style={{ fontSize: '1.2rem', justifyContent: 'center' }}>${latestPP.wAvg_Port_Charges?.toFixed(3) || 'N/A'}</div>
              {portChargesChg !== null && (
                <div className={`economic-change ${portChargesChg >= 0 ? 'positive' : 'negative'}`} style={{ justifyContent: 'center' }}>
                  {portChargesChg >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {portChargesChg >= 0 ? '+' : ''}{portChargesChg.toFixed(2)}%
                </div>
              )}
              <div className="economic-sublabel" style={{ textAlign: 'center' }}>{formatDate(latestPP.date)}</div>
            </div>
          </div>

          {/* Terminal share bar */}
          <div>
            <div style={{ fontSize: '0.55rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
              Terminal Share
            </div>
            <div style={{ display: 'flex', height: '22px', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <div style={{
                width: `${eetlShare}%`, background: '#22C55E',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.55rem', fontWeight: 700, color: '#020617',
              }}>
                {eetlShare > 20 ? `EETL ${eetlShare.toFixed(0)}%` : ''}
              </div>
              <div style={{
                width: `${pgpclShare}%`, background: '#3B82F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.55rem', fontWeight: 700, color: '#020617',
              }}>
                {pgpclShare > 20 ? `PGPCL ${pgpclShare.toFixed(0)}%` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.55rem', color: '#94A3B8' }}>
              <span>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#22C55E', marginRight: 4 }} />
                EETL ({eetlCount})
              </span>
              <span>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#3B82F6', marginRight: 4 }} />
                PGPCL ({pgpclCount})
              </span>
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
