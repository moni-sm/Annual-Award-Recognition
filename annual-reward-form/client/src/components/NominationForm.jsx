import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./NominationForm.css";
import bgimage from '../assets/bgimage.jpg';

const NominationForm = ({ user, onLogout }) => {
  const [employees, setEmployees] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customAnswers, setCustomAnswers] = useState({});
  const [checkboxValues, setCheckboxValues] = useState({});
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  const scoringQuestions = scoringHeaderIndex !== -1
    ? awardQuestions.slice(scoringHeaderIndex + 1)
    : [];

  const scoringHeader = scoringHeaderIndex !== -1
    ? awardQuestions[scoringHeaderIndex]
    : null;

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

    if (name === "nominatorName") {
      const nominator = employees.find((emp) => emp.name === value);
      if (nominator) {
        setForm((prev) => ({
          ...prev,
          nominatorDept: nominator.department,
          nominatorDesig: nominator.designation,
          nominatorEmail: nominator.email,
        }));
      }
    }
  };

  const handleCustomAnswerChange = (question, value) => {
    setCustomAnswers(prev => ({
      ...prev,
      [question]: value
    }));

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
          if (q.type === "scoringGuide") {
            return q.criteria.map((item) => ({
              question: item.title,
              answer: customAnswers[item.title] || ""
            }));
          }

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

      const dataToSend = {
        ...form,
        answers: answers
      };

      await axios.post(`${baseUrl}/nominations`, dataToSend);
      
      setShowSuccessModal(true);
      resetForm();
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Submission encountered an unexpected error. Please check validation configurations.");
    }
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
  };


  const filteredEmployees = selectedDivision
    ? employees.filter((emp) => {
        const matchesDivision = emp.division === selectedDivision;
        const isSelf = emp.name === user?.name || emp.empId === user?.empId || emp.email === user?.email;
        const meetsTenureRequirement = isEmployeeEligibleForNomination(emp);
        return matchesDivision && !isSelf && meetsTenureRequirement;
      })
    : [];

  /* UPDATED SCORING GUIDE PANEL DISPLAY LOGIC */
  const renderScoringGuidePanel = () => {
    if (!focusedScoringField || !form.awardType) return null;

    const awardGuides = scoringGuides[form.awardType];
    if (!awardGuides) return null;

    const criterionGuide = awardGuides[focusedScoringField];
    if (!criterionGuide) {
      return (
        <div className="scoring-guide-no-data">
          <p>No detailed guide data available for <strong>{focusedScoringField}</strong>.</p>
        </div>
      );
    }

    return (
      <div className="scoring-guide-active-content">
        <h4 className="active-guide-title">{focusedScoringField}</h4>
        <p className="active-guide-subtitle">Click on any rating row to auto-fill the field:</p>
        
        <div className="guide-matrix-rows">
          {["5", "4", "3", "2", "1"].map((rating) => {
            const descriptionText = criterionGuide[rating] || `No explicit performance details provided for a score of ${rating}.`;
            
            const currentAnswerValue = String(customAnswers[focusedScoringField] || "");
            const isCurrentRating = currentAnswerValue === rating || currentAnswerValue.startsWith(`${rating} -`);
            
            return (
              <div
                key={rating}
                className={`guide-matrix-row ${isCurrentRating ? "active-rating" : ""}`}
                onClick={() => handleCustomAnswerChange(focusedScoringField, `${rating} - ${descriptionText}`)}
              >
                <div className="rating-badge-container">
                  <span className="rating-badge-number">{rating}</span>
                </div>
                <div className="rating-description-text">
                  {descriptionText}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderQuestionInput = (questionObj) => {
    switch (questionObj.type) {
      case "textarea":
        return (
          <div className="form-group" key={questionObj.question}>
            <label htmlFor={`custom-${questionObj.question}`}>{questionObj.question}</label>
            <textarea
              id={`custom-${questionObj.question}`}
              required
              value={customAnswers[questionObj.question] || ""}
              onChange={(e) => handleCustomAnswerChange(questionObj.question, e.target.value)}
              rows="4"
              placeholder={questionObj.placeholder}
            />
          </div>
        );
      case "input":
        return (
          <div className="form-group" key={questionObj.question}>
            <label htmlFor={`custom-${questionObj.question}`}>
              {questionObj.question}
            </label>
            <input
              id={`custom-${questionObj.question}`}
              type="text"
              required
              value={customAnswers[questionObj.question] || ""}
              onChange={(e) =>
                handleCustomAnswerChange(questionObj.question, e.target.value)
              }
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
      case "scoringGuide":
        return (
          <div className="scoring-guide" key={questionObj.title}>
            <h3>{questionObj.title}</h3>

            {questionObj.criteria.map((item) => (
              <div key={item.title} className="score-card">
                <h4>
                  {item.title} (Weight: {item.weight})
                </h4>

                {[5, 4, 3, 2, 1].map((rating) => (
                  <div
                    key={rating}
                    className={`rating-row ${
                      customAnswers[item.title] === rating ? "selected" : ""
                    }`}
                    onClick={() =>
                      handleCustomAnswerChange(item.title, rating)
                    }
                  >
                    <strong>{rating}</strong> - {item.guide[rating]}
                  </div>
                ))}
              </div>
            ))}
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
          &#8942;
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

      <form className="award-form" onSubmit={handleSubmit}>
        <h1 className="award-title">🎉 Annual Award Nomination 🎉</h1>

        <div className="form-section">
          <div className="excel-layout-grid-seamless">
            {/* LEFT COLUMN - Nominee Information */}
            <div className="excel-column-seamless">
              <h3>Nominee Information</h3>
              
              <div className="form-group">
                <label htmlFor="division">Division</label>
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
                <label htmlFor="employeeName">Name</label>
                <select name="employeeName" required value={form.employeeName} onChange={handleChange} disabled={!selectedDivision}>
                  <option value="">{selectedDivision ? "--- Select Employee ---" : "--- Select Division First ---"}</option>
                  {filteredEmployees.map((employee) => (
                    <option key={employee.empId} value={employee.name}>
                      {employee.name}
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

            {/* RIGHT COLUMN - Nominator Information */}
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
            <label htmlFor="awardType">Award Type</label>
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
              {description[form.awardType]?.map((line, index) => {
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

              {/* DYNAMIC SCORING SECTION */}
              {/* {scoringQuestions.length > 0 && (
                <div className="form-section scoring-section-divider">
                  <h3>{scoringHeader?.title || "Scoring Weight Grid Reference"}</h3>
                  <div className="scoring-layout-container">
                    <div className="scoring-inputs-side">
                      {scoringQuestions.map((q) => (
                        <div className="form-group scoring-field-group" key={q.question}>
                          <label htmlFor={`custom-${q.question}`}>{q.question}</label>
                          <input
                            id={`custom-${q.question}`}
                            type="text"
                            required
                            value={customAnswers[q.question] || ""}
                            onChange={(e) => handleCustomAnswerChange(q.question, e.target.value)}
                            onFocus={() => setFocusedScoringField(q.question)}
                            onClick={() => setFocusedScoringField(q.question)}
                            placeholder={q.placeholder}
                            className={`scoring-input-element ${focusedScoringField === q.question ? 'active-focus' : ''}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="scoring-guide-side">
                      <div className="scoring-guide-matrix-panel">
                        {focusedScoringField ? renderScoringGuidePanel() : (
                          <div className="scoring-guide-placeholder">
                            <div className="placeholder-icon">💡</div>
                            <p>Select or click on a scoring rating field to view its scoring guide details.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )} */}
            </div>
          )}
        </div>

        <button type="submit" className="submit-button">
          Submit Nomination
        </button>
      </form>

      {showSuccessModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-card">
            <div className="modal-icon-success">🎉</div>
            <h2>Submission Successful!</h2>
            <button 
              type="button" 
              className="modal-close-btn"
              onClick={() => setShowSuccessModal(false)}
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NominationForm;