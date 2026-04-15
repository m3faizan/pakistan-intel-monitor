import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import axios from 'axios';
import {
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, LabelList,
} from 'recharts';
import EnergyPaymentsModal from './EnergyPaymentsModal';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const SERIES_KEYS  = ['Petroleum Group', 'LNG', 'LPG', 'Crude Oil', 'Petroleum Products'];
const SERIES_SHORT = { 'Petroleum Group': 'Pet.Grp', LNG: 'LNG', LPG: 'LPG', 'Crude Oil': 'Crude', 'Petroleum Products': 'Products' };

const SOURCE_COLORS = {
  'Petroleum Group':    '#F97316',
  'LNG':                '#38BDF8',
  'LPG':                '#A855F7',
  'Crude Oil':          '#78716C',
  'Petroleum Products': '#F59E0B',
  '% of Imports':       '#22C55E',
};

const CHG_RANGES = [
  { key: '1M',  label: '1M',  months: 1  },
  { key: '6M',  label: '6M',  months: 6  },
  { key: 'YTD', label: 'YTD', months: null, ytd: true },
  { key: '1Y',  label: '1Y',  months: 12 },
  { key: '5Y',  label: '5Y',  months: 60 },
];

const fmtUSD = (thousandUSD) => {
  if (thousandUSD == null) return '--';
  const m = thousandUSD / 1000;
  if (m >= 1000) return `$${(m / 1000).toFixed(2)}B`;
  return `$${m.toFixed(0)}M`;
};

const fmtDate = (d) =>
  !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

// Find start-of-period value from history
const getStartValue = (history, rangeKey) => {
  if (!history?.length) return null;
  const latest = history[history.length - 1];
  const latestDt = new Date(latest.date);

  if (rangeKey === 'YTD') {
    const year = latestDt.getFullYear();
    const first = history.find(p => new Date(p.date).getFullYear() === year);
    if (!first || first.value === 0) return null;
    return first.value;
  }
  const r = CHG_RANGES.find(r => r.key === rangeKey);
  if (!r?.months) return null;
  const target = new Date(latestDt);
  target.setMonth(target.getMonth() - r.months);
  // Find the closest point to the target date
  let best = null, bestDiff = Infinity;
  history.forEach(p => {
    const diff = Math.abs(new Date(p.date) - target);
    if (diff < bestDiff) { bestDiff = diff; best = p; }
  });
  return best?.value > 0 ? best.value : null;
};

const EnergyPaymentsPanel = () => {
  const [allData, setAllData]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [chgMode, setChgMode]   = useState('pct');   // 'pct' | 'usd'
  const [chgRange, setChgRange] = useState('YTD');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/energy-payments`);
        if (res.data?.data) setAllData(res.data.data);
      } catch (e) {
        console.error('EnergyPaymentsPanel error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 300000);
    return () => clearInterval(iv);
  }, []);

  // Derived: % of Total Imports for the latest month
  const derived = useMemo(() => {
    if (!allData) return null;
    const petro = allData['Petroleum Group'];
    const total = allData['Total Imports'];
    if (!petro || !total) return null;
    const latestDate = petro.latest?.date;
    const totalMap   = {};
    (total.history || []).forEach(p => { totalMap[p.date] = p.value; });
    const petroMap   = {};
    (petro.history || []).forEach(p => { petroMap[p.date] = p.value; });
    const pNow      = petroMap[latestDate] ?? 0;
    const tNow      = totalMap[latestDate] ?? 0;
    const petroHist = petro.history || [];
    const prevDate  = petroHist.length >= 2 ? petroHist[petroHist.length - 2]?.date : null;
    const pPrev     = prevDate ? (petroMap[prevDate] ?? 0) : 0;
    const tPrev     = prevDate ? (totalMap[prevDate] ?? 0) : 0;
    const sharePct     = tNow  > 0 ? (pNow  / tNow)  * 100 : 0;
    const sharePctPrev = tPrev > 0 ? (pPrev / tPrev) * 100 : 0;
    const shareMoM = sharePctPrev !== 0 ? ((sharePct - sharePctPrev) / sharePctPrev) * 100 : null;
    return { sharePct, shareMoM, latestDate };
  }, [allData]);

  // Change bar data for mini chart
  const changeBarData = useMemo(() => {
    if (!allData) return [];
    return SERIES_KEYS.map(s => {
      const hist   = allData[s]?.history || [];
      if (!hist.length) return { name: SERIES_SHORT[s], pct: 0, usd: 0, color: SOURCE_COLORS[s] };
      const latest = hist[hist.length - 1];
      const startVal = getStartValue(hist, chgRange);
      if (startVal == null) return { name: SERIES_SHORT[s], pct: 0, usd: 0, color: SOURCE_COLORS[s] };
      const pct = parseFloat(((latest.value - startVal) / startVal * 100).toFixed(1));
      const usd = parseFloat(((latest.value - startVal) / 1000).toFixed(1)); // → $M
      return { name: SERIES_SHORT[s], fullName: s, pct, usd, color: SOURCE_COLORS[s] };
    });
  }, [allData, chgRange]);

  if (loading) {
    return (
      <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const petro    = allData?.['Petroleum Group'];
  const pMoM     = petro?.mom_change_pct;
  const pYoY     = petro?.yoy_change;
  const isMoMPos = pMoM !== null && pMoM !== undefined && pMoM >= 0;
  const isYoYPos = pYoY !== null && pYoY !== undefined && pYoY >= 0;

  const miniCards = [
    { label: 'LNG',             desc: 'Nat. Gas; Liquified',    key: 'LNG'                },
    { label: 'LPG',             desc: 'Petroleum Gas; Liquified',key: 'LPG'                },
    { label: 'Crude Oil',       desc: 'Petroleum Crude',         key: 'Crude Oil'          },
    { label: 'Petro. Products', desc: 'Refined products',        key: 'Petroleum Products' },
    { label: '% of Imports',    desc: 'Petroleum Group share',   key: '% of Imports', isPct: true },
  ];

  const ChgTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    const val = payload[0]?.value;
    const isIncrease = val > 0;
    return (
      <div className="remittances-tooltip" style={{ minWidth: 130 }}>
        <p className="tooltip-date">{row?.fullName || row?.name}</p>
        <p style={{ color: isIncrease ? '#EF4444' : '#22C55E', fontSize: '0.82rem' }}>
          {chgMode === 'pct'
            ? `${isIncrease ? '+' : ''}${val?.toFixed(1)}%`
            : `${isIncrease ? '+$' : '-$'}${Math.abs(val)?.toFixed(1)}M`
          }
          <span style={{ color: '#64748b', fontSize: '0.65rem', marginLeft: 4 }}>{chgRange}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div className="panel-header">
        <div className="panel-title">
          <DollarSign size={16} />
          Energy Payments
        </div>
        <div className="panel-badge">SBP</div>
      </div>

      <div className="panel-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {!allData || !petro ? (
          <div style={{ color: '#475569', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>
            Data unavailable
          </div>
        ) : (
          <>
            {/* Hero card */}
            <div
              onClick={() => setModal('Petroleum Group')}
              style={{
                background: 'rgba(249,115,22,0.06)',
                border: '1px solid rgba(249,115,22,0.22)',
                borderRadius: 6, padding: '0.7rem 0.9rem', cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(249,115,22,0.06)'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.58rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', color: '#F97316', textTransform: 'uppercase', marginBottom: 4 }}>
                    Petroleum Group — Total
                  </div>
                  <div style={{ fontSize: '1.55rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                    {fmtUSD(petro.latest?.value)}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: 3 }}>
                    {fmtDate(petro.latest?.date)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                  {pMoM !== null && pMoM !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: isMoMPos ? '#EF4444' : '#22C55E' }}>
                      {isMoMPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {isMoMPos ? '+' : ''}{pMoM.toFixed(2)}%
                      <span style={{ color: '#64748b', fontSize: '0.6rem' }}>MoM</span>
                    </div>
                  )}
                  {pYoY !== null && pYoY !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: isYoYPos ? '#EF4444' : '#22C55E' }}>
                      {isYoYPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {isYoYPos ? '+' : ''}{pYoY.toFixed(2)}%
                      <span style={{ color: '#64748b', fontSize: '0.6rem' }}>YoY</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mini cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
              {miniCards.map(card => {
                const d      = card.isPct ? null : allData?.[card.key];
                const color  = SOURCE_COLORS[card.key] || '#64748b';
                const momVal = card.isPct ? derived?.shareMoM : d?.mom_change_pct;
                const isMPos = momVal !== null && momVal !== undefined && momVal > 0;
                const valueStr = card.isPct
                  ? (derived ? `${derived.sharePct.toFixed(1)}%` : '--')
                  : fmtUSD(d?.latest?.value);
                const dateStr = card.isPct
                  ? (derived?.latestDate ? fmtDate(derived.latestDate) : '')
                  : fmtDate(d?.latest?.date);
                return (
                  <div
                    key={card.key}
                    onClick={() => !card.isPct && setModal(card.key)}
                    style={{
                      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                      borderRadius: 5, padding: '0.5rem 0.6rem',
                      cursor: card.isPct ? 'default' : 'pointer', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => { if (!card.isPct) e.currentTarget.style.borderColor = color; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                  >
                    <div style={{ fontSize: '0.56rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.09em', color, textTransform: 'uppercase', marginBottom: 3 }}>
                      {card.label}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.1 }}>
                      {valueStr}
                    </div>
                    {momVal !== null && momVal !== undefined ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.62rem', color: isMPos ? '#EF4444' : '#22C55E', marginTop: 2 }}>
                        {isMPos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {isMPos ? '+' : ''}{momVal.toFixed(2)}%
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: 2 }}>—</div>
                    )}
                    <div style={{ fontSize: '0.56rem', color: '#475569', marginTop: 2 }}>{dateStr}</div>
                    <div style={{ fontSize: '0.54rem', color: '#334155', marginTop: 1 }}>{card.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* ── Mini period-change bar chart ─────────────────────────── */}
            <div style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: '0.5rem',
              marginTop: '0.1rem',
            }}>
              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.55rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569' }}>
                  Period Chg
                </span>
                <div style={{ display: 'flex', gap: '0.2rem', marginLeft: '0.3rem' }}>
                  {CHG_RANGES.map(r => (
                    <button
                      key={r.key}
                      onClick={() => setChgRange(r.key)}
                      style={{
                        fontSize: '0.56rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.07em',
                        textTransform: 'uppercase', padding: '0.12rem 0.4rem', borderRadius: 3,
                        border: `1px solid ${chgRange === r.key ? '#F97316' : 'var(--color-border)'}`,
                        background: chgRange === r.key ? 'rgba(249,115,22,0.12)' : 'transparent',
                        color: chgRange === r.key ? '#F97316' : '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.2rem', marginLeft: 'auto' }}>
                  {[{ k: 'pct', l: '%' }, { k: 'usd', l: '$M' }].map(({ k, l }) => (
                    <button
                      key={k}
                      onClick={() => setChgMode(k)}
                      style={{
                        fontSize: '0.56rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.07em',
                        textTransform: 'uppercase', padding: '0.12rem 0.4rem', borderRadius: 3,
                        border: `1px solid ${chgMode === k ? '#38BDF8' : 'var(--color-border)'}`,
                        background: chgMode === k ? 'rgba(56,189,248,0.12)' : 'transparent',
                        color: chgMode === k ? '#38BDF8' : '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact bar chart */}
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={changeBarData} margin={{ top: 14, right: 4, left: 0, bottom: 0 }} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#334155"
                    tick={{ fill: '#64748b', fontSize: 9 }}
                    axisLine={{ stroke: '#1e293b' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={v => chgMode === 'pct' ? `${v}%` : `$${v}M`}
                    stroke="#334155"
                    tick={{ fill: '#64748b', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    width={38}
                  />
                  <Tooltip content={<ChgTooltip />} />
                  <Bar dataKey={chgMode === 'pct' ? 'pct' : 'usd'} maxBarSize={40} radius={[2, 2, 0, 0]}>
                    {changeBarData.map((entry, i) => {
                      const val = chgMode === 'pct' ? entry.pct : entry.usd;
                      return <Cell key={i} fill={val > 0 ? '#EF4444' : '#22C55E'} fillOpacity={0.82} />;
                    })}
                    <LabelList
                      dataKey={chgMode === 'pct' ? 'pct' : 'usd'}
                      position="top"
                      formatter={v => chgMode === 'pct' ? `${v > 0 ? '+' : ''}${v}%` : `${v > 0 ? '+' : ''}$${v}M`}
                      style={{ fill: '#94a3b8', fontSize: 8 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {modal && (
        <EnergyPaymentsModal
          isOpen={!!modal}
          onClose={() => setModal(null)}
          allData={allData}
          initialSeries={modal}
        />
      )}
    </div>
  );
};

export default EnergyPaymentsPanel;
