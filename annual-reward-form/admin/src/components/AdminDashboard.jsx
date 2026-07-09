import React, { useEffect, useState, useMemo } from 'react';
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
  
  // 👈 State to track approved nominees (stores approved nominee names)
  const [approvedNominees, setApprovedNominees] = useState([]);

  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://annual-award-nom.onrender.com/api';

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
    if (!window.confirm('Are you sure you want to delete all nominations permanently from the database?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/nominations`);
      alert('Deleted successfully');
      window.location.reload();
    } catch (err) {
      console.error("Failed to clear database data:", err);
      alert('Failed to delete data. Please check if your backend terminal is up and active.');
    }
  };

  // Handler for approving a nominee
  const handleApprove = async (nominee) => {
    try {
      // Optional: Uncomment when your backend API is ready
      // await axios.put(`${API_BASE_URL}/nominations/approve/${nominee.name}`);
      
      // Add to approved list state dynamically
      setApprovedNominees(prev => [...prev, nominee.name]);
      alert(`Successfully approved: ${nominee.name}`);
    } catch (err) {
      console.error("Error approving nominee:", err);
      alert("Failed to approve nominee.");
    }
  };

  // Handler for rejecting a nominee
  const handleReject = async (nominee) => {
    if (!window.confirm(`Are you sure you want to reject ${nominee.name}?`)) return;
    try {
      // Optional: Connect to your backend endpoint
      // await axios.delete(`${API_BASE_URL}/nominations/reject/${nominee.name}`);
      alert(`Rejected: ${nominee.name}`);
    } catch (err) {
      console.error("Error rejecting nominee:", err);
    }
  };

  // Handler for downloading a PDF for the nominee
  const handleDownloadPDF = async (nominee) => {
    try {
      // window.open(`${API_BASE_URL}/nominations/download-pdf/${nominee.name}`, '_blank');
      alert(`Downloading PDF report for ${nominee.name}...`);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to download PDF.");
    }
  };

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

      const key = nomination.employeeName || 'N/A';
      if (!map[key]) {
        map[key] = {
          name: key,
          designation: employee?.designation || nomination.designation || 'N/A',
          division: employee?.division || 'N/A',
          count: 0,
          nominations: []
        };
      }
      map[key].count++;
      map[key].nominations.push(nomination);
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [filtered, employees]);

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
            <button className="download-excel-btn" onClick={handleExcel} disabled={!filtered.length}>
              📥 Download Excel
            </button>
            {!isSidebarCollapsed && (
              <div style={{ marginTop: '1rem', backgroundColor: 'rgb(180, 180, 248)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                <label style={{ color: 'white', marginRight: '0.5rem' }}>Filter by Division:</label>
                <select
                  value={selectedDivision}
                  onChange={e => setSelectedDivision(e.target.value)}
                  style={{ width: '100%', borderRadius: '6px', padding: '6px', backgroundColor: 'rgb(242, 195, 155)', color: 'white', border: 'none', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">ALL DIVISIONS</option>
                  {divisions.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                </select>
              </div>
            )}
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

        <div className="nominations-container">
          <h2 className="nominations-header">📋 Nominations</h2>
          <table className="nominations-table">
            <thead>
              <tr>
                <th>Nominee</th>
                <th>Award Type</th>
                <th>Designation</th>
                <th>Division</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {grouped.length > 0 ? (
                grouped.map((nominee, idx) => {
                  // 👈 Check if this specific nominee is already approved
                  const isApproved = approvedNominees.includes(nominee.name);

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
                        <div className="action-buttons-cell" style={{ display: 'flex', gap: '8px' }}>
                          {isApproved ? (
                            // 👈 Show ONLY Download PDF if approved
                            <button 
                              className="download-pdf-btn" 
                              onClick={() => handleDownloadPDF(nominee)}
                              style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #2196F3', backgroundColor: '#e3f2fd', color: '#2196F3', fontWeight: 'bold' }}
                            >
                              📄 Download PDF
                            </button>
                          ) : (
                            // 👈 Show Approve/Reject if NOT approved yet
                            <>
                              <button 
                                className="approve-btn" 
                                onClick={() => handleApprove(nominee)}
                                style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #4CAF50', backgroundColor: '#e8f5e9', color: '#4CAF50', fontWeight: 'bold' }}
                              >
                                ✅ Approve
                              </button>
                              <button 
                                className="reject-btn" 
                                onClick={() => handleReject(nominee)}
                                style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #f44336', backgroundColor: '#ffebee', color: '#f44336', fontWeight: 'bold' }}
                              >
                                ❌ Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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