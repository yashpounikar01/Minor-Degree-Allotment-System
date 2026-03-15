import React, { useState, useRef } from 'react';
import { uploadCSV, runAllotment } from '../api';

const CSVUpload = ({ activeSessionId }) => {
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState(null);
  const [allotMsg, setAllotMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [allotting, setAllotting] = useState(false);
  const fileInputRef = useRef(null);

  const flash = (setter, type, msg) => {
    setter({ type, msg });
    setTimeout(() => setter(null), 5000);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) { setFile(selected); setUploadMsg(null); }
  };

  const handleUpload = async () => {
    if (!file) return flash(setUploadMsg, 'warning', 'Select a CSV file first.');
    if (!activeSessionId) return flash(setUploadMsg, 'warning', 'Activate a session first.');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', activeSessionId);
    setUploading(true);
    try {
      const res = await uploadCSV(formData);
      flash(setUploadMsg, 'success', `${res.data.inserted} students uploaded. ${res.data.branches_seeded} branches auto-seeded.`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      flash(setUploadMsg, 'error', err.response?.data?.message || 'Upload failed.');
    } finally { setUploading(false); }
  };

  const handleAllotment = async () => {
    if (!activeSessionId) return flash(setAllotMsg, 'warning', 'Activate a session first.');
    setAllotting(true);
    try {
      await runAllotment(activeSessionId);
      flash(setAllotMsg, 'success', 'Allotment completed. Refresh results below.');
    } catch (err) {
      flash(setAllotMsg, 'error', err.response?.data?.error || 'Allotment failed.');
    } finally { setAllotting(false); }
  };

  return (
    <div className="card">
      <div className="card-header-row">
        <div className="card-icon-sq ci-navy">📤</div>
        <div>
          <div className="card-title-text">Upload & Run Allotment</div>
          <div className="card-desc-text">Upload student CSV then execute the allotment algorithm</div>
        </div>
      </div>

      {!activeSessionId && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          ⚠ Please activate a session before uploading data.
        </div>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Styled clickable zone */}
      <label className="field-label">Student Data File</label>
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 18px',
          marginBottom: 14,
          background: file ? 'var(--navy-pale)' : 'var(--bg-inset)',
          border: `1.5px dashed ${file ? 'var(--navy-light)' : 'var(--border-mid)'}`,
          borderRadius: 10,
          cursor: 'pointer',
          transition: 'all 0.18s',
          userSelect: 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--navy-light)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = file ? 'var(--navy-light)' : 'var(--border-mid)'}
      >
        {/* Icon box */}
        <div style={{
          width: 44, height: 44, borderRadius: 8, flexShrink: 0,
          background: file ? 'var(--navy-dim)' : 'var(--bg-surface)',
          border: `1px solid ${file ? 'rgba(26,46,74,0.15)' : 'var(--border-soft)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {file ? '📄' : '📂'}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 600,
            color: file ? 'var(--navy)' : 'var(--text-secondary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {file ? file.name : 'Click to choose a CSV file'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {file ? `${(file.size / 1024).toFixed(1)} KB · ready to upload` : 'Accepts .csv format only'}
          </div>
        </div>

        {/* Action hint / clear */}
        {file ? (
          <button
            onClick={e => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 16, padding: '4px 6px',
              borderRadius: 6, transition: 'color 0.12s',
              flexShrink: 0,
            }}
            title="Remove file"
          >
            ✕
          </button>
        ) : (
          <div style={{
            fontSize: 11.5, fontWeight: 600, color: 'var(--navy)',
            background: 'var(--navy-dim)', border: '1px solid rgba(26,46,74,0.15)',
            padding: '4px 10px', borderRadius: 6, flexShrink: 0,
          }}>
            Browse
          </div>
        )}
      </div>

      {uploadMsg && (
        <div className={`alert alert-${uploadMsg.type}`} style={{ marginBottom: 12 }}>
          {uploadMsg.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || !activeSessionId}>
          {uploading ? <><span className="spinner"></span> Uploading…</> : 'Upload CSV'}
        </button>
        <button className="btn btn-amber" onClick={handleAllotment} disabled={allotting || !activeSessionId}>
          {allotting ? <><span className="spinner" style={{ borderTopColor: '#fff' }}></span> Running…</> : '⚡ Run Allotment'}
        </button>
      </div>

      {allotMsg && (
        <div className={`alert alert-${allotMsg.type}`} style={{ marginTop: 12 }}>
          {allotMsg.msg}
        </div>
      )}
    </div>
  );
};

export default CSVUpload;