import React, { useState, useEffect, useMemo } from 'react';
import { Zap, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, Area, ResponsiveContainer } from 'recharts';
import PowerGenerationModal from './PowerGenerationModal';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Order matches SBP TS_GP_RLS_ELECGEN_M series E_001000 → E_013000
const SOURCE_ORDER = [
  'Total', 'Hydel', 'Coal', 'HSD', 'RFO', 'Gas', 'RLNG', 'Nuclear', 'Wind', 'Solar', 'Bagasse', 'Iran', 'Mixed'
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

const PowerGenerationPanel = () => {
  const [allData, setAllData]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [activeSource, setActive] = useState(null);
  const [showPct, setShowPct]     = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/power-generation`);
        if (res.data?.data) setAllData(res.data.data);
      } catch (e) {
        console.error('PowerGenerationPanel error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 300000);
    return () => clearInterval(iv);
  }, []);

  // Build a lookup of total GWh per date for % share computation
  const totalMap = useMemo(() => {
    const map = {};
    (allData?.['Total']?.history || []).forEach(p => { map[p.date] = p.value; });
    return map;
  }, [allData]);

  if (loading) {
    return (
      <div className="panel" data-testid="power-generation-panel">
        <div className="panel-header">
          <div className="panel-title"><Zap size={16} />Power Generation Profile</div>
        </div>
        <div className="panel-content">
          <div className="loading"><div className="spinner"></div></div>
        </div>
      </div>
    );
  }

  const fmtVal = (v) => {
    if (v === null || v === undefined) return '--';
    const n = Number(v);
    if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
    if (n >= 1000)  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return n.toFixed(1);
  };
  const fmtDate = (d) => !d ? '' : new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  // Show sources in order, skip any not returned
  const keys = allData
    ? [...SOURCE_ORDER.filter(k => allData[k]), ...Object.keys(allData).filter(k => !SOURCE_ORDER.includes(k))]
    : [];

  const activeData = activeSource ? allData?.[activeSource] : null;

  return (
    <div className="panel" data-testid="power-generation-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Zap size={16} />
          Power Generation Profile
        </div>
        <button
          onClick={() => setShowPct(p => !p)}
          style={{
            fontSize: '0.6rem', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: 3,
            border: `1px solid ${showPct ? '#22C55E' : 'var(--color-border)'}`,
            background: showPct ? 'rgba(34,197,94,0.12)' : 'transparent',
            color: showPct ? '#22C55E' : '#64748b', cursor: 'pointer', transition: 'all 0.15s',
            marginLeft: 'auto', marginRight: '0.4rem'
          }}
        >
          % Share
        </button>
        <div className="panel-badge">SBP</div>
      </div>

      <div className="panel-content">
        {!allData || keys.length === 0 ? (
          <div style={{ color: '#475569', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>
            Data unavailable
          </div>
        ) : (
          <div className="minerals-grid">
            {keys.map(name => {
              const d     = allData[name];
              const color = SOURCE_COLORS[name] || '#22C55E';
              const rawSpark = d?.history?.slice(-24) || [];

              // % share sparkline: each point = value/total*100
              const pctSpark = rawSpark.map(p => ({
                date: p.date,
                value: totalMap[p.date] > 0 ? parseFloat((p.value / totalMap[p.date] * 100).toFixed(2)) : 0,
              }));

              const spark   = showPct ? pctSpark : rawSpark;
              const latestPct = (() => {
                const latestPt = rawSpark[rawSpark.length - 1];
                const prevPt   = rawSpark[rawSpark.length - 2];
                if (!latestPt) return null;
                const curShare  = totalMap[latestPt.date] > 0 ? latestPt.value / totalMap[latestPt.date] * 100 : 0;
                const prevShare = prevPt && totalMap[prevPt.date] > 0 ? prevPt.value / totalMap[prevPt.date] * 100 : null;
                const shareMom  = prevShare !== null && prevShare !== 0 ? ((curShare - prevShare) / prevShare * 100) : null;
                return { share: curShare, mom: shareMom };
              })();

              const pct   = d?.mom_change_pct;
              const isPos = showPct
                ? (latestPct?.mom !== null && latestPct?.mom !== undefined ? latestPct.mom >= 0 : true)
                : (pct !== null && pct !== undefined && pct >= 0);

              return (
                <div
                  key={name}
                  className="mineral-item"
                  onClick={() => d && setActive(name)}
                  style={{ cursor: d ? 'pointer' : 'default' }}
                >
                  <div className="mineral-label" style={{ color: color }}>
                    {name}
                    {d && <ExternalLink size={9} style={{ marginLeft: 3, opacity: 0.5 }} />}
                  </div>

                  {spark.length > 1 && (
                    <div style={{ height: 28, margin: '4px 0 2px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={spark}>
                          <defs>
                            <linearGradient id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={isPos ? color : '#EF4444'} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={isPos ? color : '#EF4444'} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={isPos ? color : '#EF4444'}
                            strokeWidth={1.2}
                            dot={false}
                          />
                          <Area type="monotone" dataKey="value" stroke="none" fill={`url(#grad-${name})`} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {showPct ? (
                    <>
                      <div className="mineral-value">
                        {latestPct ? latestPct.share.toFixed(1) : '--'}
                      </div>
                      <div className="mineral-unit">% of total</div>
                      {latestPct?.mom !== null && latestPct?.mom !== undefined ? (
                        latestPct.mom === 0 ? (
                          <div className="mineral-change" style={{ color: '#64748b' }}>= 0.00%</div>
                        ) : (
                          <div className={`mineral-change ${latestPct.mom > 0 ? 'positive' : 'negative'}`}>
                            {latestPct.mom > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                            {latestPct.mom > 0 ? '+' : ''}{latestPct.mom.toFixed(2)}%
                          </div>
                        )
                      ) : (
                        <div className="mineral-change" style={{ color: '#64748b' }}>—</div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mineral-value">
                        {d ? fmtVal(d.latest?.value) : '--'}
                      </div>
                      <div className="mineral-unit">{d?.unit || 'GWh'}</div>
                      {pct !== null && pct !== undefined ? (
                        pct === 0 ? (
                          <div className="mineral-change" style={{ color: '#64748b' }}>= 0.00%</div>
                        ) : (
                          <div className={`mineral-change ${isPos ? 'positive' : 'negative'}`}>
                            {isPos ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                            {isPos ? '+' : ''}{pct.toFixed(2)}%
                          </div>
                        )
                      ) : (
                        <div className="mineral-change" style={{ color: '#64748b' }}>—</div>
                      )}
                    </>
                  )}

                  <div className="mineral-sublabel">{fmtDate(d?.latest?.date)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PowerGenerationModal
        isOpen={!!activeSource}
        onClose={() => setActive(null)}
        source={activeSource}
        data={activeData}
      />
    </div>
  );
};

export default PowerGenerationPanel;
