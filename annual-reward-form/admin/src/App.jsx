import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import ManageEmployees from './components/ManageEmployees';
import ManageClient from './components/ManageClient';
import ApprovedNominations from './components/ApprovedNominations';
import AdminLogin from './components/AdminLogin'; // Import your new component

const App = () => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        {/* If not logged in, force redirect to login. If logged in, redirect to dashboard */}
        <Route 
          path="/" 
          element={isAdminLoggedIn ? <Navigate to="/dashboard" /> : <AdminLogin onAdminLogin={() => setIsAdminLoggedIn(true)} />} 
        />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={isAdminLoggedIn ? <AdminDashboard /> : <Navigate to="/" />} />
        <Route path="/admin/employees" element={isAdminLoggedIn ? <ManageEmployees /> : <Navigate to="/" />} />
        <Route path="/admin/manage-client" element={isAdminLoggedIn ? <ManageClient /> : <Navigate to="/" />} />
        <Route path="/admin/approved" element={isAdminLoggedIn ? <ApprovedNominations /> : <Navigate to="/" />} />
        
        {/* Fallback for undefined routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;