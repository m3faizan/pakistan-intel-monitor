import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import axios from 'axios';
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, ComposedChart
} from 'recharts';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const PowerGridMetricsPanel = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/power-grid-metrics`);
        if (res.data?.data) {
          const parsed = res.data.data.map(d => ({
            ...d,
            displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          }));
          setData(parsed);
        }
      } catch (e) {
        console.error('PowerGridMetrics error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><Activity size={16} />Grid Metrics & Deliveries</div>
        </div>
        <div className="panel-content"><div className="loading"><div className="spinner"></div></div></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><Activity size={16} />Grid Metrics & Deliveries</div>
        </div>
        <div className="panel-content" style={{ color: '#475569', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>
          Data unavailable
        </div>
      </div>
    );
  }

  const latest = data[data.length - 1];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '8px', borderRadius: '4px', fontSize: '0.75rem', color: '#f8fafc' }}>
          <div style={{ marginBottom: '4px', fontWeight: 'bold', borderBottom: '1px solid #334155', paddingBottom: '4px' }}>{label}</div>
          {payload.map((p, i) => (
            <div key={i} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', width: '150px' }}>
              <span>{p.name}:</span>
              <span style={{ fontWeight: 'bold' }}>{p.value.toLocaleString()} {p.name.includes('Capacity') ? 'MW' : 'GWh'}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="panel" data-testid="power-grid-metrics-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Activity size={16} />
          Grid Metrics & Deliveries
        </div>
        <div className="panel-badge">NEPRA / NTDC</div>
      </div>

      <div className="panel-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Dependable Capacity</div>
            <div style={{ fontSize: '1.2rem', color: '#38bdf8', fontWeight: 'bold' }}>{latest['Dependable Capacity'].toLocaleString()} <span style={{ fontSize: '0.7rem' }}>MW</span></div>
          </div>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Net Delivered</div>
            <div style={{ fontSize: '1.2rem', color: '#22c55e', fontWeight: 'bold' }}>{latest['Net Delivered'].toLocaleString()} <span style={{ fontSize: '0.7rem' }}>GWh</span></div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Transmission Loss</div>
            <div style={{ fontSize: '1.2rem', color: '#ef4444', fontWeight: 'bold' }}>{latest['Transmission Loss'].toLocaleString()} <span style={{ fontSize: '0.7rem' }}>GWh</span></div>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Sale to IPPs</div>
            <div style={{ fontSize: '1.2rem', color: '#f59e0b', fontWeight: 'bold' }}>{latest['Sale to IPPs'].toLocaleString()} <span style={{ fontSize: '0.7rem' }}>GWh</span></div>
          </div>
        </div>

        <div style={{ height: '220px', marginTop: '0.5rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="displayDate" stroke="#64748b" fontSize={10} tickMargin={8} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={10} tickFormatter={v => v.toLocaleString()} width={45} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={10} tickFormatter={v => v.toLocaleString()} width={45} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar yAxisId="left" dataKey="Net Delivered" fill="#22c55e" radius={[2, 2, 0, 0]} name="Net Delivered" stackId="a" />
              <Bar yAxisId="left" dataKey="Transmission Loss" fill="#ef4444" radius={[0, 0, 2, 2]} name="Transmission Loss" stackId="a" />
              <Line yAxisId="right" type="monotone" dataKey="Dependable Capacity" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} name="Dependable Capacity (MW)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PowerGridMetricsPanel;
