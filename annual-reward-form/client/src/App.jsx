// import React from 'react';
// import NominationForm from './components/NominationForm';

// function App() {
//   return <NominationForm />;
// }

// export default App;


import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NominationForm from './components/NominationForm';
import AccessGate from './components/AccessGate';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("nominator_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Error reading nominator_user from localStorage:", e);
      return null;
    }
  });

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("nominator_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("nominator_user");
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            user ? (
              <NominationForm user={user} onLogout={handleLogout} />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />
        <Route path="/access" element={<AccessGate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
