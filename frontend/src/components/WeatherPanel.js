import React from 'react';
import { Cloud, Thermometer, Droplets, Wind, Eye } from 'lucide-react';

const WeatherPanel = ({ cities, loading }) => {
  const getConditionColor = (condition) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('rain') || c.includes('storm') || c.includes('thunder')) return '#3B82F6';
    if (c.includes('fog') || c.includes('haze') || c.includes('mist') || c.includes('cold')) return '#F59E0B';
    if (c.includes('cloud') || c.includes('overcast')) return '#94A3B8';
    if (c.includes('snow') || c.includes('sleet')) return '#38BDF8';
    return '#22C55E';
  };

  return (
    <div className="panel" data-testid="weather-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Cloud size={16} />
          Weather
        </div>
        <span className="panel-badge">LIVE</span>
      </div>
      <div className="panel-content">
        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : cities.length === 0 ? (
          <div className="loading">No weather data</div>
        ) : (
          <div className="weather-grid">
            {cities.map((city, index) => (
              <div key={index} className="weather-city" data-testid={`weather-city-${index}`}>
                <div className="weather-name">{city.name}</div>
                <div className="weather-temp">
                  <Thermometer size={14} style={{ marginRight: '0.25rem', opacity: 0.5 }} />
                  {city.temp}°C
                </div>
                {city.high !== undefined && city.low !== undefined && (
                  <div style={{ fontSize: '0.55rem', color: '#64748b', marginTop: '0.1rem' }}>
                    H:{city.high}° L:{city.low}°
                    {city.feels_like !== undefined && ` · Feels ${city.feels_like}°`}
                  </div>
                )}
                <div className="weather-condition" style={{ color: getConditionColor(city.condition) }}>
                  {city.condition}
                </div>
                <div style={{
                  fontSize: '0.575rem', color: 'var(--color-muted)', marginTop: '0.2rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap',
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                    <Droplets size={9} />{city.humidity}%
                  </span>
                  {city.wind_speed !== undefined && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                      <Wind size={9} />{city.wind_speed}km/h
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherPanel;
