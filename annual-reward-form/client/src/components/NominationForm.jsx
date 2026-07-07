import React, { useEffect, useState } from "react";
import axios from "axios";
import "./NominationForm.css";
import bgimage from '../assets/bgimage.jpg';

import questionMap from "../data/awards.json";
import description from "../data/description.json";

const NominationForm = ({ currentUser }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  const [employees, setEmployees] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customAnswers, setCustomAnswers] = useState({});
  const [checkboxValues, setCheckboxValues] = useState({});

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const formattedMonthYear = `${currentYear - 1}-${currentYear}`;

  const [awardQuestions, setAwardQuestions] = useState([]);
  const [form, setForm] = useState({
    employeeName: "",
    employeeId: "",
    employeeEmail: "",
    department: "",
    designation: "",
    yearOfNomination: formattedMonthYear,
    awardType: "",
  nominatorName: currentUser?.name || "",
    nominatorDept: currentUser?.department || "Operations", 
    nominatorDesig: currentUser?.designation || "",
    nominatorEmail: currentUser?.email || "",
    projectOrCustomer: "",
    submissionDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [employeesRes, divisionsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/employees`),
          axios.get(`${API_BASE_URL}/employees/divisions`),
        ]);

        setEmployees(employeesRes.data);
        setDivisions(divisionsRes.data);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load backend system configuration details. Please try again.");
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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
        .map(q => {
          if (q.type === "checkbox") {
            return {
              question: q.question,
              answer: checkboxValues[q.question]?.join(", ") || "None selected"
            };
          } else {
            return {
              question: q.question,
              answer: customAnswers[q.question] || ""
            };
          }
        });

      const dataToSend = { ...form, answers: answers };
      await axios.post(`${API_BASE_URL}/nominations`, dataToSend);
      alert("Appreciation Portal Nomination submitted successfully!");
      resetForm();
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Submission encountered an unexpected error.");
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
      nominatorName: currentUser?.name || "",
      nominatorDept: currentUser?.department || "Operations",
      nominatorDesig: currentUser?.designation || "",
      nominatorEmail: currentUser?.email || "",
      projectOrCustomer: "",
      submissionDate: new Date().toISOString().split('T')[0]
    });
    setSelectedDivision("");
    setAwardQuestions([]);
    setCustomAnswers({});
    setCheckboxValues({});
  };

  const filteredEmployees = selectedDivision
    ? employees.filter((emp) => emp.division === selectedDivision)
    : [];
 const getFilteredAwards = () => {
    return Object.keys(questionMap).filter((award) => {
      // Fallback to logged-in user profile designation
      const userDesignation = form.nominatorDesig || currentUser?.designation || "";
      if (!userDesignation) return true;

      const desig = userDesignation.toLowerCase();
      const awardLower = award.toLowerCase();

      // 1. Team Awesome / Customer Service Performance (only by Manager)
      if (awardLower.includes("team awesome") || awardLower.includes("customer service")) {
        return desig.includes("manager");
      }

      // 2. Beyond the Call of Duty (only by Management)
      if (awardLower.includes("beyond the call of duty")) {
        return desig.includes("management") || desig.includes("director") || desig.includes("vp");
      }

      // 3. Peer Appreciation / Leadership / Ace of Initiative (Management/AVP/Senior Managers)
      if (
        awardLower.includes("peer appreciation") || 
        awardLower.includes("leadership") || 
        awardLower.includes("initiative")
      ) {
        return desig.includes("manager") || desig.includes("management") || desig.includes("avp");
      }

      return true;
    });
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
            <label htmlFor={`custom-${questionObj.question}`}>{questionObj.question}</label>
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

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="award-form-container">
      <img src={bgimage} alt="Background Workspace" className="form-image" />

      <form className="award-form" onSubmit={handleSubmit}>
        <h1>🎉 Annual Award Nomination 🎉</h1>

     
        <div className="form-section">
          <h3>Nominee Information Matrix</h3>

          <div className="form-group">
            <label htmlFor="division"> Division </label>
            <select name="division" value={selectedDivision} required onChange={handleChange}>
              <option value="">-- Select Division  --</option>
              {divisions.map((division) => (
                <option key={division} value={division}>
                  {division.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="employeeName">Employee Core Name</label>
            <select name="employeeName" required value={form.employeeName} onChange={handleChange} disabled={!selectedDivision}>
              <option value="">--- Select Employee ---</option>
              {filteredEmployees.map((employee) => (
                <option key={employee.empId} value={employee.name}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Employee ID</label>
              <input readOnly value={form.employeeId} placeholder="Auto-populated" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label> Department </label>
              <input readOnly value={form.department} placeholder="Auto-populated" />
            </div>
            <div className="form-group">
              <label>  Designation</label>
              <input readOnly value={form.designation} placeholder="Auto-populated" />
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

          {form.awardType && description[form.awardType] && (
            <div className="award-description">
              {description[form.awardType].map((line, index) => {
                const isHighlighted =
                  line.startsWith("Award Description:") ||
                  line.startsWith("Applicable to all divisions:") ||
                  line.startsWith("Note:");

                return (
                  <p
                    key={index}
                    style={{
                      fontWeight: isHighlighted ? 'bold' : 'normal',
                      fontSize: isHighlighted ? '1.1rem' : '0.95rem',
                      marginTop: isHighlighted ? '0.6em' : '0.2em',
                      color: line.startsWith("Note:") ? '#d9534f' : 'inherit'
                    }}
                  >
                    {line}
                  </p>
                );
              })}
            </div>
          )}

          {form.awardType && (
            <div className="award-questions">
              <h3>Performance Summary / Justification</h3>
              {awardQuestions.map(renderQuestionInput)}
            </div>
          )}
        </div>

      
        <div className="form-section">
          <h3>Nominator Information</h3>

          <div className="form-group">
            <label>Nominator Name</label>
            <input readOnly value={form.nominatorName} style={{ backgroundColor: '#2a2a2a', color: '#bbb' }} />
          </div>

          <div className="form-group">
            <label>Nominator Email</label>
            <input readOnly value={form.nominatorEmail} style={{ backgroundColor: '#2a2a2a', color: '#bbb' }} />
          </div>

          <div className="form-group">
            <label>Nominator Designation</label>
            <input readOnly value={form.nominatorDesig} style={{ backgroundColor: '#2a2a2a', color: '#bbb' }} />
          </div>
        </div>

        <button type="submit" className="submit-button">
          Submit Nomination
        </button>
      </form>
    </div>
  );
};

export default NominationForm;