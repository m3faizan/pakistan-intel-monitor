import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Clock, MapPin, Wifi, WifiOff, Sun, Moon, Twitter, Linkedin, Facebook } from 'lucide-react';
import axios from 'axios';
import useSocket from './hooks/useSocket';
import NewsPanel from './components/NewsPanel';
import DailyBriefingPanel from './components/DailyBriefingPanel';
import EconomicPanel from './components/EconomicPanel';
import WeatherPanel from './components/WeatherPanel';
import RegionalPanel from './components/RegionalPanel';
import InfrastructurePanel from './components/InfrastructurePanel';
import AirTrafficPanel from './components/AirTrafficPanel';
import MarineTrafficPanel from './components/MarineTrafficPanel';
import GovernancePanel from './components/GovernancePanel';
import RoadAdvisoryPanel from './components/RoadAdvisoryPanel';
import InflationPanel from './components/InflationPanel';
import BusinessEnvironmentPanel from './components/BusinessEnvironmentPanel';
import RealSectorPanel from './components/RealSectorPanel';
import MineralsMetalsPanel from './components/MineralsMetalsPanel';
import EnergyComplexPanel from './components/EnergyComplexPanel';
import MapSection from './components/MapSection';
import NewsTicker from './components/NewsTicker';
import EnergyDashboard from './components/EnergyDashboard';
import LNGDashboard from './components/LNGDashboard';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

function App() {
  const [activeTab, setActiveTab] = useState('pakistan');
  const [news, setNews] = useState([]);
  const [lngNews, setLngNews] = useState([]);
  const [oilPrices, setOilPrices] = useState(null);
  const [economic, setEconomic] = useState(null);
  const [security, setSecurity] = useState([]);
  const [weather, setWeather] = useState([]);
  const [regional, setRegional] = useState(null);
  const [infrastructure, setInfrastructure] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [energyReport, setEnergyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Real-time WebSocket connection
  const { isConnected, clientCount, on, off } = useSocket();

  // Listen for real-time pushes
  useEffect(() => {
    const newsHandler = (data) => {
      if (data.news) {
        setNews(data.news);
        setLastUpdate(new Date());
      }
    };
    const securityHandler = (data) => {
      if (data.alerts) setSecurity(data.alerts);
    };
    const weatherHandler = (data) => {
      if (data.cities) setWeather(data.cities);
    };

    on('news_update', newsHandler);
    on('security_update', securityHandler);
    on('weather_update', weatherHandler);

    return () => {
      off('news_update', newsHandler);
      off('security_update', securityHandler);
      off('weather_update', weatherHandler);
    };
  }, [on, off]);

  const fetchData = useCallback(async () => {
    try {
      const [newsRes, economicRes, securityRes, weatherRes, regionalRes, infraRes, mapRes, energyRes, lngNewsRes, oilPricesRes] = 
        await Promise.allSettled([
          axios.get(`${API_BASE}/api/news`),
          axios.get(`${API_BASE}/api/economic`),
          axios.get(`${API_BASE}/api/security`),
          axios.get(`${API_BASE}/api/weather`),
          axios.get(`${API_BASE}/api/regional-relations`),
          axios.get(`${API_BASE}/api/infrastructure`),
          axios.get(`${API_BASE}/api/map-data`),
          axios.get(`${API_BASE}/api/daily-energy-report`),
          axios.get(`${API_BASE}/api/lng/news`),
          axios.get(`${API_BASE}/api/lng/oil-prices`)
        ]);

      if (newsRes.status === 'fulfilled') setNews(newsRes.value.data.news || []);
      if (lngNewsRes.status === 'fulfilled') setLngNews(lngNewsRes.value.data.news || []);
      if (oilPricesRes.status === 'fulfilled') setOilPrices(oilPricesRes.value.data.data);
      if (economicRes.status === 'fulfilled') setEconomic(economicRes.value.data.data);
      if (securityRes.status === 'fulfilled') setSecurity(securityRes.value.data.alerts || []);
      if (weatherRes.status === 'fulfilled') setWeather(weatherRes.value.data.cities || []);
      if (regionalRes.status === 'fulfilled') setRegional(regionalRes.value.data.data);
      if (infraRes.status === 'fulfilled') setInfrastructure(infraRes.value.data);
      if (mapRes.status === 'fulfilled') setMapData(mapRes.value.data);
      if (energyRes.status === 'fulfilled') setEnergyReport(energyRes.value.data.data);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // With WebSocket connected, reduce polling to 5 min (fallback only)
    // Without WS, keep 60s polling
    const pollInterval = isConnected ? 300000 : 60000;
    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, isConnected]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatPakistanTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Karachi'
    });
  };

  const formatPakistanDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      timeZone: 'Asia/Karachi'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="app-container" data-testid="app-container">
      {/* Header */}
      <header className="header" data-testid="header">
        <div className="header-left">
          <div className="header-logo">
            <img src="https://customer-assets.emergentagent.com/job_intel-tracker-13/artifacts/8ekxxykb_image.png" alt="PakESDA Logo" style={{ width: 32, height: 32, objectFit: 'contain', background: 'var(--color-surface)', borderRadius: '50%', padding: '2px' }} />
            <h1 className="header-title">
              <span>PakESDA</span> Intelligence Monitor
            </h1>
          </div>
          <div className="header-status">
            <span className="status-dot" style={{ background: isConnected ? 'var(--color-primary)' : 'var(--color-warning)' }}></span>
            <span>{isConnected ? 'LIVE' : 'POLLING'}</span>
            {isConnected && (
              <Wifi size={12} style={{ color: 'var(--color-primary)', marginLeft: '0.25rem' }} />
            )}
            {!isConnected && (
              <WifiOff size={12} style={{ color: 'var(--color-warning)', marginLeft: '0.25rem' }} />
            )}
            {isConnected && clientCount > 0 && (
              <span style={{ fontSize: '0.6rem', color: 'var(--color-muted)', marginLeft: '0.35rem' }}>
                {clientCount} viewer{clientCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="header-right">
          <button onClick={toggleTheme} className="theme-toggle" style={{ 
            background: 'transparent', border: '1px solid var(--color-border)', 
            color: 'var(--color-text)', borderRadius: '4px', padding: '0.4rem', 
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.75rem' 
          }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <div className="header-time" data-testid="header-time">
            <MapPin size={14} style={{ marginRight: '0.25rem', display: 'inline' }} />
            <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>Pakistan</span>
            <Clock size={14} style={{ marginLeft: '0.75rem', marginRight: '0.25rem', display: 'inline' }} />
            {formatPakistanDate(currentTime)} | {formatPakistanTime(currentTime)} PKT
          </div>
          <button 
            onClick={fetchData} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--color-primary)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            data-testid="refresh-button"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'pakistan' ? 'active' : ''}`}
          onClick={() => setActiveTab('pakistan')}
        >
          PAKISTAN
        </button>
        <button
          className={`tab-btn ${activeTab === 'energy' ? 'active' : ''}`}
          onClick={() => setActiveTab('energy')}
        >
          ENERGY
        </button>
        <button
          className={`tab-btn ${activeTab === 'lng' ? 'active' : ''}`}
          onClick={() => setActiveTab('lng')}
          data-testid="lng-tab-btn"
        >
          LNG
        </button>

        {/* Oil prices — right side */}
        {oilPrices && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1.25rem' }} data-testid="nav-oil-prices">
            {['BRENT_CRUDE_USD', 'WTI_USD'].map(code => {
              const d = oilPrices[code];
              if (!d) return null;
              const chg = d.changes_24h;
              const isPos = chg && chg.percent >= 0;
              return (
                <div key={code} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem' }}>
                  <span style={{ color: '#64748b', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.06em' }}>
                    {code === 'BRENT_CRUDE_USD' ? 'BRENT' : 'WTI'}
                  </span>
                  <span style={{ color: '#F8FAFC', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {d.formatted}
                  </span>
                  {chg && (
                    <span style={{ color: isPos ? 'var(--color-primary)' : '#EF4444', fontSize: '0.6rem', fontFamily: 'var(--font-mono)' }}>
                      {isPos ? '+' : ''}{chg.percent}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* News Ticker - LNG-only on LNG tab */}
      <NewsTicker news={activeTab === 'lng' ? lngNews : [...news, ...lngNews]} />

      {/* Main Content */}
      <main className="main-content" data-testid="main-content">
        {activeTab === 'energy' ? (
          <EnergyDashboard />
        ) : activeTab === 'lng' ? (
          <LNGDashboard />
        ) : (
          <div className="bento-grid">
            {/* Map Section */}
            <div className="map-section" data-testid="map-section">
              <MapSection mapData={mapData} alerts={security} energyReport={energyReport} loading={loading} />
            </div>

            {/* Daily Briefing */}
            <div className="briefing-col">
              <DailyBriefingPanel />
            </div>

            {/* News */}
            <div className="news-col">
              <NewsPanel news={news} loading={loading} />
            </div>

            {/* Bottom Panels */}
            <div className="bottom-panels">
              <EconomicPanel data={economic} loading={loading} />
              <InflationPanel loading={loading} />
              <BusinessEnvironmentPanel loading={loading} />
              <RealSectorPanel loading={loading} />
              <WeatherPanel cities={weather} loading={loading} />
              <RegionalPanel relations={regional} loading={loading} />
              <InfrastructurePanel data={infrastructure} loading={loading} />
              <AirTrafficPanel data={infrastructure} loading={loading} />
              <MarineTrafficPanel data={infrastructure} loading={loading} />
              <GovernancePanel loading={loading} />
              <RoadAdvisoryPanel loading={loading} />
              <MineralsMetalsPanel loading={loading} />
              <EnergyComplexPanel loading={loading} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ 
        padding: '0.75rem 1rem', 
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
        color: 'var(--color-muted)'
      }} data-testid="footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>PakESDA Intelligence Monitor v1.0.0</span>
            <a href="https://pakistanenergydata.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
               PakistanEnergyData.com
            </a>
            <div style={{ display: 'flex', gap: '0.75rem', marginLeft: '0.5rem' }}>
               <a href="https://twitter.com/pakenergydata" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-muted)', textDecoration: 'none' }} onMouseEnter={e=>e.currentTarget.style.color='var(--color-primary)'} onMouseLeave={e=>e.currentTarget.style.color='var(--color-muted)'}><Twitter size={14} /></a>
               <a href="https://www.linkedin.com/company/pakesda/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-muted)', textDecoration: 'none' }} onMouseEnter={e=>e.currentTarget.style.color='var(--color-primary)'} onMouseLeave={e=>e.currentTarget.style.color='var(--color-muted)'}><Linkedin size={14} /></a>
               <a href="https://www.facebook.com/pakistanenergydata" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-muted)', textDecoration: 'none' }} onMouseEnter={e=>e.currentTarget.style.color='var(--color-primary)'} onMouseLeave={e=>e.currentTarget.style.color='var(--color-muted)'}><Facebook size={14} /></a>
            </div>
        </div>
        {lastUpdate && (
          <span>Last updated: {formatTime(lastUpdate)}</span>
        )}
      </footer>
    </div>
  );
}

export default App;
