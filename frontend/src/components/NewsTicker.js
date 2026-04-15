import React, { useRef, useEffect, useState } from 'react';
import { Radio } from 'lucide-react';

const NewsTicker = ({ news }) => {
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef(null);

  if (!news || news.length === 0) return null;

  // Take top 20 news for ticker
  const tickerItems = news.slice(0, 20);
  // Duplicate for seamless loop
  const allItems = [...tickerItems, ...tickerItems];

  return (
    <div 
      className="news-ticker" 
      data-testid="news-ticker"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        background: '#7f1d1d',
        borderBottom: '1px solid #991b1b',
        padding: '0.4rem 0',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* BREAKING badge */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        zIndex: 10,
        background: '#dc2626',
        padding: '0 0.85rem',
        borderRight: '2px solid #991b1b'
      }}>
        <Radio size={11} color="#fff" style={{ animation: 'pulse 2s infinite' }} />
        <span style={{ 
          fontSize: '0.65rem', 
          color: '#fff',
          textTransform: 'uppercase',
          fontWeight: 800,
          letterSpacing: '0.12em',
          fontFamily: 'var(--font-heading)'
        }}>
          Breaking
        </span>
      </div>

      <div 
        ref={tickerRef}
        className="ticker-content"
        style={{
          display: 'flex',
          animation: isPaused ? 'none' : 'ticker 20s linear infinite',
          whiteSpace: 'nowrap',
          paddingLeft: '130px'
        }}
      >
        {allItems.map((item, index) => (
          <span 
            key={index} 
            className="ticker-item"
            style={{
              padding: '0 2rem',
              fontSize: '0.8rem',
              color: '#fecaca',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <span style={{
              width: '5px',
              height: '5px',
              background: '#fca5a5',
              borderRadius: '50%',
              flexShrink: 0
            }}></span>
            <span>{item.title}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default NewsTicker;
