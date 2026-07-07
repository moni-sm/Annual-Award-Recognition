const awardRules = [
  {
    name: 'Customer Service Performance / Star Service Champion / Customer Hero Award',
    divisions: ['Conceptia Marine', 'CKONNECT (Product Sales & Technical Enablement)', 'CMTechno (Engineering Services & Consultancy)', 'LightLeader Solar (Installation & Support Services)', 'Conceptia Manpower', 'Conceptia Software', 'Conceptia Business Enablers'],
    designations: ['Customer Service Executive', 'Customer Support Executive', 'Team Manager', 'Manager', 'Senior Manager']
  },
  {
    name: 'Team Awesome Award',
    divisions: ['Conceptia Marine', 'CKONNECT (Product Sales & Technical Enablement)', 'CMTechno (Engineering Services & Consultancy)', 'LightLeader Solar (Installation & Support Services)', 'Conceptia Manpower', 'Conceptia Software', 'Conceptia Business Enablers'],
    designations: ['Team Manager', 'Manager', 'Senior Manager', 'AVP', 'Management']
  },
  {
    name: 'Peer Appreciation Award',
    divisions: ['Conceptia Marine', 'CKONNECT (Product Sales & Technical Enablement)', 'CMTechno (Engineering Services & Consultancy)', 'LightLeader Solar (Installation & Support Services)', 'Conceptia Manpower', 'Conceptia Software', 'Conceptia Business Enablers'],
    designations: ['Management', 'AVP', 'Senior Manager', 'Manager', 'Team Manager']
  },
  {
    name: 'Outstanding Leadership Award',
    divisions: ['Conceptia Marine', 'CKONNECT (Product Sales & Technical Enablement)', 'CMTechno (Engineering Services & Consultancy)', 'LightLeader Solar (Installation & Support Services)', 'Conceptia Manpower', 'Conceptia Software', 'Conceptia Business Enablers'],
    designations: ['Management', 'AVP', 'Senior Manager', 'Manager']
  },
  {
    name: 'Beyond the Call of Duty Award',
    divisions: ['Conceptia Marine', 'CKONNECT (Product Sales & Technical Enablement)', 'CMTechno (Engineering Services & Consultancy)', 'LightLeader Solar (Installation & Support Services)', 'Conceptia Manpower', 'Conceptia Software', 'Conceptia Business Enablers'],
    designations: ['Management', 'AVP', 'Senior Manager']
  },
  {
    name: 'Ace of Initiative Award',
    divisions: ['Conceptia Marine', 'CKONNECT (Product Sales & Technical Enablement)', 'CMTechno (Engineering Services & Consultancy)', 'LightLeader Solar (Installation & Support Services)', 'Conceptia Manpower', 'Conceptia Software', 'Conceptia Business Enablers'],
    designations: ['Management', 'AVP', 'Senior Manager', 'Manager']
  },
  {
    name: 'Administrative Excellence Award',
    divisions: ['*'],
    designations: ['*']
  },
  {
    name: 'Spotlight Award',
    divisions: ['*'],
    designations: ['*']
  },
  {
    name: 'Top Performance Award',
    divisions: ['*'],
    designations: ['*']
  },
  {
    name: 'Sales Champion Award',
    divisions: ['CKONNECT (Product Sales & Technical Enablement)'],
    designations: ['Sales Executive', 'Sales Manager', 'Business Development Executive', 'Senior Manager', 'Manager', 'AVP']
  },
  {
    name: 'Customer Delight Award',
    divisions: ['Conceptia Marine', 'CKONNECT (Product Sales & Technical Enablement)', 'CMTechno (Engineering Services & Consultancy)', 'LightLeader Solar (Installation & Support Services)', 'Conceptia Manpower', 'Conceptia Software', 'Conceptia Business Enablers'],
    designations: ['Customer Support Executive', 'Customer Service Executive', 'Project Manager', 'Manager', 'Senior Manager', 'Technical Support Engineer']
  }
];

export const getEligibleAwards = (division, designation = '') => {
  if (!division) return [];

  const normalizedDivision = division.trim();
  const normalizedDesignation = (designation || '').trim().toLowerCase();

  return awardRules
    .filter((rule) => {
      const matchesDivision = rule.divisions.includes('*') || rule.divisions.includes(normalizedDivision);
      const matchesDesignation =
        rule.designations.includes('*') ||
        rule.designations.some((candidate) =>
          normalizedDesignation.includes(candidate.toLowerCase())
        );

      return matchesDivision && matchesDesignation;
    })
    .map((rule) => rule.name);
};
