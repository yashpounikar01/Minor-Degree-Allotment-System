import React, { useEffect, useState } from 'react';
import { getBranches, saveBranches, deleteBranch } from '../api';

const BranchManager = ({ activeSessionId }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  // new branch form
  const [newName, setNewName] = useState('');
  const [newSeats, setNewSeats] = useState('72');
  // track which rows have unsaved edits: { id: newSeatValue }
  const [edits, setEdits] = useState({});

  const flash = (type, msg) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 4000);
  };

  const fetchBranches = async () => {
    if (!activeSessionId) return;
    setLoading(true);
    try {
      const res = await getBranches(activeSessionId);
      setBranches(res.data);
      setEdits({});
    } catch { flash('error', 'Failed to load branches.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBranches(); }, [activeSessionId]);

  // Handle inline seat edit
  const handleSeatEdit = (id, val) => {
    setEdits(prev => ({ ...prev, [id]: val }));
  };

  // Save all edited rows at once
  const handleSaveEdits = async () => {
    const editedIds = Object.keys(edits);
    if (editedIds.length === 0) return flash('warning', 'No changes to save.');

    // Validate
    for (const id of editedIds) {
      const val = parseInt(edits[id]);
      if (isNaN(val) || val < 0) return flash('error', 'Seat count must be a positive number.');
    }

    setSaving(true);
    try {
      const updated = branches.map(b => ({
        branch_name: b.branch_name,
        total_seats: edits[b.id] !== undefined ? parseInt(edits[b.id]) : b.total_seats,
      }));
      await saveBranches(activeSessionId, updated);
      flash('success', 'Seat counts updated successfully.');
      await fetchBranches();
    } catch { flash('error', 'Failed to save changes.'); }
    finally { setSaving(false); }
  };

  // Add new branch
  const handleAdd = async () => {
    if (!newName.trim()) return flash('error', 'Enter a branch name.');
    const seats = parseInt(newSeats);
    if (isNaN(seats) || seats < 1) return flash('error', 'Enter a valid seat count.');
    if (branches.find(b => b.branch_name.toLowerCase() === newName.trim().toLowerCase())) {
      return flash('error', `Branch "${newName.trim()}" already exists.`);
    }
    setSaving(true);
    try {
      const all = [
        ...branches.map(b => ({ branch_name: b.branch_name, total_seats: b.total_seats })),
        { branch_name: newName.trim(), total_seats: seats },
      ];
      await saveBranches(activeSessionId, all);
      flash('success', `Branch "${newName.trim()}" added.`);
      setNewName('');
      setNewSeats('72');
      await fetchBranches();
    } catch { flash('error', 'Failed to add branch.'); }
    finally { setSaving(false); }
  };

  // Delete a branch
  const handleDelete = async (branch_name) => {
    if (!window.confirm(`Delete branch "${branch_name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await deleteBranch(activeSessionId, branch_name);
      flash('success', `"${branch_name}" deleted.`);
      await fetchBranches();
    } catch { flash('error', 'Failed to delete branch.'); }
    finally { setSaving(false); }
  };

  const hasEdits = Object.keys(edits).length > 0;
  const totalSeats = branches.reduce((sum, b) => {
    const id = b.id;
    return sum + (edits[id] !== undefined ? parseInt(edits[id]) || 0 : b.total_seats);
  }, 0);
  const totalAllotted = branches.reduce((sum, b) => sum + (b.allotted_seats || 0), 0);

  return (
    <div className="card">
      <div className="card-header-row">
        <div className="card-icon-sq ci-amber">🏛️</div>
        <div>
          <div className="card-title-text">Branch & Seat Management</div>
          <div className="card-desc-text">
            Configure available branches and seat capacity for this session
          </div>
        </div>
      </div>

      {!activeSessionId ? (
        <div style={{
          textAlign: 'center', padding: '36px 20px',
          background: 'var(--bg-inset)', borderRadius: 10,
          border: '1px solid var(--border-soft)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>🏛️</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
            No active session
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
            Activate a session to manage branches
          </div>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: 13.5 }}>
          <span className="spinner" style={{ borderTopColor: 'var(--navy)', borderColor: 'var(--border-mid)', width: 18, height: 18, borderWidth: 2.5 }}></span>
          <div style={{ marginTop: 10 }}>Loading branches…</div>
        </div>
      ) : (
        <>
          {/* Summary pills */}
          {branches.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Branches', val: branches.length },
                { label: 'Total Seats', val: totalSeats },
                { label: 'Allotted', val: totalAllotted },
                { label: 'Available', val: totalSeats - totalAllotted },
              ].map(s => (
                <div key={s.label} style={{
                  flex: '1 1 80px',
                  padding: '8px 14px',
                  background: 'var(--bg-inset)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--navy)', lineHeight: 1 }}>
                    {s.val}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Branch rows */}
          {branches.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 20px', marginBottom: 16,
              background: 'var(--bg-inset)', borderRadius: 10,
              border: '1px dashed var(--border-mid)',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>📂</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                No branches yet — upload a CSV to auto-seed, or add manually below
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 110px 110px 36px',
                gap: 8, padding: '7px 12px', marginBottom: 4,
              }}>
                {['Branch Name', 'Total Seats', 'Allotted', ''].map(h => (
                  <div key={h} style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {branches.map(b => {
                const editVal = edits[b.id];
                const isEdited = editVal !== undefined;
                const seats = isEdited ? editVal : String(b.total_seats);
                const pct = b.total_seats > 0 ? Math.round((b.allotted_seats / b.total_seats) * 100) : 0;

                return (
                  <div key={b.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 110px 110px 36px',
                    gap: 8, padding: '9px 12px',
                    background: isEdited ? 'rgba(26,46,74,0.04)' : 'var(--bg-inset)',
                    border: `1px solid ${isEdited ? 'rgba(26,46,74,0.2)' : 'var(--border-soft)'}`,
                    borderRadius: 9, marginBottom: 6, alignItems: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {/* Name */}
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)' }}>
                        {b.branch_name}
                      </div>
                      {b.allotted_seats > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <div style={{
                            height: 3, borderRadius: 99, background: 'var(--border-soft)',
                            overflow: 'hidden', width: '80%',
                          }}>
                            <div style={{
                              height: '100%', borderRadius: 99,
                              width: `${pct}%`,
                              background: pct > 85 ? 'var(--red)' : pct > 60 ? 'var(--amber)' : 'var(--green)',
                              transition: 'width 0.4s var(--ease)',
                            }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Editable seats */}
                    <input
                      type="number"
                      min="0"
                      value={seats}
                      onChange={e => handleSeatEdit(b.id, e.target.value)}
                      style={{
                        width: '100%', padding: '6px 10px',
                        border: `1px solid ${isEdited ? 'var(--navy-light)' : 'var(--border-mid)'}`,
                        borderRadius: 7, fontSize: 13.5, fontFamily: 'var(--font-mono)',
                        fontWeight: 600, color: 'var(--navy)',
                        background: isEdited ? '#fff' : 'var(--bg-surface)',
                        outline: 'none',
                        boxShadow: isEdited ? '0 0 0 3px rgba(26,46,74,0.08)' : 'none',
                      }}
                    />

                    {/* Allotted (read-only) */}
                    <div style={{
                      textAlign: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: 13.5,
                      fontWeight: 600, color: b.allotted_seats > 0 ? 'var(--green)' : 'var(--text-muted)',
                    }}>
                      {b.allotted_seats}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2, fontWeight: 400 }}>
                        /{b.total_seats}
                      </span>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(b.branch_name)}
                      disabled={saving}
                      title={`Delete ${b.branch_name}`}
                      style={{
                        width: 28, height: 28, border: '1px solid var(--border-soft)',
                        borderRadius: 6, background: 'transparent', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: 13, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-pale)'; e.currentTarget.style.borderColor = 'var(--red-border)'; e.currentTarget.style.color = 'var(--red)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-soft)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}

              {/* Save edits button */}
              {hasEdits && (
                <button
                  className="btn btn-primary btn-full"
                  onClick={handleSaveEdits}
                  disabled={saving}
                  style={{ marginTop: 4 }}
                >
                  {saving ? <><span className="spinner"></span> Saving…</> : `Save Changes (${Object.keys(edits).length} edited)`}
                </button>
              )}
            </div>
          )}

          <div className="divider" style={{ margin: '16px 0' }}></div>

          {/* Add new branch */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
            Add New Branch
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px auto', gap: 8, alignItems: 'flex-end' }}>
            <div>
              <label className="field-label">Branch Name</label>
              <input
                className="inp"
                type="text"
                placeholder="e.g. CSE"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div>
              <label className="field-label">Seats</label>
              <input
                className="inp"
                type="number"
                min="1"
                placeholder="72"
                value={newSeats}
                onChange={e => setNewSeats(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={saving}
              style={{ alignSelf: 'flex-end' }}
            >
              {saving ? <span className="spinner"></span> : '+ Add'}
            </button>
          </div>

          {status && (
            <div className={`alert alert-${status.type === 'success' ? 'success' : status.type === 'warning' ? 'warning' : 'error'}`}
              style={{ marginTop: 14 }}>
              {status.msg}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BranchManager;