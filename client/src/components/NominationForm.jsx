import React, { useEffect, useState } from "react";
import axios from "axios";
import "./NominationForm.css";
import bgimage from '../assets/bgimage.jpg';
import { getEligibleAwards } from './awardEligibility';

const questionMap = {
  "Customer Service Performance / Star Service Champion / Customer Hero Award": [
    { type: "textarea", question: "Individual or Team Nomination Name", placeholder: "Enter individual employee name or editable team name..." },
    { type: "input", question: "Project / Customer Name", placeholder: "Enter project or customer name..." },
    { type: "textarea", question: "Justification: Why does the nominee deserve Customer Service Award?", placeholder: "Describe outstanding customer service actions..." },
    { type: "textarea", question: "What impact has the nominee's accomplishment had on the division/department/company?", placeholder: "Explain the broader organizational impact..." },
    { type: "textarea", question: "How did customer(s) benefit from the accomplishment?", placeholder: "Detail the customer benefits..." },
    { type: "section", title: "Project Metrics" },
    { type: "input", question: "Schedule: Planned vs Actual", placeholder: "e.g., Planned: 3 months, Actual: 2.5 months" },
    { type: "input", question: "Effort: Planned vs Actual", placeholder: "e.g., Planned: 120hrs, Actual: 110hrs" },
    { type: "input", question: "Is there evidence of repeat project from customer? (Yes/No - If Yes, provide details)", placeholder: "Specify Yes/No, quantity, and value of repeat projects..." },
    { type: "textarea", question: "Customer feedback and testimonials", placeholder: "Paste email excerpts, call logs, or survey responses..." },
    { type: "section", title: "Scoring Weight Grid Reference (Total: 100)" },
    { type: "input", question: "Schedule adherence Rating (Weight: 15)", placeholder: "Rate 1-5 (5: Ahead/on time, 1: Penalties)" },
    { type: "input", question: "Cost control Rating (Weight: 15)", placeholder: "Rate 1-5 (5: Within budget, 1: Penalties)" },
    { type: "input", question: "Quality Rating (Weight: 15)", placeholder: "Rate 1-5 (5: Exceptional, 1: Penalties)" },
    { type: "input", question: "Customer testimonials Rating (Weight: 40)", placeholder: "Rate 1-5 (5: Delight, 1: Negative)" },
    { type: "input", question: "Repeat project Rating (Weight: 15)", placeholder: "Rate 1-5 (5: High value repeat, 1: None)" }
  ],
  "Team Awesome Award": [
    { type: "input", question: "Project / Customer Name", placeholder: "Enter project or customer name..." },
    { type: "textarea", question: "Justification: Describe the team's achievements and justify the qualification for the nomination.", placeholder: "Detail why the group deserves this award..." },
    { type: "textarea", question: "Team collaboration details (Number of team members & Roles played in brief)", placeholder: "List member counts and functional duties..." },
    { type: "input", question: "Did it involve cross-functional teams? (Yes/No - If Yes, provide details)", placeholder: "Detail collaborative departments..." },
    { type: "textarea", question: "Innovation (List new ideas, automation, or process changes introduced to overcome challenges)", placeholder: "Describe creative breakthroughs..." },
    { type: "textarea", question: "Stakeholder feedback and testimonials", placeholder: "Enter stakeholder review summaries..." },
    { type: "section", title: "Scoring Weight Grid Reference (Total: 100)" },
    { type: "input", question: "Collaboration Rating (Weight: 30)", placeholder: "Rate 1-5 (5: Outstanding coordination, 1: Fragmented team)" },
    { type: "input", question: "Innovation Rating (Weight: 15)", placeholder: "Rate 1-5 (5: Breakthrough ideas, 1: No innovation)" },
    { type: "input", question: "Stakeholder impact Rating (Weight: 30)", placeholder: "Rate 1-5 (5: Customer delight, 1: Negative feedback)" },
    { type: "input", question: "Challenges overcome Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Overcame major challenges, 1: Not addressed)" }
  ],
  "Peer Appreciation Award": [
    { type: "input", question: "Project / Customer Name", placeholder: "Enter project or customer name if applicable..." },
    { type: "textarea", question: "Justification: Brief description about the nominee & current responsibilities.", placeholder: "Summarize profile..." },
    { type: "textarea", question: "Explain how the nominee positively impacted co-workers, customers, and vendors with examples (If any).", placeholder: "Describe cross-stakeholder relationship impacts..." },
    { type: "input", question: "Number of appreciations received from team/peers", placeholder: "Quantify if known..." },
    { type: "textarea", question: "Contribution to team success (Quantify the impact due to the nominee & list owned activities)", placeholder: "Highlight clear deliverables..." },
    { type: "section", title: "Scoring Weight Grid Reference (Total: 100)" },
    { type: "input", question: "Ownership Rating (Weight: 30)", placeholder: "Rate 1-5 (5: Strong ownership, 1: No contribution)" },
    { type: "input", question: "Contribution/Impact Rating (Weight: 30)", placeholder: "Rate 1-5 (5: Outstanding, 1: No impact)" },
    { type: "input", question: "Appreciations received Rating (Weight: 40)", placeholder: "Rate 1-5 (5: Team delight, 1: Negative feedback)" }
  ],
  "Outstanding Leadership Award": [
    { type: "input", question: "Project / Customer Name", placeholder: "Enter project or customer name..." },
    { type: "textarea", question: "Justification: Brief description about the nominee & current responsibilities.", placeholder: "Introduce the nominee..." },
    { type: "textarea", question: "Describe the nominee's ability to inspire and motivate his/her team.", placeholder: "Explain motivational traits..." },
    { type: "textarea", question: "Describe with examples how the nominee leads by example (Self-learning, conflict handling, integrity, work ethics).", placeholder: "Provide explicit cultural alignment examples..." },
    { type: "textarea", question: "List the coaching/mentoring and guidance sessions handled by the nominee.", placeholder: "Quantify frequency/topics..." },
    { type: "textarea", question: "How often does the nominee review his/her team's activities and give credit? Cite numbers if possible.", placeholder: "Describe validation patterns..." },
    { type: "input", question: "Score received by the manager in last ESAT", placeholder: "Provide official score..." },
    { type: "section", title: "Scoring Weight Grid Reference (Total: 100)" },
    { type: "input", question: "Motivation Rating (Weight: 20)", placeholder: "Rate 1-5 (5: Strong motivation/consistent team performance)" },
    { type: "input", question: "Leading by example Rating (Weight: 20)", placeholder: "Rate 1-5 (5: Outstanding multiple instances)" },
    { type: "input", question: "Coaching/Mentoring Rating (Weight: 20)", placeholder: "Rate 1-5 (5: More than 5 sessions)" },
    { type: "input", question: "Reviews/Credits Rating (Weight: 20)", placeholder: "Rate 1-5 (5: Weekly reviews, >=50% team recognized)" },
    { type: "input", question: "ESAT score Rating (Weight: 20)", placeholder: "As per the score rated on 5" }
  ],
  "Beyond the Call of Duty Award": [
    { type: "input", question: "Project / Customer Name", placeholder: "Enter project or customer name..." },
    { type: "textarea", question: "Justification: Describe the tasks performed beyond the call of duty.", placeholder: "What did they do outside core duties?" },
    { type: "textarea", question: "Explain how the nominee exceeds expectations - handles challenges and takes ownership beyond assigned responsibilities.", placeholder: "Highlight problem management skillsets..." },
    { type: "textarea", question: "Describe with examples how the nominee operates and how often he/she takes action without supervision.", placeholder: "Define autonomy benchmarks..." },
    { type: "textarea", question: "List the results/goals that were achieved by the nominee and highlight how it went beyond expectations.", placeholder: "Quantify impacts..." },
    { type: "section", title: "Scoring Weight Grid Reference (Total: 100)" },
    { type: "input", question: "Ownership Rating (Weight: 30)", placeholder: "Rate 1-5 (5: Proactively solves complex problems)" },
    { type: "input", question: "Self-driven performance Rating (Weight: 30)", placeholder: "Rate 1-5 (5: Delivers exceptional outcomes with minimal guidance)" },
    { type: "input", question: "Results Rating (Weight: 40)", placeholder: "Rate 1-5 (5: Delivers high-impact results changing org trajectory)" }
  ],
  "Ace of Initiative Award": [
    { type: "input", question: "Project / Customer Name", placeholder: "Enter project or customer name..." },
    { type: "textarea", question: "Justification: Describe the new initiatives led by the nominee.", placeholder: "What process modification or deployment did they spearhead?" },
    { type: "textarea", question: "Describe how the nominee led the initiative from the front.", placeholder: "Detail active execution milestones..." },
    { type: "textarea", question: "Describe the quality of the output and list the improvements with expected vs actual numbers (Provide benchmarks if any).", placeholder: "Quantify productivity or efficiency changes..." },
    { type: "textarea", question: "Describe the nominee's collaboration skill in terms of working with cross-functional teams and managing conflicts.", placeholder: "Detail relational navigation..." },
    { type: "textarea", question: "Describe the change management approach? How did they roll out the initiative and get buy-in?", placeholder: "Explain stakeholder alignment roadmap..." },
    { type: "section", title: "Scoring Weight Grid Reference (Total: 100)" },
    { type: "input", question: "Leadership Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Demonstrates exceptional ownership)" },
    { type: "input", question: "Outcome Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Sets new organizational benchmarks)" },
    { type: "input", question: "Collaboration Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Strong collaborator and negotiator)" },
    { type: "input", question: "Change Management Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Multi-channel communication; excellent engagement)" }
  ],
  "Administrative Excellence Award": [
    { type: "input", question: "Project / Customer Name", placeholder: "Enter project/functional context..." },
    { type: "textarea", question: "Justification: Brief about the nomination for the outstanding performance.", placeholder: "Highlight primary administrative drivers..." },
    { type: "textarea", question: "Describe how effectively the nominee manages time and commitments.", placeholder: "Detail turnaround reliability..." },
    { type: "textarea", question: "Describe the nominee's integrity, confidentiality, and adherence to rules/regulations.", placeholder: "Detail system compliance updates..." },
    { type: "textarea", question: "Describe the nominee's communication, listening, and relationship-building skills.", placeholder: "Detail stakeholder feedback updates..." },
    { type: "textarea", question: "Describe the nominee's ability to plan ahead and complete tasks without prompting.", placeholder: "Detail proactive execution updates..." },
    { type: "section", title: "Scoring Weight Grid Reference (Total: 100)" },
    { type: "input", question: "Commitment Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Demonstrates exceptional ownership)" },
    { type: "input", question: "Outcome Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Delivers exceptional quality metrics)" },
    { type: "input", question: "Collaboration Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Strong collaborator and negotiator)" },
    { type: "input", question: "Change Management Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Transparent, timely execution patterns)" }
  ],
  "Spotlight Award": [
    { type: "input", question: "Project / Customer Name", placeholder: "Enter project or internal client tracking name..." },
    { type: "textarea", question: "Justification: Brief about the nomination for the outstanding performance.", placeholder: "Describe general performance metrics..." },
    { type: "textarea", question: "Describe how the nominee achieved role-defined goals and job expectations. (List goals, targets, and actuals)", placeholder: "Provide raw performance tracking targets..." },
    { type: "textarea", question: "Describe the nominee's quality of execution and schedule adherence.", placeholder: "Note timeline deliveries..." },
    { type: "textarea", question: "Describe the nominee's initiative and willingness to contribute beyond assigned duties.", placeholder: "Detail voluntary assignments..." },
    { type: "textarea", question: "Describe the nominee's professionalism, customer focus, teamwork, punctuality, discipline, and influence on others.", placeholder: "Evaluate code-of-conduct alignment..." },
    { type: "section", title: "Scoring Weight Grid Reference (Total: 100)" },
    { type: "input", question: "Outcome Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Achieves/exceeds all major goals)" },
    { type: "input", question: "Quality and Timeliness Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Always on time; high-quality output)" },
    { type: "input", question: "Initiative Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Frequently volunteers for significant loads)" },
    { type: "input", question: "Professionalism Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Exceptional attitude; role model for peers)" }
  ],
  "Top Performance Award": [
    { type: "input", question: "Project / Customer Name", placeholder: "Enter project context..." },
    { type: "textarea", question: "Justification: Brief about the nomination for the outstanding performance.", placeholder: "Summarize overarching wins..." },
    { type: "textarea", question: "Describe how the nominee achieved division/function goals and KPIs. (List goals/KPIs, targets, and actuals)", placeholder: "Supply comparative data..." },
    { type: "textarea", question: "Describe the nominee's quality of execution, schedule adherence, and customer satisfaction.", placeholder: "Detail quality parameters..." },
    { type: "textarea", question: "Describe the nominee's initiative, ownership, and problem-solving skills.", placeholder: "Detail critical logic application..." },
    { type: "textarea", question: "Describe the nominee's impact on business and value creation.", placeholder: "Explain explicit scaling, savings or revenue generation mechanics..." },
    { type: "section", title: "Scoring Weight Grid Reference (Total: 100)" },
    { type: "input", question: "Outcome Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Strong multi-area functional over-achievement)" },
    { type: "input", question: "Quality and CSAT Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Always on time; raw customer delight)" },
    { type: "input", question: "Initiative Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Frequently volunteers; revived failing initiatives)" },
    { type: "input", question: "Business Impact/Value Creation Rating (Weight: 25)", placeholder: "Rate 1-5 (5: Significant revenue growth / cost structural optimization)" }
  ],
  "Sales Champion Award": [
    { type: "input", question: "Project / Customer Name", placeholder: "Enter primary account or customer logo info..." },
    { type: "textarea", question: "Justification: Brief about the nomination for the outstanding sales performance.", placeholder: "Summarize commercial achievements..." },
    { type: "textarea", question: "Describe how the nominee contributed to top-line growth. Provide target vs actual numbers for sales, revenue generated, new customers acquired, deal win ratio.", placeholder: "Enter absolute numbers..." },
    { type: "textarea", question: "Describe the nominee's ability to bring in new logos and expand into new markets. Provide number of new logos, new regions, or details of strong competitive wins.", placeholder: "List competitive acquisitions..." },
    { type: "textarea", question: "Describe the nominee's effectiveness in cross-selling and up-selling. Provide numbers for multi-product sales.", placeholder: "Itemize collaborative product additions..." },
    { type: "textarea", question: "Describe the nominee's ability to close complex deals efficiently and maintain long-term relationship strength for repeat business.", placeholder: "Detail account preservation..." },
    { type: "section", title: "Scoring Weight Grid Reference (Total: 100)" },
    { type: "input", question: "Revenue achievement Rating (Weight: 20)", placeholder: "Rate 1-5 (5: Exceeded targets significantly)" },
    { type: "input", question: "New Customer acquisition Rating (Weight: 20)", placeholder: "Rate 1-5 (5: Multiple new logos/regions)" },
    { type: "input", question: "Cross-Selling/Up-Selling Rating (Weight: 20)", placeholder: "Rate 1-5 (5: Exceptional multi-product values)" },
    { type: "input", question: "Strategic Deal closure Rating (Weight: 20)", placeholder: "Rate 1-5 (5: Short sales cycles on complex configurations)" },
    { type: "input", question: "Customer Relationship Management Rating (Weight: 20)", placeholder: "Rate 1-5 (5: Exceptional trust-based retention profiles)" }
  ],
  "Customer Delight Award": [
    { type: "input", question: "Project / Customer Name", placeholder: "Enter customer or project name..." },
    { type: "textarea", question: "Justification: Brief about the project/customer engagement and the nominee's contribution.", placeholder: "Describe milestones..." },
    {
      type: "checkbox",
      question: "Indicate the Type of services provided",
      options: ["Technical support", "Post Installation Service", "Account Management", "Escalation handling", "Documentation/Deliverables", "Other"]
    },
    { type: "textarea", question: "Describe the nominee's execution quality and customer satisfaction during project delivery. Please provide target vs actuals for Delivery Timeliness.", placeholder: "Enter timeliness verification..." },
    { type: "textarea", question: "Describe the nominee's effectiveness in managing multi-phase or strategic customer engagements.", placeholder: "Detail alignment maps..." },
    { type: "textarea", question: "Describe the nominee's responsiveness and effectiveness after project completion. Provide target vs actuals for first response time, resolution time, CSAT, Net Promoter Score.", placeholder: "Provide metric parameters..." },
    { type: "textarea", question: "Describe the nominee's ability to sustain customer relationships and repeat business. Provide repeat business numbers & Customer satisfaction testimonials.", placeholder: "Paste quotes or repeat frequencies..." },
    { type: "section", title: "Scoring Weight Grid Reference (Total: 100)" },
    { type: "input", question: "Delivery Excellence Rating (Weight: 20)", placeholder: "Rate 1-5 (5: On time, within budget, exceptional quality)" },
    { type: "input", question: "Multi-phase/strategic engagement Rating (Weight: 20)", placeholder: "Rate 1-5 (5: Seamless program execution, proactive coordination)" },
    { type: "input", question: "Support effectiveness Rating (Weight: 20)", placeholder: "Rate 1-5 (5: Rapid response, outstanding issue resolution)" },
    { type: "input", question: "Customer Relationship Management Rating (Weight: 20)", placeholder: "Rate 1-5 (5: Exceptional long-term engagement; repeat business)" },
    { type: "input", question: "Customer Satisfaction Rating (Weight: 20)", placeholder: "Rate 1-5 (5: Multiple positive testimonials; measurable improvements)" }
  ]
};

const defaultDivisions = [
  "Conceptia Marine",
  "CKONNECT (Product Sales & Technical Enablement)",
  "CMTechno (Engineering Services & Consultancy)",
  "LightLeader Solar (Installation & Support Services)",
  "Conceptia Manpower",
  "Conceptia Software"
];

const awardGroups = [
  {
    groupName: "Leadership / Managerial",
    awards: [
      "Outstanding Leadership Award",
      "Beyond the Call of Duty Award",
      "Ace of Initiative Award",
      "Team Awesome Award"
    ]
  },
  {
    groupName: "Customer / Service / Support",
    awards: [
      "Customer Service Performance / Star Service Champion / Customer Hero Award",
      "Customer Delight Award",
      "Peer Appreciation Award"
    ]
  },
  {
    groupName: "Operations / Admin / General Excellence",
    awards: [
      "Administrative Excellence Award",
      "Spotlight Award",
      "Top Performance Award"
    ]
  },
  {
    groupName: "Sales / Commercial",
    awards: ["Sales Champion Award"]
  }
];

const description = {
  "Customer Service Performance / Star Service Champion / Customer Hero Award": [
    "Award Guidelines & Matrix:",
    "Note: This award can be nominated only by Team Manager.",
    "If Individual nomination - Nominator maps to dropdown of employee names. If Team nomination - Name field remains editable.",
    "Applicable to all divisions:",
    "• Conceptia – Business Enablers",
    "• Conceptia Marine",
    "• CKONNECT (Product Sales & Technical Enablement)",
    "• CMTechno (Engineering Services & Consultancy)",
    "• LightLeader Solar (Installation & Support Services)",
    "• Conceptia Manpower",
    "• Conceptia Software"
  ],
  "Team Awesome Award": [
    "Award Guidelines & Matrix:",
    "Note: This award can be nominated only by Team Manager/Manager.",
    "Focuses on group project completions, process improvement innovations, cross-functional collaboration metrics, and mitigation models.",
    "Applicable to all divisions:",
    "• Conceptia Marine",
    "• CKONNECT (Product Sales & Technical Enablement)",
    "• CMTechno (Engineering Services & Consultancy)",
    "• LightLeader Solar (Installation & Support Services)",
    "• Conceptia Manpower",
    "• Conceptia Software"
  ],
  "Peer Appreciation Award": [
    "Award Guidelines & Matrix:",
    "Note: This award can be nominated only by Management/AVP/Senior Managers.",
    "Measures ownership values, coworker collaboration dynamics, behind-the-scenes operational supports, and contribution to baseline department success metrics.",
    "Applicable to all divisions:",
    "• Conceptia Marine",
    "• CKONNECT (Product Sales & Technical Enablement)",
    "• CMTechno (Engineering Services & Consultancy)",
    "• LightLeader Solar (Installation & Support Services)",
    "• Conceptia Manpower",
    "• Conceptia Software",
    "• Conceptia Business Enablers"
  ],
  "Outstanding Leadership Award": [
    "Award Guidelines & Matrix:",
    "Note: This award can be nominated only by Management/AVP/Senior Managers.",
    "Evaluates cross-team mentorship patterns, leadership mechanics, leading by example, cadence review counts, and functional ESAT alignment outputs.",
    "Applicable to all divisions:",
    "• Conceptia Marine",
    "• CKONNECT (Product Sales & Technical Enablement)",
    "• CMTechno (Engineering Services & Consultancy)",
    "• LightLeader Solar (Installation & Support Services)",
    "• Conceptia Manpower",
    "• Conceptia Software"
  ],
  "Beyond the Call of Duty Award": [
    "Award Guidelines & Matrix:",
    "Note: This award can be nominated only by Management.",
    "Evaluates proactive problem resolution actions without oversight, extraordinary task execution ownerships, and functional baseline objective exceedances.",
    "Applicable to all divisions:",
    "• Conceptia Marine",
    "• CKONNECT (Product Sales & Technical Enablement)",
    "• CMTechno (Engineering Services & Consultancy)",
    "• LightLeader Solar (Installation & Support Services)",
    "• Conceptia Manpower",
    "• Conceptia Software"
  ],
  "Ace of Initiative Award": [
    "Award Guidelines & Matrix:",
    "Note: This award can be nominated only by Management/AVP/Senior Managers.",
    "Tracks programmatic change management rollouts, frontline workflow leadership, strategic implementation benchmarks, and stakeholder alignment operations.",
    "Applicable to all divisions:",
    "• Conceptia Marine",
    "• CKONNECT (Product Sales & Technical Enablement)",
    "• CMTechno (Engineering Services & Consultancy)",
    "• LightLeader Solar (Installation & Support Services)",
    "• Conceptia Manpower",
    "• Conceptia Software"
  ],
  "Administrative Excellence Award": [
    "Award Guidelines & Matrix:",
    "Upholds workplace operational support systems, procedural compliance structures, time commitment management, and strategic confidentiality rules.",
    "Applicable to all divisions:",
    "• Conceptia Marine",
    "• CKONNECT (Product Sales & Technical Enablement)",
    "• CMTechno (Engineering Services & Consultancy)",
    "• LightLeader Solar (Installation & Support Services)",
    "• Conceptia Manpower",
    "• Conceptia Software"
  ],
  "Spotlight Award": [
    "Award Guidelines & Matrix:",
    "Recognizes the execution quality, role goals adherence, performance timeline reliability, and workplace discipline benchmarks of core team contributors.",
    "Applicable to all divisions:",
    "• Conceptia Marine",
    "• CKONNECT (Product Sales & Technical Enablement)",
    "• CMTechno (Engineering Services & Consultancy)",
    "• LightLeader Solar (Installation & Support Services)",
    "• Conceptia Manpower",
    "• Conceptia Software",
    "• Conceptia Business Enablers"
  ],
  "Top Performance Award": [
    "Award Guidelines & Matrix:",
    "Tracks division metric achievements, overarching KPI deliveries, value creation milestones, and advanced project orchestration capabilities.",
    "Applicable to all divisions:",
    "• Conceptia Marine",
    "• CKONNECT (Product Sales & Technical Enablement)",
    "• CMTechno (Engineering Services & Consultancy)",
    "• LightLeader Solar (Installation & Support Services)",
    "• Conceptia Manpower",
    "• Conceptia Software",
    "• Conceptia Business Enablers"
  ],
  "Sales Champion Award": [
    "Award Guidelines & Matrix:",
    "Tracks absolute top-line revenue additions, margin generation metrics, new market cross-selling ratios, and strategic customer acquisition programs.",
    "Applicable to all divisions:",
    "• Conceptia Marine",
    "• CKONNECT (Product Sales & Technical Enablement)",
    "• CMTechno (Engineering Services & Consultancy)",
    "• LightLeader Solar (Installation & Support Services)",
    "• Conceptia Manpower",
    "• Conceptia Software"
  ],
  "Customer Delight Award": [
    "Award Guidelines & Matrix:",
    "Measures program delivery metrics, after-sales service operations, post-delivery CSAT/NPS targets, and repeat long-term relationship acquisitions.",
    "Applicable to all divisions:",
    "• Conceptia – Administrative team",
    "• Conceptia Marine (Manpower, Marine Design & Services)",
    "• CKONNECT (Product Sales & Technical Enablement)",
    "• CMTechno (Engineering Services & Consultancy)",
    "• LightLeader Solar (Installation & Support Services)",
    "• Conceptia Software"
  ]
};

const NominationForm = () => {
  const [employees, setEmployees] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [eligibleAwards, setEligibleAwards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customAnswers, setCustomAnswers] = useState({});
  const [checkboxValues, setCheckboxValues] = useState({});

  const currentDate = new Date();
  const formattedMonthYear = `${currentDate.toLocaleString("default", { month: "long" })} ${currentDate.getFullYear()}`;

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
    projectOrCustomer: "",
    submissionDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [employeesRes, divisionsRes] = await Promise.all([
          axios.get("https://annual-award12.onrender.com/api/employees"),
          axios.get("https://annual-award12.onrender.com/api/employees/divisions"),
        ]);

        const mergedDivisions = [...new Set([
          ...defaultDivisions,
          ...(Array.isArray(divisionsRes.data) ? divisionsRes.data : [])
        ])];

        setEmployees(employeesRes.data);
        setDivisions(mergedDivisions);
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
      setEligibleAwards([]);
      setAwardQuestions([]);
      setCustomAnswers({});
      setCheckboxValues({});
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
        const nextDesignation = employee.designation || employee.position || employee.role || "";
        const nextEligibleAwards = getEligibleAwards(selectedDivision, nextDesignation);
        const awardsToShow = nextEligibleAwards.length > 0 ? nextEligibleAwards : Object.keys(questionMap);
        setEligibleAwards(awardsToShow);
        setForm((prev) => ({
          ...prev,
          employeeId: employee.empId,
          department: employee.department,
          designation: nextDesignation,
          employeeEmail: employee.email,
          awardType: awardsToShow.includes(prev.awardType) ? prev.awardType : "",
        }));
        setAwardQuestions([]);
        setCustomAnswers({});
        setCheckboxValues({});
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
      alert("Appreciation Portal Nomination submitted successfully!");
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
      nominatorName: "",
      nominatorDept: "",
      nominatorDesig: "",
      nominatorEmail: "",
      projectOrCustomer: "",
      submissionDate: new Date().toISOString().split('T')[0]
    });
    setSelectedDivision("");
    setEligibleAwards([]);
    setAwardQuestions([]);
    setCustomAnswers({});
    setCheckboxValues({});
  };

  const filteredEmployees = selectedDivision
    ? employees.filter((emp) => emp.division === selectedDivision)
    : [];

  const groupedAwardOptions = awardGroups
    .map((group) => ({
      ...group,
      awards: group.awards.filter((award) => eligibleAwards.includes(award))
    }))
    .filter((group) => group.awards.length > 0);

  const isAwardSelectorDisabled = !selectedDivision || !form.employeeName;

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

  if (isLoading) return <div className="loading">Processing System Configuration Assets...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="award-form-container">
      <img src={bgimage} alt="Background Workspace" className="form-image" />

      <form className="award-form" onSubmit={handleSubmit}>
        <h1>🎉 Conceptia Appreciations Portal 🎉</h1>

        <div className="form-section">
          <h3>Nominee Information Matrix</h3>

          <div className="form-group">
            <label htmlFor="division">Nominee Division Context</label>
            <select name="division" value={selectedDivision} required onChange={handleChange}>
              <option value="">-- Select Division Branch --</option>
              {divisions.map((division) => (
                <option key={division} value={division}>
                  {division.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="employeeName">Nominee Core Name</label>
            <select name="employeeName" required value={form.employeeName} onChange={handleChange} disabled={!selectedDivision}>
              <option value="">--- Select Registered Corporate Profile ---</option>
              {filteredEmployees.map((employee) => (
                <option key={employee.empId} value={employee.name}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nominee Profile Identity Key (ID)</label>
              <input readOnly value={form.employeeId} placeholder="Auto-populated" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Assigned Department Block</label>
              <input readOnly value={form.department} placeholder="Auto-populated" />
            </div>
            <div className="form-group">
              <label>Official Corporate Designation</label>
              <input readOnly value={form.designation} placeholder="Auto-populated" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Award Categorization & Parameters</h3>

          <div className="form-group">
            <label>Nomination Cycle Grouping</label>
            <input value={form.yearOfNomination} readOnly />
          </div>

          <div className="form-group">
            <label htmlFor="awardType">Configured Evaluation Category</label>
            <select name="awardType" required value={form.awardType} onChange={handleChange} disabled={isAwardSelectorDisabled}>
              <option value="">{selectedDivision && form.employeeName ? "-- Select Award Validation Matrix --" : "Select a division and nominee first"}</option>
              {groupedAwardOptions.map((group) => (
                <optgroup key={group.groupName} label={group.groupName}>
                  {group.awards.map((award) => (
                    <option key={award} value={award}>
                      {award}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {form.awardType && description[form.awardType] && (
            <div className="award-description">
              {description[form.awardType].map((line, index) => {
                const isHighlighted =
                  line.startsWith("Award Guidelines & Matrix:") ||
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
              <h3>Performance Justification & Strategic Metric Entry</h3>
              {awardQuestions.map(renderQuestionInput)}
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Nominator Information (Validation Chain)</h3>

          <div className="form-group">
            <label htmlFor="nominatorName">Authenticated Nominator Identity</label>
            <select name="nominatorName" required value={form.nominatorName} onChange={handleChange}>
              <option value="">-- Select Active Nominator Profile --</option>
              {employees.map((employee) => (
                <option key={employee.empId} value={employee.name}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nominator Tracking Department</label>
              <input readOnly value={form.nominatorDept} placeholder="Auto-populated" />
            </div>
          </div>

          <div className="form-group">
            <label>Nominator Role Designation</label>
            <input readOnly value={form.nominatorDesig} placeholder="Auto-populated" />
          </div>
        </div>

        <button type="submit" className="submit-button">
          Submit Official Appreciation Portal Form
        </button>
      </form>
    </div>
  );
}

export default NominationForm;