import React, { useEffect, useState } from "react";
import axios from "axios";
import "./NominationForm.css";
import bgimage from '../assets/bgimage.jpg';


const questionMap = {
  "Team Awesome Award": [
    {
      type: "textarea",
      question: "Describe the team's achievements and justify the qualification for the nomination.",
      placeholder: "Describe the team's achievements and justify the qualification for the nomination."
    }
  ],
  "Peer Appreciation Award": [
    {
      type: "textarea",
      question: "Brief description about the nominee & current responsibilities.",
      placeholder: "Brief description about the nominee & current responsibilities."
    },
    {
      type: "textarea",
      question: "Explain how the nominee positively impacted co-workers, customers, and vendors with examples. (If any)",
      placeholder: "Explain how the nominee positively impacted co-workers, customers, and vendors with examples. (If any)"
    }
  ],
  "Customer Service Performance / Star Service champion / Customer Hero award": [
    {
      type: "textarea",
      question: "Why does your nominee deserve to receive the Customer Service Award?",
      placeholder: "Why does your nominee deserve to receive the Customer Service Award?"
    },
    {
      type: "textarea",
      question: "What impact has the nominee’s accomplishment had on your function?",
      placeholder: "What impact has the nominee’s accomplishment had on your function?"
    },
    {
      type: "textarea",
      question: "How did staff, co-workers, or customers benefit from the accomplishment?",
      placeholder: "How did staff, co-workers, or customers benefit from the accomplishment?"
    }
  ],
  "Outstanding Leadership": [
    {
      type: "textarea",
      question: "Brief description about this nomination.",
      placeholder: "Brief description about this nomination."
    },
    {
      type: "textarea",
      question: "What are the characteristics of this leader which deserve an outstanding leadership nomination with examples. (If any)",
      placeholder: "What are the characteristics of this leader which deserve an outstanding leadership nomination with examples. (If any)"
    }
  ],
  "Beyond the Call of Duty": [
    {
      type: "textarea",
      question: "Describe the tasks performed beyond the call of duty.",
      placeholder: "Describe the tasks performed beyond the call of duty."
    },
    {
      type: "textarea",
      question: "Explain how the nominee exceeded expectations.",
      placeholder: "Explain how the nominee exceeded expectations."
    }
  ],
  "Ace of Initiative": [
    {
      type: "textarea",
      question: "Describe the new initiatives led by the nominee.",
      placeholder: "Describe the new initiatives led by the nominee."
    },
    {
      type: "textarea",
      question: "Provide examples of quality output and productivity improvements.",
      placeholder: "Provide examples of quality output and productivity improvements."
    }
  ],
  "Administrative Excellence Award – 2024": [
    {
      type: "textarea",
      question: "Brief about the nomination for the outstanding performance",
      placeholder: "Brief about the nomination for the outstanding performance"
    },
    {
      type: "textarea",
      question: "Justify the nomination for activities that qualify for the nomination",
      placeholder: "Justify the nomination for activities that qualify for the nomination"
    },
    {
      type: "textarea",
      question: "Describe the nominee’s work quality and consistency.",
      placeholder: "Describe the nominee’s work quality and consistency."
    }
  ],
  "Spotlight Award": [
    {
      type: "textarea",
      question: "Describe the nominee's achievements.",
      placeholder: "Describe the nominee's achievements."
    },
    {
      type: "textarea",
      question: "Explain how the nominee demonstrated initiative and commitment with examples.",
      placeholder: "Explain how the nominee demonstrated initiative and commitment with examples."
    }
  ],
  "Top Performance": [
    {
      type: "textarea",
      question: "Describe the nominee's excellence in project completion or sales.",
      placeholder: "Describe the nominee's excellence in project completion or sales."
    },
    {
      type: "textarea",
      question: "Explain how the nominee exceeded business expectations.",
      placeholder: "Explain how the nominee exceeded business expectations."
    },
    {
      type: "textarea",
      question: "Provide examples of outstanding performance in administration or development.",
      placeholder: "Provide examples of outstanding performance in administration or development."
    }
  ],
  "Sales Champion Award – 2024": [
    {
      type: "textarea",
      question: "Describe the key sales achievements of the nominee/team in FY 2025:",
      placeholder: "Describe the key sales achievements of the nominee/team in FY 2025:"
    },
    {
      type: "textarea",
      question: "Notable deals won and strategic accounts handled:",
      placeholder: "Notable deals won and strategic accounts handled:"
    },
    {
      type: "textarea",
      question: "Describe any successful cross-selling or up-selling activities:",
      placeholder: "Describe any successful cross-selling or up-selling activities:"
    },
    {
      type: "section",
      title: "Metrics or KPIs (if applicable)"
    },
    {
      type: "input",
      question: "Sales Target Achievement %",
      placeholder: "Enter percentage"
    },
    {
      type: "input",
      question: "Revenue Generated (INR)",
      placeholder: "Enter amount"
    },
    {
      type: "input",
      question: "New Customers Acquired",
      placeholder: "Enter number"
    },
    {
      type: "input",
      question: "Deal Win Ratio",
      placeholder: "Enter ratio"
    }
  ],
  "Customer Service Award": [
    {
      type: "textarea",
      question: "Brief Description of the Project/Customer Engagement:",
      placeholder: "Brief Description of the Project/Customer Engagement:"
    },
    {
      type: "textarea",
      question: "What specific actions led to exceptional customer delight?",
      placeholder: "What specific actions led to exceptional customer delight?"
    },
    {
      type: "input",
      question: "Customer Name / Company (if applicable):",
      placeholder: "Enter customer name/company"
    },
    {
      type: "textarea",
      question: "Describe a situation where the nominee demonstrated exceptional customer service:",
      placeholder: "Describe a situation where the nominee demonstrated exceptional customer service:"
    },
    {
      type: "checkbox",
      question: "Type of Service Provided",
      options: [
        "Technical Support",
        "Post-Installation Service",
        "Account Management",
        "Escalation Handling",
        "Documentation / Deliverables",
        "Other"
      ]
    },
    {
      type: "textarea",
      question: "Mention any notable customer feedback received (email, call, survey, etc.):",
      placeholder: "Mention any notable customer feedback received (email, call, survey, etc.):"
    },
    {
      type: "section",
      title: "Key Metrics (if applicable)"
    },
    {
      type: "input",
      question: "First Response Time",
      placeholder: "Enter time"
    },
    {
      type: "input",
      question: "Resolution Time",
      placeholder: "Enter time"
    },
    {
      type: "input",
      question: "Customer Satisfaction Score (CSAT)",
      placeholder: "Enter score"
    },
    {
      type: "input",
      question: "Net Promoter Score (NPS)",
      placeholder: "Enter score"
    },
    {
      type: "input",
      question: "Repeat Business %",
      placeholder: "Enter percentage"
    },
    {
      type: "input",
      question: "Delivery Timeliness",
      placeholder: "Enter timeliness"
    }
  ]
};

const description = {
  "Team Awesome Award": [
    "Award Description:",
    "This award is to recognize the most successful group of employees in a single team who has exceeded the expectations in displaying their capability with regard to maturity, innovation and efforts made to provide a stellar customer/co-worker experience, and how people, process, and technology together have improved service and overcome challenges presented to the organization.",
    "Nominating Authority: Team Manager/Manager",
    "Applicable to all divisions:",
    " Conceptia Marine (Marine Design & Services)",
    " CKONNECT (Product Sales & Technical Enablement)",
    " CMTechno (Engineering Services & Consultancy)",
    " LightLeader Solar (Installation & Support Services)"
  ],
  "Peer Appreciation Award": [
    "Award Description:",
    "This award is for the team member with highest average rating for the contributions he / she has made to the overall success of the team. They are the heroes who work behind the scenes and may not be noticed by the Management circle, but makes a powerful impact with co-workers, customers and vendors.",
    "Nominating Authority: Management/Team Manager/Senior Employees",
    "Applicable to all divisions:",
    " Conceptia Marine (Marine Design & Services)",
    " CKONNECT (Product Sales & Technical Enablement)",
    " CMTechno (Engineering Services & Consultancy)",
    " LightLeader Solar (Installation & Support Services)"
  ],
  "Customer Service Performance / Star Service champion / Customer Hero award": [
    "Award Description:",
    "This award acknowledges individual employees who demonstrate outstanding customer service, flexibility and personal attention to develop and maintain relationships with customers. Your recommendation must include the accomplishment description and explain why the nominee deserves the Customers service award.",
    "Why does your nominee deserve to receive the Customer Service Award?",
    "What impact has the nominee’s accomplishment had on your function?",
    "How did staff, co-workers, or customers benefit from the accomplishment?",
    "Nominating Authority: Team Manager",
    "Applicable to all divisions:",
    " Conceptia Marine (Marine Design & Services)",
    " CKONNECT (Product Sales & Technical Enablement)",
    " CMTechno (Engineering Services & Consultancy)",
    " LightLeader Solar (Installation & Support Services)"
  ],
  "Outstanding Leadership": [
    "Award Description:",
    "Each team has a leader who cares and helps the team members to grow. The primary decision criteria for this award is to listen from our executives and gather their feedback on the leadership aspects of their respective team lead / Manager. At Conceptia we'd like to honour those leaders who made this year amazing for their teams.",
    "This leader motivates you and believes in your potential.",
    "They help you perform at your best.",
    "Always leads with example, the team admires his / her professionalism and dedication to work.",
    "Guides on the right path to success, encourages to take chances, gives due credit to the accomplishments, active monitoring and review.",
    "Provides a work environment that is respectful and supportive, high standards of professional ethics, foster pride in being a Conceptians.",
    "Nominating Authority: Management/AVP/Senior Managers",
    "Applicable to all divisions:",
    " Conceptia Marine (Marine Design & Services)",
    " CKONNECT (Product Sales & Technical Enablement)",
    " CMTechno (Engineering Services & Consultancy)",
    " LightLeader Solar (Installation & Support Services)"
  ],
  "Beyond the Call of Duty": [
    "Award Description:",
    "This award is given to the executive who set a standard of what above and beyond looks like. It is to recognize the outstanding performance by employees who went beyond their call of duty and performed the tasks with least supervision and specific instructions. They just did it meeting and exceeding the expectations of the organization. The nominee must clearly demonstrate behaviours or produce results that go above and beyond the normal job expectations, or above and beyond the call of duty.",
    "Nominating Authority: Management",
    "Applicable to all divisions:",
    " Conceptia Marine (Marine Design & Services)",
    " CKONNECT (Product Sales & Technical Enablement)",
    " CMTechno (Engineering Services & Consultancy)",
    " LightLeader Solar (Installation & Support Services)"
  ],
  "Ace of Initiative": [
    "Award Description:",
    "This award is given to highlight those individuals who have driven the new initiatives, leading the way in their approach, execution of the tasks, team contributions and delivers quality output meeting and exceeding our company standards and sets benchmark for others. We also consider initiatives which were earlier not delivering expected results and was risky to attempt but was revamped and made functional for the organization saving considerable amount of time and improved productivity of the team.",
    "Nominating Authority: Management/AVP/Senior Managers",
    "Applicable to all divisions:",
    " Conceptia Marine (Marine Design & Services)",
    " CKONNECT (Product Sales & Technical Enablement)",
    " CMTechno (Engineering Services & Consultancy)",
    " LightLeader Solar (Installation & Support Services)"
  ],
  "Administrative Excellence Award – 2024": [
    "Award Description:",
    "This award celebrates administrative professionals who demonstrate excellence as the cornerstone of an office environment. With exceptional time management and a strong commitment to deadlines, these individuals uphold confidentiality and strictly follow statutory regulations. Their interpersonal and listening skills foster positive workplace relationships, while their strategic decision-making and clear, effective communication contribute to organizational success. They plan proactively, follow defined processes with consistency, and anticipate needs—often completing crucial tasks without being prompted. Operating with minimal supervision yet delivering maximum results, they embody reliability and initiative. As executive-level contributors, they are truly the backbone of the administrative function, ensuring smooth operations and driving continued excellence."
  ],
  "Spotlight Award": [
    "Award Description:",
    "This category of award is dedicated to recognizing the outstanding contributions of the employees who have achieved their goals defined as per their roles and jobs description. An employee who is committed and willing to take up more initiatives and more tasks as part of their regular job routines.",
    "***Employee who completes assignments on time and volunteers to take part on additional responsibilities***",
    "Employee should have a positive eye on work responsibilities, customers and colleagues, and should be one who stands as a role model for others.",
    "Met the expectations of the organizations on the task assigned for the year. (Areas of recognition includes Engineering Projects, Technical certifications, Demo capabilities, Presentation skills, Certifications, Customer feedback, Product Knowledge, Project executions, Time management, Sales accelerator program execution, Sales achievements, Punctuality and Discipline,  OEM awards and recommendations, Event planning, Event executions, Marketing visibility, Competitive market expansion for products and services offered by Target achievement - Sales and Technical, Training feedback, Customer Satisfaction surveys, Timely review, Mentorship, Cash flow management, Recruitment process, Learning and Development initiatives, House Keeping)."
  ],
  "Top Performance": [
    "Award Description:",
    "Award for Excellence in Engineering project completion and delivery as per customer expectations, exceeds the business expectations significantly. Award for Excellence in Product sales business (Marketing/ Sales/ Technical), exceeds the business expectations significantly. Award for Excellence in business administration, exceeds the business expectations significantly. Award for Excellence in business development (Marine/ Manpower and Light leader), exceeds the business expectations significantly."
  ],
  "Sales Champion Award – 2024": [
    "Award Description:",
    "The Sales Champion Award is presented to an individual or team that has consistently demonstrated exceptional sales performance, strategic account management, and market expansion across our service and solutions divisions. This award celebrates excellence in:",
    "- Revenue Achievement – Surpassing sales targets and contributing significantly to top-line growth.",
    "- New Customer Acquisition – Bringing in new logos and expanding into new markets or regions.",
    "- Cross-Selling & Up-Selling – Leveraging multi-product offerings to enhance customer value.",
    "- Strategic Deal Closure – Handling complex sales cycles with efficiency and professionalism.",
    "- Customer Relationship Management – Maintaining long-term, trust-based relationships that drive repeat business.",
    "Applicable to all divisions:",
    "- Conceptia Marine (Marine Design & Services)",
    "- CKONNECT (Product Sales & Technical Enablement)",
    "- CMTechno (Engineering Services & Consultancy)",
    "- LightLeader Solar (Installation & Support Services)"
  ],
  "Customer Service Award": [
    "Award Description:",
    "The Customer Delight Award recognizes an individual or team that has gone above and beyond in ensuring outstanding customer experiences across our service and solutions ecosystem. This prestigious award honors those who demonstrate excellence in:",
    "- Project Delivery – On-time, within-budget, and high-quality execution that exceeds customer expectations.",
    "- Program Delivery – Seamless management of multi-phase or strategic customer engagements.",
    "- After-Sales Service – Prompt and effective support that enhances customer satisfaction and trust.",
    "- Long-Term Customer Engagement – Building enduring relationships that lead to sustained business and referrals.",
    "- Customer Feedback & Testimonials – Demonstrated impact through positive, measurable client responses.",
    "Applicable to all divisions:",
    "• Conceptia – Administrative team",
    "• Conceptia Marine (Manpower, Marine Design & Services)",
    "• CKONNECT (Product Sales & Technical Enablement)",
    "• CMTechno (Engineering Services & Consultancy)",
    "• LightLeader Solar (Installation & Support Services)"
  ]
};
const NominationForm = () => {
  const [employees, setEmployees] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customAnswers, setCustomAnswers] = useState({});
  const [checkboxValues, setCheckboxValues] = useState({});

  const currentDate = new Date();
  const formattedMonthYear = `${currentDate.toLocaleString("default", {
    month: "long",
  })} ${currentDate.getFullYear() - 1}`;

  const [awardQuestions, setAwardQuestions] = useState([]);
  const [form, setForm] = useState({
    employeeName: "",
    employeeId: "",
    employeeEmail: "",
    department: "",
    designation: "",
    yearOfNomination: formattedMonthYear,
    awardType: "",
    nominatorName: "",
    nominatorDept: "",
    nominatorDesig: "",
    nominatorEmail: "",
  });

  //  Redirect if outside allowed date range
  useEffect(() => {
    const today = new Date();
    const day = today.getDate();
    if (day >= 1 || day <= 31) {
      window.location.href = '/access';
    }
  }, []);



  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [employeesRes, divisionsRes] = await Promise.all([
          axios.get("https://annual-award12.onrender.com/api/employees"),
          axios.get("https://annual-award12.onrender.com/api/employees/divisions"),
        ]);

        setEmployees(employeesRes.data);
        setDivisions(divisionsRes.data);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load data. Please try again later.");
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
      // Prepare answers array
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

      const dataToSend = {
        ...form,
        answers: answers
      };

      await axios.post("https://annual-award12.onrender.com/api/nominations", dataToSend);
      alert("Nomination submitted successfully!");
      resetForm();
    } catch (err) {
      console.error("Submission failed:", err);
      alert("Submission failed. Please try again.");
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
      nominatorName: "",
      nominatorDept: "",
      nominatorDesig: "",
      nominatorEmail: "",
    });
    setSelectedDivision("");
    setAwardQuestions([]);
    setCustomAnswers({});
    setCheckboxValues({});
  };

  const filteredEmployees = selectedDivision
    ? employees.filter((emp) => emp.division === selectedDivision)
    : [];

  const renderQuestionInput = (questionObj) => {
    switch (questionObj.type) {
      case "textarea":
        return (
          <div className="form-group" key={questionObj.question}>
            <label htmlFor={`custom-${questionObj.question}`}>
              {questionObj.question}
            </label>
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
                    onChange={(e) => handleCheckboxChange(
                      questionObj.question,
                      option,
                      e.target.checked
                    )}
                  />
                  <label htmlFor={`${questionObj.question}-${option}`}>
                    {option}
                  </label>
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
      <img src={bgimage} alt="Background" className="form-image" />

      <form className="award-form" onSubmit={handleSubmit}>
        <h1>🎉 Annual Award Nomination 🎉</h1>

        <div className="form-section">
          <h3>Nominee Information</h3>

          <div className="form-group">
            <label htmlFor="division">Division</label>
            <select
              name="division"
              value={selectedDivision}
              required
              onChange={handleChange}
            >
              <option value="">-- Select Division --</option>
              {divisions.map((division) => (
                <option key={division} value={division}>
                  {division.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="employeeName">Employee Name</label>
            <select
              name="employeeName"
              required
              value={form.employeeName}
              onChange={handleChange}
              disabled={!selectedDivision}
            >
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
              <input readOnly value={form.employeeId} />
            </div>
            <div className="form-group"></div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <input readOnly value={form.department} />
            </div>
            <div className="form-group">
              <label>Designation</label>
              <input readOnly value={form.designation} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Award Information</h3>

          <div className="form-group">
            <label>Year of Nomination</label>
            <input value="2024-2025" readOnly />
          </div>

          <div className="form-group">
            <label htmlFor="awardType">Award Type</label>
            <select
              name="awardType"
              required
              value={form.awardType}
              onChange={handleChange}
            >
              <option value="">-- Select Award Type --</option>
              {Object.keys(questionMap).map((award) => (
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
                  line.startsWith("Nominating Authority: Team Manager/Manager") ||
                  line.startsWith("Nominating Authority: Management/Team Manager/Senior Employees") ||
                  line.startsWith("Nominating Authority: Team Manager") ||
                  line.startsWith("Nominating Authority: Management/AVP/Senior Managers") ||
                  line.startsWith("Nominating Authority: Management") ||
                  line.startsWith("Nominating Authority: Management/AVP/Senior Managers");

                return (
                  <p
                    key={index}
                    style={{
                      fontWeight: isHighlighted ? 'bold' : 'normal',
                      fontSize: isHighlighted ? '1.15rem' : '1rem',  // Adjust as needed
                      marginTop: isHighlighted ? '0.8em' : '0.3em'   // Optional spacing tweak
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
            <label htmlFor="nominatorName">Nominator Name</label>
            <select
              name="nominatorName"
              required
              value={form.nominatorName}
              onChange={handleChange}
            >
              <option value="">-- Select Nominator --</option>
              {employees.map((employee) => (
                <option key={employee.empId} value={employee.name}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">

            <div className="form-group">
              <label>Nominator Department</label>
              <input readOnly value={form.nominatorDept} />
            </div>
          </div>

          <div className="form-group">
            <label>Nominator Designation</label>
            <input readOnly value={form.nominatorDesig} />
          </div>
        </div>

        <button type="submit" className="submit-button">
          Submit Nomination
        </button>
      </form>
    </div>
  );
}

export default NominationForm;

