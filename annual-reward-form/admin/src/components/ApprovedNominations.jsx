import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css'; // Reuses base layout rules for consistent UI

const ApprovedNominations = () => {
  const navigate = useNavigate();
  const [approvedList, setApprovedList] = useState([]);
  const [activeNomineeKey, setActiveNomineeKey] = useState(""); // Combines Name + Award Type for strict tracking
  const [activeNomineeData, setActiveNomineeData] = useState(null); // Stores full data of selected nominee
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null); // Holds blob object URL for live inline rendering
  const [pdfBlob, setPdfBlob] = useState(null); // Holds raw blob for clean structural downloading

  // 🗃️ DB Filter States
  const [divisions, setDivisions] = useState([]);
  const [awards, setAwards] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedAward, setSelectedAward] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

useEffect(() => {
  const fetchLiveApprovedData = async () => {
    try {
      const [divisionsRes, nominationsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/employees/divisions`),
        axios.get(`${API_BASE_URL}/nominations`) 
      ]);

      setDivisions(divisionsRes.data || []);

      if (nominationsRes.data) {
        // 1. Extract only unique awards from all configurations
        const uniqueAwards = [...new Set(nominationsRes.data.map(n => n.awardType).filter(Boolean))];
        setAwards(uniqueAwards);

        // 2. Filter approved items and strip out duplicate name + awardType pairs
        const seenPairs = new Set();
        const verifiedApproved = [];

        nominationsRes.data.forEach(nominee => {
          if (nominee.status === 'approved') {
            const compositeKey = `${nominee.employeeName}_${nominee.awardType}`;
            
            // Only push to array if we haven't encountered this specific worker + award combination yet
            if (!seenPairs.has(compositeKey)) {
              seenPairs.add(compositeKey);
              verifiedApproved.push({
                name: nominee.employeeName, 
                awardType: nominee.awardType,
                division: nominee.department || 'N/A', 
                totalScore: nominee.totalScore || nominee.score // Keeps fallback template values intact
              });
            }
          }
        });
          
        setApprovedList(verifiedApproved);
      }
    } catch (err) {
      console.error("Error fetching live data from database:", err);
    }
  };

  fetchLiveApprovedData();
}, [API_BASE_URL]);

  // 👁️ Fetches file data array stream and creates an inline blob view URL
  const handleSelectNominee = async (nominee) => {
    const uniqueKey = `${nominee.name}_${nominee.awardType}`;
    setActiveNomineeKey(uniqueKey);
    setActiveNomineeData(nominee);

    try {
      // Append awardType as a URL query parameter to filter multi-nominated employee rows accurately
      const targetUrl = `${API_BASE_URL}/nominations/download-pdf/${encodeURIComponent(nominee.name)}?awardType=${encodeURIComponent(nominee.awardType)}`;

      const response = await axios.get(targetUrl, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      setPdfBlob(blob);

      // Revoke old URL if it exists to preserve client system memory performance
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      const inlineUrl = URL.createObjectURL(blob);
      setPdfUrl(inlineUrl);
    } catch (error) {
      console.error("Failed to generate real-time live preview for PDF document:", error);
      alert("Could not load preview stream. Please confirm your server API instance is online.");
    }
  };

  // 📥 Forces browser download with clean nominee specific template naming rules
  const handleDownloadFileWithCustomName = () => {
    if (!pdfBlob || !activeNomineeData) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    const safeName = activeNomineeData.name.replace(/\s+/g, '_');
    const safeAward = activeNomineeData.awardType.replace(/\s+/g, '_');
    link.setAttribute('download', `${safeName}_${safeAward}_Nomination_Report.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemoveApproval = (nominee) => {
    if (!window.confirm(`Revoke approval for ${nominee.name} (${nominee.awardType}) and return to pending dashboard?`)) return;

    // Filtering items out based on unique name AND award combination matching pattern
    const updated = approvedList.filter(item => !(item.name === nominee.name && item.awardType === nominee.awardType));
    setApprovedList(updated);
    localStorage.setItem('approved_nominations', JSON.stringify(updated));

    const uniqueKey = `${nominee.name}_${nominee.awardType}`;
    if (activeNomineeKey === uniqueKey) {
      setActiveNomineeKey("");
      setActiveNomineeData(null);
      setPdfUrl(null);
      setPdfBlob(null);
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
    <div className={`dashboard-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button className="sidebar-toggle" onClick={() => setIsSidebarCollapsed(prev => !prev)}>☰</button>

      <aside className="sidebar">
        <div>
          {!isSidebarCollapsed && <div className="sidebar-header">Approved Nominations</div>}
          <nav className="sidebar-nav">
            <button onClick={() => navigate('/')}>
              <i className="fa-solid fa-chart-simple fa-fw"></i>
              <span>Pending Dashboard</span>
            </button>
            <button onClick={() => navigate('/admin/employees')}>
              <i className="fa-solid fa-users fa-fw"></i>
              <span>Manage Employees</span>
            </button>
            <button onClick={() => navigate('/admin/manage-client')}>
              <i className="fa-solid fa-award fa-fw"></i>
              <span>Manage Awards</span>
            </button>
          </nav>
        </div>
      </aside>

      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
        <h1 className="dashboard-header">📜 Approved Nominees Document Vault</h1>

        {/* 🛠️ FILTER CONTROLS BAR */}
        <div className="filters-container" style={{ display: 'flex', gap: '15px', padding: '15px', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="filter-group" style={{ flex: 'none' }}>
            <label className="filter-label">Filter by Division</label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="filter-select"
              style={{ minWidth: '180px', padding: '6px 12px' }}
            >
              <option value="">All Divisions</option>
              {divisions.map((div, index) => (
                <option key={index} value={div}>{div}</option>
              ))}
            </select>
          </div>

          <div className="filter-group" style={{ flex: 'none' }}>
            <label className="filter-label">Filter by Award Type</label>
            <select
              value={selectedAward}
              onChange={(e) => setSelectedAward(e.target.value)}
              className="filter-select"
              style={{ minWidth: '220px', padding: '6px 12px' }}
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
              className="btn btn-danger-outline table-action-btn"
              style={{ alignSelf: 'flex-end', height: '36px', minWidth: '100px' }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* 💻 SPLIT DISPLAY VIEWPORT */}
        <div style={{ display: 'flex', flex: 1, gap: '20px', minHeight: 0, paddingBottom: '20px' }}>

          {/* LEFT COLUMN: Nominee Cards Stack */}
          <div style={{ flex: '1', overflowY: 'auto', background: 'var(--mist2)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--fog)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--brand-primary)', letterSpacing: '0.5px', fontWeight: 'bold' }}>
              APPROVED BATCH LIST ({filteredList.length}) — Click an entry to preview its report
            </h3>

            {filteredList.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px', background: 'var(--card)', border: '1.5px dashed var(--fog)', borderRadius: 'var(--radius-sm)' }}>
                <div className="empty-icon">📑</div>
                <div className="empty-message">No matches found</div>
                <div className="empty-submessage">No approved entries match your current filter settings.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '15px' }}>
                {filteredList.map((nominee, i) => {
                  const currentUniqueKey = `${nominee.name}_${nominee.awardType}`;
                  const isActiveSelected = currentUniqueKey === activeNomineeKey;
                  return (
                    <div
                      key={i}
                      onClick={() => handleSelectNominee(nominee)}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        borderLeft: isActiveSelected ? '5px solid var(--status-approved)' : '5px solid var(--brand-accent)',
                        backgroundColor: isActiveSelected ? 'var(--color-success-bg)' : 'var(--card)',
                        boxShadow: isActiveSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        border: '1px solid var(--fog)',
                        borderLeftWidth: '5px',
                        color: 'var(--ink)'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--ink)', marginBottom: '6px', paddingRight: '20px' }}>
                        {nominee.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>🏆 {nominee.awardType}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span>🏢 {nominee.division?.toUpperCase()}</span>
                      </div>

                      {nominee.totalScore !== undefined && (
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--brand-primary)', background: 'var(--mist)', display: 'inline-block', padding: '2px 6px', borderRadius: '3px', marginTop: '5px', border: '1px solid var(--fog)' }}>
                          Score: {nominee.totalScore}
                        </div>
                      )}

                      <div style={{ marginTop: '10px', fontSize: '11px', color: isActiveSelected ? 'var(--status-approved)' : 'var(--brand-accent)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isActiveSelected ? '👀 Previewing Now' : '📄 Click to Open Document'}
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveApproval(nominee); }}
                        style={{ position: 'absolute', top: '12px', right: '12px', border: 'none', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', lineHeight: '1' }}
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

          {/* RIGHT COLUMN: Interactive Document Sandbox */}
          <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', background: 'var(--card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--fog)', overflow: 'hidden' }}>
            {pdfUrl ? (
              <React.Fragment>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'var(--mist2)', borderBottom: '1px solid var(--fog)', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--brand-primary)' }}>📋 {activeNomineeData?.name}'s Nomination File</span>

                    <div style={{ fontSize: '13px', color: 'var(--status-approved)', fontWeight: 'bold', background: 'var(--color-success-bg)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(4, 99, 7, 0.15)', marginTop: '4px', display: 'inline-block' }}>
                      💯 Reviewed Score Total: <span style={{ fontSize: '15px' }}>{activeNomineeData?.totalScore || activeNomineeData?.score || "N/A"}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadFileWithCustomName}
                    className="btn btn-primary"
                    style={{ height: 'fit-content', minWidth: 'auto', padding: '8px 16px' }}
                  >
                    📥 Download Document
                  </button>
                </div>
                <iframe
                  src={`${pdfUrl}#view=FitH`}
                  title="Live PDF Report Renderer Viewport"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </React.Fragment>
            ) : (
              <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '20px', textAlign: 'center', background: 'var(--mist)' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📑</div>
                <div style={{ fontWeight: 'bold', color: 'var(--ink)' }}>No Document Selected</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '300px' }}>
                  Select an approved nominee profile on the left pane to view their comprehensive report.
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default ApprovedNominations;