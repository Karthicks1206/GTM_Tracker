// Starting totals already on the platform when tracking began. The tracker only
// counts progress from this date; the Weekly metrics sheet holds NEW numbers per week.
export const BASELINE_DATE = '2026-10-21';
export const BASELINE_LABEL = 'Oct 21';

// Fixed targets KT set on Oct 19, 2026. Edit here if targets change.
export const CHECKPOINT_DATE = '2026-12-15';
export const CHECKPOINT_LABEL = 'Dec 15';

export const TARGETS = [
  { key: 'registeredEmployers', label: 'Registered employers', definition: 'Companies with a Talon account', baseline: 26, target: 45, spring: 75, springBy: 'May 2027' },
  { key: 'activeEmployers', label: 'Active employers', definition: 'Registered and sent at least one interview request', baseline: 4, target: 15, spring: 30, springBy: 'May 2027' },
  { key: 'completedProfiles', label: 'Completed student profiles', definition: 'Resume uploaded and visible in search', baseline: 650, target: 1000, spring: 1300, springBy: 'mid-March 2027' },
  { key: 'candidateHandoffs', label: 'Candidate handoffs', definition: 'Student finished the AI interview and the employer advanced them', baseline: 8, target: 20, spring: 100, springBy: 'May 2027' },
  { key: 'placements', label: 'Placements', definition: 'Offer accepted (on-campus jobs count)', baseline: 1, target: 5, spring: 20, springBy: 'May 2027' },
];

export const CONTACT_STATUSES = [
  'Not contacted',
  'Contacted',
  'Replied',
  'Meeting booked',
  'Signed up',
  'Active',
  'Not interested',
];

export const ACTIVITY_STATUSES = ['Planned', 'In progress', 'Worked', "Didn't work"];

// Funnel stages: a contact counts in every stage up to the one it has reached.
export const FUNNEL = [
  { label: 'Contacted', statuses: ['Contacted', 'Replied', 'Meeting booked', 'Signed up', 'Active', 'Not interested'] },
  { label: 'Replied', statuses: ['Replied', 'Meeting booked', 'Signed up', 'Active'] },
  { label: 'Meeting booked', statuses: ['Meeting booked', 'Signed up', 'Active'] },
  { label: 'Signed up', statuses: ['Signed up', 'Active'] },
  { label: 'Active', statuses: ['Active'] },
];

export const TIME_ZONE = 'America/Chicago';
