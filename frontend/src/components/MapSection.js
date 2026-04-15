import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

const ALERT_COORDS = {
  islamabad: [73.0479, 33.6844],
  karachi: [67.0011, 24.8607],
  lahore: [74.3587, 31.5204],
  peshawar: [71.5249, 34.0151],
  quetta: [66.9905, 30.1798],
  multan: [71.5249, 30.1575],
  rawalpindi: [73.0551, 33.5651],
  sindh: [67.0011, 24.8607],
  punjab: [74.3587, 31.5204],
  balochistan: [66.9905, 30.1798],
  'khyber pakhtunkhwa': [71.5249, 34.0151],
  kp: [71.5249, 34.0151],
  kpk: [71.5249, 34.0151],
  gilgit: [74.3142, 35.9208],
  pakistan: [69.3451, 30.3753]
};

const REGION_COLORS = {
  asia: '#38BDF8',
  europe: '#60A5FA',
  africa: '#F59E0B',
  'middle east': '#F97316',
  americas: '#A855F7',
  global: '#94A3B8'
};

const COUNTRY_FLAG_MAP = {
  china: '🇨🇳',
  'hong kong': '🇭🇰',
  india: '🇮🇳',
  indonesia: '🇮🇩',
  japan: '🇯🇵',
  kazakhstan: '🇰🇿',
  malaysia: '🇲🇾',
  mongolia: '🇲🇳',
  pakistan: '🇵🇰',
  philippines: '🇵🇭',
  'south korea': '🇰🇷',
  'sri lanka': '🇱🇰',
  taiwan: '🇹🇼',
  vietnam: '🇻🇳',
  bahrain: '🇧🇭',
  iran: '🇮🇷',
  iraq: '🇮🇶',
  israel: '🇮🇱',
  jordan: '🇯🇴',
  kuwait: '🇰🇼',
  lebanon: '🇱🇧',
  oman: '🇴🇲',
  qatar: '🇶🇦',
  'saudi arabia': '🇸🇦',
  'united arab emirates': '🇦🇪',
  uae: '🇦🇪',
  angola: '🇦🇴',
  'cote d ivoire': '🇨🇮',
  gabon: '🇬🇦',
  ghana: '🇬🇭',
  guinea: '🇬🇳',
  kenya: '🇰🇪',
  mauritania: '🇲🇷',
  namibia: '🇳🇦',
  seychelles: '🇸🇨',
  'south africa': '🇿🇦',
  'south sudan': '🇸🇸',
  cyprus: '🇨🇾',
  estonia: '🇪🇪',
  france: '🇫🇷',
  germany: '🇩🇪',
  hungary: '🇭🇺',
  italy: '🇮🇹',
  netherlands: '🇳🇱',
  norway: '🇳🇴',
  russia: '🇷🇺',
  australia: '🇦🇺',
  brazil: '🇧🇷',
  canada: '🇨🇦',
  cuba: '🇨🇺'
};

const normalizeKey = (value = '') => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getRegionColor = (region = '') => {
  const normalized = normalizeKey(region);
  if (normalized.includes('middle east')) return REGION_COLORS['middle east'];
  if (normalized.includes('asia')) return REGION_COLORS.asia;
  if (normalized.includes('europe')) return REGION_COLORS.europe;
  if (normalized.includes('africa')) return REGION_COLORS.africa;
  if (normalized.includes('america')) return REGION_COLORS.americas;
  if (normalized.includes('global')) return REGION_COLORS.global;
  return REGION_COLORS.global;
};

const getCountryFlag = (country = '') => {
  const normalized = normalizeKey(country);
  if (!normalized) return '🌐';
  if (normalized.includes('global') || normalized.includes('region')) return '🌍';
  if (normalized.includes('asia') || normalized.includes('africa') || normalized.includes('europe')) return '🌍';
  return COUNTRY_FLAG_MAP[normalized] || '🌐';
};

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const resolveAlertCoords = (alert) => {
  const text = `${alert?.title || ''} ${alert?.description || ''} ${alert?.region || ''}`.toLowerCase();
  const keys = Object.keys(ALERT_COORDS);
  for (const key of keys) {
    if (text.includes(key)) {
      return ALERT_COORDS[key];
    }
  }
  return null;
};

const MapSection = ({ mapData, alerts = [], energyReport, loading }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const maplibreRef = useRef(null);
  const markerRefs = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showAlertsLayer, setShowAlertsLayer] = useState(true);
  const [activeLayer, setActiveLayer] = useState('overview');
  const [energySidebarOpen, setEnergySidebarOpen] = useState(true);

  const topAlerts = useMemo(() => {
    const sorted = [...(alerts || [])].sort((a, b) => {
      const ta = new Date(a?.timestamp || 0).getTime();
      const tb = new Date(b?.timestamp || 0).getTime();
      return tb - ta;
    });
    return sorted.slice(0, 8);
  }, [alerts]);

  const energyEntries = useMemo(() => energyReport?.entries || [], [energyReport]);
  const energyReportDate = energyReport?.report_date;

  const energyFeedItems = useMemo(() => {
    return energyEntries.flatMap((entry) =>
      (entry.items || []).map((item, idx) => ({
        id: `${entry.country}-${idx}`,
        country: entry.country,
        region: entry.region,
        text: item,
        flag: getCountryFlag(entry.country),
        regionColor: getRegionColor(entry.region)
      }))
    );
  }, [energyEntries]);

  useEffect(() => {
    const loadMap = async () => {
      if (!mapContainerRef.current || mapRef.current) return;

      try {
        const maplibregl = (await import('maplibre-gl')).default;
        maplibreRef.current = maplibregl;
        await import('maplibre-gl/dist/maplibre-gl.css');

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: {
            version: 8,
            sources: {
              'carto-dark': {
                type: 'raster',
                tiles: [
                  'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                  'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                  'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
                ],
                tileSize: 256,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              }
            },
            layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark', minzoom: 0, maxzoom: 22 }]
          },
          center: [69.3451, 30.3753],
          zoom: 5,
          attributionControl: false
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

        map.on('load', () => {
          setMapLoaded(true);
          mapRef.current = map;
        });
      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    loadMap();

    return () => {
      markerRefs.current.forEach((m) => m.remove());
      markerRefs.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const timer = setTimeout(() => {
      mapRef.current.resize();
    }, 300);
    return () => clearTimeout(timer);
  }, [activeLayer, energySidebarOpen, mapLoaded]);

  useEffect(() => {
    const renderMarkers = async () => {
      if (!mapRef.current || !mapLoaded || !maplibreRef.current) return;

      const maplibregl = maplibreRef.current;
      markerRefs.current.forEach((m) => m.remove());
      markerRefs.current = [];

      if (activeLayer === 'energy') {
        const bounds = new maplibregl.LngLatBounds();
        let hasEnergy = false;

        energyEntries.forEach((entry, index) => {
          if (entry?.lon === undefined || entry?.lat === undefined) return;
          hasEnergy = true;
          bounds.extend([entry.lon, entry.lat]);

          const el = document.createElement('div');
          el.className = 'map-marker energy-marker';
          el.setAttribute('data-testid', `energy-marker-${index}`);
          el.style.cssText = `
            width: 11px;
            height: 11px;
            background: #38BDF8;
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.6);
            cursor: pointer;
            box-shadow: 0 0 10px #38BDF8;
          `;

          const items = (entry.items || []).map((item) => `
            <li style="margin-bottom: 6px;">${item}</li>
          `).join('');

          const popup = new maplibregl.Popup({ offset: 15 }).setHTML(`
            <div style="background: #0F172A; color: #F8FAFC; padding: 8px 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; border: 1px solid #38BDF8; max-width: 280px;">
              <div style="color: #38BDF8; text-transform: uppercase; font-size: 10px; margin-bottom: 6px;">${entry.country} • ${entry.region || 'Region'} • ${entry.count || entry.items?.length || 0} items</div>
              <div style="max-height: 220px; overflow-y: auto; padding-right: 4px;">
                <ul style="padding-left: 16px; color: #E2E8F0;">
                  ${items}
                </ul>
              </div>
            </div>
          `);

          const marker = new maplibregl.Marker({ element: el }).setLngLat([entry.lon, entry.lat]).setPopup(popup).addTo(mapRef.current);
          markerRefs.current.push(marker);
        });

        if (hasEnergy) {
          mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 4 });
        }
        return;
      }

      (mapData?.cities || []).forEach((city) => {
        const el = document.createElement('div');
        el.className = 'map-marker city-marker';
        el.style.cssText = `
          width: 12px;
          height: 12px;
          background: ${city.type === 'capital' ? '#22C55E' : city.type === 'strategic' ? '#F59E0B' : '#3B82F6'};
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.5);
          cursor: pointer;
          box-shadow: 0 0 10px ${city.type === 'capital' ? '#22C55E' : city.type === 'strategic' ? '#F59E0B' : '#3B82F6'};
        `;

        const popup = new maplibregl.Popup({ offset: 15 }).setHTML(`
          <div style="background: #0F172A; color: #F8FAFC; padding: 8px 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; border: 1px solid #22C55E;">
            <strong style="color: #22C55E;">${city.name}</strong><br/>
            <span style="color: #94A3B8;">Population: ${city.population}</span><br/>
            <span style="color: #94A3B8; text-transform: uppercase; font-size: 10px;">${city.type}</span>
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el }).setLngLat([city.lon, city.lat]).setPopup(popup).addTo(mapRef.current);
        markerRefs.current.push(marker);
      });

      if (showAlertsLayer) {
        topAlerts.forEach((alert) => {
          const coords = resolveAlertCoords(alert);
          if (!coords) return;

          const el = document.createElement('div');
          el.className = 'map-marker alert-marker';
          el.style.cssText = `
            width: 11px;
            height: 11px;
            background: #EF4444;
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.6);
            cursor: pointer;
            box-shadow: 0 0 10px #EF4444;
          `;

          const popup = new maplibregl.Popup({ offset: 15 }).setHTML(`
            <div style="background: #0F172A; color: #F8FAFC; padding: 8px 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; border: 1px solid #EF4444; max-width: 260px;">
              <strong style="color: #EF4444; text-transform: uppercase;">Alert</strong><br/>
              <span style="color: #94A3B8; text-transform: uppercase; font-size: 10px;">${alert.type || 'general'} • ${alert.severity || 'info'}</span><br/>
              <strong style="color: #F8FAFC;">${alert.title || 'Untitled Alert'}</strong><br/>
              <span style="color: #94A3B8;">${alert.region || 'Pakistan'}${alert.source ? ` • ${alert.source}` : ''}</span>
            </div>
          `);

          const marker = new maplibregl.Marker({ element: el }).setLngLat(coords).setPopup(popup).addTo(mapRef.current);
          markerRefs.current.push(marker);
        });
      }

      mapRef.current.easeTo({ center: [69.3451, 30.3753], zoom: 5 });
    };

    renderMarkers();
  }, [mapData, topAlerts, mapLoaded, showAlertsLayer, activeLayer, energyEntries]);

  return (
    <div className="map-container" data-testid="map-container">
      <div className={`map-layout ${activeLayer === 'energy' ? 'energy-active' : ''}`} data-testid="map-layout">
        {activeLayer === 'energy' && (
          <div
            className={`energy-sidebar ${energySidebarOpen ? 'open' : 'collapsed'}`}
            data-testid="energy-sidebar"
          >
            <div className="energy-sidebar-header">
              <div className="panel-title energy-sidebar-title" data-testid="energy-sidebar-title">
                <Zap size={14} />
                Daily Energy Report
              </div>
              <button
                className="energy-sidebar-toggle"
                onClick={() => setEnergySidebarOpen((prev) => !prev)}
                data-testid="energy-sidebar-toggle"
                type="button"
              >
                {energySidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>
            </div>
            {energySidebarOpen && (
              <>
                <div className="energy-sidebar-meta" data-testid="energy-sidebar-meta">
                  Report: {energyReportDate || 'Latest'} • {energyReport?.total_items || 0} items
                </div>
                <div className="energy-sidebar-content" data-testid="energy-sidebar-content">
                  {energyFeedItems.map((item, index) => (
                    <div className="energy-feed-item" data-testid={`energy-feed-item-${index}`} key={`${item.id}-${index}`}>
                      <div className="energy-feed-title">
                        <span className="energy-flag" data-testid={`energy-feed-flag-${index}`}>{item.flag}</span>
                        <span>{item.country}</span>
                        <span
                          className="energy-region-chip"
                          data-testid={`energy-feed-region-${index}`}
                          style={{ borderColor: item.regionColor, color: item.regionColor }}
                        >
                          {item.region}
                        </span>
                      </div>
                      <div className="energy-feed-text">{item.text}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        <div className="map-canvas" data-testid="map-canvas">
          <div ref={mapContainerRef} className="map-canvas-inner" />

          <div className="map-overlay" data-testid="map-overlay">
            <div className="map-tabs" data-testid="map-tabs">
              <button
                className={`map-tab ${activeLayer === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveLayer('overview')}
                data-testid="map-tab-overview"
              >
                Pakistan
              </button>
              <button
                className={`map-tab ${activeLayer === 'energy' ? 'active' : ''}`}
                onClick={() => setActiveLayer('energy')}
                data-testid="map-tab-energy"
              >
                Daily Energy Report
              </button>
            </div>
            {activeLayer === 'energy' && energyReportDate && (
              <div className="map-report-date" data-testid="map-energy-report-date">
                Report: {energyReportDate}
              </div>
            )}
          </div>

          <div className="map-legend" data-testid="map-legend">
            {activeLayer === 'overview' ? (
              <>
                <div className="legend-item">
                  <span className="legend-dot capital"></span>
                  <span>Capital</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot major"></span>
                  <span>Major City</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot strategic"></span>
                  <span>Strategic Port</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: '#EF4444' }}></span>
                  <span>Alerts</span>
                </div>
                <button
                  onClick={() => setShowAlertsLayer((prev) => !prev)}
                  className="range-btn"
                  style={{ marginTop: '0.3rem', fontSize: '0.55rem', padding: '0.18rem 0.4rem', width: '100%' }}
                  data-testid="map-alert-layer-toggle"
                >
                  <Bell size={11} style={{ marginRight: '0.3rem', display: 'inline' }} />
                  Alerts: {showAlertsLayer ? 'On' : 'Off'}
                </button>
              </>
            ) : (
              <>
                <div className="legend-item">
                  <span className="legend-dot energy"></span>
                  <span>Energy Report</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: '#38BDF8' }}></span>
                  <span>Country/Region</span>
                </div>
                <div className="legend-meta" data-testid="energy-report-meta">
                  {energyReport?.total_countries || 0} locations • {energyReport?.total_items || 0} items
                </div>
              </>
            )}
          </div>

          {loading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(2, 6, 23, 0.9)',
              padding: '1rem 2rem',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div className="spinner"></div>
              <span>Loading map data...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapSection;
