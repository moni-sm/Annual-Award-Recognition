import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css'; // Reuses base layout rules for consistent UI

const ApprovedNominations = () => {
  const navigate = useNavigate();
  const [approvedList, setApprovedList] = useState([]);
  const [activeNomineeName, setActiveNomineeName] = useState("");

  // 🗃️ DB Filter States
  const [divisions, setDivisions] = useState([]);
  const [awards, setAwards] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedAward, setSelectedAward] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://annual-award-nom.onrender.com/api';

  useEffect(() => {
    // 1. Load LocalStorage Approved List
    const saved = localStorage.getItem('approved_nominations');
    if (saved) {
      setApprovedList(JSON.parse(saved));
    }

    // 2. Fetch Filter Configurations from DB
    const fetchFilterData = async () => {
      try {
        const [divisionsRes, nominationsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/employees/divisions`),
          axios.get(`${API_BASE_URL}/nominations`)
        ]);

        // Set divisions array
        setDivisions(divisionsRes.data || []);

        // Extract unique award types from database nominations
        if (nominationsRes.data) {
          const uniqueAwards = [...new Set(nominationsRes.data.map(n => n.awardType).filter(Boolean))];
          setAwards(uniqueAwards);
        }
      } catch (err) {
        console.error("Error fetching filter options from database:", err);
      }
    };

    fetchFilterData();
  }, [API_BASE_URL]);

  // 📥 Triggers a direct file download in the browser
  const handleDownloadPdf = (name) => {
    setActiveNomineeName(name);
    const targetUrl = `${API_BASE_URL}/nominations/download-pdf/${encodeURIComponent(name)}`;
    
    const link = document.createElement('a');
    link.href = targetUrl;
    link.setAttribute('download', `${name}_Nomination_Report.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemoveApproval = (name) => {
    if (!window.confirm(`Revoke approval for ${name} and return to pending dashboard?`)) return;
    const updated = approvedList.filter(item => item.name !== name);
    setApprovedList(updated);
    localStorage.setItem('approved_nominations', JSON.stringify(updated));
    
    if (activeNomineeName === name) {
      setActiveNomineeName("");
    }
  };

  // 🔍 Filter the display list dynamically based on user selections
  const filteredList = useMemo(() => {
    return approvedList.filter(nominee => {
      const matchDivision = selectedDivision 
        ? nominee.division?.toLowerCase() === selectedDivision.toLowerCase() 
        : true;
      const matchAward = selectedAward 
        ? nominee.awardType?.toLowerCase() === selectedAward.toLowerCase() 
        : true;
      return matchDivision && matchAward;
    });
  }, [approvedList, selectedDivision, selectedAward]);

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div>
          <div className="sidebar-header">Navigation</div>
          <nav className="sidebar-nav">
            <button onClick={() => navigate('/admin')}>📊 Pending Dashboard</button>
            <button onClick={() => navigate('/admin/employees')}>👥 Manage Employees</button>
            <button onClick={() => navigate('/admin/manage-client')}>🎯 Manage Awards</button>
          </nav>
        </div>
      </aside>

      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
        <h1 className="dashboard-header">📜 Approved Nominees Document Vault</h1>

        {/* 🛠️ FILTER CONTROLS BAR */}
        <div style={{ display: 'flex', gap: '15px', background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e0e0e0', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Filter by Division</label>
            <select 
              value={selectedDivision} 
              onChange={(e) => setSelectedDivision(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '180px', background: '#fff' }}
            >
              <option value="">All Divisions</option>
              {divisions.map((div, index) => (
                <option key={index} value={div}>{div}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Filter by Award Type</label>
            <select 
              value={selectedAward} 
              onChange={(e) => setSelectedAward(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '220px', background: '#fff' }}
            >
              <option value="">All Award Types</option>
              {awards.map((award, index) => (
                <option key={index} value={award}>{award}</option>
              ))}
            </select>
          </div>

          {(selectedDivision || selectedAward) && (
            <button 
              onClick={() => { setSelectedDivision(""); setSelectedAward(""); }}
              style={{ marginTop: '20px', padding: '8px 15px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flex: 1, gap: '20px', minHeight: 0, paddingBottom: '20px' }}>
          
          {/* FULL WIDTH STACK OF NOMINEES (CLEAN GRID/LIST VIEW) */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#f9f9f9', borderRadius: '8px', padding: '20px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#555', letterSpacing: '0.5px', fontWeight: 'bold' }}>
              APPROVED BATCH LIST ({filteredList.length}) — Click an entry to download its PDF
            </h3>
            
            {filteredList.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontStyle: 'italic', background: '#fff', borderRadius: '6px', border: '1px dashed #ccc' }}>
                No approved entries match your current filter settings.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {filteredList.map((nominee, i) => {
                  const isLastDownloaded = nominee.name === activeNomineeName;
                  return (
                    <div 
                      key={i}
                      onClick={() => handleDownloadPdf(nominee.name)}
                      style={{
                        padding: '16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        borderLeft: isLastDownloaded ? '5px solid #2e7d32' : '5px solid #4CAF50',
                        backgroundColor: isLastDownloaded ? '#ffffff' : '#ffffff',
                        boxShadow: isLastDownloaded ? '0 0 8px rgba(46, 125, 50, 0.2)' : '0 2px 4px rgba(0,0,0,0.04)',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        border: '1px solid #e0e0e0',
                        borderLeftWidth: '5px'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#222', marginBottom: '6px', paddingRight: '20px' }}>
                        {nominee.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>🏆 {nominee.awardType}</div>
                      <div style={{ fontSize: '12px', color: '#777' }}>
                        <span>🏢 {nominee.division?.toUpperCase()}</span>
                      </div>
                      <div style={{ marginTop: '10px', fontSize: '11px', color: isLastDownloaded ? '#2e7d32' : '#4CAF50', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isLastDownloaded ? '✅ Downloaded' : '📥 Click to Download PDF'}
                      </div>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRemoveApproval(nominee.name); }}
                        style={{ position: 'absolute', top: '12px', right: '12px', border: 'none', background: 'transparent', color: '#f44336', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', lineHeight: '1' }}
                        title="Revoke Approval"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default ApprovedNominations;