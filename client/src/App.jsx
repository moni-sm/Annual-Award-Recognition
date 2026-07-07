import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NominationForm from './components/NominationForm';
import AccessGate from './components/AccessGate';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <BrowserRouter>
       {user && (
        <div 
          className="user-navbar" 
          style={{ 
            background: '#2c3e50', 
            color: '#fff', 
            padding: '12px 20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontFamily: 'sans-serif',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <span>👋 Welcome, <strong>{user.name}</strong> ({user.designation})</span>
          <button 
            onClick={handleLogout} 
            style={{ 
              background: '#e74c3c', 
              color: '#fff', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#c0392b'}
            onMouseOut={(e) => e.target.style.background = '#e74c3c'}
          >
            Logout
          </button>
        </div>
      )}

      <Routes>
        {/* Main Route: Shows nomination form if logged in, otherwise shows Login screen */}
        <Route 
          path="/" 
          element={
            user ? (
              <NominationForm currentUser={user} />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />
        
        {/* Admin/Access Gate Management Route */}
        <Route path="/access" element={<AccessGate />} />

        {/* Fallback Catch-all: Redirects unrecognized links safely to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;