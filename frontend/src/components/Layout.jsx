// Layout.jsx
// Owns ALL layout state: is sidebar open or closed?
// Renders: sidebar wrapper + backdrop + main wrapper
// Children (the dashboard content) go into main-content.
//
// WHY a separate Layout component?
// App.jsx has business logic (which stock is selected, what data to show).
// Layout.jsx has UI logic (is sidebar open, screen size, transitions).
// Keeping them separate = easier to change either one independently.

import { useState, useEffect, useCallback } from 'react';
import '../styles/layout.css';

function Layout({ sidebar, header, children }) {
  // Track if sidebar is open
  // Default: open on desktop (>768px), closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile]       = useState(window.innerWidth <= 768);

  // Listen for window resize to detect mobile/desktop switches
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // Auto-open on desktop, auto-close on mobile when resizing
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Close sidebar when backdrop is clicked (mobile)
  const handleBackdropClick = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // On desktop: collapsed means width→0 (pushes main)
  // On mobile:  open means position:fixed overlay
  const sidebarClass = [
    'sidebar-wrapper',
    isMobile
      ? (sidebarOpen ? 'open' : '')
      : (sidebarOpen ? '' : 'collapsed')
  ].filter(Boolean).join(' ');


 // main-wrapper needs full-width class when sidebar is collapsed on desktop
  const mainClass = [
    'main-wrapper',
    (!isMobile && !sidebarOpen) ? 'full-width' : ''
  ].filter(Boolean).join(' ');


  return (
    <div className="app-shell">

      {/* ── Mobile Backdrop ── */}
      {/* Clicking this closes the sidebar on mobile */}
      <div
        className={`backdrop ${isMobile && sidebarOpen ? 'visible' : ''}`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* ── Sidebar ── */}
      <div className={sidebarClass}>
        {sidebar}
      </div>

      {/* ── Main Area ── */}
      <div className={mainClass}>

        {/* Fixed header strip */}
        <header className="main-header">

          {/* Hamburger / toggle button */}
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {/* Animated hamburger → X */}
            <div className={`hamburger ${sidebarOpen ? 'is-open' : ''}`}>
              <span />
              <span />
              <span />
            </div>
          </button>

          {/* Header content passed from App */}
          {header}

        </header>

        {/* Scrollable content — ONLY this scrolls */}
        <main className="main-content">
          {children}
        </main>

      </div>
    </div>
  );
}

export default Layout;