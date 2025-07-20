import React, { useState } from 'react';
import axios from 'axios';

export default function LoginRegister({ onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', secretCode: '' });
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      const url = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload =
        mode === 'login'
          ? { username: form.username, password: form.password }
          : { username: form.username, password: form.password, secretCode: form.secretCode };

      const res = await axios.post(`${API_BASE}${url}`, payload);

      if (mode === 'login') {
        const token = res.data.token;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        onAuthSuccess(token);
      } else {
        alert(res.data.message);
        setMode('login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-100 to-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-emerald-200">
        <h2 className="text-3xl font-extrabold text-center text-emerald-600 mb-6 tracking-tight">
          {mode === 'login' ? '🔐 Admin Login' : '📝 Admin Registration'}
        </h2>

        <div className="space-y-5">
          <input
            name="username"
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
          />
          {mode === 'register' && (
            <input
              name="secretCode"
              type="text"
              placeholder="Admin Secret Code"
              value={form.secretCode}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
            />
          )}

          {error && (
            <p className="text-red-600 text-sm font-medium text-center">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold transition-all hover:bg-emerald-600 hover:shadow-lg"
          >
            {mode === 'login' ? 'Login' : 'Register'}
          </button>
        </div>

        <p className="text-center mt-6 text-slate-600 text-sm">
          {mode === 'login'
            ? "Don't have an account?"
            : 'Already have an account?'}{' '}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="text-emerald-600 font-medium underline hover:text-emerald-800"
          >
            {mode === 'login' ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
