// Pure helpers that turn raw rows (arrays of header -> value) into clean records.
// No dependencies, so they can be tested with plain Node.
import { CONTACT_STATUSES, ACTIVITY_STATUSES, TARGETS } from './config.js';

export const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

export const SPECS = {
  contacts: {
    sheetName: 'contacts',
    required: ['company', 'status'],
    columns: {
      company: 'company',
      'contact name': 'name',
      title: 'title',
      email: 'email',
      phone: 'phone',
      industry: 'industry',
      channel: 'channel',
      'date contacted': 'dateContacted',
      'last follow-up': 'lastFollowUp',
      status: 'status',
      'next step': 'nextStep',
      notes: 'notes',
    },
    dates: ['dateContacted', 'lastFollowUp'],
    key: 'company',
  },
  metrics: {
    sheetName: 'weekly metrics',
    required: ['week', 'registered employers'],
    columns: {
      week: 'week',
      'registered employers': 'registeredEmployers',
      'active employers': 'activeEmployers',
      'completed student profiles': 'completedProfiles',
      'candidate handoffs': 'candidateHandoffs',
      placements: 'placements',
    },
    dates: ['week'],
    numbers: TARGETS.map((t) => t.key),
    key: 'week',
  },
  activities: {
    sheetName: 'activities',
    required: ['activity'],
    columns: {
      activity: 'activity',
      when: 'when',
      side: 'side',
      reached: 'reached',
      converted: 'converted',
      result: 'result',
      status: 'status',
    },
    numbers: ['reached', 'converted'],
    key: 'activity',
  },
};

// Which kind of sheet is this, judged by its headers.
export function detectKind(headers) {
  const set = new Set(headers.map(norm));
  for (const [kind, spec] of Object.entries(SPECS)) {
    if (spec.required.every((h) => set.has(h))) return kind;
  }
  return null;
}

const pad = (n) => String(n).padStart(2, '0');

// Accepts a Date, an ISO string, m/d/yyyy, or an Excel serial number. Returns yyyy-mm-dd or ''.
export function toIsoDate(v) {
  if (v === null || v === undefined || v === '') return '';
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  if (typeof v === 'number' && v > 20000 && v < 80000) {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 864e5);
    return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const y = m[3].length === 2 ? '20' + m[3] : m[3];
    return `${y}-${pad(m[1])}-${pad(m[2])}`;
  }
  const t = Date.parse(s);
  return isNaN(t) ? '' : new Date(t).toISOString().slice(0, 10);
}

export function toNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

function canonical(value, allowed) {
  const hit = allowed.find((a) => norm(a) === norm(value));
  return hit ?? null;
}

// rows: array of plain objects keyed by the sheet's own header text.
export function cleanRows(kind, rows, warnings) {
  const spec = SPECS[kind];
  const out = [];
  rows.forEach((raw, i) => {
    const rec = {};
    for (const [header, value] of Object.entries(raw)) {
      const field = spec.columns[norm(header)];
      if (field) rec[field] = typeof value === 'string' ? value.trim() : value;
    }
    const values = Object.values(rec).filter((v) => v !== '' && v !== null && v !== undefined);
    if (!values.length) return;
    if (norm(rec[spec.key]).startsWith('example')) return;

    for (const f of spec.dates ?? []) rec[f] = toIsoDate(rec[f]);
    for (const f of spec.numbers ?? []) rec[f] = toNumber(rec[f]);
    for (const f of Object.values(spec.columns)) {
      if (rec[f] === undefined) rec[f] = spec.numbers?.includes(f) ? null : '';
      else if (typeof rec[f] !== 'number' && rec[f] !== null) rec[f] = String(rec[f]);
    }

    const rowNo = i + 2;
    if (kind === 'contacts') {
      const s = canonical(rec.status, CONTACT_STATUSES);
      if (rec.status && !s) warnings.push(`Contacts row ${rowNo}: unknown status "${rec.status}" (counted as Contacted).`);
      rec.status = s ?? (rec.status ? 'Contacted' : rec.dateContacted ? 'Contacted' : 'Not contacted');
      if (!rec.company) warnings.push(`Contacts row ${rowNo}: no company name.`);
    }
    if (kind === 'activities') {
      const s = canonical(rec.status, ACTIVITY_STATUSES);
      if (rec.status && !s) warnings.push(`Activities row ${rowNo}: unknown status "${rec.status}".`);
      rec.status = s ?? rec.status;
    }
    if (kind === 'metrics' && !rec.week) {
      warnings.push(`Weekly metrics row ${rowNo}: missing or unreadable week date, skipped.`);
      return;
    }
    out.push(rec);
  });
  return out;
}
