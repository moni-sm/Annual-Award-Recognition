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
  const [activeMenu, setActiveMenu] = useState(null); 

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
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

      if (nominationsRes.data.length && selectedYear === null) {
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

  useEffect(() => {
    fetchAllData();
  }, [API_BASE_URL]);

  const handleSubmissionStatusUpdate = async (submissionId, status) => {
    try {
      await axios.patch(`${API_BASE_URL}/nominations/status`, {
        nominationId: submissionId, 
        status: status
      });
  const [nominationsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/nominations`),
        axios.get(`${API_BASE_URL}/nominations/stats`)
      ]);

      setNominations(nominationsRes.data);
      setApprovedNomineesCount(statsRes.data.approved || 0);
      setRejectedNomineesCount(statsRes.data.rejected || 0);
  if (popupNominee) {
        const updatedNominationList = nominationsRes.data.filter(n =>
          n.employeeName?.toLowerCase() === popupNominee.name?.toLowerCase() &&
          n.awardType === popupNominee.awardType
        );
        setPopupNominee(prev => ({
          ...prev,
          count: updatedNominationList.length,
          nominations: updatedNominationList
        }));
      }
    } catch (err) {
      console.error(`Failed to update status to ${status}:`, err);
      alert("Could not update status on DB server.");
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all nominations permanently?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/nominations`);
      alert('Deleted successfully');
      window.location.reload();
    } catch (err) {
      console.error("Failed to clear data:", err);
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

  const totalPages = Math.ceil(grouped.length / rowsPerPage);

  const nomineeGenderStats = useMemo(() => {
    const uniqueNomineeIds = [...new Set(nominations.map(n => n.employeeId))];
    const nomineeEmployees = employees.filter(emp =>
      uniqueNomineeIds.some(id => String(id).trim().toLowerCase() === String(emp.empId).trim().toLowerCase())
    );
    const male = nomineeEmployees.filter(emp => emp.gender?.toLowerCase() === "m" || emp.gender?.toLowerCase() === "male").length;
    const female = nomineeEmployees.filter(emp => emp.gender?.toLowerCase() === "f" || emp.gender?.toLowerCase() === "female").length;
    return { male, female };
  }, [nominations, employees]);

  const paginatedGrouped = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return grouped.slice(start, start + rowsPerPage);
  }, [grouped, currentPage]);

  const handleExcel = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/nominations/download/all`);
      let nominationsData = response.data.data || response.data;
      if (!nominationsData || !Array.isArray(nominationsData)) return;

      const data = nominationsData.map(nomination => ({
        Nominee: nomination.employeeName || 'N/A',
        EmployeeID: nomination.employeeId || 'N/A',
        Department: nomination.department || 'N/A',
        Designation: nomination.designation || 'N/A',
        Award: nomination.awardType || 'N/A',
        Justification: nomination.justification || 'N/A',
        NominatorName: nomination.nominatorName || 'N/A',
        CreatedAt: new Date(nomination.createdAt).toLocaleString(),
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Nominations");
      XLSX.writeFile(wb, `Nominations_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Error generating Excel file:", error);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [colFilterNominee, colFilterAward, colFilterDivision, selectedDivision, selectedMonth, selectedYear]);

  return (
    <div className={`dashboard-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button className="sidebar-toggle" onClick={() => setIsSidebarCollapsed(prev => !prev)}>☰</button>

      <aside className="sidebar">
        <div>
          {!isSidebarCollapsed && <div className="sidebar-header">Admin</div>}
          <nav className="sidebar-nav">
            <button onClick={() => navigate('/admin/employees')}>
              <i className="fa-solid fa-users fa-fw"></i>
              <span>Manage Employees</span>
            </button>
            <button onClick={() => navigate('/admin/manage-client')}>
              <i className="fa-solid fa-award fa-fw"></i>
              <span>Manage Awards</span>
            </button>
            <button onClick={() => navigate('/admin/approved')}>
              <i className="fa-solid fa-file-signature fa-fw"></i>
              <span>Approved Nominees ({approvedNomineesCount})</span>
            </button>
            <button className="download-excel-btn" onClick={handleExcel} disabled={!filtered.length}>
              <i className="fa-solid fa-file-excel fa-fw"></i>
              <span>Download Excel</span>
            </button>
          </nav>
        </div>
        <button onClick={handleDeleteAll} className="delete-btn">
          <i className="fa-solid fa-trash-can fa-fw"></i>
          <span>Delete All Nominations</span>
        </button>
      </aside>

      <main className="main-content">
        <h1 className="dashboard-header">Admin Dashboard</h1>

        <div className="stats-container">
          <div className="stat-card"><div className="stat-title">Total Nominations</div><div className="stat-value">{filtered.length}</div></div>
          <div className="stat-card">
            <div className="stat-title">Unique Nominees</div>
            <div className="stat-value">{grouped.length}</div>
            <div className="stat-description"><span>Male: {nomineeGenderStats.male}</span> | <span>Female: {nomineeGenderStats.female}</span></div>
          </div>
          <div className="stat-card"><div className="stat-title">Approved List</div><div className="stat-value">{approvedNomineesCount}</div></div>
          <div className="stat-card"><div className="stat-title">Rejected List</div><div className="stat-value">{rejectedNomineesCount}</div></div>
        </div>

        <div className="nominations-container">
          <h2 className="nominations-header">Nominations</h2>
          <table className="nominations-table">
            <thead>
              <tr>
                <th ref={nomineeMenuRef}>Nominee</th>
                <th ref={awardMenuRef}>Award Type</th>
                <th>Designation</th>
                <th ref={divisionMenuRef}>Division</th>
                <th>Count</th> 
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {grouped.length > 0 ? (
                paginatedGrouped.map((nominee, idx) => {
                  const allApproved = nominee.nominations.every(n => n.status === 'approved');
                  const allRejected = nominee.nominations.every(n => n.status === 'rejected');
                  const overallStatus = allApproved ? 'Approved' : allRejected ? 'Rejected' : 'Pending';

                  return (
                    <tr key={idx}>
                      <td>{nominee.name}</td>
                      <td>{nominee.awardType}</td>
                      <td>{nominee.designation}</td>
                      <td>{nominee.division}</td>
                      <td><span className="nomination-score-badge">{nominee.count}</span></td>
                      <td>
                        {overallStatus === 'Approved' && (
                          <span className="status-approved-badge" style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Approved</span>
                        )}
                        {overallStatus === 'Rejected' && (
                          <span className="status-rejected-badge" style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Rejected</span>
                        )}
                        {overallStatus === 'Pending' && (
                          <span className="status-pending-badge" style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: '#e07437', color: '#fff', display: 'inline-block' }}>Pending</span>
                        )}
                      </td>
                      <td>
                        <button 
                          onClick={() => setPopupNominee(nominee)}
                          className="btn btn-success-outline table-action-btn"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="7"><div className="empty-state"><div className="empty-message">No nominations found</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {popupNominee && (
          <NomineePopup 
            nominee={popupNominee} 
            onClose={() => setPopupNominee(null)} 
            onStatusUpdate={handleSubmissionStatusUpdate}
          />
        )}

        {grouped.length > rowsPerPage && (
          <div className="pagination">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>◀ Previous</button>
            {Array.from({ length: totalPages }, (_, index) => (
              <button key={index} className={currentPage === index + 1 ? "active-page" : ""} onClick={() => setCurrentPage(index + 1)}>{index + 1}</button>
            ))}
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next ▶</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;