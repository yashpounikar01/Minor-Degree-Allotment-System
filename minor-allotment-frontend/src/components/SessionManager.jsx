import React, { useEffect, useState } from 'react';
import { getSessions, createSession, activateSession, deleteSession } from '../api';

const SessionManager = ({ onSessionChange }) => {
  const [sessions, setSessions] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const fetchSessions = async () => {
    try { const res = await getSessions(); setSessions(res.data); } catch {}
  };

  useEffect(() => { fetchSessions(); }, []);

  const flash = (type, msg) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 3500);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return flash('warning', 'Enter a session name first.');
    setLoading(true);
    try {
      await createSession(newName.trim());
      flash('success', `"${newName.trim()}" created.`);
      setNewName('');
      await fetchSessions();
    } catch (err) {
      flash('error', err.response?.data?.error || 'Could not create session.');
    } finally { setLoading(false); }
  };

  const handleActivate = async (id, name) => {
    setLoading(true);
    try {
      await activateSession(id);
      flash('success', `"${name}" is now active.`);
      await fetchSessions();
      if (onSessionChange) onSessionChange(id);
    } catch { flash('error', 'Failed to activate.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" and all its data? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await deleteSession(id);
      flash('success', `"${name}" deleted.`);
      await fetchSessions();
      if (onSessionChange) onSessionChange(null);
    } catch { flash('error', 'Failed to delete.'); }
    finally { setLoading(false); }
  };

  const active = sessions.find(s => s.is_active);

  return (
    <div className="card card-accented" style={{ height: '100%' }}>
      <div className="card-header-row">
        <div className="card-icon-sq ci-navy">🗂️</div>
        <div>
          <div className="card-title-text">Academic Sessions</div>
          <div className="card-desc-text">Each session holds independent data</div>
        </div>
      </div>

      {/* Active status */}
      {active ? (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12 }}>●</span>
          Active: <strong style={{ marginLeft: 4 }}>{active.session_name}</strong>
        </div>
      ) : (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          ⚠ No active session. Create or activate one below.
        </div>
      )}

      {/* Create */}
      <label className="field-label">New Session</label>
      <div className="input-row" style={{ marginBottom: 14 }}>
        <input
          className="inp"
          type="text"
          value={newName}
          placeholder="e.g. 2024-25"
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />
        <button className="btn btn-primary" onClick={handleCreate} disabled={loading} style={{ flexShrink: 0 }}>
          {loading ? <span className="spinner"></span> : '+ Add'}
        </button>
      </div>

      {status && (
        <div className={`alert alert-${status.type === 'success' ? 'success' : status.type === 'warning' ? 'warning' : 'error'}`}
          style={{ marginBottom: 12 }}>
          {status.msg}
        </div>
      )}

      <div className="divider"></div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <div className="empty-state-text">No sessions yet</div>
        </div>
      ) : (
        <div>
          {sessions.map(s => (
            <div key={s.id} className={`session-item ${s.is_active ? 'active' : ''}`}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span className="session-item-name">{s.session_name}</span>
                  {s.is_active && (
                    <span className="badge-active">
                      <span className="badge-dot"></span>Active
                    </span>
                  )}
                </div>
                <div className="session-item-meta">
                  {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!s.is_active && (
                  <button className="btn btn-outline btn-sm" onClick={() => handleActivate(s.id, s.session_name)} disabled={loading}>
                    Activate
                  </button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id, s.session_name)} disabled={loading}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionManager;