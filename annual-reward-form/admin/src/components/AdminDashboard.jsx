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
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [popupNominee, setPopupNominee] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 

  const [colFilterNominee, setColFilterNominee] = useState('');
  const [colFilterAward, setColFilterAward] = useState('');
  const [colFilterDivision, setColFilterDivision] = useState('');
  const [activeMenu, setActiveMenu] = useState(null); // 'nominee' | 'award' | 'division' | null


  const [approvedNomineesCount, setApprovedNomineesCount] = useState(0); 
  const [rejectedNomineesCount, setRejectedNomineesCount] = useState(0);

  const nomineeMenuRef = useRef(null);
  const awardMenuRef = useRef(null);
  const divisionMenuRef = useRef(null);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenu === 'nominee' && nomineeMenuRef.current && !nomineeMenuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
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
        const [nominationsRes, divisionsRes, employeesRes, statsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/nominations`),
          axios.get(`${API_BASE_URL}/employees/divisions`),
          axios.get(`${API_BASE_URL}/employees`),
          axios.get(`${API_BASE_URL}/nominations/stats`) 
        ]);

        setNominations(nominationsRes.data);
        setDivisions(divisionsRes.data);
        setEmployees(employeesRes.data);
        
        setApprovedNomineesCount(statsRes.data.approved || 0);
        setRejectedNomineesCount(statsRes.data.rejected || 0);

        if (nominationsRes.data.length) {
          const latest = nominationsRes.data.reduce((a, b) =>
            new Date(b.createdAt) > new Date(a.createdAt) ? b : a
          );
          const dt = new Date(latest.createdAt);
          setSelectedYear(dt.getFullYear());
          setSelectedMonth(dt.getMonth());
        }
      } catch (err) {
        console.error("Error fetching data from the server:", err);
      }
    };
    fetchAllData();
  }, [API_BASE_URL]);

  
  const handleApprove = async (nominee) => {
    try {
      await axios.patch(`${API_BASE_URL}/nominations/status`, {
        employeeName: nominee.name,
        awardType: nominee.awardType,
        status: 'approved'
      });

      alert(`Successfully approved: ${nominee.name} for ${nominee.awardType}`);
      setPopupNominee(null);
      window.location.reload(); 
    } catch (err) {
      console.error("Failed to approve nomination:", err);
      alert("Could not update status on DB server.");
    }
  };


  const handleReject = async (nominee) => {
    if (!window.confirm(`Are you sure you want to reject ${nominee.name} for the ${nominee.awardType}?`)) return;

    try {
      await axios.patch(`${API_BASE_URL}/nominations/status`, {
        employeeName: nominee.name,
        awardType: nominee.awardType,
        status: 'rejected'
      });

      alert(`Rejected: ${nominee.name} for ${nominee.awardType}`);
      setPopupNominee(null);
      window.location.reload();
    } catch (err) {
      console.error("Failed to reject nomination:", err);
      alert("Could not update status on DB server.");
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all nominations permanently from the database?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/nominations`);
      alert('Deleted successfully');
      window.location.reload();
    } catch (err) {
      console.error("Failed to clear database data:", err);
      alert('Failed to delete data.');
    }
  };

  const uniqueNominees = useMemo(() => {
    const names = nominations.map(n => n.employeeName).filter(Boolean);
    return [...new Set(names)].sort();
  }, [nominations]);

  const uniqueAwards = useMemo(() => {
    const awards = nominations.map(n => n.awardType).filter(Boolean);
    return [...new Set(awards)];
  }, [nominations]);

  const filtered = useMemo(() => {
    return nominations.filter(nomination => {
      const dt = new Date(nomination.createdAt);
      const okTime = selectedYear && selectedMonth !== null
        ? dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonth
        : true;

      if (!selectedDivision) return okTime;

      const employee = employees.find(emp =>
        emp.name?.toLowerCase() === nomination.employeeName?.toLowerCase()
      );

      return okTime && employee?.division === selectedDivision;
    });
  }, [nominations, employees, selectedYear, selectedMonth, selectedDivision]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(nomination => {
      const employee = employees.find(emp =>
        emp.name?.toLowerCase() === nomination.employeeName?.toLowerCase()
      );

      const empDivision = employee?.division || 'N/A';
      const awardType = nomination.awardType || 'N/A';
      const nomineeName = nomination.employeeName || 'N/A';
     
      if (colFilterNominee && nomineeName !== colFilterNominee) return;
      if (colFilterAward && awardType !== colFilterAward) return;
      if (colFilterDivision && empDivision !== colFilterDivision) return;

      const key = `${nomineeName}_${awardType}`;
      
      if (!map[key]) {
        map[key] = {
          name: nomineeName,
          awardType: awardType,
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
  }, [filtered, employees, colFilterNominee, colFilterAward, colFilterDivision]);

  const handleExcel = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/nominations/download/all`);
      let nominationsData = response.data;
      if (nominationsData && nominationsData.data) {
        nominationsData = nominationsData.data;
      }

      if (!nominationsData || !Array.isArray(nominationsData)) {
        alert("No valid nominations data found!");
        return;
      }

      const data = nominationsData.map(nomination => ({
        Nominee: nomination.employeeName || 'N/A',
        EmployeeID: nomination.employeeId || 'N/A',
        Department: nomination.department || 'N/A',
        Designation: nomination.designation || 'N/A',
        Email: nomination.employeeEmail || 'N/A',
        Year: nomination.yearOfNomination || 'N/A',
        Award: nomination.awardType || 'N/A',
        Justification: nomination.justification || 'N/A',
        Recommendation: nomination.recommendation || 'N/A',
        NominatorName: nomination.nominatorName || 'N/A',
        NominatorDept: nomination.nominatorDept || 'N/A',
        NominatorDesig: nomination.nominatorDesig || 'N/A',
        NominatorEmail: nomination.nominatorEmail || 'N/A',
        CreatedAt: new Date(nomination.createdAt).toLocaleString(),
        Answers: nomination.answers?.map(a => `${a.question}: ${a.answer}`).join(' | ') || ''
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Nominations");

      const fileName = `Nominations_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error generating Excel file:", error);
    }
  };

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
              📜 Approved Nominees ({approvedNomineesCount})
            </button>
            <button className="download-excel-btn" onClick={handleExcel} disabled={!filtered.length}>
              📥 Download Excel
            </button>
          </nav>
        </div>
        <button onClick={handleDeleteAll} className="delete-btn">🗑️ Delete All Nominations</button>
      </aside>

      <main className="main-content">
        <h1 className="dashboard-header">🏆 Admin Dashboard</h1>

        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-title">Total Nominations</div>
            <div className="stat-value">{filtered.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Unique Nominees</div>
            <div className="stat-value">{grouped.length}</div>
          </div>
          <div className="stat-card" style={{ borderColor: '#4CAF50' }}>
            <div className="stat-title">Approved List</div>
            <div className="stat-value">{approvedNomineesCount}</div>
          </div>
          <div className="stat-card" style={{ borderColor: '#f44336' }}>
            <div className="stat-title">Rejected List</div>
            <div className="stat-value">{rejectedNomineesCount}</div>
          </div>
        </div>

        {(colFilterNominee || colFilterAward || colFilterDivision) && (
          <div className="active-filters-ribbon">
            {colFilterNominee && (
              <span className="filter-tag">
                Nominee: {colFilterNominee} <button onClick={() => setColFilterNominee('')}>×</button>
              </span>
            )}
            {colFilterAward && (
              <span className="filter-tag">
                Award: {colFilterAward} <button onClick={() => setColFilterAward('')}>×</button>
              </span>
            )}
            {colFilterDivision && (
              <span className="filter-tag">
                Division: {colFilterDivision.toUpperCase()} <button onClick={() => setColFilterDivision('')}>×</button>
              </span>
            )}
          </div>
        )}

        <div className="nominations-container">
          <h2 className="nominations-header">📋 Nominations</h2>
          <table className="nominations-table">
            <thead>
              <tr>
                <th className="filterable-header" ref={nomineeMenuRef}>
                  <div className="header-cell-content">
                    <span>Nominee</span>
                    <button 
                      className={`filter-icon-btn ${colFilterNominee ? 'active' : ''}`}
                      onClick={() => setActiveMenu(prev => prev === 'nominee' ? null : 'nominee')}
                    >
                      ▼  
                    </button>
                  </div>
                  {activeMenu === 'nominee' && (
                    <div className="filter-popover" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      <div 
                        className={`popover-item ${!colFilterNominee ? 'selected' : ''}`} 
                        onClick={() => { setColFilterNominee(''); setActiveMenu(null); }}
                      >
                        All Nominees
                      </div>
                      {uniqueNominees.map(name => (
                        <div 
                          key={name} 
                          className={`popover-item ${colFilterNominee === name ? 'selected' : ''}`} 
                          onClick={() => { setColFilterNominee(name); setActiveMenu(null); }}
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                  )}
                </th>
                <th className="filterable-header" ref={awardMenuRef}>
                  <div className="header-cell-content">
                    <span>Award Type</span>
                    <button 
                      className={`filter-icon-btn ${colFilterAward ? 'active' : ''}`}
                      onClick={() => setActiveMenu(prev => prev === 'award' ? null : 'award')}
                    >
                      ▼  
                    </button>
                  </div>
                  {activeMenu === 'award' && (
                    <div className="filter-popover">
                      <div 
                        className={`popover-item ${!colFilterAward ? 'selected' : ''}`} 
                        onClick={() => { setColFilterAward(''); setActiveMenu(null); }}
                      >
                        All Awards
                      </div>
                      {uniqueAwards.map(award => (
                        <div 
                          key={award} 
                          className={`popover-item ${colFilterAward === award ? 'selected' : ''}`} 
                          onClick={() => { setColFilterAward(award); setActiveMenu(null); }}
                        >
                          {award}
                        </div>
                      ))}
                    </div>
                  )}
                </th>
                <th>Designation</th>
                <th className="filterable-header" ref={divisionMenuRef}>
                  <div className="header-cell-content">
                    <span>Division</span>
                    <button 
                      className={`filter-icon-btn ${colFilterDivision ? 'active' : ''}`}
                      onClick={() => setActiveMenu(prev => prev === 'division' ? null : 'division')}
                    >
                      ▼  
                    </button>
                  </div>
                  {activeMenu === 'division' && (
                    <div className="filter-popover">
                      <div 
                        className={`popover-item ${!colFilterDivision ? 'selected' : ''}`} 
                        onClick={() => { setColFilterDivision(''); setActiveMenu(null); }}
                      >
                        All Divisions
                      </div>
                      {divisions.map(div => (
                        <div 
                          key={div} 
                          className={`popover-item ${colFilterDivision === div ? 'selected' : ''}`} 
                          onClick={() => { setColFilterDivision(div); setActiveMenu(null); }}
                        >
                          {div.toUpperCase()}
                        </div>
                      ))}
                    </div>
                  )}
                </th>
                <th>Count</th> 
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {grouped.length > 0 ? (
                grouped.map((nominee, idx) => {
                  const currentStatus = nominee.nominations[0]?.status || 'pending';
                  const isApproved = currentStatus === 'approved';
                  const isRejected = currentStatus === 'rejected';

                  return (
                    <tr key={idx}>
                      <td>{nominee.name}</td>
                      <td>{nominee.awardType}</td>
                      <td>{nominee.designation}</td>
                      <td>{nominee.division}</td>
                      <td><span className="nomination-score-badge">{nominee.count}</span></td>
                      <td>
                        {isApproved && <span style={{ color: '#2e7d32', fontWeight: 'bold', backgroundColor: '#e8f5e9', padding: '4px 10px', borderRadius: '4px' }}> Approved</span>}
                        {isRejected && <span style={{ color: '#c62828', fontWeight: 'bold', backgroundColor: '#ffebee', padding: '4px 10px', borderRadius: '4px' }}> Rejected</span>}
                        {!isApproved && !isRejected && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              onClick={() => setPopupNominee(nominee)}
                              style={{ border: '1px solid #4CAF50', backgroundColor: '#e8f5e9', color: '#4CAF50', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReject(nominee)}
                              style={{ border: '1px solid #f44336', backgroundColor: '#ffebee', color: '#f44336', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
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
                  <td colSpan="6"> 
                    <div className="empty-state">
                      <div className="empty-icon">📭</div>
                      <div className="empty-message">No nominations found</div>
                      <div className="empty-submessage">There are no nominations for the selected criteria</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

       {popupNominee && (
  <NomineePopup 
    nominee={popupNominee} 
    onClose={() => setPopupNominee(null)} 
    onApprove={handleApprove}
    isAlreadyApproved={popupNominee?.nominations[0]?.status === 'approved'} 
    isAlreadyRejected={popupNominee?.nominations[0]?.status === 'rejected'} 
  />
)}
      </main>
    </div>
  );
};

export default AdminDashboard;