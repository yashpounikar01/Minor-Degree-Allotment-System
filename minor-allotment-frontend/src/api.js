import axios from 'axios';
import { getToken } from './auth';

const API_BASE = 'http://localhost:5000';

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`
  }
});

export const uploadCSV = (formData) =>
  axios.post(`${API_BASE}/upload/csv`, formData, authHeaders());

export const runAllotment = () =>
  axios.get(`${API_BASE}/allot/run`, authHeaders());

export const getAllotmentResult = () =>
  axios.get(`${API_BASE}/allot/result`);

export const getStudentResult = (erpid) =>
  axios.get(`${API_BASE}/allot/result/${erpid}`);
