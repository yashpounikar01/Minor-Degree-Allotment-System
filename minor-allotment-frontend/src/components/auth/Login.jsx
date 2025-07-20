import React, { useState } from 'react';
import axios from 'axios';
import { login } from '../../auth';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/auth/login', { username, password });
      login(res.data.token);
      onLogin(); // Notify App component
    } catch (err) {
      setError('❌ Login failed. Please check your credentials.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <div className="w-full max-w-md bg-gray-950 border border-gray-700 rounded-3xl shadow-xl p-8 text-white mt-2">
        <h2 className="text-3xl font-extrabold text-center text-emerald-400 mb-6">🔐 Admin Login</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <br /><br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <br /><br />
          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-center transition-all duration-200 shadow-md"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
