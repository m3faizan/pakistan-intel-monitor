import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LNGMap from './LNGMap';
import LNGNewsPanel from './LNGNewsPanel';
import LNGDataPanel from './LNGDataPanel';
import LNGTerminalPanel from './LNGTerminalPanel';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const LNGDashboard = () => {
  const [terminals, setTerminals] = useState([]);
  const [lngData, setLngData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [termRes, dataRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/lng/terminals`),
          axios.get(`${API_BASE}/api/lng/data`),
        ]);
        if (termRes.status === 'fulfilled') setTerminals(termRes.value.data.terminals || []);
        if (dataRes.status === 'fulfilled') setLngData(dataRes.value.data);
      } catch (e) {
        console.error('LNG Dashboard error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 300000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="energy-dashboard" data-testid="lng-dashboard">
      {/* Top row: Map + News */}
      <div className="energy-top-row">
        <div className="energy-map-col">
          <LNGMap terminals={terminals} />
        </div>
        <div className="energy-news-col">
          <LNGNewsPanel />
        </div>
      </div>

      {/* Bottom row: Pakistan LNG Metrics + Terminal Activity */}
      <div className="energy-bottom-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <LNGDataPanel
          summary={lngData?.summary}
          history={lngData?.history}
          loading={loading}
        />
        <LNGTerminalPanel
          summary={lngData?.summary}
          history={lngData?.history}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default LNGDashboard;
