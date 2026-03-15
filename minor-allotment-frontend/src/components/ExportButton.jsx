import React, { useState } from 'react';
import { downloadMeritListCSV, downloadRankListCSV, downloadAllotmentDOCX } from '../api';

const ExportButton = ({ activeSessionId }) => {
  const [loadingDocx, setLoadingDocx] = useState(false);
  const [status, setStatus] = useState(null);

  const flash = (type, msg) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 4000);
  };

  const handleDocx = async () => {
    setLoadingDocx(true);
    try {
      await downloadAllotmentDOCX(activeSessionId);
      flash('success', 'Allotment document downloaded.');
    } catch (err) {
      flash('error', err.message);
    } finally { setLoadingDocx(false); }
  };

  const handleMeritCSV = () => {
    try { downloadMeritListCSV(activeSessionId); flash('success', 'Merit list download started.'); }
    catch (err) { flash('error', err.message); }
  };

  const handleRankCSV = () => {
    try { downloadRankListCSV(activeSessionId); flash('success', 'Rank list download started.'); }
    catch (err) { flash('error', err.message); }
  };

  return (
    <div className="card">
      <div className="card-header-row">
        <div className="card-icon-sq ci-amber">📥</div>
        <div>
          <div className="card-title-text">Export Lists</div>
          <div className="card-desc-text">Download merit list, rank list, or the official allotment document</div>
        </div>
      </div>

      <div className="download-grid">
        <button className="dl-card navy-accent" onClick={handleMeritCSV} disabled={!activeSessionId}>
          <div className="dl-card-icon">📊</div>
          <div className="dl-card-label">Merit List</div>
          <div className="dl-card-sub">CSV · By percentage</div>
        </button>

        <button className="dl-card teal-accent" onClick={handleRankCSV} disabled={!activeSessionId}>
          <div className="dl-card-icon">🏆</div>
          <div className="dl-card-label">Rank List</div>
          <div className="dl-card-sub">CSV · By branch</div>
        </button>

        <button className="dl-card amber-accent" onClick={handleDocx} disabled={loadingDocx || !activeSessionId}>
          <div className="dl-card-icon">{loadingDocx ? '⏳' : '📄'}</div>
          <div className="dl-card-label">{loadingDocx ? 'Generating…' : 'Allotment Doc'}</div>
          <div className="dl-card-sub">DOCX · Official format</div>
        </button>
      </div>

      {status && (
        <div className={`alert alert-${status.type === 'success' ? 'success' : 'error'}`} style={{ marginTop: 14 }}>
          {status.msg}
        </div>
      )}
    </div>
  );
};

export default ExportButton;