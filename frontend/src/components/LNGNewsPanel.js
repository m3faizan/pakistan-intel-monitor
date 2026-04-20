import React, { useState, useEffect } from 'react';
import { Fuel, ExternalLink } from 'lucide-react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const LNGNewsPanel = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/lng/news`);
        setNews(res.data?.news || []);
      } catch (e) {
        console.error('LNG news error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 300000);
    return () => clearInterval(iv);
  }, []);

  const formatTime = (d) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      const now = new Date();
      const diffH = Math.floor((now - dt) / 3600000);
      if (diffH < 24) return `${diffH}h ago`;
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  return (
    <div className="panel enews-panel" data-testid="lng-news-panel" style={{ minHeight: '460px' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Fuel size={16} />
          LNG News
        </div>
        <span className="panel-badge">LIVE</span>
      </div>
      <div className="panel-content enews-list" style={{ maxHeight: '500px' }}>
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : news.length === 0 ? (
          <div style={{ color: '#475569', fontSize: '0.75rem', padding: '1rem', textAlign: 'center' }}>
            No LNG news available
          </div>
        ) : (
          news.slice(0, 25).map((item, i) => (
            <div key={i} className="enews-item" data-testid={`lng-news-item-${i}`}>
              <div className="enews-item-header">
                <span className="enews-source">{item.source}</span>
                <span className="enews-time">{formatTime(item.published)}</span>
              </div>
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="enews-title">
                {item.title}
                <ExternalLink size={10} style={{ marginLeft: 4, opacity: 0.5, flexShrink: 0 }} />
              </a>
              {item.summary && !item.summary.includes('<img') && (
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.2rem', lineHeight: 1.4 }}>
                  {item.summary}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LNGNewsPanel;
