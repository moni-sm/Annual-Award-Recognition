import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard';
import ManageEmployees from './components/ManageEmployees';
import ManageClient from './components/ManageClient';
import ApprovedNominations from './components/ApprovedNominations';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminDashboard />} /> {/* default route */}
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/employees" element={<ManageEmployees />} />
        <Route path="/admin/manage-client" element={<ManageClient />} />
        <Route path="/admin/approved" element={<ApprovedNominations />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
