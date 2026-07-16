import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import "./NominationForm.css";
import bgimage from '../assets/bgimage.jpg';

// Reusable Auto-resizing Textarea component
const AutoResizingTextarea = ({ id, required, value, onChange, placeholder }) => {
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; 
      textarea.style.height = `${textarea.scrollHeight}px`; 
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      id={id}
      ref={textareaRef}
      required={required}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows="4"
      style={{ overflowY: "hidden", resize: "none" }} 
    />
  );
};

const NominationForm = ({ user, onLogout }) => {
  const [employees, setEmployees] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customAnswers, setCustomAnswers] = useState({});
  const [checkboxValues, setCheckboxValues] = useState({});
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // View & Modal tracking states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [viewMode, setViewMode] = useState(false); // Controls the "View Nomination / PDF Download Summary" layout
  const [submittedData, setSubmittedData] = useState(null); // Keeps a snapshot of submitted data for the review panel
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [modalSelectedAward, setModalSelectedAward] = useState(null);

  const pdfPrintAreaRef = useRef(null);
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  const [questionMap, setQuestionMap] = useState({});
  const [description, setDescription] = useState({});
  const [scoringGuides, setScoringGuides] = useState({});
  const [eligibleDesignations, setEligibleDesignations] = useState({});

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const formattedMonthYear = `${currentYear - 1}-${currentYear}`;

  const financialYearEnd = new Date(currentYear, 2, 31);
  const minimumTenureDate = new Date(financialYearEnd);
  minimumTenureDate.setMonth(minimumTenureDate.getMonth() - 9);

  const isEmployeeEligibleForNomination = (employee) => {
    if (!employee?.doj) return false;
    const dojDate = new Date(employee.doj);
    if (Number.isNaN(dojDate.getTime())) return false;
    return dojDate <= minimumTenureDate;
  };

  const [awardQuestions, setAwardQuestions] = useState([]);
  const [form, setForm] = useState({
    employeeName: "",
    employeeId: "",
    employeeEmail: "",
    department: "",
    designation: "",
    yearOfNomination: formattedMonthYear,
    awardType: "",
    nominatorName: user?.name || "",
    nominatorDept: user?.department || "",
    nominatorDesig: user?.designation || "",
    nominatorEmail: user?.email || "",
    projectOrCustomer: "",
    submissionDate: new Date().toISOString().split('T')[0]
  });

  const [focusedScoringField, setFocusedScoringField] = useState(null);

  const scoringHeaderIndex = awardQuestions.findIndex(
    (q) => q.type === "section" && q.title.toLowerCase().includes("scoring weight")
  );

  const justificationQuestions = scoringHeaderIndex !== -1
    ? awardQuestions.slice(0, scoringHeaderIndex)
    : awardQuestions;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [employeesRes, divisionsRes, awardsRes] = await Promise.all([
          axios.get(`${baseUrl}/employees`),
          axios.get(`${baseUrl}/employees/divisions`),
          axios.get(`${baseUrl}/award-config/export/client-format`),
        ]);

        setEmployees(employeesRes.data);
        setDivisions(divisionsRes.data);
        setQuestionMap(awardsRes.data.questionMap || {});
        setDescription(awardsRes.data.descriptions || {});
        setScoringGuides(awardsRes.data.scoringGuides || {});
        setEligibleDesignations(awardsRes.data.eligibleDesignations || {});
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load backend system configuration details. Please try again.");
        setIsLoading(false);
      }
    };
    fetchData();
  }, [baseUrl]);

  const getFilteredAwards = useMemo(() => {
    return () => {
      return Object.keys(questionMap).filter((award) => {
        const userDesignation = form.nominatorDesig || user?.designation || "";
        if (!userDesignation) return true;

        const desig = userDesignation.toLowerCase();
        const allowed = eligibleDesignations[award] || [];

        if (allowed.length === 0) return true;
        return allowed.some(a => desig.includes(a.toLowerCase()));
      });
    };
  }, [questionMap, eligibleDesignations, form.nominatorDesig, user?.designation]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "division") {
      setSelectedDivision(value);
      setForm((prev) => ({
        ...prev,
        employeeName: "",
        employeeId: "",
        employeeEmail: "",
        department: "",
        designation: "",
      }));
      return;
    }

    if (name === "awardType") {
      setAwardQuestions(questionMap[value] || []);
      setCustomAnswers({});
      setCheckboxValues({});
      setFocusedScoringField(null);
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "employeeName") {
      const employee = employees.find((emp) => emp.name === value);
      if (employee) {
        setForm((prev) => ({
          ...prev,
          employeeId: employee.empId,
          department: employee.department,
          designation: employee.designation,
          employeeEmail: employee.email,
        }));
      }
    }
  };

  const handleCustomAnswerChange = (question, value) => {
    setCustomAnswers(prev => ({ ...prev, [question]: value }));
    if (question === "Project / Customer Name") {
      setForm(prev => ({ ...prev, projectOrCustomer: value }));
    }
  };

  const handleCheckboxChange = (question, option, isChecked) => {
    setCheckboxValues(prev => {
      const currentValues = prev[question] || [];
      return {
        ...prev,
        [question]: isChecked
          ? [...currentValues, option]
          : currentValues.filter(item => item !== option)
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const answers = awardQuestions
        .filter(q => q.type !== "section") 
        .flatMap((q) => {
          if (q.type === "checkbox") {
            return [{
              question: q.question,
              answer: checkboxValues[q.question]?.join(", ") || ""
            }];
          }
          return [{
            question: q.question,
            answer: customAnswers[q.question] || ""
          }];
        });

      const dataToSend = { ...form, answers };
      await axios.post(`${baseUrl}/nominations`, dataToSend);
      
      setSubmittedData(dataToSend);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Submission encountered an unexpected error.");
    }
  };

  const handleDownloadPDF = () => {
    const element = pdfPrintAreaRef.current;
    if (!element) return;

    const opt = {
      margin:       10,
      filename:     `Nomination_${submittedData?.employeeName || "Summary"}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setViewMode(true); // Switches directly into summary preview screen
  };

  const resetForm = () => {
    setForm({
      employeeName: "",
      employeeId: "",
      employeeEmail: "",
      department: "",
      designation: "",
      yearOfNomination: formattedMonthYear,
      awardType: "",
      nominatorName: user?.name || "",
      nominatorDept: user?.department || "",
      nominatorDesig: user?.designation || "",
      nominatorEmail: user?.email || "",
      projectOrCustomer: "",
      submissionDate: new Date().toISOString().split('T')[0]
    });
    setSelectedDivision("");
    setAwardQuestions([]);
    setCustomAnswers({});
    setCheckboxValues({});
    setFocusedScoringField(null);
    setSubmittedData(null);
    setViewMode(false);
  };

  const filteredEmployees = selectedDivision
    ? employees.filter((emp) => {
        const matchesDivision = emp.division === selectedDivision;
        const isSelf = emp.name === user?.name || emp.empId === user?.empId || emp.email === user?.email;
        const meetsTenureRequirement = isEmployeeEligibleForNomination(emp);
        return matchesDivision && !isSelf && meetsTenureRequirement;
      })
    : [];

  const renderQuestionInput = (questionObj) => {
    switch (questionObj.type) {
      case "textarea":
        return (
          <div className="form-group" key={questionObj.question}>
            <label htmlFor={`custom-${questionObj.question}`}>{questionObj.question} <span className="required-asterisk">*</span></label>
            <AutoResizingTextarea
              id={`custom-${questionObj.question}`}
              required
              value={customAnswers[questionObj.question] || ""}
              onChange={(e) => handleCustomAnswerChange(questionObj.question, e.target.value)}
              placeholder={questionObj.placeholder}
            />
          </div>
        );
      case "input":
        return (
          <div className="form-group" key={questionObj.question}>
            <label htmlFor={`custom-${questionObj.question}`}>{questionObj.question} <span className="required-asterisk">*</span></label>
            <input
              id={`custom-${questionObj.question}`}
              type="text"
              required
              value={customAnswers[questionObj.question] || ""}
              onChange={(e) => handleCustomAnswerChange(questionObj.question, e.target.value)}
              placeholder={questionObj.placeholder}
            />
          </div>
        );
      case "checkbox":
        return (
          <div className="form-group" key={questionObj.question}>
            <label>{questionObj.question}</label>
            <div className="checkbox-group">
              {questionObj.options.map((option) => (
                <div key={option} className="checkbox-option">
                  <input
                    type="checkbox"
                    id={`${questionObj.question}-${option}`}
                    checked={checkboxValues[questionObj.question]?.includes(option) || false}
                    onChange={(e) => handleCheckboxChange(questionObj.question, option, e.target.checked)}
                  />
                  <label htmlFor={`${questionObj.question}-${option}`}>{option}</label>
                </div>
              ))}
            </div>
          </div>
        );
      case "section":
        return (
          <div className="form-section-header" key={questionObj.title}>
            <h4>{questionObj.title}</h4>
          </div>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.outside-vertical-dots-toggle') && !e.target.closest('.outside-profile-dropdown-card')) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener("click", handleOutsideClick);
    }
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [showProfileMenu]);

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="award-form-container">
      <div className="app-corner-profile-menu">
        <button 
          type="button" 
          className="outside-vertical-dots-toggle" 
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          aria-label="Toggle profile menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
        
        {showProfileMenu && (
          <div className="outside-profile-dropdown-card">
            <div className="dropdown-user-info">
              <span className="dropdown-avatar">👤</span>
              <div className="dropdown-details">
                <span className="dropdown-name">{user?.name}</span>
                <span className="dropdown-division">{user?.division || "CONCEPTIA SOFTWARE"}</span>
              </div>
            </div>
            <hr className="dropdown-divider" />
            <button type="button" onClick={onLogout} className="dropdown-logout-btn">
              Logout
            </button>
          </div>
        )}
      </div>

      <img src={bgimage} alt="Background Workspace" className="form-image" />

      {/* RENDER VIEW MODE NOMINATION / PDF PREVIEW */}
      {viewMode && submittedData ? (
        <div className="award-form calculation-preview-card" style={{ maxWidth: '1100px', margin: '20px auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" className="view-categories-btn" style={{ backgroundColor: '#6c757d' }} onClick={resetForm}>
              ← Back to Create New Nomination
            </button>
            <button type="button" className="view-categories-btn" style={{ backgroundColor: '#28a745' }} onClick={handleDownloadPDF}>
              📥 Download official PDF
            </button>
          </div>

          {/* PDF Layout Target */}
          <div ref={pdfPrintAreaRef} style={{ padding: '15px', color: '#333', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '3px double #007bff', paddingBottom: '10px' }}>
              <h1 style={{ margin: '0 0 5px 0', fontSize: '1.8rem', color: '#007bff' }}>Nomination Summary</h1>
              <p style={{ margin: 0, color: '#555', fontWeight: 'bold' }}>Year Cycle: {submittedData.yearOfNomination}</p>
            </div>

            <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px', color: '#007bff' }}>General Profile Metrics</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px', fontWeight: 'bold', width: '25%' }}>Award Type:</td>
                  <td style={{ padding: '6px' }}>{submittedData.awardType}</td>
                  <td style={{ padding: '6px', fontWeight: 'bold', width: '25%' }}>Submission Date:</td>
                  <td style={{ padding: '6px' }}>{submittedData.submissionDate}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', fontWeight: 'bold' }}>Nominee Name:</td>
                  <td style={{ padding: '6px' }}>{submittedData.employeeName} (ID: {submittedData.employeeId})</td>
                  <td style={{ padding: '6px', fontWeight: 'bold' }}>Nominator Name:</td>
                  <td style={{ padding: '6px' }}>{submittedData.nominatorName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', fontWeight: 'bold' }}>Nominee Role & Dept:</td>
                  <td style={{ padding: '6px' }}>{submittedData.designation} [{submittedData.department}]</td>
                  <td style={{ padding: '6px', fontWeight: 'bold' }}>Nominator Designation:</td>
                  <td style={{ padding: '6px' }}>{submittedData.nominatorDesig}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px', fontWeight: 'bold' }}>Project / Customer:</td>
                  <td style={{ padding: '6px' }} colSpan="3">{submittedData.projectOrCustomer || 'N/A'}</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px', color: '#007bff', marginTop: '25px' }}>Performance Summaries & Custom Responses</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
{submittedData.answers
  .filter((ans) => {
    const question = String(ans.question || "");
    const answer = String(ans.answer || "");
    
    // Check if the item is a rating or weight question
    const isRatingOrWeight = question.match(/rating/i) || question.match(/weight/i);
    
    // Only exclude if it is a rating/weight OR if the answer starts with a digit 
    // AND is NOT a critical field (like a project name/ID).
    // We now allow answers that are descriptive or non-rating specific.
    return !isRatingOrWeight && (isNaN(answer) || answer.length > 5);
  })
  .map((ans, idx) => (
    <div key={idx} style={{margin: '10px 0', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px', borderLeft: '3px solid #6c757d' }}>
      <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '0.95rem', color: '#444' }}>{ans.question}</p>
      <p style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'pre-wrap', color: '#111' }}>{ans.answer || <i>No Response Provided</i>}</p>
    </div>
  ))
}
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD INPUT FORM MODE */
        <form className="award-form" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'left', marginBottom: '10px' }}>
            <button 
              type="button" 
              className="view-categories-btn"
              onClick={() => {
                setModalSelectedAward(null);
                setShowCategoryModal(true);
              }}
              style={{
                padding: '8px 12px',
                backgroundColor: '#083360',
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s'
              }}
            >
              🔍 View Award Categories
            </button>
          </div>

          <h1 className="award-title">🎉 Annual Award Nomination 🎉</h1>

          <div className="form-section">
            <div className="excel-layout-grid-seamless">
              <div className="excel-column-seamless">
                <h3>Nominee Information</h3>
                <div className="form-group">
                  <label htmlFor="division">Division <span className="required-asterisk">*</span></label>
                  <select name="division" value={selectedDivision} required onChange={handleChange}>
                    <option value="">-- Select Division --</option>
                    {divisions.map((division) => (
                      <option key={division} value={division}>
                        {division.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="employeeName">Name <span className="required-asterisk">*</span></label>
                  <select name="employeeName" required value={form.employeeName} onChange={handleChange} disabled={!selectedDivision}>
                    <option value="">{selectedDivision ? "--- Select Employee ---" : "--- Select Division First ---"}</option>
                    {filteredEmployees.map((employee) => (
                      <option key={employee.empId} value={employee.name}>
                        {employee.name} {employee.designation ? `(${employee.designation})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="projectOrCustomer">Project/Customer</label>
                  <input
                    type="text"
                    name="projectOrCustomer"
                    value={form.projectOrCustomer}
                    onChange={handleChange}
                    placeholder="Enter project or customer name"
                  />
                </div>
              </div>

              <div className="excel-column-seamless">
                <h3>Nominator Information</h3>
                <div className="form-group">
                  <label>Nominated by</label>
                  <input readOnly value={form.nominatorName} placeholder="(auto select based on login)" />
                </div>
                <div className="form-group">
                  <label>Nominator Department</label>
                  <input readOnly value={form.nominatorDept} placeholder="(auto populate)" />
                </div>
                <div className="form-group">
                  <label>Nominator Designation</label>
                  <input readOnly value={form.nominatorDesig} placeholder="(auto populate)" />
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Award Information</h3>
            <div className="form-group">
              <label>Year of Nomination</label>
              <input value={form.yearOfNomination} readOnly />
            </div>

            <div className="form-group">
              <label htmlFor="awardType">Award Type <span className="required-asterisk">*</span></label>
              <select name="awardType" required value={form.awardType} onChange={handleChange}>
                <option value="">-- Select Award Type --</option>
                {getFilteredAwards().map((award) => (
                  <option key={award} value={award}>
                    {award}
                  </option>
                ))}
              </select>
            </div>

            {form.awardType && (description[form.awardType] || (eligibleDesignations[form.awardType] && eligibleDesignations[form.awardType].length > 0)) && (
              <div className="award-description">
                {eligibleDesignations[form.awardType] && eligibleDesignations[form.awardType].length > 0 && (
                  <p style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#d9534f', marginBottom: '0.8em' }}>
                    ⚠️ Note: This award can be nominated only by {eligibleDesignations[form.awardType].map(d => d.toUpperCase()).join(" / ")}
                  </p>
                )}
                {description[form.awardType]
                  ?.filter((line) => !line.toLowerCase().includes("nominated only by"))
                  ?.map((line, index) => {
                    const isHighlighted = line.startsWith("Award Description:") || line.startsWith("Applicable to all divisions:") || line.startsWith("Note:");
                    return (
                      <p key={index} style={{ fontWeight: isHighlighted ? 'bold' : 'normal', fontSize: isHighlighted ? '1.1rem' : '0.95rem', marginTop: isHighlighted ? '0.6em' : '0.2em', color: line.startsWith("Note:") ? '#d9534f' : 'inherit' }}>
                        {line}
                      </p>
                    );
                  })}
              </div>
            )}

            {form.awardType && (
              <div className="award-questions">
                {justificationQuestions.length > 0 && (
                  <>
                    <h3>Performance Summary / Justification</h3>
                    <div className="justification-section">
                      {justificationQuestions.map(renderQuestionInput)}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <button type="submit" className="submit-button">Submit Nomination</button>
        </form>
      )}

      {/* DYNAMIC AWARD CATEGORIES DIALOG MODAL */}
      {showCategoryModal && (
        <div className="custom-modal-overlay" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div className="custom-modal-card" style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', maxWidth: '1400px', width: '90%', maxHeight: '100vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              type="button" 
              className="modal-close-x"
              onClick={() => setShowCategoryModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#666' }}
            >
              ✕
            </button>

            {!modalSelectedAward ? (
              <>
                <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px', color: '#333' }}>Award Categories</h2>
                <div className="categories-list-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.keys(questionMap).map((awardKey) => (
                    <button
                      key={awardKey}
                      type="button"
                      onClick={() => setModalSelectedAward(awardKey)}
                      style={{
                        padding: '12px 15px',
                        textAlign: 'left',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      🏆 {awardKey}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ 
  display: 'flex', 
  alignItems: 'center', 
  marginBottom: '15px', 
  borderBottom: '2px solid #eee', 
  paddingBottom: '10px' 
}}>
  <button 
    type="button" 
    onClick={() => setModalSelectedAward(null)}
    style={{ background: 'none', border: 'none', color: '#007bff', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
  >
    ← Back
  </button>
  
  <h2 style={{ 
    margin: 0, 
    fontSize: '1.4rem', 
    color: '#333', 
    flex: 1,           // This forces the h2 to take up all available space
    textAlign: 'center' // This centers the text within that space
  }}>
    {modalSelectedAward}
  </h2>
</div>
                <div 
  className="modal-description-content" 
  style={{ 
    backgroundColor: '#fdfdfe', 
    padding: '15px', 
    borderRadius: '6px', 
    borderLeft: '4px solid #007bff', 
    maxHeight: '50vh', 
    overflowY: 'auto',
    textAlign: 'left' // Add this to align all internal text to the left
  }}
>
                  {eligibleDesignations[modalSelectedAward] && eligibleDesignations[modalSelectedAward].length > 0 && (
                    <p style={{ fontWeight: 'bold', color: '#d9534f', marginBottom: '10px' }}>
                      ⚠️ Restriction: Nominated only by {eligibleDesignations[modalSelectedAward].map(d => d.toUpperCase()).join(" / ")}
                    </p>
                  )}
                  {description[modalSelectedAward] ? (
                    description[modalSelectedAward]
                      .filter((line) => !line.toLowerCase().includes("nominated only by"))
                      .map((line, idx) => {
                        const isHighlighted = line.startsWith("Award Description:") || line.startsWith("Applicable to all divisions:") || line.startsWith("Note:");
                        return (
                          <p key={idx} style={{ fontWeight: isHighlighted ? 'bold' : 'normal', fontSize: '0.95rem', margin: '8px 0', color: line.startsWith("Note:") ? '#d9534f' : 'inherit', lineHeight: '1.4' }}>
                            {line}
                          </p>
                        );
                      })
                  ) : (
                    <p style={{ fontStyle: 'italic', color: '#6c757d' }}>No description content configured for this award category.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {showSuccessModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card">
            <div className="modal-icon-success">🎉</div>
            <h2>Submission Successful!</h2>
            <button type="button" className="modal-close-btn" onClick={handleCloseSuccess}>View & Download Details</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NominationForm;