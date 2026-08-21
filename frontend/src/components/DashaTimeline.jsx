import React, { useState } from 'react';

export default function DashaTimeline({ dashaList }) {
  if (!dashaList || dashaList.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
        No Vimshottari Dasha data available. Please generate the Kundali first.
      </div>
    );
  }

  // State to track expanded Mahadashas (index)
  const [expandedMD, setExpandedMD] = useState(null);
  // State to track expanded Antardashas (key like "mdIndex-adIndex")
  const [expandedAD, setExpandedAD] = useState({});

  const toggleMD = (idx) => {
    if (expandedMD === idx) {
      setExpandedMD(null);
    } else {
      setExpandedMD(idx);
    }
  };

  const toggleAD = (mdIdx, adIdx) => {
    const key = `${mdIdx}-${adIdx}`;
    setExpandedAD((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const formatDashaDate = (isoStr) => {
    if (!isoStr) return "";
    const dt = new Date(isoStr);
    return dt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="dasha-section">
      <h3 style={{ color: 'var(--gold-primary)', marginBottom: '1rem', borderBottom: '1px solid rgba(223, 183, 108, 0.1)', paddingBottom: '0.5rem' }}>
        Vimshottari Dasha Timeline (3 Levels)
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Click on any Mahadasha below to expand and view its Antardashas, and click on an Antardasha to view its Pratyantardashas.
      </p>

      {dashaList.map((md, mdIdx) => {
        const isMdExpanded = expandedMD === mdIdx;
        return (
          <div key={mdIdx} className={`dasha-row ${isMdExpanded ? 'expanded' : ''}`}>
            {/* Mahadasha Row Trigger */}
            <div className="dasha-header-trigger" onClick={() => toggleMD(mdIdx)}>
              <div className="dasha-lord-badge">
                <span className="dasha-arrow">▶</span>
                <span>{md.lord} Mahadasha</span>
              </div>
              <div className="dasha-date-range">
                {formatDashaDate(md.start)} — {formatDashaDate(md.end)}
              </div>
            </div>

            {/* Antardashas (Level 2) */}
            {isMdExpanded && (
              <div className="dasha-child-container">
                {md.antardashas.map((ad, adIdx) => {
                  const adKey = `${mdIdx}-${adIdx}`;
                  const isAdExpanded = !!expandedAD[adKey];
                  
                  return (
                    <div key={adIdx} className="dasha-sub-row">
                      <div className="dasha-sub-header" onClick={() => toggleAD(mdIdx, adIdx)}>
                        <span style={{ fontWeight: 600, color: '#e2c185' }}>
                          {isAdExpanded ? '▼' : '▶'} {ad.lord} Bhukti (Antardasha)
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {formatDashaDate(ad.start)} — {formatDashaDate(ad.end)}
                        </span>
                      </div>

                      {/* Pratyantardashas (Level 3) */}
                      {isAdExpanded && (
                        <div className="dasha-sub-child-container">
                          {ad.pratyantardashas.map((pd, pdIdx) => (
                            <div key={pdIdx} className="dasha-sub-sub-item">
                              <span style={{ paddingLeft: '0.5rem' }}>• {pd.lord} Pratyantar</span>
                              <span style={{ fontSize: '0.78rem' }}>
                                {formatDashaDate(pd.start)} — {formatDashaDate(pd.end)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
