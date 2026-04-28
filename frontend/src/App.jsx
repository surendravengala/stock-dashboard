// App.jsx
// The root of our React app.
// It holds ALL shared state and passes it down to child components.
//
// State management pattern:
// App owns: companies, selectedSymbol, stockData, summary, prediction, gainersLosers
// App passes: data as props, handler functions as props
// Children: only receive and display, never fetch directly
//
// This is called "lifting state up" — a core React pattern.

import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import StockChart from './components/StockChart';
import MetricCards from './components/MetricCards';
import GainersLosers from './components/GainersLosers';
import CompareChart from './components/CompareChart';
import Layout from './components/Layout';
import {
  getCompanies,
  getStockData,
  getSummary,
  getGainersLosers,
  getPrediction,
} from './api/stockApi';
import './App.css';
import '../src/styles/layout.css'; 



const errorBannerStyle = {
  background: '#3a1a1a',
  border: '1px solid #7a2020',
  color: '#f87171',
  padding: '10px 16px',
  borderRadius: '8px',
  marginBottom: '20px',
  fontSize: '0.875rem',
};

const stockHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
  flexWrap: 'wrap',
  gap: '10px',
};

const stockTitleStyle = {
  color: '#fff',
  fontSize: '1.15rem',
  fontWeight: '600',
  margin: 0,
};

const emptyStateStyle = {
  color: '#454d66',
  textAlign: 'center',
  padding: '80px 20px',
  fontSize: '0.95rem',
  borderRadius: '12px',
  border: '1px dashed #1e2233',
};



function App() {
  // ── State ──────────────────────────────────────────────────────
  const [companies,     setCompanies]     = useState([]);
  const [activeSymbol,  setActiveSymbol]  = useState(null);
  const [activeCompany, setActiveCompany] = useState('');
  const [stockData,     setStockData]     = useState([]);
  const [summary,       setSummary]       = useState(null);
  const [prediction,    setPrediction]    = useState([]);
  const [gainersLosers, setGainersLosers] = useState(null);
  const [activeDays,    setActiveDays]    = useState(30);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);

  // ── On mount: load companies and gainers/losers ────────────────
  // useEffect with [] runs ONCE when the component first renders.
  // Like componentDidMount in class components.
  useEffect(() => {
    getCompanies()
      .then(res => setCompanies(res.data))
      .catch(() => setError('Could not load companies. Is Django running?'));

    getGainersLosers()
      .then(res => setGainersLosers(res.data))
      .catch(console.error);
  }, []);

  // ── When a company is selected ─────────────────────────────────
  const handleSelectCompany = (symbol, companyName) => {
    setActiveSymbol(symbol);
    setActiveCompany(companyName);
    setActiveDays(30);
    loadStockDetails(symbol, 30);
  };

  // ── When time range button is clicked ─────────────────────────
  const handleDaysChange = (days) => {
    setActiveDays(days);
    if (activeSymbol) loadStockDetails(activeSymbol, days);
  };

  // ── Core data loader ───────────────────────────────────────────
  const loadStockDetails = async (symbol, days) => {
    setLoading(true);
    setError(null);

    try {
      // Run all three API calls in parallel using Promise.all
      // This is faster than running them one after another
      const [dataRes, summaryRes, predRes] = await Promise.all([
        getStockData(symbol, days),
        getSummary(symbol),
        getPrediction(symbol, 7),
      ]);

      setStockData(dataRes.data);
      setSummary(summaryRes.data);
      setPrediction(predRes.data.predictions || []);
    } catch (err) {
      setError('Failed to load stock data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
return (
  <Layout
    sidebar={
      <Sidebar
        companies={companies}
        onSelect={handleSelectCompany}
        activeSymbol={activeSymbol}
      />
    }
    header={
      <>
        <span className="header-title">
          <span className="header-accent">Stock</span> Intelligence
        </span>
        <span className="header-sub">NSE India · Real Data</span>
      </>
    }
  >


 {/* Stock detail */}
    {activeSymbol && (
      <div>
        <div style={stockHeaderStyle}>
          <h2 style={stockTitleStyle}>
            {activeSymbol} — {activeCompany}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[30, 90, 365].map(d => (
              <button
                key={d}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: activeDays === d ? 'var(--accent, #6c74e8)' : '#1e2233',
                  background: activeDays === d ? 'var(--accent, #6c74e8)' : '#13161f',
                  color: activeDays === d ? '#fff' : '#8890a8',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
                onClick={() => handleDaysChange(d)}
              >
                {d === 365 ? '1Y' : `${d}D`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#6c74e8', textAlign: 'center', padding: '60px' }}>
            Loading...
          </div>
        ) : (
          <>
            <MetricCards summary={summary} />
            <StockChart data={stockData} prediction={prediction} />
          </>
        )}
      </div>
    )}

    {/* Empty state */}
    {!activeSymbol && !error && (
      <div style={emptyStateStyle}>
        ← Select a company from the sidebar to view its chart
      </div>
    )}



    {/* Error banner */}
    {error && (
      <div style={errorBannerStyle}>{error}</div>
    )}



 {/* Compare section */}
    <CompareChart />
<br />
    {/* Gainers / Losers */}
    <GainersLosers data={gainersLosers} />

   

   

  </Layout>
);

}

const styles = {
  app: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0f1117',
    color: '#e0e0e0',
    fontFamily: "'Segoe UI', sans-serif",
  },
  main: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
  },
  header: {
    marginBottom: '24px',
    borderBottom: '1px solid #2a2f4a',
    paddingBottom: '16px',
    display: 'flex',
    alignItems: 'baseline',
    gap: '16px',
  },
  headerTitle: {
    color: '#7c83fd',
    fontSize: '1.5rem',
    fontWeight: '600',
    margin: 0,
  },
  headerSub: {
    color: '#666',
    fontSize: '0.85rem',
  },
  errorBanner: {
    background: '#3a1a1a',
    border: '1px solid #7a2020',
    color: '#f87171',
    padding: '10px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '0.875rem',
  },
  stockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  stockTitle: {
    color: '#fff',
    fontSize: '1.15rem',
    fontWeight: '600',
    margin: 0,
  },
  filterRow: {
    display: 'flex',
    gap: '8px',
  },
  // ADD these two (no more shorthand mixing):
  filterBtn: {
    padding: '6px 16px',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#2a2f4a',
    background: '#1c2030',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '0.8rem',
  },
  filterBtnActive: {
    background: '#7c83fd',
    color: '#fff',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#7c83fd',
  },
  loading: {
    color: '#7c83fd',
    textAlign: 'center',
    padding: '40px',
    fontSize: '1rem',
  },
  emptyState: {
    color: '#555',
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '1rem',
    borderRadius: '12px',
    border: '1px dashed #2a2f4a',
  },


  
};

export default App;