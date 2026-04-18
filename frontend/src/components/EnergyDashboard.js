import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useSocket from '../hooks/useSocket';
import MapSection from './MapSection';
import EnergyNewsPanel from './EnergyNewsPanel';
import PowerGenerationPanel from './PowerGenerationPanel';
import PowerGenDistributionPanel from './PowerGenDistributionPanel';
import EnergyPaymentsPanel from './EnergyPaymentsPanel';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const EnergyDashboard = () => {
  const [mapData, setMapData]     = useState(null);
  const [security, setSecurity]   = useState([]);
  const [energyReport, setReport] = useState(null);
  const [loading, setLoading]     = useState(true);
  const { isConnected, on, off }  = useSocket();

  useEffect(() => {
    const load = async () => {
      try {
        const [mapRes, secRes, energyRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/map-data`),
          axios.get(`${API_BASE}/api/security`),
          axios.get(`${API_BASE}/api/daily-energy-report`),
        ]);
        if (mapRes.status    === 'fulfilled') setMapData(mapRes.value.data);
        if (secRes.status    === 'fulfilled') setSecurity(secRes.value.data.alerts || []);
        if (energyRes.status === 'fulfilled') setReport(energyRes.value.data.data);
      } catch (e) {
        console.error('EnergyDashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const pollInterval = isConnected ? 300000 : 120000;
    const iv = setInterval(load, pollInterval);
    return () => clearInterval(iv);
  }, [isConnected]);

  // Listen for real-time security updates
  useEffect(() => {
    const secHandler = (data) => {
      if (data.alerts) setSecurity(data.alerts);
    };
    on('security_update', secHandler);
    return () => off('security_update', secHandler);
  }, [on, off]);

  return (
    <div className="energy-dashboard">
      {/* Top row: map + news */}
      <div className="energy-top-row">
        <div className="energy-map-col">
          <MapSection
            mapData={mapData}
            alerts={security}
            energyReport={energyReport}
            loading={loading}
          />
        </div>
        <div className="energy-news-col">
          <EnergyNewsPanel />
        </div>
      </div>

      {/* Bottom row: Power Generation stat-cards (left) + Power Generation Profile sparklines (right) + Energy Payments (right) */}
      <div className="energy-bottom-row">
        <PowerGenDistributionPanel />
        <PowerGenerationPanel />
        <EnergyPaymentsPanel />
      </div>
    </div>
  );
};

export default EnergyDashboard;
