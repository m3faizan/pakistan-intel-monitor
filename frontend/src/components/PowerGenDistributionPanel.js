import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import axios from 'axios';
import PowerGenMixModal from './PowerGenMixModal';
import RenewableShareModal from './RenewableShareModal';
import ImportedSourcesModal from './ImportedSourcesModal';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const CARD_ORDER = [
  'Total', 'Hydel', 'Coal', 'Gas', 'RLNG', 'Nuclear', 'Wind', 'Solar', 'RFO', 'HSD', 'Bagasse', 'Iran', 'Mixed'
];

const SOURCE_COLORS = {
  Total:   '#22C55E',
  Hydel:   '#38BDF8',
  Coal:    '#78716C',
  HSD:     '#F97316',
  RFO:     '#EF4444',
  Gas:     '#F59E0B',
  RLNG:    '#FB923C',
  Nuclear: '#A855F7',
  Wind:    '#6EE7B7',
  Solar:   '#FDE68A',
  Bagasse: '#10B981',
  Iran:    '#64748B',
  Mixed:   '#475569',
};

const SOURCE_DESC = {
  Total:   'All sources combined',
  Hydel:   'Hydroelectric generation',
  Coal:    'Coal-fired generation',
  HSD:     'High Speed Diesel',
  RFO:     'Residual Fuel Oil',
  Gas:     'Natural Gas',
  RLNG:    'Regasified LNG',
  Nuclear: 'Nuclear generation',
  Wind:    'Wind energy',
  Solar:   'Solar generation',
  Bagasse: 'Bagasse / biomass',
  Iran:    'Imported from Iran',
  Mixed:   'Mixed / other fuels',
};

const PowerGenDistributionPanel = () => {
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSource, setActive] = useState(null);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/power-generation`);
        if (res.data?.data) setAllData(res.data.data);
      } catch (e) {
        console.error('PowerGenDistributionPanel error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 300000);
    return () => clearInterval(iv);
  }, []);

  const fmtVal = (v) => {
    if (v == null) return '--';
    const n = Number(v);
    if (n === 0) return '0';
    if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
    if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return n.toFixed(1);
  };

  const fmtDate = (d) => !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const openModal = (src) => {
    setActive(src);
    setModalOpen(true);
  };

  // Only show Total in the hero card — individual sources are in Power Generation Profile
  const keys = allData && allData['Total'] ? ['Total'] : [];

  // Derived metrics: Renewable Share & Imported Sources
  const derived = (() => {
    if (!allData) return null;
    const latestDate = allData['Total']?.latest?.date;
    const hist = allData['Total']?.history || [];
    const prevDate = hist.length >= 2 ? hist[hist.length - 2]?.date : null;

    const getAt = (src, date) => {
      const pts = allData[src]?.history || [];
      return pts.find(p => p.date === date)?.value ?? 0;
    };

    const RENEW = ['Hydel', 'Wind', 'Solar', 'Bagasse'];
    const IMPORT = ['RLNG', 'Iran'];

    const totalNow  = allData['Total']?.latest?.value ?? 0;
    const totalPrev = prevDate ? getAt('Total', prevDate) : 0;

    const renewNow  = RENEW.reduce((s, k) => s + getAt(k, latestDate), 0);
    const renewPrev = prevDate ? RENEW.reduce((s, k) => s + getAt(k, prevDate), 0) : 0;
    const renewShare     = totalNow  > 0 ? (renewNow  / totalNow)  * 100 : 0;
    const renewSharePrev = totalPrev > 0 ? (renewPrev / totalPrev) * 100 : 0;
    const renewMoM = renewSharePrev !== 0
      ? ((renewShare - renewSharePrev) / renewSharePrev) * 100
      : null;

    const importNow  = IMPORT.reduce((s, k) => s + getAt(k, latestDate), 0);
    const importPrev = prevDate ? IMPORT.reduce((s, k) => s + getAt(k, prevDate), 0) : 0;
    const importMoM  = importPrev !== 0
      ? ((importNow - importPrev) / importPrev) * 100
      : null;

    return {
      renewableShare: { value: renewShare, mom: renewMoM, date: latestDate, unit: '%' },
      imported:       { value: importNow,  mom: importMoM, date: latestDate, unit: 'GWh' },
    };
  })();

  return (
    <div className="panel pgd-panel" data-testid="power-gen-distribution-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Zap size={16} />
          Power Generation
        </div>
        <div className="panel-badge">SBP</div>
      </div>

      <div className="panel-content pgd-grid-content">
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : !allData || keys.length === 0 ? (
          <div style={{ color: '#475569', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>
            Data unavailable
          </div>
        ) : (
          <div className="pgd-grid pgd-grid-single">
            {keys.map(name => {
              const d    = allData[name];
              const pct  = d?.mom_change_pct;
              const yoy  = d?.yoy_change;
              const val  = d?.latest?.value;
              const date = d?.latest?.date;
              const color = SOURCE_COLORS[name] || '#94A3B8';
              const isMomPos  = pct !== null && pct !== undefined && pct > 0;
              const isMomNeg  = pct !== null && pct !== undefined && pct < 0;
              const isMomZero = pct !== null && pct !== undefined && pct === 0;
              const isYoyPos  = yoy !== null && yoy !== undefined && yoy > 0;
              const isYoyNeg  = yoy !== null && yoy !== undefined && yoy < 0;
              const isYoyZero = yoy !== null && yoy !== undefined && yoy === 0;

              return (
                <div
                  key={name}
                  className="pgd-card pgd-card-hero"
                  onClick={() => openModal(name)}
                >
                  {/* Card title row */}
                  <div className="pgd-card-title pgd-card-title-hero">
                    <span style={{ color }}>
                      {name}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.58rem', marginLeft: '0.4rem', textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--font-body)' }}>All sources combined</span>
                    <ExternalLink size={10} style={{ opacity: 0.4, marginLeft: 'auto' }} />
                  </div>

                  {/* Big value */}
                  <div className="pgd-card-value pgd-card-value-hero">
                    {fmtVal(val)}
                    <span className="pgd-card-unit">GWh</span>
                  </div>

                  {/* Change row — MoM + YoY */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.4rem' }}>
                    <div className={`pgd-card-change ${isMomPos ? 'positive' : isMomNeg ? 'negative' : ''}`}>
                      {isMomPos && <TrendingUp size={13} />}
                      {isMomNeg && <TrendingDown size={13} />}
                      {isMomZero && <span style={{ color: '#64748b' }}>= </span>}
                      <span style={isMomZero ? { color: '#64748b' } : {}}>
                        {pct !== null && pct !== undefined ? `${isMomPos ? '+' : ''}${pct.toFixed(2)}%` : '—'}
                      </span>
                      <span style={{ color: '#475569', fontSize: '0.62rem', marginLeft: 3 }}>MoM</span>
                    </div>
                    {yoy !== null && yoy !== undefined && (
                      <div className={`pgd-card-change ${isYoyPos ? 'positive' : isYoyNeg ? 'negative' : ''}`}>
                        {isYoyPos && <TrendingUp size={13} />}
                        {isYoyNeg && <TrendingDown size={13} />}
                        {isYoyZero && <span style={{ color: '#64748b' }}>= </span>}
                        <span style={isYoyZero ? { color: '#64748b' } : {}}>
                          {`${isYoyPos ? '+' : ''}${yoy.toFixed(2)}%`}
                        </span>
                        <span style={{ color: '#475569', fontSize: '0.62rem', marginLeft: 3 }}>YoY</span>
                      </div>
                    )}
                  </div>

                  {/* Month */}
                  <div className="pgd-card-period" style={{ marginTop: '0.3rem', fontSize: '0.7rem' }}>{fmtDate(date)}</div>

                  {/* Click hint */}
                  <div style={{ marginTop: '0.6rem', fontSize: '0.6rem', color: '#334155', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Click to view full mix chart →
                  </div>
                </div>
              );
            })}

            {/* Derived metric mini-cards */}
            {derived && (
              <>
                {[
                  {
                    label: 'Renewable Share',
                    desc: 'Hydel + Wind + Solar + Bagasse',
                    color: '#6EE7B7',
                    value: derived.renewableShare.value.toFixed(1),
                    unit: '%',
                    mom: derived.renewableShare.mom,
                    date: derived.renewableShare.date,
                    onClickOverride: () => setRenewModalOpen(true),
                  },
                  {
                    label: 'Imported Sources',
                    desc: 'RLNG + Iran',
                    color: '#64748B',
                    value: derived.imported.value >= 1000
                      ? derived.imported.value.toLocaleString(undefined, { maximumFractionDigits: 1 })
                      : derived.imported.value.toFixed(1),
                    unit: 'GWh',
                    mom: derived.imported.mom,
                    date: derived.imported.date,
                    onClickOverride: () => setImportModalOpen(true),
                  },
                ].map(m => {
                  const iPos  = m.mom !== null && m.mom !== undefined && m.mom > 0;
                  const iNeg  = m.mom !== null && m.mom !== undefined && m.mom < 0;
                  const iZero = m.mom !== null && m.mom !== undefined && m.mom === 0;
                  return (
                    <div key={m.label} className="pgd-card pgd-card-mini" onClick={m.onClickOverride || (() => openModal('Total'))}>
                      <div className="pgd-card-title">
                        <span style={{ color: m.color }}>{m.label}</span>
                      </div>
                      <div className="pgd-card-value" style={{ fontSize: '1.25rem' }}>
                        {m.value}
                        <span className="pgd-card-unit">{m.unit}</span>
                      </div>
                      <div className={`pgd-card-change ${iPos ? 'positive' : iNeg ? 'negative' : ''}`}>
                        {iPos && <TrendingUp size={11} />}
                        {iNeg && <TrendingDown size={11} />}
                        {iZero && <span style={{ color: '#64748b' }}>= </span>}
                        <span style={iZero ? { color: '#64748b' } : {}}>
                          {m.mom !== null && m.mom !== undefined
                            ? `${iPos ? '+' : ''}${m.mom.toFixed(2)}%`
                            : '—'}
                        </span>
                        <span style={{ color: '#475569', fontSize: '0.6rem', marginLeft: 3 }}>MoM</span>
                      </div>
                      <div className="pgd-card-period">{fmtDate(m.date)}</div>
                      <div className="pgd-card-desc">{m.desc}</div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      <PowerGenMixModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        allData={allData}
        initialSource={activeSource}
      />

      <RenewableShareModal
        isOpen={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        allData={allData}
      />

      <ImportedSourcesModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        allData={allData}
      />
    </div>
  );
};

export default PowerGenDistributionPanel;
