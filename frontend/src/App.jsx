import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import VedicChart from './components/VedicChart';
import DashaTimeline from './components/DashaTimeline';

// Planets in traditional Vedic order
const PLANET_ORDER = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

export default function App() {
  // Input fields state
  const [name, setName] = useState('');
  const [dob, setDob] = useState('1995-10-15');
  const [tob, setTob] = useState('10:30:00');
  const [placeQuery, setPlaceQuery] = useState('Mumbai, India');
  const [latitude, setLatitude] = useState(19.0760);
  const [longitude, setLongitude] = useState(72.8777);
  const [timezoneName, setTimezoneName] = useState('Asia/Kolkata');
  
  // Geolocation autocomplete states
  const [predictions, setPredictions] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Custom API configuration
  const [backendUrl, setBackendUrl] = useState(() => {
    return localStorage.getItem('astro_backend_url') || 'http://localhost:8000';
  });
  const [showSettings, setShowSettings] = useState(false);

  // App calculations state
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // UI Tabs & chart styles
  const [activeTab, setActiveTab] = useState('vedic');
  const [chartStyle, setChartStyle] = useState('north'); // 'north' or 'south'

  const dropdownRef = useRef(null);

  // Save custom backend url to localStorage
  useEffect(() => {
    localStorage.setItem('astro_backend_url', backendUrl);
  }, [backendUrl]);

  // Click outside listener for geocode dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch geocoding predictions
  const handlePlaceChange = async (e) => {
    const value = e.target.value;
    setPlaceQuery(value);
    
    if (value.length < 3) {
      setPredictions([]);
      return;
    }

    setIsGeocoding(true);
    try {
      const res = await fetch(`${backendUrl}/api/geocode?q=${encodeURIComponent(value)}`);
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.results || []);
        setShowDropdown(true);
      }
    } catch (err) {
      console.error("Geocoding fetch error:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const selectPrediction = (item) => {
    setPlaceQuery(item.display_name);
    setLatitude(item.latitude);
    setLongitude(item.longitude);
    setTimezoneName(item.timezone_name);
    setPredictions([]);
    setShowDropdown(false);
  };

  // Trigger astrological calculations
  const generateKundali = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${backendUrl}/api/chart-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date_of_birth: dob,
          time_of_birth: tob,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          timezone_name: timezoneName
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to fetch Kundali data');
      }

      const data = await response.json();
      setChartData(data.result);
    } catch (err) {
      setError(err.message || 'An error occurred during calculations. Check if your backend is running.');
      console.error("Calculation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Perform initial calculation for Mumbai on mount
  useEffect(() => {
    // Wait a brief moment to let backend start up, or if user wants to change url first
    generateKundali();
  }, []);

  return (
    <div className="app-container">
      {/* Header */}
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1>Astro Kundali</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontFamily: 'var(--font-cosmic)', letterSpacing: '1px' }}>
          Vedic Rasi Chart & KP Astro System with SSSL Analysis
        </p>
      </header>

      {/* Backend Settings toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button 
          className="chart-toggle-btn" 
          onClick={() => setShowSettings(!showSettings)}
          style={{ fontSize: '0.8rem', opacity: 0.7 }}
        >
          ⚙️ Backend Config: {showSettings ? "Hide" : "Edit"}
        </button>
      </div>

      {showSettings && (
        <div className="cosmic-card" style={{ marginBottom: '2.5rem', borderStyle: 'dashed' }}>
          <h4 style={{ color: 'var(--gold-primary)', marginBottom: '1rem' }}>Backend Connection Settings</h4>
          <div className="input-group">
            <label>FastAPI / Render Backend Server URL</label>
            <input 
              type="text" 
              className="input-control" 
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)} 
              placeholder="e.g. http://localhost:8000"
            />
            <small style={{ color: 'var(--text-muted)', marginTop: '5px' }}>
              Set to your deployed Render URL (e.g. <code>https://my-astrology-api.onrender.com</code>) when running online.
            </small>
          </div>
        </div>
      )}

      {/* Birth Input Form */}
      <div className="cosmic-card">
        <form onSubmit={generateKundali}>
          <div className="input-grid">
            <div className="input-group">
              <label>Name</label>
              <input 
                type="text" 
                className="input-control" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter Name"
              />
            </div>
            <div className="input-group">
              <label>Date of Birth</label>
              <input 
                type="date" 
                className="input-control" 
                value={dob} 
                onChange={(e) => setDob(e.target.value)} 
                required
              />
            </div>
            <div className="input-group">
              <label>Time of Birth</label>
              <input 
                type="text" 
                className="input-control" 
                value={tob} 
                onChange={(e) => setTob(e.target.value)} 
                placeholder="HH:MM:SS"
                required
              />
            </div>
            <div className="input-group" ref={dropdownRef}>
              <label>Place of Birth</label>
              <div className="autocomplete-container">
                <input 
                  type="text" 
                  className="input-control" 
                  value={placeQuery} 
                  onChange={handlePlaceChange} 
                  onFocus={() => placeQuery.length >= 3 && setShowDropdown(true)}
                  placeholder="City, Country"
                  required
                />
                {isGeocoding && (
                  <span style={{ position: 'absolute', right: '10px', top: '12px', fontSize: '0.8rem', color: 'var(--gold-primary)' }}>
                    Searching...
                  </span>
                )}
                {showDropdown && predictions.length > 0 && (
                  <ul className="autocomplete-dropdown">
                    {predictions.map((item, idx) => (
                      <li 
                        key={idx} 
                        className="autocomplete-item"
                        onClick={() => selectPrediction(item)}
                      >
                        {item.display_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Collapsible Lat/Lon Metadata Panel */}
          <div className="meta-grid">
            <div className="meta-item">
              <span className="meta-label">Latitude</span>
              <span className="meta-value">{latitude ? latitude.toFixed(4) : 'N/A'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Longitude</span>
              <span className="meta-value">{longitude ? longitude.toFixed(4) : 'N/A'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Timezone</span>
              <span className="meta-value">{timezoneName}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Ayanamsa (Lahiri)</span>
              <span className="meta-value">{chartData ? chartData.ayanamsa_formatted : 'Pending Calculation'}</span>
            </div>
          </div>

          <button type="submit" className="btn-gold" disabled={isLoading}>
            {isLoading ? "Generating Chart..." : "Calculate Vedic & KP Kundali"}
          </button>
        </form>
      </div>

      {error && (
        <div className="cosmic-card" style={{ borderColor: '#a52a2a', color: '#ff8888', textAlign: 'center' }}>
          <p>{error}</p>
        </div>
      )}

      {/* Loading Screen */}
      {isLoading && (
        <div className="spinner-container">
          <div className="cosmic-loader"></div>
          <div className="loader-text">Consulting the Stars...</div>
        </div>
      )}

      {/* Results Section */}
      {!isLoading && chartData && (
        <div>
          {/* Main Dashboard Tabs */}
          <nav className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'vedic' ? 'active' : ''}`}
              onClick={() => setActiveTab('vedic')}
            >
              Vedic Kundali
            </button>
            <button 
              className={`tab-btn ${activeTab === 'kp_cusps' ? 'active' : ''}`}
              onClick={() => setActiveTab('kp_cusps')}
            >
              KP House Cusps
            </button>
            <button 
              className={`tab-btn ${activeTab === 'kp_planets' ? 'active' : ''}`}
              onClick={() => setActiveTab('kp_planets')}
            >
              KP Planets (SSSL)
            </button>
            <button 
              className={`tab-btn ${activeTab === 'dashas' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashas')}
            >
              Vimshottari Dasha
            </button>
          </nav>

          {/* TAB 1: VEDIC KUNDALI */}
          {activeTab === 'vedic' && (
            <div className="dashboard-grid">
              {/* Left Column: Visual Chart wrapper */}
              <div className="cosmic-card">
                <h3 style={{ color: 'var(--gold-primary)', textAlign: 'center', marginBottom: '1.5rem' }}>
                  {name ? `${name}'s ` : ''}Birth Rasi Chart
                </h3>
                
                {/* SVG Visual Chart */}
                <VedicChart 
                  chartData={chartData} 
                  style={chartStyle} 
                />
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1.5rem' }}>
                  <button 
                    className={`chart-toggle-btn ${chartStyle === 'north' ? 'active' : ''}`}
                    onClick={() => setChartStyle('north')}
                  >
                    North Indian
                  </button>
                  <button 
                    className={`chart-toggle-btn ${chartStyle === 'south' ? 'active' : ''}`}
                    onClick={() => setChartStyle('south')}
                  >
                    South Indian
                  </button>
                </div>
              </div>

              {/* Right Column: Planetary Positions Table */}
              <div className="cosmic-card">
                <h3 style={{ color: 'var(--gold-primary)', marginBottom: '1rem' }}>Planetary Degrees & Nakshatras</h3>
                <div className="table-responsive">
                  <table className="astro-table">
                    <thead>
                      <tr>
                        <th>Planet</th>
                        <th>Longitude</th>
                        <th>Sign (Rasi)</th>
                        <th>Nakshatra</th>
                        <th>Pada</th>
                        <th>Star Lord</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Render Ascendant first */}
                      <tr>
                        <td className="text-gold">Ascendant</td>
                        <td>{chartData.ascendant.formatted}</td>
                        <td>{chartData.ascendant.sign}</td>
                        <td>{chartData.ascendant.nakshatra}</td>
                        <td>{chartData.ascendant.pada}</td>
                        <td>{chartData.ascendant.star_lord}</td>
                      </tr>
                      {/* Then render other planets in order */}
                      {PLANET_ORDER.map((pName) => {
                        const pData = chartData.planets[pName];
                        if (!pData) return null;
                        return (
                          <tr key={pName}>
                            <td className="text-gold" style={{ display: 'flex', alignItems: 'center' }}>
                              {pName}
                              {pData.retrograde === "R" && <span className="badge-retro">R</span>}
                            </td>
                            <td>{pData.formatted}</td>
                            <td>{pData.sign}</td>
                            <td>{pData.nakshatra}</td>
                            <td>{pData.pada}</td>
                            <td>{pData.star_lord}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KP CUSPS */}
          {activeTab === 'kp_cusps' && (
            <div className="cosmic-card">
              <h3 style={{ color: 'var(--gold-primary)', marginBottom: '1rem' }}>KP Cuspal House Positions (Placidus)</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                House Cusps representing the exact boundary coordinate positions of the 12 Placidus houses, correct under Lahiri Ayanamsa.
              </p>
              <div className="table-responsive">
                <table className="astro-table">
                  <thead>
                    <tr>
                      <th>Cusp</th>
                      <th>Longitude</th>
                      <th>Sign</th>
                      <th>Sign Lord (R)</th>
                      <th>Star Lord (S)</th>
                      <th>Sub Lord (Sub)</th>
                      <th>Sub-Sub Lord (SSL)</th>
                      <th>Sub-Sub-Sub Lord (SSSL)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.cusps.map((cusp) => (
                      <tr key={cusp.cusp_number}>
                        <td className="text-glowing">House {cusp.cusp_number}</td>
                        <td>{cusp.formatted}</td>
                        <td>{cusp.sign}</td>
                        <td>{cusp.sign_lord}</td>
                        <td>{cusp.star_lord}</td>
                        <td className="text-gold">{cusp.sub_lord}</td>
                        <td>{cusp.sub_sub_lord}</td>
                        <td>{cusp.sub_sub_sub_lord}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: KP PLANETS */}
          {activeTab === 'kp_planets' && (
            <div className="cosmic-card">
              <h3 style={{ color: 'var(--gold-primary)', marginBottom: '1rem' }}>KP Planet SSSL Lords</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Planetary SSSL divisions detailing Sign, Star, Sub, Sub-Sub, and Sub-Sub-Sub lords calculated via Vimshottari proportional geometry.
              </p>
              <div className="table-responsive">
                <table className="astro-table">
                  <thead>
                    <tr>
                      <th>Planet</th>
                      <th>Longitude</th>
                      <th>Sign</th>
                      <th>Sign Lord (R)</th>
                      <th>Star Lord (S)</th>
                      <th>Sub Lord (Sub)</th>
                      <th>Sub-Sub Lord (SSL)</th>
                      <th>Sub-Sub-Sub Lord (SSSL)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render Ascendant first */}
                    <tr>
                      <td className="text-glowing">Ascendant</td>
                      <td>{chartData.ascendant.formatted}</td>
                      <td>{chartData.ascendant.sign}</td>
                      <td>{chartData.ascendant.sign_lord}</td>
                      <td>{chartData.ascendant.star_lord}</td>
                      <td className="text-gold">{chartData.ascendant.sub_lord}</td>
                      <td>{chartData.ascendant.sub_sub_lord}</td>
                      <td>{chartData.ascendant.sub_sub_sub_lord}</td>
                    </tr>
                    {/* Render Planets in order */}
                    {PLANET_ORDER.map((pName) => {
                      const pData = chartData.planets[pName];
                      if (!pData) return null;
                      return (
                        <tr key={pName}>
                          <td className="text-glowing" style={{ display: 'flex', alignItems: 'center' }}>
                            {pName}
                            {pData.retrograde === "R" && <span className="badge-retro">R</span>}
                          </td>
                          <td>{pData.formatted}</td>
                          <td>{pData.sign}</td>
                          <td>{pData.sign_lord}</td>
                          <td>{pData.star_lord}</td>
                          <td className="text-gold">{pData.sub_lord}</td>
                          <td>{pData.sub_sub_lord}</td>
                          <td>{pData.sub_sub_sub_lord}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: VIMSHOTTARI DASHA */}
          {activeTab === 'dashas' && (
            <div className="cosmic-card">
              <DashaTimeline dashaList={chartData.dasha} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
