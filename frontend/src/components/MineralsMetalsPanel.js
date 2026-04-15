import React, { useState, useEffect } from 'react';
import { Gem, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import MineralsDetailModal from './MineralsDetailModal';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const MINERALS = [
  'Silica Sand',
  'Gypsum',
  'Lime Stone',
  'Rock Salt',
  'Coal',
  'China Clay',
  'Chromite',
  'Marble',
  'Barytes',
  'Dolomite',
  'Sulphur',
];

const MineralsMetalsPanel = ({ loading: parentLoading }) => {
  const [allData, setAllData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeMineral, setActiveMineral] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/minerals-metals`);
        if (res.data?.data) {
          setAllData(res.data.data);
        }
      } catch (err) {
        console.error('MineralsMetalsPanel fetch error:', err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  if (parentLoading || dataLoading) {
    return (
      <div className="panel" data-testid="minerals-metals-panel">
        <div className="panel-header">
          <div className="panel-title"><Gem size={16} />Minerals &amp; Metals</div>
        </div>
        <div className="panel-content">
          <div className="loading"><div className="spinner"></div></div>
        </div>
      </div>
    );
  }

  const formatVal = (v, unit) => {
    if (v === null || v === undefined) return '--';
    const n = Number(v);
    if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
    if (n >= 1000)  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
    return n.toFixed(n < 10 ? 2 : 1);
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const activeData = activeMineral ? allData?.[activeMineral] : null;

  return (
    <div className="panel" data-testid="minerals-metals-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Gem size={16} />
          Minerals &amp; Metals
        </div>
        <div className="panel-badge">PBS</div>
      </div>

      <div className="panel-content">
        <div className="minerals-grid">
          {MINERALS.map(name => {
            const d = allData?.[name];
            const pct = d?.mom_change_pct;
            const isPos = pct !== null && pct !== undefined && pct >= 0;
            const sparkData = d?.history?.slice(-24) || [];

            return (
              <div
                key={name}
                className="mineral-item"
                onClick={() => d && setActiveMineral(name)}
                style={{ cursor: d ? 'pointer' : 'default' }}
              >
                <div className="mineral-label">
                  {name}
                  {d && <ExternalLink size={9} style={{ marginLeft: 3, opacity: 0.5 }} />}
                </div>

                {/* Sparkline */}
                {sparkData.length > 1 && (
                  <div style={{ height: 28, margin: '4px 0 2px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparkData}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={isPos ? '#22C55E' : '#EF4444'}
                          strokeWidth={1.2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="mineral-value">
                  {d ? formatVal(d.latest?.value, d.unit) : '--'}
                </div>

                <div className="mineral-unit">{d?.unit || ''}</div>

                {pct !== null && pct !== undefined ? (
                  <div className={`mineral-change ${isPos ? 'positive' : 'negative'}`}>
                    {isPos ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {isPos ? '+' : ''}{pct.toFixed(2)}%
                  </div>
                ) : (
                  <div className="mineral-change" style={{ color: '#64748b' }}>—</div>
                )}

                <div className="mineral-sublabel">{formatDate(d?.latest?.date)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <MineralsDetailModal
        isOpen={!!activeMineral}
        onClose={() => setActiveMineral(null)}
        mineral={activeMineral}
        data={activeData}
      />
    </div>
  );
};

export default MineralsMetalsPanel;
