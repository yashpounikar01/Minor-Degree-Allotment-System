import React, { useEffect, useState } from 'react';
import { getAllotmentResult } from '../api';

const AllotmentResult = ({ activeSessionId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const fetchResults = async () => {
    if (!activeSessionId) return;
    setLoading(true);
    try {
      const res = await getAllotmentResult(activeSessionId);
      setData([...res.data].sort((a, b) => a.rank - b.rank));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchResults(); }, [activeSessionId]);

  const filtered = (filter.trim()
    ? data.filter(r =>
        r.name?.toLowerCase().includes(filter.toLowerCase()) ||
        r.erpid?.toLowerCase().includes(filter.toLowerCase()) ||
        r.allotted_branch?.toLowerCase().includes(filter.toLowerCase())
      )
    : data
  ).sort((a, b) => a.rank - b.rank);

  const allottedCount = data.filter(r => r.allotted_branch !== 'Not Allotted').length;

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="card-icon-sq ci-green">📋</div>
          <div>
            <div className="card-title-text">Allotment Results</div>
            <div className="card-desc-text">
              {data.length > 0
                ? `${allottedCount} of ${data.length} students allotted`
                : 'Run allotment to see results'}
            </div>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={fetchResults}
          disabled={loading || !activeSessionId}
        >
          {loading
            ? <span className="spinner" style={{ borderTopColor: 'var(--navy)', borderColor: 'var(--border-mid)' }}></span>
            : '↻ Refresh'}
        </button>
      </div>

      {/* No session */}
      {!activeSessionId ? (
        <div style={{
          textAlign: 'center', padding: '48px 20px',
          background: 'var(--bg-inset)', borderRadius: 10,
          border: '1px solid var(--border-soft)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📂</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
            No active session
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Create and activate a session to view results
          </div>
        </div>

      /* Loading */
      ) : loading && data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)', fontSize: 13.5 }}>
          <span className="spinner" style={{ borderTopColor: 'var(--navy)', borderColor: 'var(--border-mid)', width: 20, height: 20, borderWidth: 2.5 }}></span>
          <div style={{ marginTop: 12 }}>Loading results…</div>
        </div>

      /* No data yet */
      ) : data.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 20px',
          background: 'var(--bg-inset)', borderRadius: 10,
          border: '1px solid var(--border-soft)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>⚡</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
            No results yet
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Upload student data and run allotment to see results here
          </div>
        </div>

      /* Results */
      ) : (
        <>
          {/* Stat pills */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Students', val: data.length, color: 'var(--navy)' },
              { label: 'Allotted', val: allottedCount, color: 'var(--green)' },
              { label: 'Not Allotted', val: data.length - allottedCount, color: 'var(--red)' },
            ].map(s => (
              <div key={s.label} style={{
                padding: '10px 18px',
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-soft)',
                borderRadius: 9,
                flex: '1 1 110px',
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4,
                }}>
                  {s.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 24,
                  fontWeight: 800, color: s.color, lineHeight: 1,
                }}>
                  {s.val}
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <input
            className="inp"
            type="text"
            placeholder="Search by name, ERPID, or branch…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ marginBottom: 14 }}
          />

          {/* Table */}
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>ERPID</th>
                  <th>Name</th>
                  <th>Avg %</th>
                  <th>Allotted Branch</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ erpid, name, avg_percent, allotted_branch, rank }) => (
                  <tr key={erpid}>
                    <td className="rank-cell">{rank}</td>
                    <td className="mono">{erpid}</td>
                    <td style={{ fontWeight: 500 }}>{name}</td>
                    <td>
                      <span className="pct-val">{Number(avg_percent).toFixed(2)}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>%</span>
                    </td>
                    <td>
                      <span className={`branch-tag ${allotted_branch === 'Not Allotted' ? 'not-allotted' : ''}`}>
                        {allotted_branch}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{
                      textAlign: 'center', padding: '28px',
                      color: 'var(--text-muted)', fontSize: 13,
                    }}>
                      No records match "{filter}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AllotmentResult;