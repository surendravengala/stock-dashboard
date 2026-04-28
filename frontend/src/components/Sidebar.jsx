// Sidebar.jsx
// Pure display component — receives data, calls onSelect.
// Has its own internal scroll via .sidebar-list.
// No knowledge of layout state (that lives in Layout.jsx).

import { useState } from 'react';
import '../styles/sidebar.css';

function Sidebar({ companies = [], onSelect, activeSymbol }) {
  const [search, setSearch] = useState('');

  const filtered = companies.filter(c =>
    c.symbol.toLowerCase().includes(search.toLowerCase()) ||
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    c.sector.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="sidebar">

      {/* Brand strip — aligns with header height */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">📈</span>
        <span className="sidebar-brand-text">NSE Markets</span>
      </div>

      {/* Search */}
      <div className="sidebar-search-wrap">
        <span className="sidebar-search-icon">🔍</span>
        <input
          className="sidebar-search"
          placeholder="Search symbol or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search companies"
        />
      </div>

      <div className="sidebar-section-label">
        {filtered.length} Companies
      </div>

      {/* THIS is the only scrolling element in the sidebar */}
      <div className="sidebar-list">
        {filtered.length === 0 ? (
          <div className="sidebar-empty">
            No results for "{search}"
          </div>
        ) : (
          filtered.map(c => (
            <div
              key={c.symbol}
              className={`sidebar-item ${activeSymbol === c.symbol ? 'active' : ''}`}
              onClick={() => onSelect(c.symbol, c.company_name)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onSelect(c.symbol, c.company_name)}
              aria-label={`Select ${c.company_name}`}
            >
              <div className="sidebar-item-left">
                <span className="sidebar-item-symbol">{c.symbol}</span>
                <span className="sidebar-item-name">{c.company_name}</span>
              </div>
              <span className="sidebar-item-badge">{c.sector}</span>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default Sidebar;