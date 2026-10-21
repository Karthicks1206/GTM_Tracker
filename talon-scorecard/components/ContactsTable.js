'use client';
import { useMemo, useState } from 'react';
import { CONTACT_STATUSES } from '../lib/config.js';
import { RowDelete } from './DeleteControls.js';

const fmtDate = (iso) => (iso ? new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '—');
const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '-');

const COLUMNS = [
  { key: 'company', label: 'Company' },
  { key: 'name', label: 'Contact' },
  { key: 'title', label: 'Title', hideNarrow: true },
  { key: 'channel', label: 'Channel', hideNarrow: true },
  { key: 'dateContacted', label: 'Contacted', date: true },
  { key: 'lastFollowUp', label: 'Last follow-up', date: true, hideNarrow: true },
  { key: 'status', label: 'Status' },
  { key: 'nextStep', label: 'Next step', hideNarrow: true },
];

export default function ContactsTable({ contacts }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ key: 'dateContacted', dir: 'desc' });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = contacts.filter(
      (c) =>
        (!status || c.status === status) &&
        (!needle || [c.company, c.name, c.title, c.email, c.industry, c.notes, c.nextStep].join(' ').toLowerCase().includes(needle)),
    );
    const order = (c) => (sort.key === 'status' ? CONTACT_STATUSES.indexOf(c.status) : (c[sort.key] || '').toString().toLowerCase());
    return filtered.sort((a, b) => {
      const x = order(a), y = order(b);
      const cmp = x < y ? -1 : x > y ? 1 : 0;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [contacts, q, status, sort]);

  const toggle = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));

  return (
    <div className="card">
      <div className="table-tools">
        <input className="input" type="search" placeholder="Search company, contact, notes…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search contacts" />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {CONTACT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="muted small">{rows.length} of {contacts.length}</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key} className={c.hideNarrow ? 'hide-narrow' : ''} aria-sort={sort.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button className="th-btn" onClick={() => toggle(c.key)}>
                    {c.label}{sort.key === c.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </th>
              ))}
              <th aria-label="Delete" />
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={c.id ?? `${c.company}-${c.email}-${i}`}>
                {COLUMNS.map((col) => (
                  <td key={col.key} className={col.hideNarrow ? 'hide-narrow' : ''}>
                    {col.key === 'status' ? (
                      <span className={`chip s-${slug(c.status)}`}>{c.status}</span>
                    ) : col.key === 'name' ? (
                      <>
                        {c.name || '—'}
                        {c.email && <div className="muted small">{c.email}</div>}
                      </>
                    ) : col.date ? (
                      fmtDate(c[col.key])
                    ) : (
                      c[col.key] || '—'
                    )}
                  </td>
                ))}
                <td><RowDelete part="contacts" id={c.id} label={c.name ? `${c.name}, ${c.company}` : c.company} /></td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={COLUMNS.length + 1} className="muted">No contacts match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
