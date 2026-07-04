import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const CATEGORY_COLORS = {
  terminal: '#22C55E',
  plant: '#38BDF8',
  infrastructure: '#A855F7',
  proposed: '#F59E0B',
};

const CATEGORY_LABELS = {
  terminal: 'LNG Terminal',
  plant: 'RLNG Power Plant',
  infrastructure: 'Pipeline',
  proposed: 'Proposed',
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
      center: [69.5, 28.5],
      zoom: 5.2,
      attributionControl: true,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      if (terminals && terminals.length > 0) {
        terminals.forEach((t) => {
          const status = t.status === 'proposed' ? 'proposed' : (t.category || 'terminal');
          const color = CATEGORY_COLORS[status] || CATEGORY_COLORS[t.category] || '#3B82F6';
          const size = t.category === 'plant' ? 10 : t.category === 'infrastructure' ? 8 : 14;
          const el = document.createElement('div');
          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
          el.style.borderRadius = t.category === 'infrastructure' ? '2px' : '50%';
          el.style.background = color;
          el.style.border = '2px solid rgba(255,255,255,0.6)';
          el.style.cursor = 'pointer';
          el.style.boxShadow = `0 0 8px ${color}`;

          new maplibregl.Marker({ element: el })
            .setLngLat([t.lon, t.lat])
            .addTo(map);

          el.addEventListener('click', () => setSelected(t));
        });
      }
    });

    return () => map.remove();
  }, [terminals]);

  const infoRows = selected ? [
    ['Operator', selected.operator],
    ['Location', selected.location],
    ['Type', selected.type],
    ['Capacity', selected.capacity],
    ...(selected.vessel && selected.vessel !== 'N/A' ? [['FSRU Vessel', selected.vessel]] : []),
    ['Commissioned', selected.commissioned],
    ['Status', selected.status?.toUpperCase()],
  ] : [];

  return (
    <div className="map-container" style={{ position: 'relative', height: '100%', minHeight: '460px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Legend */}
      <div className="map-legend" style={{ bottom: '1rem', right: '1rem' }}>
        <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          LNG Infrastructure
        </div>
        {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
          <div className="legend-item" key={key} style={{ marginBottom: '0.2rem' }}>
            <span style={{
              width: 8, height: 8, display: 'inline-block',
              borderRadius: key === 'infrastructure' ? '2px' : '50%',
              background: color,
            }} />
            <span style={{ fontSize: '0.6rem', color: '#94A3B8' }}>{CATEGORY_LABELS[key] || key}</span>
          </div>
        ))}
      </div>

      {/* Info Popup */}
      {selected && (
        <div style={{
          position: 'absolute', top: '1rem', left: '1rem', zIndex: 20,
          background: 'rgba(2,6,23,0.95)', border: '1px solid var(--color-border)',
          padding: '0.85rem 1rem', maxWidth: '300px', fontSize: '0.7rem',
        }}>
          {/* Name */}
          <div style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700,
            fontSize: '0.85rem', color: CATEGORY_COLORS[selected.category] || '#22C55E',
            textTransform: 'uppercase', letterSpacing: '0.03em',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            marginBottom: '0.6rem',
          }}>
            <MapPin size={14} />
            {selected.name}
            <button onClick={() => setSelected(null)} style={{
              background: 'none', border: 'none', color: '#64748b',
              cursor: 'pointer', marginLeft: 'auto', padding: '2px',
              display: 'flex', alignItems: 'center',
            }}>
              <X size={14} />
            </button>
          </div>

          {/* Info rows with proper spacing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {infoRows.map(([label, val]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                gap: '1rem',
              }}>
                <span style={{
                  color: '#64748b', textTransform: 'uppercase',
                  fontSize: '0.58rem', letterSpacing: '0.06em',
                  flexShrink: 0, minWidth: '70px',
                }}>
                  {label}
                </span>
                <span style={{
                  color: '#F8FAFC', fontWeight: 500, fontSize: '0.68rem',
                  textAlign: 'right', wordBreak: 'break-word',
                }}>
                  {val || 'N/A'}
                </span>
              </div>
            ))}
          </div>

          {/* Notes */}
          {selected.notes && (
            <div style={{
              marginTop: '0.6rem', fontSize: '0.6rem', color: '#94A3B8',
              lineHeight: 1.5, borderTop: '1px solid var(--color-border)',
              paddingTop: '0.5rem',
            }}>
              {selected.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LNGMap;
