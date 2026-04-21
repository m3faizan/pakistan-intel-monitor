import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LNGMap from './LNGMap';
import LNGNewsPanel from './LNGNewsPanel';
import LNGDataPanel from './LNGDataPanel';
import LNGTerminalPanel from './LNGTerminalPanel';
import LNGBenchmarkPanel from './LNGBenchmarkPanel';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const LNGDashboard = () => {
  const [terminals, setTerminals] = useState([]);
  const [lngData, setLngData] = useState(null);
  const [sbpPayments, setSbpPayments] = useState(null);
  const [sbpGeneration, setSbpGeneration] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [termRes, dataRes, pmtRes, genRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/lng/terminals`),
          axios.get(`${API_BASE}/api/lng/data`),
          axios.get(`${API_BASE}/api/lng/import-payments`),
          axios.get(`${API_BASE}/api/lng/generation`),
        ]);
        if (termRes.status === 'fulfilled') setTerminals(termRes.value.data.terminals || []);
        if (dataRes.status === 'fulfilled') setLngData(dataRes.value.data);
        if (pmtRes.status === 'fulfilled') setSbpPayments(pmtRes.value.data.data);
        if (genRes.status === 'fulfilled') setSbpGeneration(genRes.value.data.data);
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

      {/* Middle row: Pakistan LNG Metrics + Terminal Activity + World Benchmarks */}
      <div className="energy-bottom-row" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
        <LNGDataPanel
          summary={lngData?.summary}
          history={lngData?.history}
          loading={loading}
          sbpPayments={sbpPayments}
          sbpGeneration={sbpGeneration}
        />
        <LNGTerminalPanel
          summary={lngData?.summary}
          history={lngData?.history}
          loading={loading}
        />
        <LNGBenchmarkPanel />
      </div>
    </div>
  );
};

export default LNGDashboard;
