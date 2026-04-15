import React, { useMemo, useState } from 'react';
import { Info, TrendingUp, TrendingDown, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const formatTradeValue = (value, unit) => {
  if (value === null || value === undefined) return '--';
  let usd;
  if (unit === 'million_usd') {
    usd = value * 1000000;
  } else {
    usd = value * 1000;
  }
  const abs = Math.abs(usd);
  if (abs >= 1000000000) return `$${(usd / 1000000000).toFixed(2)}B`;
  if (abs >= 1000000) return `$${(usd / 1000000).toFixed(2)}M`;
  if (abs >= 1000) return `$${(usd / 1000).toFixed(1)}K`;
  return `$${usd.toFixed(0)}`;
};

const scaleHistory = (history = [], unit) => {
  const factor = unit === 'million_usd' ? 1000000 : 1000;
  return history.map((item) => ({ ...item, value: item.value * factor }));
};

const GROUP_ORDER = ['Neighbor', 'GCC', 'Major', 'Central Asia', 'EU'];

const BAD_STATUSES = [
  'suspended', 'tense', 'hostile', 'restricted', 'conflict', 'strained',
  'frozen', 'severed', 'disruption', 'border security'
];

const isNegativeRelationship = (status) => {
  if (!status) return false;
  const lower = status.toLowerCase();
  return BAD_STATUSES.some((word) => lower.includes(word));
};

const RegionalPanel = ({ relations, loading }) => {
  const countries = relations?.countries || [];
  const [expandedCountry, setExpandedCountry] = useState(null);
  const [showSources, setShowSources] = useState(false);

  const grouped = useMemo(() => {
    const map = {};
    countries.forEach((c) => {
      const g = c.group || 'Other';
      if (!map[g]) map[g] = [];
      map[g].push(c);
    });
    const ordered = [];
    GROUP_ORDER.forEach((g) => { if (map[g]) ordered.push({ group: g, items: map[g] }); });
    Object.keys(map).forEach((g) => { if (!GROUP_ORDER.includes(g)) ordered.push({ group: g, items: map[g] }); });
    return ordered;
  }, [countries]);

  const activeCountry = useMemo(
    () => countries.find((c) => c.code === expandedCountry) || null,
    [countries, expandedCountry]
  );

  const tradeCards = useMemo(() => {
    if (!activeCountry?.trade) return [];
    const cards = [];
    const t = activeCountry.trade;
    if (t.exports?.latest?.value != null) cards.push({ key: 'exports', label: 'Exports', data: t.exports });
    if (t.imports?.latest?.value != null) cards.push({ key: 'imports', label: 'Imports', data: t.imports });
    if (t.remittances?.latest?.value != null) cards.push({ key: 'remittances', label: 'Remittances', data: t.remittances });
    return cards;
  }, [activeCountry]);

  const tradeBalance = useMemo(() => {
    if (!activeCountry?.trade) return null;
    const exp = activeCountry.trade.exports?.latest?.value;
    const imp = activeCountry.trade.imports?.latest?.value;
    if (exp == null || imp == null) return null;
    return (exp - imp) * 1000;
  }, [activeCountry]);

  const formatBalance = (bal) => {
    const usd = bal;
    const abs = Math.abs(usd);
    if (abs >= 1000000000) return `$${(usd / 1000000000).toFixed(2)}B`;
    if (abs >= 1000000) return `$${(usd / 1000000).toFixed(2)}M`;
    if (abs >= 1000) return `$${(usd / 1000).toFixed(1)}K`;
    return `$${usd.toFixed(0)}`;
  };

  const handleCountryClick = (code) => {
    setExpandedCountry((prev) => prev === code ? null : code);
    setShowSources(false);
  };

  return (
    <div className="panel regional-panel" data-testid="regional-panel">
      <div className="panel-header">
        <div className="panel-title" data-testid="regional-panel-title">
          Regional Relations
        </div>
        <div className="panel-badge" data-testid="regional-panel-badge">Live</div>
      </div>
      <div className="panel-content regional-panel-content" data-testid="regional-panel-content">
        {loading ? (
          <div className="loading" data-testid="regional-panel-loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="regional-list" data-testid="regional-list">
            {grouped.map((grp) => (
              <React.Fragment key={grp.group}>
                <div className="regional-group-label">{grp.group}</div>
                {grp.items.map((country) => {
                  const isExpanded = expandedCountry === country.code;
                  const isNeg = isNegativeRelationship(country.status);
                  const isActive = isExpanded && activeCountry;
                  return (
                    <div key={country.code} className="regional-country-block" data-testid={`regional-block-${country.code}`}>
                      <button
                        className={`regional-country-row ${isExpanded ? 'active' : ''}`}
                        onClick={() => handleCountryClick(country.code)}
                        data-testid={`regional-country-${country.code}`}
                      >
                        <span className="regional-country-expand">
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </span>
                        <span className="regional-country-row-name">{country.name.toUpperCase()}</span>
                        <span className={`regional-country-row-status ${isNeg ? 'negative' : 'positive'}`}>
                          {country.status || 'ACTIVE'}
                        </span>
                        {country.tag && (
                          <span className={`regional-country-row-tag ${isNeg ? 'negative' : ''}`}>
                            {country.tag.toUpperCase()}
                          </span>
                        )}
                      </button>

                      {isActive && (
                        <div className="regional-detail" data-testid="regional-detail">
                          <div className="regional-detail-header">
                            <div>
                              <div className="regional-detail-title" data-testid="regional-detail-title">
                                {activeCountry.name.toUpperCase()}
                              </div>
                              <div className="regional-status-row">
                                <span className={`regional-status-badge ${isNeg ? 'negative' : ''}`} data-testid="regional-status-badge">
                                  {activeCountry.status || 'ACTIVE'}
                                </span>
                                {activeCountry.embassy_url && (
                                  <a
                                    href={activeCountry.embassy_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="regional-embassy-link"
                                    data-testid="regional-embassy-link"
                                  >
                                    <ExternalLink size={10} />
                                    Embassy
                                  </a>
                                )}
                              </div>
                            </div>
                            <button
                              className="regional-info-button"
                              onClick={() => setShowSources((prev) => !prev)}
                              data-testid="regional-sources-button"
                            >
                              <Info size={14} />
                            </button>
                            {showSources && (
                              <div className="regional-sources-panel" data-testid="regional-sources-panel">
                                <div className="regional-sources-title">Sources</div>
                                {(activeCountry.sources || []).map((source, idx) => (
                                  <a key={source.url} href={source.url} target="_blank" rel="noreferrer"
                                    className="regional-source-link" data-testid={`regional-source-link-${idx}`}>
                                    {source.title}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>

                          {(activeCountry.highlights || []).length > 0 && (
                            <div className="regional-highlights" data-testid="regional-highlights">
                              <div className="regional-section-title">Relationship Status</div>
                              <ul>
                                {activeCountry.highlights.map((item, idx) => (
                                  <li key={`${activeCountry.code}-h-${idx}`} data-testid={`regional-highlight-${idx}`}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {activeCountry.recent_visit && (
                            <div className="regional-recent-visit" data-testid="regional-recent-visit">
                              <div className="regional-section-title">Most Recent Visit</div>
                              <div className="regional-recent-visit-text">{activeCountry.recent_visit}</div>
                            </div>
                          )}

                          {tradeCards.length > 0 && (
                            <div className="regional-trade" data-testid="regional-trade">
                              <div className="regional-section-title">Trade & Remittance (Last 12 Months)</div>
                              <div className="regional-trade-grid" style={{ gridTemplateColumns: `repeat(${Math.min(tradeCards.length, 3)}, 1fr)` }}>
                                {tradeCards.map((card) => {
                                  const latest = card.data?.latest?.value;
                                  const change = card.data?.mom_change;
                                  const unit = card.data?.unit || 'thousand_usd';
                                  const hasData = latest !== null && latest !== undefined;
                                  const trendUp = change != null && change >= 0;
                                  const chartData = scaleHistory(card.data?.history || [], unit);
                                  return (
                                    <div key={card.key} className="regional-trade-card" data-testid={`regional-trade-${card.key}`}>
                                      <div className="regional-trade-label">{card.label}</div>
                                      <div className="regional-trade-value" data-testid={`regional-trade-value-${card.key}`}>
                                        {hasData ? formatTradeValue(latest, unit) : '--'}
                                      </div>
                                      <div className="regional-trade-meta">
                                        <span data-testid={`regional-trade-month-${card.key}`}>
                                          {card.data?.latest?.month || ''}
                                        </span>
                                        {change != null && (
                                          <span className={`regional-trade-change ${trendUp ? 'positive' : 'negative'}`}
                                            data-testid={`regional-trade-change-${card.key}`}>
                                            {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                            {trendUp ? '+' : ''}{change.toFixed(1)}%
                                          </span>
                                        )}
                                      </div>
                                      <div className="regional-trade-chart" data-testid={`regional-trade-chart-${card.key}`}>
                                        {chartData.length > 1 ? (
                                          <ResponsiveContainer width="100%" height={50}>
                                            <LineChart data={chartData}>
                                              <Line type="monotone" dataKey="value"
                                                stroke={trendUp ? '#22C55E' : '#F97316'} strokeWidth={1.5} dot={false} />
                                            </LineChart>
                                          </ResponsiveContainer>
                                        ) : (
                                          <div className="regional-trade-empty">No trend data</div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              {tradeBalance !== null && (
                                <div className="regional-trade-balance" data-testid="regional-trade-balance">
                                  <span className="regional-trade-balance-label">Trade Balance</span>
                                  <span className={`regional-trade-balance-value ${tradeBalance >= 0 ? 'surplus' : 'deficit'}`}
                                    data-testid="regional-trade-balance-value">
                                    {tradeBalance >= 0 ? '+' : ''}{formatBalance(tradeBalance)}
                                    <span style={{ fontSize: '0.5rem', marginLeft: '0.3rem', opacity: 0.7 }}>
                                      {tradeBalance >= 0 ? 'SURPLUS' : 'DEFICIT'}
                                    </span>
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {(activeCountry.visa?.status || (activeCountry.visa?.notes || []).length > 0) && (
                            <div className="regional-visa" data-testid="regional-visa">
                              <div className="regional-section-title">Visa & Travel</div>
                              <div className="regional-visa-status" data-testid="regional-visa-status">
                                {activeCountry.visa?.status || 'Visa required'}
                              </div>
                              <ul>
                                {(activeCountry.visa?.notes || []).map((note, idx) => (
                                  <li key={`${activeCountry.code}-v-${idx}`} data-testid={`regional-visa-note-${idx}`}>{note}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionalPanel;
