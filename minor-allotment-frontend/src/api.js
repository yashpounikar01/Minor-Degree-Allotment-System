import axios from 'axios';
import { getToken } from './auth';

const API_BASE = 'http://localhost:5000';

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

// ── Students / Allotment ─────────────────────────────────────────
export const uploadCSV = (formData) =>
  axios.post(`${API_BASE}/upload/csv`, formData, authHeaders());

export const runAllotment = (session_id) =>
  axios.get(`${API_BASE}/allot/run`, {
    ...authHeaders(),
    params: { session_id }
  });

export const getAllotmentResult = (session_id) =>
  axios.get(`${API_BASE}/allot/result`, { params: { session_id } });

export const getStudentResult = (erpid, session_id) =>
  axios.get(`${API_BASE}/allot/result/${erpid}`, { params: { session_id } });

export const getMeritList = (session_id) =>
  axios.get(`${API_BASE}/allot/merit-list`, { params: { session_id } });

export const getRankList = (session_id) =>
  axios.get(`${API_BASE}/allot/rank-list`, { params: { session_id } });

// ── Sessions ────────────────────────────────────────────────────
export const getSessions = () =>
  axios.get(`${API_BASE}/sessions`);

export const getActiveSession = () =>
  axios.get(`${API_BASE}/sessions/active`);

export const createSession = (session_name) =>
  axios.post(`${API_BASE}/sessions`, { session_name }, authHeaders());

export const activateSession = (id) =>
  axios.put(`${API_BASE}/sessions/${id}/activate`, {}, authHeaders());

export const deleteSession = (id) =>
  axios.delete(`${API_BASE}/sessions/${id}`, authHeaders());

// ── Branches ────────────────────────────────────────────────────
export const getBranches = (session_id) =>
  axios.get(`${API_BASE}/upload/branches`, { ...authHeaders(), params: { session_id } });

export const saveBranches = (session_id, branches) =>
  axios.post(`${API_BASE}/upload/branches`, { session_id, branches }, authHeaders());

export const deleteBranch = (session_id, branch_name) =>
  axios.delete(`${API_BASE}/upload/branches`, {
    ...authHeaders(),
    data: { session_id, branch_name }
  });

// ── CSV Downloads (trigger browser download) ─────────────────────
export const downloadMeritListCSV = (session_id) => {
  const url = `${API_BASE}/export/merit-list-csv${session_id ? `?session_id=${session_id}` : ''}`;
  triggerDownload(url);
};

export const downloadRankListCSV = (session_id) => {
  const url = `${API_BASE}/export/rank-list-csv${session_id ? `?session_id=${session_id}` : ''}`;
  triggerDownload(url);
};

export const downloadAllotmentDOCX = async (session_id) => {
  const url = `${API_BASE}/export/docx-template${session_id ? `?session_id=${session_id}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Server error: ${response.status} - ${err}`);
  }
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  const disposition = response.headers.get('Content-Disposition');
  let filename = 'allotment_list.docx';
  if (disposition && disposition.includes('filename=')) {
    filename = disposition.split('filename=')[1].replace(/['"]/g, '');
  }
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

function triggerDownload(url) {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', '');
  document.body.appendChild(link);
  link.click();
  link.remove();
}