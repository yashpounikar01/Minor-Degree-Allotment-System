import React, { useState } from 'react';
import axios from 'axios';

export default function LoginRegister({ onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', secretCode: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
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
        setRegistered(true);
        setTimeout(() => {
          setRegistered(false);
          setMode('login');
          setForm({ username: '', password: '', secretCode: '' });
        }, 2200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    setRegistered(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-in">

        {/* Institutional seal */}
        <div className="auth-seal">🎓</div>
        <div className="auth-inst">Academic Administration</div>

        <h2 className="auth-title">
          {mode === 'login' ? 'Admin Portal' : 'Register Account'}
        </h2>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Sign in to manage allotments'
            : 'Create an administrator account'}
        </p>

        {/* Success message after register */}
        {registered ? (
          <div className="alert alert-success" style={{ justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
            ✓ Account created. Redirecting to sign in…
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div>
              <label className="field-label">Username</label>
              <input
                className="inp"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="field-label">Password</label>
              <input
                className="inp"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="field-label">Admin Authorization Code</label>
                <input
                  className="inp"
                  name="secretCode"
                  type="text"
                  placeholder="Enter the admin secret code"
                  value={form.secretCode}
                  onChange={handleChange}
                />
              </div>
            )}

            {error && (
              <div className="alert alert-error">{error}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading
                ? <><span className="spinner"></span>{mode === 'login' ? ' Signing in…' : ' Registering…'}</>
                : mode === 'login' ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>
        )}

        {/* Switch between login / register */}
        <div className="auth-switch">
          <p>{mode === 'login' ? 'New administrator?' : 'Already have an account?'}</p>
          <button className="btn btn-ghost btn-full" onClick={switchMode}>
            {mode === 'login' ? 'Register Account' : '← Back to Sign In'}
          </button>
        </div>

      </div>
    </div>
  );
}