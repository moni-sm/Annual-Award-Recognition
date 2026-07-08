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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // 👈 toggle state
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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

      // 3. Prepare data for Excel
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

      // 4. Create worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Nominations");

      // 5. Generate file name with current date
      const fileName = `Nominations_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;

      // 6. Write and download the file
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
            <button className="download-excel-btn" onClick={handleExcel} disabled={!filtered.length}>
              📥 Download Excel
            </button>
            {!isSidebarCollapsed && (
              <div style={{
                marginTop: '1rem',
                backgroundColor: '#242121ff',  // medium gray background for the box
                padding: '0.5rem 1rem',      // some padding for better spacing
                borderRadius: '6px'          // rounded corners to match dropdown
              }}>
                <label style={{ color: 'white', marginRight: '0.5rem' }}>
                  Filter by Division:
                </label>
                <select
                  value={selectedDivision}
                  onChange={e => setSelectedDivision(e.target.value)}
                  style={{
                    width: '100%',
                    borderRadius: '6px',
                    padding: '6px',
                    backgroundColor: '#363434ff',  // slightly lighter gray for the dropdown itself
                    color: 'white',
                    border: 'none',              // optional: remove default border for cleaner look
                    outline: 'none',
                    appearance: 'none',          // hides default arrow in some browsers for custom styling
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    cursor: 'pointer'
                  }}
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

        {/* {(selectedYear !== null && selectedMonth !== null) && (
          <h3 style={{ textAlign: 'center', marginBottom: '20px', color:'grey'}}>
            Showing nominations for: <strong>
              {[
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
              ][selectedMonth]} {selectedYear}
            </strong>
            {selectedDivision && ` | Division: ${selectedDivision}`}
          </h3>
        )} */}

        {winners.length === 1 && (
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-title">Top Winner</div>
              <div className="stat-value">
                {winners[0].name} ({winners[0].count})
              </div>
              <div>{winners[0].division}</div>
            </div>
          </div>
        )}

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

