import React from 'react';
import { Cloud, Thermometer, Droplets } from 'lucide-react';

const WeatherPanel = ({ cities, loading }) => {
  const getConditionColor = (condition) => {
    if (condition.toLowerCase().includes('fog') || condition.toLowerCase().includes('cold')) {
      return '#F59E0B';
    }
    if (condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('storm')) {
      return '#3B82F6';
    }
    return '#22C55E';
  };

  return (
    <div className="panel" data-testid="weather-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Cloud size={16} />
          Weather
        </div>
        <span className="panel-badge">{cities.length} cities</span>
      </div>
      <div className="panel-content">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
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
                <div 
                  className="weather-condition"
                  style={{ color: getConditionColor(city.condition) }}
                >
                  {city.condition}
                </div>
                <div style={{ 
                  fontSize: '0.625rem', 
                  color: 'var(--color-muted)',
                  marginTop: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem'
                }}>
                  <Droplets size={10} />
                  {city.humidity}%
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
