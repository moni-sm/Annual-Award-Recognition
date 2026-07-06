const awardRules = [
  {
    name: 'Customer Service Performance / Star Service Champion / Customer Hero Award',
    divisions: ['CKONNECT (Product Sales & Technical Enablement)', 'LightLeader Solar (Installation & Support Services)', 'CMTechno (Engineering Services & Consultancy)', 'Conceptia Marine', 'Conceptia Software'],
    designations: ['Customer Service Executive', 'Customer Support Executive', 'Team Manager', 'Manager', 'Senior Manager']
  },
  {
    name: 'Team Awesome Award',
    divisions: ['CKONNECT (Product Sales & Technical Enablement)', 'LightLeader Solar (Installation & Support Services)', 'CMTechno (Engineering Services & Consultancy)', 'Conceptia Marine', 'Conceptia Software', 'Conceptia Business Enablers', 'Conceptia Manpower'],
    designations: ['Team Manager', 'Manager', 'Senior Manager', 'AVP', 'Management']
  },
  {
    name: 'Peer Appreciation Award',
    divisions: ['CKONNECT (Product Sales & Technical Enablement)', 'LightLeader Solar (Installation & Support Services)', 'CMTechno (Engineering Services & Consultancy)', 'Conceptia Marine', 'Conceptia Software', 'Conceptia Business Enablers', 'Conceptia Manpower'],
    designations: ['Management', 'AVP', 'Senior Manager', 'Manager', 'Team Manager']
  },
  {
    name: 'Outstanding Leadership Award',
    divisions: ['CKONNECT (Product Sales & Technical Enablement)', 'LightLeader Solar (Installation & Support Services)', 'CMTechno (Engineering Services & Consultancy)', 'Conceptia Marine', 'Conceptia Software', 'Conceptia Business Enablers', 'Conceptia Manpower'],
    designations: ['Management', 'AVP', 'Senior Manager', 'Manager']
  },
  {
    name: 'Beyond the Call of Duty Award',
    divisions: ['CKONNECT (Product Sales & Technical Enablement)', 'LightLeader Solar (Installation & Support Services)', 'CMTechno (Engineering Services & Consultancy)', 'Conceptia Marine', 'Conceptia Software', 'Conceptia Business Enablers', 'Conceptia Manpower'],
    designations: ['Management', 'AVP', 'Senior Manager']
  },
  {
    name: 'Ace of Initiative Award',
    divisions: ['CKONNECT (Product Sales & Technical Enablement)', 'LightLeader Solar (Installation & Support Services)', 'CMTechno (Engineering Services & Consultancy)', 'Conceptia Marine', 'Conceptia Software', 'Conceptia Business Enablers', 'Conceptia Manpower'],
    designations: ['Management', 'AVP', 'Senior Manager', 'Manager']
  },
  {
    name: 'Administrative Excellence Award',
    divisions: ['Conceptia Business Enablers', 'Conceptia Manpower', 'Conceptia Software', 'Conceptia Marine', 'CKONNECT (Product Sales & Technical Enablement)'],
    designations: ['Administrative Assistant', 'Executive Assistant', 'Operations Executive', 'Administrator', 'Manager', 'Senior Manager']
  },
  {
    name: 'Spotlight Award',
    divisions: ['Conceptia Business Enablers', 'Conceptia Manpower', 'Conceptia Software', 'Conceptia Marine', 'CKONNECT (Product Sales & Technical Enablement)', 'LightLeader Solar (Installation & Support Services)', 'CMTechno (Engineering Services & Consultancy)'],
    designations: ['Executive', 'Engineer', 'Technician', 'Specialist', 'Analyst', 'Associate', 'Assistant', 'Manager', 'Senior Manager', 'AVP']
  },
  {
    name: 'Top Performance Award',
    divisions: ['Conceptia Business Enablers', 'Conceptia Manpower', 'Conceptia Software', 'Conceptia Marine', 'CKONNECT (Product Sales & Technical Enablement)', 'LightLeader Solar (Installation & Support Services)', 'CMTechno (Engineering Services & Consultancy)'],
    designations: ['Manager', 'Senior Manager', 'AVP', 'Management', 'Team Lead', 'Lead']
  },
  {
    name: 'Sales Champion Award',
    divisions: ['CKONNECT (Product Sales & Technical Enablement)'],
    designations: ['Sales Executive', 'Sales Manager', 'Business Development Executive', 'Senior Manager', 'Manager', 'AVP']
  },
  {
    name: 'Customer Delight Award',
    divisions: ['CKONNECT (Product Sales & Technical Enablement)', 'LightLeader Solar (Installation & Support Services)', 'CMTechno (Engineering Services & Consultancy)', 'Conceptia Software'],
    designations: ['Customer Support Executive', 'Customer Service Executive', 'Project Manager', 'Manager', 'Senior Manager', 'Technical Support Engineer']
  }
];

export const getEligibleAwards = (division, designation = '') => {
  if (!division) return [];

  const normalizedDivision = division.trim();
  const normalizedDesignation = (designation || '').trim().toLowerCase();

  return awardRules
    .filter((rule) => {
      const matchesDivision = rule.divisions.includes(normalizedDivision);
      const matchesDesignation = rule.designations.some((candidate) =>
        normalizedDesignation.includes(candidate.toLowerCase())
      );

      return matchesDivision && matchesDesignation;
    })
    .map((rule) => rule.name);
};
