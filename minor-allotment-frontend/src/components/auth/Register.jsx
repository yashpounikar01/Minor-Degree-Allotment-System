import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    setMessage('');
    try {
      await axios.post('http://localhost:5000/auth/register', {
        username,
        password,
        adminCode
      });
      setMessage('✅ Registered successfully. Now login.');
    } catch (err) {
      setMessage(err.response?.data?.error || '❌ Registration failed.');
      console.error(err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-white/20 text-white">
        <h2 className="text-3xl font-bold text-center mb-6 text-white drop-shadow-md">📝 Register Admin</h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 bg-white/20 placeholder-white/80 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <br /> <br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 bg-white/20 placeholder-white/80 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <br /> <br />
          <input
            type="text"
            placeholder="Admin Code"
            value={adminCode}
            onChange={e => setAdminCode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 bg-white/20 placeholder-white/80 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {message && (
            <p className={`text-sm text-center ${message.startsWith('✅') ? 'text-green-300' : 'text-red-300'}`}>
              {message}
            </p>
          )}
          <br /> <br />
          <button
            onClick={handleRegister}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-sky-500 hover:opacity-90 text-white font-bold rounded-xl transition-all duration-300 shadow-lg"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
