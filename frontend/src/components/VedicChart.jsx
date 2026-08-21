import React from 'react';

const RASI_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

export default function VedicChart({ chartData, style = 'north' }) {
  if (!chartData || !chartData.vedic_houses || !chartData.ascendant) {
    return (
      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
        No chart data available. Please generate the Kundali first.
      </div>
    );
  }

  const { vedic_houses, ascendant } = chartData;
  const ascSignName = ascendant.sign;
  const ascSignIdx = RASI_NAMES.indexOf(ascSignName);

  // Helper to map planet names to short 2-char codes
  const getPlanetShort = (p) => {
    const mapping = {
      "Sun": "Su",
      "Moon": "Mo",
      "Mars": "Ma",
      "Mercury": "Me",
      "Jupiter": "Ju",
      "Venus": "Ve",
      "Saturn": "Sa",
      "Rahu": "Ra",
      "Ketu": "Ke",
      "Ascendant": "Asc"
    };
    return mapping[p] || p;
  };

  // Render North Indian Chart (Diamond Format)
  const renderNorthIndian = () => {
    // In North Indian style:
    // Houses are fixed in space (House 1 is top-center, 2 is top-left, etc. counting counter-clockwise)
    // Numbers in the houses represent Zodiac Sign Indexes (1-based: 1=Aries, 12=Pisces)
    // House 1 gets ascSignIdx + 1. House i gets (ascSignIdx + i - 1) % 12 + 1.
    const getHouseSignNum = (houseNum) => {
      return ((ascSignIdx + houseNum - 1) % 12) + 1;
    };

    const getHousePlanets = (houseNum) => {
      const house = vedic_houses[houseNum] || { planets: [] };
      let planets = [...house.planets].map(getPlanetShort);
      if (houseNum === 1) {
        planets.unshift("Asc");
      }
      return planets;
    };

    // Centers for text placements for each house (1-12)
    const houseCenters = {
      1: { sx: 200, sy: 90, px: 200, py: 125 }, // Top Center Diamond
      2: { sx: 130, sy: 50, px: 110, py: 75 },  // Top Left Triangle
      3: { sx: 50, sy: 130, px: 50, py: 155 },  // Left Top Triangle
      4: { sx: 90, sy: 200, px: 125, py: 200 }, // Center Left Diamond
      5: { sx: 50, sy: 270, px: 50, py: 245 },  // Left Bottom Triangle
      6: { sx: 130, sy: 350, px: 110, py: 325 }, // Bottom Left Triangle
      7: { sx: 200, sy: 310, px: 200, py: 275 }, // Center Bottom Diamond
      8: { sx: 270, sy: 350, px: 290, py: 325 }, // Bottom Right Triangle
      9: { sx: 350, sy: 270, px: 350, py: 245 }, // Right Bottom Triangle
      10: { sx: 310, sy: 200, px: 275, py: 200 },// Center Right Diamond
      11: { sx: 350, sy: 130, px: 350, py: 155 }, // Right Top Triangle
      12: { sx: 270, sy: 50, px: 290, py: 75 }   // Top Right Triangle
    };

    return (
      <svg viewBox="0 0 400 400" className="vedic-chart-svg" width="100%" height="100%">
        {/* Background panel */}
        <rect width="400" height="400" fill="rgba(8, 8, 24, 0.4)" stroke="var(--gold-primary)" strokeWidth="2" />
        
        {/* Diagonals */}
        <line x1="0" y1="0" x2="400" y2="400" className="chart-line" />
        <line x1="0" y1="400" x2="400" y2="0" className="chart-line" />
        
        {/* Inner Diamond */}
        <line x1="200" y1="0" x2="400" y2="200" className="chart-line" />
        <line x1="400" y1="200" x2="200" y2="400" className="chart-line" />
        <line x1="200" y1="400" x2="0" y2="200" className="chart-line" />
        <line x1="0" y1="200" x2="200" y2="0" className="chart-line" />
        
        {/* Render sign numbers & planets */}
        {Object.keys(houseCenters).map((houseStr) => {
          const hNum = parseInt(houseStr);
          const signNum = getHouseSignNum(hNum);
          const planets = getHousePlanets(hNum);
          const pos = houseCenters[hNum];
          
          // Divide planets list into chunks to wrap nicely if multiple planets are in the same house
          const chunkPlanets = [];
          for (let i = 0; i < planets.length; i += 3) {
            chunkPlanets.push(planets.slice(i, i + 3).join(" "));
          }

          return (
            <g key={hNum}>
              {/* House Number in small subscript */}
              <text x={pos.sx} y={pos.sy - 15} className="chart-text-house">H{hNum}</text>
              {/* Zodiac Sign Number (1-12) */}
              <text x={pos.sx} y={pos.sy} className="chart-text-sign" textAnchor="middle">{signNum}</text>
              {/* Planets placed in the house */}
              {chunkPlanets.map((pGroup, idx) => (
                <text 
                  key={idx} 
                  x={pos.px} 
                  y={pos.py + (idx * 14)} 
                  className="chart-text-planet" 
                  textAnchor="middle"
                >
                  {pGroup}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    );
  };

  // Render South Indian Chart (Box Grid Format)
  const renderSouthIndian = () => {
    // In South Indian style:
    // Zodiac signs are fixed in a clockwise outer ring:
    // Top Row: Pisces (11), Aries (0), Taurus (1), Gemini (2)
    // Right Col: Cancer (3), Leo (4)
    // Bottom Row: Virgo (5), Libra (6), Scorpio (7), Sagittarius (8)
    // Left Col: Capricorn (9), Aquarius (10)
    // Centers are at indices 0-11 representing Aries to Pisces.
    const signBoxPositions = {
      0: { x: 100, y: 0 },   // Aries (Top Mid 1)
      1: { x: 200, y: 0 },   // Taurus (Top Mid 2)
      2: { x: 300, y: 0 },   // Gemini (Top Right)
      3: { x: 300, y: 100 }, // Cancer (Right Mid 1)
      4: { x: 300, y: 200 }, // Leo (Right Mid 2)
      5: { x: 300, y: 300 }, // Virgo (Bottom Right)
      6: { x: 200, y: 300 }, // Libra (Bottom Mid 2)
      7: { x: 100, y: 300 }, // Scorpio (Bottom Mid 1)
      8: { x: 0, y: 300 },   // Sagittarius (Bottom Left)
      9: { x: 0, y: 200 },   // Capricorn (Left Mid 2)
      10: { x: 0, y: 100 },  // Aquarius (Left Mid 1)
      11: { x: 0, y: 0 }     // Pisces (Top Left)
    };

    return (
      <svg viewBox="0 0 400 400" className="vedic-chart-svg" width="100%" height="100%">
        {/* Background panel */}
        <rect width="400" height="400" fill="rgba(8, 8, 24, 0.4)" stroke="var(--gold-primary)" strokeWidth="2" />
        
        {/* Grid lines */}
        {/* Horizontal */}
        <line x1="0" y1="100" x2="400" y2="100" className="chart-line" />
        <line x1="0" y1="200" x2="400" y2="200" className="chart-line" />
        <line x1="0" y1="300" x2="400" y2="300" className="chart-line" />
        {/* Vertical */}
        <line x1="100" y1="0" x2="100" y2="400" className="chart-line" />
        <line x1="200" y1="0" x2="200" y2="400" className="chart-line" />
        <line x1="300" y1="0" x2="300" y2="400" className="chart-line" />

        {/* Center label */}
        <text x="200" y="195" fill="var(--gold-primary)" fontFamily="var(--font-cosmic)" fontWeight="bold" fontSize="16" textAnchor="middle">VEDIC</text>
        <text x="200" y="215" fill="var(--text-muted)" fontFamily="var(--font-cosmic)" fontSize="12" textAnchor="middle">RASI CHART (D1)</text>

        {/* Draw each Sign Box */}
        {RASI_NAMES.map((signName, signIdx) => {
          const pos = signBoxPositions[signIdx];
          
          // Find which house number this sign corresponds to (1 to 12)
          // House 1 is ascSignIdx.
          const houseNum = ((signIdx - ascSignIdx + 12) % 12) + 1;
          const isAscendant = signIdx === ascSignIdx;
          
          // Get planets in this sign
          const housePlanets = vedic_houses[houseNum] ? [...vedic_houses[houseNum].planets].map(getPlanetShort) : [];
          if (isAscendant) {
            housePlanets.unshift("Asc");
          }

          // Chunk planets for layout inside 100x100 box
          const chunkPlanets = [];
          for (let i = 0; i < housePlanets.length; i += 2) {
            chunkPlanets.push(housePlanets.slice(i, i + 2).join(" "));
          }

          return (
            <g key={signName} transform={`translate(${pos.x}, ${pos.y})`}>
              {/* Sign abbreviation inside box */}
              <text x="8" y="18" fill="var(--gold-primary)" fontSize="10" fontFamily="var(--font-sans)" fontWeight="bold">
                {signName.slice(0, 3).toUpperCase()}
              </text>
              
              {/* House number indicator (e.g. H1, H2) */}
              <text x="92" y="18" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="var(--font-sans)" textAnchor="end">
                H{houseNum}
              </text>

              {/* Diagonal slash for Ascendant box */}
              {isAscendant && (
                <line x1="2" y1="2" x2="98" y2="98" stroke="rgba(223, 183, 108, 0.25)" strokeDasharray="3,3" strokeWidth="1" />
              )}

              {/* Planets */}
              {chunkPlanets.map((pGroup, idx) => (
                <text
                  key={idx}
                  x="50"
                  y="45 + (idx * 16)"
                  className="chart-text-planet"
                  textAnchor="middle"
                  style={{ fill: '#ffffff', fontSize: '11px' }}
                  transform={`translate(0, ${idx * 16})`}
                >
                  {pGroup}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="chart-type-container">
        <button 
          className={`chart-toggle-btn ${style === 'north' ? 'active' : ''}`}
          onClick={() => {}} // Swapped by parent state
          data-style="north"
        >
          North Indian (Diamond)
        </button>
        <button 
          className={`chart-toggle-btn ${style === 'south' ? 'active' : ''}`}
          onClick={() => {}} // Swapped by parent state
          data-style="south"
        >
          South Indian (Grid)
        </button>
      </div>
      <div className="chart-visual-wrapper">
        {style === 'north' ? renderNorthIndian() : renderSouthIndian()}
      </div>
    </div>
  );
}
