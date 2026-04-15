import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const formatPakistanTimestamp = (isoString) => {
  if (!isoString) return 'Unknown';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const DailyBriefingPanel = () => {
  const [briefing, setBriefing] = useState(null);
  const [meta, setMeta] = useState({ updated: null, stale: false });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchBriefing = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const url = forceRefresh ? `${API_BASE}/api/daily-briefing/refresh` : `${API_BASE}/api/daily-briefing`;
      const response = forceRefresh ? await axios.post(url) : await axios.get(url);
      setBriefing(response.data.briefing);
      setMeta({
        updated: response.data.updated,
        stale: response.data.stale
      });
      setError(null);
    } catch (err) {
      setError('Unable to load the daily briefing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefing(false);
    const interval = setInterval(() => fetchBriefing(false), 21600000);
    return () => clearInterval(interval);
  }, [fetchBriefing]);

  const renderList = (items, testIdPrefix) => {
    if (!items || items.length === 0) {
      return (
        <div className="briefing-empty" data-testid={`${testIdPrefix}-empty`}>
          No updates available.
        </div>
      );
    }

    return (
      <ul className="briefing-list" data-testid={`${testIdPrefix}-list`}>
        {items.map((item, index) => (
          <li key={`${testIdPrefix}-${index}`} data-testid={`${testIdPrefix}-item-${index}`}>
            {item}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="panel daily-briefing-panel" data-testid="daily-briefing-panel">
      <div className="panel-header">
        <div className="panel-title" data-testid="daily-briefing-title">
          <BookOpen size={16} />
          Daily Briefing
        </div>
        <div className="briefing-header-actions" data-testid="daily-briefing-header-actions">
          <span
            className="briefing-status-dot"
            data-testid="daily-briefing-status-dot"
            style={{
              width: '6px',
              height: '6px',
              backgroundColor: meta.stale ? '#F59E0B' : '#22C55E',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'pulse 2s infinite'
            }}
          ></span>
          <button
            type="button"
            className="briefing-refresh"
            onClick={() => fetchBriefing(true)}
            disabled={refreshing}
            data-testid="daily-briefing-refresh-button"
          >
            <RefreshCw size={14} />
            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </div>
      <div className="panel-content daily-briefing-content" data-testid="daily-briefing-content">
        {loading ? (
          <div className="loading" data-testid="daily-briefing-loading">
            <div className="spinner"></div>
          </div>
        ) : !briefing ? (
          <div className="briefing-empty" data-testid="daily-briefing-empty">
            No briefing available.
          </div>
        ) : (
          <>
            <div className="briefing-meta" data-testid="daily-briefing-meta">
              Updated {formatPakistanTimestamp(meta.updated)} PKT
            </div>
            {error && (
              <div className="briefing-error" data-testid="daily-briefing-error">
                {error}
              </div>
            )}
            <div className="briefing-section" data-testid="daily-briefing-executive-summary-section">
              <div className="briefing-section-title" data-testid="daily-briefing-executive-summary-title">
                Executive Summary
              </div>
              <p className="briefing-summary" data-testid="daily-briefing-executive-summary">
                {briefing.executive_summary}
              </p>
            </div>
            <div className="briefing-section" data-testid="daily-briefing-key-takeaways-section">
              <div className="briefing-section-title" data-testid="daily-briefing-key-takeaways-title">
                Key Takeaways
              </div>
              {renderList(briefing.key_takeaways, 'daily-briefing-key-takeaways')}
            </div>
            <div className="briefing-section" data-testid="daily-briefing-economic-watch-section">
              <div className="briefing-section-title" data-testid="daily-briefing-economic-watch-title">
                Economic Watch
              </div>
              {renderList(briefing.economic_watch, 'daily-briefing-economic-watch')}
            </div>
            <div className="briefing-section" data-testid="daily-briefing-risks-section">
              <div className="briefing-section-title" data-testid="daily-briefing-risks-title">
                Risks
              </div>
              {renderList(briefing.risks, 'daily-briefing-risks')}
            </div>
            <div className="briefing-section" data-testid="daily-briefing-watchlist-section">
              <div className="briefing-section-title" data-testid="daily-briefing-watchlist-title">
                Watchlist
              </div>
              {renderList(briefing.watchlist, 'daily-briefing-watchlist')}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyBriefingPanel;
