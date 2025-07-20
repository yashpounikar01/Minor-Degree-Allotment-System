import React, { useState } from 'react';
import CSVUpload from './components/CSVUpload';
import AllotmentResult from './components/AllotmentResult';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { isLoggedIn, logout } from './auth';
import ExportButton from './components/ExportButton';

function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = () => {
    setLoggedIn(true);
    setShowRegister(false);
  };

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
    setShowRegister(false);
  };

  const toggleAuthMode = () => {
    setShowRegister(!showRegister);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8 ">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            🎓 Minor Degree Allotment System
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Streamlined allocation system for academic programs with intelligent matching algorithms
          </p>
        </div>

        {loggedIn ? (
          /* Authenticated View */
          <div className="space-y-8">
            {/* User Controls */}
            <div className="flex justify-between items-center bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  ✓
                </div>
                <div>
                  <h3 className="text-white font-semibold">Welcome back!</h3>
                  <p className="text-slate-400 text-sm">System ready for operations</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 hover:text-red-200 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium"
              >
                🚪 Logout
              </button>
            </div>

            {/* Main Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300">
                <CSVUpload />
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 hover:border-purple-500/30 transition-all duration-300">
                <AllotmentResult />
              </div>
            </div>

            {/* Export Section */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 hover:border-green-500/30 transition-all duration-300">
              <ExportButton />
            </div>
          </div>
        ) : (
          /* Authentication View */
          <div className="max-w-md mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
              {!showRegister ? (
                /* Login Form */
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-slate-400">Sign in to access the allotment system</p>
                  </div>
                  
                  <Login onLogin={handleLogin} />
                  
                  <div className="text-center pt-6 border-t border-slate-700/50">
                    <p className="text-slate-400 mb-4">Don't have an account?</p>
                    <button 
                      onClick={toggleAuthMode}
                      className="w-full px-6 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-blue-500/50 text-slate-200 hover:text-white rounded-xl transition-all duration-300 font-medium"
                    >
                      ✨ Register New Account
                    </button>
                  </div>
                </div>
              ) : (
                /* Register Form */
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
                    <p className="text-slate-400">Join the allotment system</p>
                  </div>
                  
                  <Register />
                  
                  <div className="text-center pt-6 border-t border-slate-700/50">
                    <p className="text-slate-400 mb-4">Already have an account?</p>
                    <button 
                      onClick={toggleAuthMode}
                      className="w-full px-6 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-purple-500/50 text-slate-200 hover:text-white rounded-xl transition-all duration-300 font-medium"
                    >
                      🔑 Back to Login
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Info */}
            {/* <div className="text-center mt-8 space-y-2">
              <p className="text-slate-500 text-sm">Secure • Reliable • Efficient</p>
              <div className="flex justify-center gap-6 text-slate-600 text-xs">
                <span>🔒 SSL Protected</span>
                <span>⚡ Fast Processing</span>
                <span>📊 Analytics Ready</span>
              </div>
            </div> */}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;