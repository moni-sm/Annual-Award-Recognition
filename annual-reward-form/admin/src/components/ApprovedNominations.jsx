import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
 
const ApprovedNominations = () => {
  const navigate = useNavigate();
  const [approvedList, setApprovedList] = useState([]);
  const [activeNomineeKey, setActiveNomineeKey] = useState("");
  const [activeNomineeData, setActiveNomineeData] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
 
  // 🪟 Popup & Scoring Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNominee, setEditingNominee] = useState(null);
  const [scores, setScores] = useState({});
  const [scoringGuides, setScoringGuides] = useState({});
  const [isSavingScores, setIsSavingScores] = useState(false);
 
  // 🗃️ DB Filter States
  const [divisions, setDivisions] = useState([]);
  const [awards, setAwards] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedAward, setSelectedAward] = useState("");
 
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
 
  useEffect(() => {
    const fetchLiveApprovedData = async () => {
      try {
        const [divisionsRes, nominationsRes, guidesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/employees/divisions`),
          axios.get(`${API_BASE_URL}/nominations`),
          axios.get(`${API_BASE_URL}/nominations/scoring-guides`).catch(() => ({ data: {} }))
        ]);
 
        setDivisions(divisionsRes.data || []);
        setScoringGuides(guidesRes.data || {});
 
        if (nominationsRes.data) {
          const uniqueAwards = [...new Set(nominationsRes.data.map(n => n.awardType).filter(Boolean))];
          setAwards(uniqueAwards);
 
          const seenPairs = new Set();
          const verifiedApproved = [];
 
          nominationsRes.data.forEach(nominee => {
            if (nominee.status === 'approved') {
              const compositeKey = `${nominee.employeeName}_${nominee.awardType}`;
             
              if (!seenPairs.has(compositeKey)) {
                seenPairs.add(compositeKey);
                verifiedApproved.push({
                  id: nominee._id,
                  name: nominee.employeeName,
                  awardType: nominee.awardType,
                  division: nominee.department || 'N/A',
                  totalScore: nominee.totalScore || nominee.score,
                  scores: nominee.scores || {}
                });
              } else {
                const existingItem = verifiedApproved.find(item => item.name === nominee.employeeName && item.awardType === nominee.awardType);
                if (existingItem && nominee.scores && Object.keys(nominee.scores).length > 0) {
                  existingItem.scores = { ...existingItem.scores, ...nominee.scores };
                }
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
  const handleSelectNominee = async (nominee, updatedScores = null) => {
    const uniqueKey = `${nominee.name}_${nominee.awardType}`;
    const targetScores = updatedScores || nominee.scores || {};
   
    const nomineeWithScores = {
      ...nominee,
      scores: targetScores
    };
 
    setActiveNomineeKey(uniqueKey);
    setActiveNomineeData(nomineeWithScores);
 
    try {
      const targetUrl = `${API_BASE_URL}/nominations/download-pdf/${encodeURIComponent(nominee.name)}?awardType=${encodeURIComponent(nominee.awardType)}&t=${Date.now()}`;
 
      const response = await axios.get(targetUrl, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      setPdfBlob(blob);
 
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
 
 const defaultCriteriaList = [
    "Outcome Rating",
    "Quality and Timeliness Rating",
    "Initiative Rating",
    "Team Collaboration Rating"
  ];
 
  const getCriteriaForAward = (awardType) => {
    if (!awardType || !scoringGuides || Object.keys(scoringGuides).length === 0) {
      return defaultCriteriaList;
    }
 
    const targetKey = String(awardType).trim().toLowerCase();
    const matchedAwardKey = Object.keys(scoringGuides).find(
      (key) => key.trim().toLowerCase() === targetKey
    );
 
    if (matchedAwardKey && scoringGuides[matchedAwardKey]) {
      const keys = Object.keys(scoringGuides[matchedAwardKey]);
      if (keys.length > 0) return keys;
    }
 
    return defaultCriteriaList;
  };
 
  // 📝 Open Edit Modal & Load Existing Scores
  const handleOpenEditModal = (nominee) => {
    setEditingNominee(nominee);
    setScores(nominee.scores || {});
    setIsEditModalOpen(true);
  };
 
  const handleClearScores = () => {
    setScores({});
  };
 
  // 💾 Save Scores via Popup Modal and Force Refresh PDF Preview
  const handleSaveScoresFromModal = async () => {
    if (!editingNominee) return;
    setIsSavingScores(true);
 
    try {
      await axios.patch(`${API_BASE_URL}/nominations/scores`, {
        employeeName: editingNominee.name,
        awardType: editingNominee.awardType,
        scores: scores
      });
 
      // 1. Update local list state with the updated scores
      const updatedList = approvedList.map(item =>
        item.name === editingNominee.name && item.awardType === editingNominee.awardType
          ? { ...item, scores: { ...scores } }
          : item
      );
      setApprovedList(updatedList);
 
      // 2. Refresh active nominee data and force PDF preview regeneration
      const updatedNominee = { ...editingNominee, scores: { ...scores } };
      await handleSelectNominee(updatedNominee, scores);
 
      setIsEditModalOpen(false);
      alert("Scores updated and PDF refreshed successfully!");
    } catch (err) {
      console.error("Error saving scores:", err);
      alert("Failed to save scores. Please try again.");
    } finally {
      setIsSavingScores(false);
    }
  };
 
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
 
  const handleDownloadAllApprovedPDFs = async () => {
    if (filteredList.length === 0) return;
    setIsBulkDownloading(true);
 
    try {
      const queryParams = new URLSearchParams();
      if (selectedDivision) queryParams.append('division', selectedDivision);
      if (selectedAward) queryParams.append('awardType', selectedAward);
 
      const targetUrl = `${API_BASE_URL}/nominations/download-bulk-archive?${queryParams.toString()}`;
     
      const response = await axios.get(targetUrl, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/zip' });
     
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'Approved_Nominations_Documents_Package.zip');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Bulk zipped package download pipeline failed:", error);
      alert("Failed to build or stream the compressed document archive package.");
    } finally {
      setIsBulkDownloading(false);
    }
  };
 
  return (
    <div className={`dashboard-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div>
          {!isSidebarCollapsed && <div className="sidebar-header">Approved Section</div>}
          <nav className="sidebar-nav">
            <button onClick={() => navigate('/')}>
              <i className="fa-solid fa-chart-simple fa-fw"></i>
              <span>Dashboard</span>
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
 
          <button
            onClick={handleDownloadAllApprovedPDFs}
            disabled={isBulkDownloading || filteredList.length === 0}
            className="btn btn-primary"
            style={{
              alignSelf: 'flex-end',
              height: '36px',
              padding: '0 16px',
              backgroundColor: 'var(--brand-primary)',
              opacity: filteredList.length === 0 ? 0.5 : 1
            }}
          >
            {isBulkDownloading ? "⏳ Processing..." : `📥 Bulk Download All PDFs (${filteredList.length})`}
          </button>
 
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
 
          {/* RIGHT COLUMN: Document Viewer Pane with Top Header Actions */}
          <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', background: 'var(--card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--fog)', overflow: 'hidden' }}>
            {pdfUrl ? (
              <React.Fragment>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'var(--mist2)', borderBottom: '1px solid var(--fog)', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--brand-primary)' }}>📋 {activeNomineeData?.name}'s Nomination File</span>
                  </div>
 
                  {/* 🔘 ACTION BUTTONS: VIEW/EDIT SCORES + DOWNLOAD PDF */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleOpenEditModal(activeNomineeData)}
                      className="btn btn-secondary"
                      style={{ height: 'fit-content', padding: '8px 14px', fontSize: '13px' }}
                    >
                      ✏️ View / Edit PDF
                    </button>
 
                    <button
                      onClick={handleDownloadFileWithCustomName}
                      className="btn btn-primary"
                      style={{ height: 'fit-content', padding: '8px 16px', fontSize: '13px' }}
                    >
                      📥 Download Document
                    </button>
                  </div>
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
 
      {/* 🪟 EDIT SCORING POPUP MODAL */}
      {isEditModalOpen && editingNominee && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: '8px', padding: '24px', width: '480px', maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#1a1a1a' }}>
                  ✏️ Edit Scores & Rating: {editingNominee.name}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--brand-primary)', marginTop: '2px', fontWeight: 'bold' }}>
                  Award: {editingNominee.awardType}
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}
              >
                ×
              </button>
            </div>
 
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
              {getCriteriaForAward(editingNominee.awardType).map((criteria, idx) => {
                const criteriaTitle = criteria.replace(/\s*\(Weight:\s*\d+\)/i, "").trim();
                const cleanKey = criteriaTitle.toLowerCase();
                const currentValue = scores[cleanKey] ?? scores[criteriaTitle] ?? scores[criteria] ?? "";
 
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
                      {criteria}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      placeholder="Score (1-5)"
                      value={currentValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        setScores(prev => ({
                          ...prev,
                          [cleanKey]: val,
                          [criteriaTitle]: val,
                          [criteria]: val
                        }));
                      }}
                      style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' }}
                    />
                  </div>
                );
              })}
            </div>
 
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <button
                onClick={handleClearScores}
                type="button"
                className="btn btn-danger-outline"
                style={{ padding: '6px 14px', fontSize: '13px' }}
              >
                🗑️ Clear Scores
              </button>
 
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveScoresFromModal}
                  disabled={isSavingScores}
                  className="btn btn-primary"
                  style={{ padding: '6px 16px' }}
                >
                  {isSavingScores ? "Saving..." : "Update PDF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default ApprovedNominations;
 