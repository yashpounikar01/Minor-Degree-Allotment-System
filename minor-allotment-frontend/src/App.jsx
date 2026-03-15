import React, { useState, useEffect } from 'react';
import CSVUpload from './components/CSVUpload';
import AllotmentResult from './components/AllotmentResult';
import SessionManager from './components/SessionManager';
import BranchManager from './components/BranchManager';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { isLoggedIn, logout } from './auth';
import ExportButton from './components/ExportButton';
import { getActiveSession } from './api';

function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [showRegister, setShowRegister] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSessionName, setActiveSessionName] = useState('');

  useEffect(() => {
    if (loggedIn) {
      getActiveSession()
        .then(res => { setActiveSessionId(res.data.id); setActiveSessionName(res.data.session_name); })
        .catch(() => { setActiveSessionId(null); setActiveSessionName(''); });
    }
  }, [loggedIn]);

  const handleSessionChange = async () => {
    try {
      const res = await getActiveSession();
      setActiveSessionName(res.data.session_name);
      setActiveSessionId(res.data.id);
    } catch {
      setActiveSessionId(null);
      setActiveSessionName('');
    }
  };

  const handleLogin = () => { setLoggedIn(true); setShowRegister(false); };
  const handleLogout = () => {
    logout(); setLoggedIn(false); setShowRegister(false);
    setActiveSessionId(null); setActiveSessionName('');
  };

  /* ── Auth Screen ── */
  if (!loggedIn) {
    return (
      <div className="auth-page">
        <div className="auth-card animate-in">
          <div className="auth-seal">🎓</div>
          <div className="auth-inst">Academic Administration</div>
          {!showRegister ? (
            <>
              <h2 className="auth-title">Admin Portal</h2>
              <p className="auth-subtitle">Sign in to manage allotments</p>
              <Login onLogin={handleLogin} />
              <div className="auth-switch">
                <p>New administrator?</p>
                <button className="btn btn-ghost btn-full" onClick={() => setShowRegister(true)}>
                  Register Account
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="auth-title">Register</h2>
              <p className="auth-subtitle">Create an administrator account</p>
              <Register />
              <div className="auth-switch">
                <p>Already registered?</p>
                <button className="btn btn-ghost btn-full" onClick={() => setShowRegister(false)}>
                  ← Back to Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ── Dashboard ── */
  return (
    <>
      <nav className="topbar">
        <div className="topbar-brand">
          <div className="topbar-emblem">🎓</div>
          <div>
            <div className="topbar-name">Minor Degree Allotment System</div>
            <div className="topbar-dept">Administrative Dashboard</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="session-pill">
            <span className={`session-pill-dot ${activeSessionName ? '' : 'off'}`}></span>
            {activeSessionName || 'No Active Session'}
          </div>
          <button className="btn-signout" onClick={handleLogout}>Sign Out</button>
        </div>
      </nav>

      <div className="app-shell">
        {/* Page Header */}
        <div className="page-header animate-in">
          <div className="page-header-left">
            <div className="page-header-eyebrow">Academic Allotment System</div>
            <h1>Minor Degree <em>Allotment</em></h1>
          </div>
          <div className="page-header-meta">
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Academic Administration Portal</span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="dashboard-grid">
          {/* LEFT — Sessions */}
          <div className="animate-in anim-d1">
            <SessionManager onSessionChange={handleSessionChange} />
          </div>

          {/* RIGHT — Work Area */}
          <div className="dashboard-right">
            <div className="animate-in anim-d2">
              <CSVUpload activeSessionId={activeSessionId} />
            </div>
            <div className="animate-in anim-d2">
              <BranchManager activeSessionId={activeSessionId} />
            </div>
            <div className="animate-in anim-d3">
              <ExportButton activeSessionId={activeSessionId} />
            </div>
            <div className="animate-in anim-d3">
              <AllotmentResult activeSessionId={activeSessionId} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;