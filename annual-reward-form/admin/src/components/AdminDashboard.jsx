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

 
  const [colFilterAward, setColFilterAward] = useState('');
  const [colFilterDivision, setColFilterDivision] = useState('');
  const [activeMenu, setActiveMenu] = useState(null); // 'award' | 'division' | null

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
        console.error("Error fetching data from the server:", err);
      }
    };
    fetchAllData();
  }, []);

  const handleDeleteAll = async () => {
    if (!window.confirm(' Are you sure you want to delete all nominations permanently from the database?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/nominations`);
      alert(' Deleted successfully ');
      window.location.reload();
    } catch (err) {
      console.error(" Failed to clear database data:", err);
      alert(' Failed to delete data. Please check if your backend terminal is up and active.');
    }
  };
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
  if (colFilterAward && awardType !== colFilterAward) return;
      if (colFilterDivision && empDivision !== colFilterDivision) return;

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
  }, [filtered, employees, colFilterAward, colFilterDivision]);

  const winners = useMemo(() => {
    if (grouped.length === 0) return [];
    const topCount = grouped[0].count;
    const tied = grouped.filter(n => n.count === topCount);
    return tied.length === 1 ? tied : [];
  }, [grouped]);

  const handleExcel = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/nominations/download/all`);

      let nominationsData = response.data;
      if (nominationsData && nominationsData.data) {
        nominationsData = nominationsData.data;
      }

      if (!nominationsData || !Array.isArray(nominationsData)) {
        console.error("Invalid nominations data:", nominationsData);
        alert("No valid nominations data found!");
        return;
      }

      if (nominationsData.length === 0) {
        alert("No nominations found to export!");
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
      alert("Failed to export nominations to Excel. Please check console for details.");
    }
  };

  return (
    <div className={`dashboard-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setIsSidebarCollapsed(prev => !prev)}
      >
        ☰
      </button>

      <aside className="sidebar">
        <div>
          {!isSidebarCollapsed && <div className="sidebar-header">Admin</div>}
          <nav className="sidebar-nav">
            <button onClick={() => navigate('/admin/employees')}>👥 Manage Employees</button>
            <button onClick={() => navigate('/admin/manage-client')}>🎯 Manage Awards</button>
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
        </div>

     
        {(colFilterAward || colFilterDivision) && (
          <div className="active-filters-ribbon">
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
                <th>Nominee</th>
                
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
              </tr>
            </thead>
            <tbody>
              {grouped.length > 0 ? (
                grouped.map((nominee, idx) => (
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
                      <span className="nomination-score-badge">
                        {nominee.count}
                      </span> 
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5"> 
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
          <NomineePopup nominee={popupNominee} onClose={() => setPopupNominee(null)} />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;