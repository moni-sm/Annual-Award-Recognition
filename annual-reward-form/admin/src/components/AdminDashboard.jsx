import React, { useEffect, useState, useMemo, useRef } from 'react';
import './AdminDashboard.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import NomineePopup from './NomineePopup';

const AdminDashboard = () => {
  const [nominations, setNominations] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedAward, setSelectedAward] = useState('');
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [popupNominee, setPopupNominee] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 

  // 📜 Persistent collection for Approvals via LocalStorage
  const [approvedNominees, setApprovedNominees] = useState(() => {
    const saved = localStorage.getItem('approved_nominations');
    return saved ? JSON.parse(saved) : [];
  });

  // ❌ Persistent collection for Rejections via LocalStorage
  const [rejectedNominees, setRejectedNominees] = useState(() => {
    const saved = localStorage.getItem('rejected_nominations');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeMenu, setActiveMenu] = useState(null);
  const awardMenuRef = useRef(null);
  const divisionMenuRef = useRef(null);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://annual-award-nom.onrender.com/api';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu === 'award' && awardMenuRef.current && !awardMenuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
      if (activeMenu === 'division' && divisionMenuRef.current && !divisionMenuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [nominationsRes, divisionsRes, employeesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/nominations`),
          axios.get(`${API_BASE_URL}/employees/divisions`),
          axios.get(`${API_BASE_URL}/employees`)
        ]);

        setNominations(nominationsRes.data);
        setDivisions(divisionsRes.data);
        setEmployees(employeesRes.data);

        if (nominationsRes.data.length) {
          const latest = nominationsRes.data.reduce((a, b) =>
            new Date(b.createdAt) > new Date(a.createdAt) ? b : a
          );
          const dt = new Date(latest.createdAt);
          setSelectedYear(dt.getFullYear());
          setSelectedMonth(dt.getMonth());
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchAllData();
  }, []);

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all nominations permanently from the database?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/nominations`);
      localStorage.removeItem('approved_nominations'); 
      localStorage.removeItem('rejected_nominations');
      alert('Deleted successfully');
      window.location.reload();
    } catch (err) {
      console.error("Failed to clear database data:", err);
      alert('Failed to delete data.');
    }
  };

  const handleApprove = (nominee) => {
    if (approvedNominees.some(item => item.name === nominee.name)) {
      alert("This candidate is already approved.");
      return;
    }

    const cleanRejections = rejectedNominees.filter(item => item.name !== nominee.name);
    setRejectedNominees(cleanRejections);
    localStorage.setItem('rejected_nominations', JSON.stringify(cleanRejections));

    const simpleNomineeRecord = {
      name: nominee.name,
      awardType: nominee.nominations[0]?.awardType || 'N/A',
      designation: nominee.designation,
      division: nominee.division
    };

    const updatedList = [...approvedNominees, simpleNomineeRecord];
    setApprovedNominees(updatedList);
    localStorage.setItem('approved_nominations', JSON.stringify(updatedList));
    alert(`Successfully approved: ${nominee.name}`);
  };

  const handleReject = (nominee) => {
    if (!window.confirm(`Are you sure you want to reject ${nominee.name}?`)) return;

    if (rejectedNominees.some(item => item.name === nominee.name)) {
      alert("This candidate is already rejected.");
      return;
    }

    const cleanApprovals = approvedNominees.filter(item => item.name !== nominee.name);
    setApprovedNominees(cleanApprovals);
    localStorage.setItem('approved_nominations', JSON.stringify(cleanApprovals));

    const simpleNomineeRecord = {
      name: nominee.name,
      awardType: nominee.nominations[0]?.awardType || 'N/A',
      designation: nominee.designation,
      division: nominee.division
    };

    const updatedList = [...rejectedNominees, simpleNomineeRecord];
    setRejectedNominees(updatedList);
    localStorage.setItem('rejected_nominations', JSON.stringify(updatedList));
    alert(`Rejected: ${nominee.name}`);
  };

  // Pull unique awards fetched dynamically from existing nominations database records
  const uniqueAwards = useMemo(() => {
    const awardsList = nominations.map(n => n.awardType).filter(Boolean);
    return [...new Set(awardsList)];
  }, [nominations]);

  const filtered = useMemo(() => {
    return nominations.filter(nomination => {
      const dt = new Date(nomination.createdAt);
      return selectedYear && selectedMonth !== null
        ? dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonth
        : true;
    });
  }, [nominations, selectedYear, selectedMonth]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(nomination => {
      const employee = employees.find(emp =>
        emp.name?.toLowerCase() === nomination.employeeName?.toLowerCase()
      );

      const empDivision = employee?.division || 'N/A';
      const awardType = nomination.awardType || 'N/A';

      // Match filters seamlessly directly inside the list sequence
      if (selectedAward && awardType.toLowerCase() !== selectedAward.toLowerCase()) return;
      if (selectedDivision && empDivision.toLowerCase() !== selectedDivision.toLowerCase()) return;

      const key = nomination.employeeName || 'N/A';
      if (!map[key]) {
        map[key] = {
          name: key,
          designation: employee?.designation || nomination.designation || 'N/A',
          division: empDivision,
          count: 0,
          nominations: []
        };
      }
      map[key].count++;
      map[key].nominations.push(nomination);
    });
    
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filtered, employees, selectedAward, selectedDivision]);

  return (
    <div className={`dashboard-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button className="sidebar-toggle" onClick={() => setIsSidebarCollapsed(prev => !prev)}>☰</button>

      <aside className="sidebar">
        <div>
          {!isSidebarCollapsed && <div className="sidebar-header">Admin</div>}
          <nav className="sidebar-nav">
            <button onClick={() => navigate('/admin/employees')}>👥 Manage Employees</button>
            <button onClick={() => navigate('/admin/manage-client')}>🎯 Manage Awards</button>
            <button onClick={() => navigate('/admin/approved')} style={{ backgroundColor: '#e8f5e9', fontWeight: 'bold', color: '#2e7d32' }}>
              📜 Approved Nominees ({approvedNominees.length})
            </button>
          </nav>
        </div>
        <button onClick={handleDeleteAll} className="delete-btn">🗑️ Delete All Nominations</button>
      </aside>

      <main className="main-content">
        <h1 className="dashboard-header">🏆 Admin Dashboard</h1>

        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-title">Total Processed Entries</div>
            <div className="stat-value">{grouped.length}</div>
          </div>
          <div className="stat-card" style={{ borderColor: '#4CAF50' }}>
            <div className="stat-title">Total Approved List</div>
            <div className="stat-value" style={{ color: '#4CAF50' }}>{approvedNominees.length}</div>
          </div>
          <div className="stat-card" style={{ borderColor: '#f44336' }}>
            <div className="stat-title">Total Rejected List</div>
            <div className="stat-value" style={{ color: '#f44336' }}>{rejectedNominees.length}</div>
          </div>
        </div>

        <div className="nominations-container">
          <h2 className="nominations-header">📋 Nomination Tracking Queue</h2>
          
          <table className="nominations-table">
            <thead>
              <tr>
                <th>NOMINEE</th>
                
                {/* 🗳 AWARD TYPE Header Dropdown Box */}
                <th>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '12px', letterSpacing: '0.5px' }}>AWARD TYPE</span>
                    <select 
                      value={selectedAward} 
                      onChange={(e) => setSelectedAward(e.target.value)}
                      style={{ 
                        padding: '6px 12px', 
                        borderRadius: '4px', 
                        border: '1px solid #ccc', 
                        width: '90%', 
                        minWidth: '180px', 
                        background: '#fff', 
                        fontWeight: 'normal',
                        color: '#333'
                      }}
                    >
                      <option value="">All Awards</option>
                      {uniqueAwards.map((award, index) => (
                        <option key={index} value={award}>{award}</option>
                      ))}
                    </select>
                  </div>
                </th>

                <th>DESIGNATION</th>

                {/* 🗳 DIVISION Header Dropdown Box */}
                <th>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '12px', letterSpacing: '0.5px' }}>DIVISION</span>
                    <select 
                      value={selectedDivision} 
                      onChange={(e) => setSelectedDivision(e.target.value)}
                      style={{ 
                        padding: '6px 12px', 
                        borderRadius: '4px', 
                        border: '1px solid #ccc', 
                        width: '90%', 
                        minWidth: '160px', 
                        background: '#fff', 
                        fontWeight: 'normal',
                        color: '#333'
                      }}
                    >
                      <option value="">All Divisions</option>
                      {divisions.map((div, index) => (
                        <option key={index} value={div}>{div}</option>
                      ))}
                    </select>
                  </div>
                </th>

                <th>STATUS / ACTION</th>
              </tr>
            </thead>
            <tbody>
              {grouped.length > 0 ? (
                grouped.map((nominee, idx) => {
                  const isApproved = approvedNominees.some(item => item.name === nominee.name);
                  const isRejected = rejectedNominees.some(item => item.name === nominee.name);
                  
                  return (
                    <tr key={idx}>
                      <td>
                        <button className="nominee-link" onClick={() => setPopupNominee(nominee)}>
                          {nominee.name}
                        </button>
                      </td>
                      <td>{nominee.nominations[0]?.awardType || 'N/A'}</td>
                      <td>{nominee.designation}</td>
                      <td>{nominee.division}</td>
                      <td>
                        {isApproved && (
                          <span style={{ color: '#2e7d32', fontWeight: 'bold', backgroundColor: '#e8f5e9', padding: '4px 10px', borderRadius: '4px', display: 'inline-block' }}>
                            ✓ Approved
                          </span>
                        )}
                        {isRejected && (
                          <span style={{ color: '#c62828', fontWeight: 'bold', backgroundColor: '#ffebee', padding: '4px 10px', borderRadius: '4px', display: 'inline-block' }}>
                            ✗ Rejected
                          </span>
                        )}
                        {!isApproved && !isRejected && (
                          <div className="action-buttons-cell" style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="approve-btn" 
                              onClick={() => handleApprove(nominee)}
                              style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #4CAF50', backgroundColor: '#e8f5e9', color: '#4CAF50', fontWeight: 'bold' }}
                            >
                              Approve
                            </button>
                            <button 
                              className="reject-btn" 
                              onClick={() => handleReject(nominee)}
                              style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #f44336', backgroundColor: '#ffebee', color: '#f44336', fontWeight: 'bold' }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">No entries found matching column selections.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {popupNominee && (
          <NomineePopup nominee={popupNominee} onClose={() => setPopupNominee(null)} />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;