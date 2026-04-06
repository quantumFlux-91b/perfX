import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Compare from './pages/Compare';
import Login from './pages/Login';

function AppContent() {
  const location = useLocation();
  const showNav = location.pathname !== '/';

  return (
    <>
      {showNav && (
        <nav className="glass-panel" style={{ display: 'flex', padding: '1rem 2rem', alignItems: 'center', justifyContent: 'space-between', margin: '20px', borderRadius: '50px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '36px', height: '36px', background: 'var(--primary)', borderRadius: '50%', boxShadow: 'var(--shadow-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{color: 'white', fontWeight: 'bold'}}>PX</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '1px', background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PerfX</h1>
          </div>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
             <Link to="/applications" style={{ color: 'var(--text-main)', fontWeight: 600 }}>Applications</Link>
             <Link to="/upload" style={{ color: 'var(--text-main)', fontWeight: 600 }}>Upload</Link>
             <Link to="/compare" style={{ color: 'var(--text-main)', fontWeight: 600 }}>Compare</Link>
             <Link to="/" className="btn btn-glass" style={{ color: 'var(--text-muted)' }}>Logout</Link>
          </div>
        </nav>
      )}
      
      <main className="container animate-fade-in" style={{ padding: '2rem 0' }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/applications" element={<Dashboard />} />
          <Route path="/applications/:applicationName" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/compare" element={<Compare />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
