import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const TERMINALS_COLORS = {
  operational: '#22C55E',
  proposed: '#F59E0B',
};

const LNGMap = ({ terminals }) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [67.33, 24.9],
      zoom: 9.5,
      attributionControl: true,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      if (terminals && terminals.length > 0) {
        terminals.forEach((t) => {
          const color = TERMINALS_COLORS[t.status] || '#3B82F6';
          const el = document.createElement('div');
          el.style.width = '14px';
          el.style.height = '14px';
          el.style.borderRadius = '50%';
          el.style.background = color;
          el.style.border = '2px solid rgba(255,255,255,0.6)';
          el.style.cursor = 'pointer';
          el.style.boxShadow = `0 0 8px ${color}`;

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([t.lon, t.lat])
            .addTo(map);

          el.addEventListener('click', () => setSelected(t));
          marker._element = el;
        });
      }
    });

    return () => map.remove();
  }, [terminals]);

  return (
    <div className="map-container" style={{ position: 'relative', height: '100%', minHeight: '460px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Legend */}
      <div className="map-legend" style={{ bottom: '1rem', right: '1rem' }}>
        <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          LNG Terminals
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#22C55E' }}></span>
          <span style={{ fontSize: '0.6rem', color: '#94A3B8' }}>Operational</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#F59E0B' }}></span>
          <span style={{ fontSize: '0.6rem', color: '#94A3B8' }}>Proposed</span>
        </div>
      </div>

      {/* Terminal Info Popup */}
      {selected && (
        <div style={{
          position: 'absolute', top: '1rem', left: '1rem', zIndex: 20,
          background: 'rgba(2,6,23,0.95)', border: '1px solid var(--color-border)',
          padding: '0.75rem', maxWidth: '280px', fontSize: '0.7rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.8rem', color: '#22C55E', textTransform: 'uppercase' }}>
              <MapPin size={12} style={{ marginRight: '0.3rem', display: 'inline' }} />
              {selected.name}
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem' }}>x</button>
          </div>
          <div style={{ display: 'grid', gap: '0.3rem' }}>
            {[
              ['Operator', selected.operator],
              ['Location', selected.location],
              ['Type', selected.type],
              ['Capacity', selected.capacity],
              ['FSRU Vessel', selected.vessel],
              ['Commissioned', selected.commissioned],
              ['Status', selected.status?.toUpperCase()],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '0.6rem' }}>{label}</span>
                <span style={{ color: '#F8FAFC', fontWeight: 500 }}>{val || 'N/A'}</span>
              </div>
            ))}
          </div>
          {selected.notes && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.6rem', color: '#94A3B8', lineHeight: 1.4, borderTop: '1px solid var(--color-border)', paddingTop: '0.4rem' }}>
              {selected.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LNGMap;
