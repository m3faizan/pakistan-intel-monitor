import React, { useState, useEffect } from 'react';
import { Zap, ExternalLink } from 'lucide-react';
import axios from 'axios';
import useSocket from '../hooks/useSocket';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const TAGS = [
  { key: 'all',         label: 'ALL' },
  { key: 'oil',         label: 'OIL' },
  { key: 'gas',         label: 'GAS' },
  { key: 'electricity', label: 'POWER' },
  { key: 'renewable',   label: 'RENEW' },
  { key: 'coal',        label: 'COAL' },
];

const TAG_KEYWORDS = {
  oil:         ['oil', 'petroleum', 'fuel', 'pol', 'petrol', 'diesel', 'kerosene', 'lng', 'refinery'],
  gas:         ['gas', 'natural gas', 'lng', 'rlng', 'pipeline', 'ssgc', 'sngpl'],
  electricity: ['electricity', 'electric', 'power', 'wapda', 'nepra', 'load shedding', 'grid', 'kwh', 'mw'],
  renewable:   ['solar', 'wind', 'hydro', 'renewable', 'green energy', 'clean energy', 'bagasse'],
  coal:        ['coal', 'thar', 'lignite', 'engro', 'mine'],
};

function tagItem(text) {
  const lower = text.toLowerCase();
  return Object.entries(TAG_KEYWORDS)
    .filter(([, kws]) => kws.some(kw => lower.includes(kw)))
    .map(([tag]) => tag);
}

const EnergyNewsPanel = () => {
  const [news, setNews]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('all');
  const { isConnected, on, off } = useSocket();

  const filterEnergy = (all) => {
    return all.filter(n => {
      const text = `${n.title || ''} ${n.summary || ''} ${n.category || ''}`.toLowerCase();
      const energyKw = [
        'energy', 'power', 'electricity', 'gas', 'oil', 'petroleum', 'coal',
        'hydro', 'solar', 'wind', 'renewable', 'wapda', 'nepra', 'load shedding',
        'fuel', 'lng', 'rlng', 'refinery', 'thar', 'nuclear'
      ];
      return energyKw.some(kw => text.includes(kw));
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/news`);
        const all = res.data?.news || [];
        setNews(filterEnergy(all));
      } catch (e) {
        console.error('EnergyNewsPanel error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const pollInterval = isConnected ? 300000 : 120000;
    const iv = setInterval(load, pollInterval);
    return () => clearInterval(iv);
  }, [isConnected]);

  // Listen for real-time news updates
  useEffect(() => {
    const handler = (data) => {
      if (data.news) {
        setNews(filterEnergy(data.news));
        setLoading(false);
      }
    };
    on('news_update', handler);
    return () => off('news_update', handler);
  }, [on, off]);

  const filtered = activeTag === 'all'
    ? news
    : news.filter(n => tagItem(`${n.title} ${n.summary || ''}`).includes(activeTag));

  const formatTime = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Karachi' });
  };

  return (
    <div className="panel enews-panel" data-testid="energy-news-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Zap size={16} />
          Energy News
        </div>
        <div className="panel-badge">LIVE</div>
      </div>

      {/* Tag filters */}
      <div className="enews-tags">
        {TAGS.map(t => (
          <button
            key={t.key}
            className={`enews-tag ${activeTag === t.key ? 'active' : ''}`}
            onClick={() => setActiveTag(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="panel-content enews-list">
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : filtered.length === 0 ? (
          <div style={{ color: '#475569', fontSize: '0.75rem', padding: '1rem', textAlign: 'center' }}>
            No energy news available
          </div>
        ) : (
          filtered.slice(0, 20).map((item, i) => {
            const tags = tagItem(`${item.title} ${item.summary || ''}`);
            return (
              <div key={i} className="enews-item">
                <div className="enews-item-header">
                  <span className="enews-source">{item.source || item.feed_name || ''}</span>
                  <span className="enews-time">{formatTime(item.published_at || item.published)}</span>
                </div>
                <a
                  href={item.url || item.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="enews-title"
                >
                  {item.title}
                  <ExternalLink size={10} style={{ marginLeft: 4, opacity: 0.5, flexShrink: 0 }} />
                </a>
                {tags.length > 0 && (
                  <div className="enews-item-tags">
                    {tags.map(tag => (
                      <span key={tag} className={`enews-item-tag enews-tag-${tag}`}>
                        {tag.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EnergyNewsPanel;
