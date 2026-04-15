import React, { useState, useEffect } from 'react';
import { Building2, Users, CheckCircle, Target, Award, Calendar, ExternalLink } from 'lucide-react';

// Chief Ministers data from Pakistan Projects Tracker
const CM_DATA = [
  {
    name: 'Maryam Nawaz',
    party: 'PML-N',
    partyColor: '#22C55E',
    province: 'Punjab',
    provinceColor: '#EC4899',
    tenure: '2024-Present',
    projects: 62,
    completed: 7,
    focusArea: 'Social Welfare',
    impactScore: 6.2,
    daysInPower: 736,
    url: 'https://pakistanprojects.pakesda.com/'
  },
  {
    name: 'Sohail Afridi',
    party: 'PTI',
    partyColor: '#EF4444',
    province: 'KPK',
    provinceColor: '#06B6D4',
    tenure: '2025-Present',
    projects: 13,
    completed: 1,
    focusArea: 'Governance',
    impactScore: 6.2,
    daysInPower: 139,
    url: 'https://pakistanprojects.pakesda.com/'
  },
  {
    name: 'Murad Ali Shah',
    party: 'PPP',
    partyColor: '#000000',
    province: 'Sindh',
    provinceColor: '#F43F5E',
    tenure: '2024-Present',
    projects: 9,
    completed: 3,
    focusArea: 'Transport',
    impactScore: 4.9,
    daysInPower: 736,
    url: 'https://pakistanprojects.pakesda.com/'
  }
];

const GovernancePanel = ({ loading }) => {
  const [data, setData] = useState(CM_DATA);

  if (loading) {
    return (
      <div className="panel" data-testid="governance-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Building2 size={16} />
            Governance
          </div>
        </div>
        <div className="panel-content">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  const totalProjects = data.reduce((sum, cm) => sum + cm.projects, 0);
  const totalCompleted = data.reduce((sum, cm) => sum + cm.completed, 0);

  const getScoreColor = (score) => {
    if (score >= 7) return '#22C55E';
    if (score >= 5) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="panel" data-testid="governance-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Building2 size={16} />
          Governance
        </div>
        <a 
          href="https://pakistanprojects.pakesda.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="panel-badge"
          style={{ 
            background: 'rgba(168, 85, 247, 0.2)', 
            color: '#A855F7',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          {totalProjects} PROJECTS
          <ExternalLink size={10} />
        </a>
      </div>
      <div className="panel-content">
        <div className="governance-note" style={{
          fontSize: '0.6rem',
          color: 'var(--color-muted)',
          marginBottom: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Provincial CM Tracker</span>
          <span>{totalCompleted} Completed</span>
        </div>

        <div className="cm-grid" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {data.map((cm, index) => (
            <div 
              key={index}
              className="cm-card"
              style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid var(--color-border)',
                borderLeft: `3px solid ${cm.provinceColor}`,
                padding: '0.6rem'
              }}
              data-testid={`cm-${cm.province.toLowerCase()}`}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.4rem'
              }}>
                <div>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: '0.8rem',
                    color: cm.provinceColor,
                    marginBottom: '0.15rem'
                  }}>
                    {cm.name}
                  </div>
                  <div style={{ 
                    fontSize: '0.6rem', 
                    color: 'var(--color-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ 
                      padding: '0.1rem 0.3rem',
                      border: `1px solid ${cm.provinceColor}`,
                      fontSize: '0.55rem'
                    }}>
                      {cm.province}
                    </span>
                    <span>{cm.party} • {cm.tenure}</span>
                  </div>
                </div>
                
                <div style={{ 
                  textAlign: 'right',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '0.2rem'
                }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: getScoreColor(cm.impactScore),
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {cm.impactScore}/10
                  </div>
                  <div style={{ fontSize: '0.5rem', color: 'var(--color-muted)' }}>
                    Impact Score
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.4rem',
                paddingTop: '0.4rem',
                borderTop: '1px solid var(--color-border)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 700, 
                    color: '#3B82F6',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {cm.projects}
                  </div>
                  <div style={{ fontSize: '0.5rem', color: 'var(--color-muted)' }}>Projects</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 700, 
                    color: '#22C55E',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {cm.completed}
                  </div>
                  <div style={{ fontSize: '0.5rem', color: 'var(--color-muted)' }}>Done</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: 'var(--color-text)'
                  }}>
                    {cm.focusArea}
                  </div>
                  <div style={{ fontSize: '0.5rem', color: 'var(--color-muted)' }}>Focus</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 700, 
                    color: '#F59E0B',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {cm.daysInPower}
                  </div>
                  <div style={{ fontSize: '0.5rem', color: 'var(--color-muted)' }}>Days</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Source Attribution */}
        <div style={{
          marginTop: '0.5rem',
          paddingTop: '0.4rem',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.55rem',
          color: 'var(--color-muted)'
        }}>
          <span>Source: PakESDA Pakistan Projects</span>
          <a 
            href="https://pakistanprojects.pakesda.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ 
              color: '#A855F7',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            View Full Data <ExternalLink size={8} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default GovernancePanel;
