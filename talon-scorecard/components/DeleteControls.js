'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

async function callDelete(body) {
  const res = await fetch('/api/data', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Delete failed.');
}

// Small × button that removes one row.
export function RowDelete({ part, id, label }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!id) return null;
  return (
    <button
      className="row-delete"
      aria-label={`Delete ${label}`}
      title={`Delete ${label}`}
      disabled={busy}
      onClick={async () => {
        if (!window.confirm(`Delete "${label}"?\n\nIf it's still in your Excel file, the next upload will bring it back.`)) return;
        setBusy(true);
        try {
          await callDelete({ part, id });
          router.refresh();
        } catch (e) {
          window.alert(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      ×
    </button>
  );
}

const OPTIONS = [
  { value: 'contacts', label: 'Contacts' },
  { value: 'metrics', label: 'Weekly metrics' },
  { value: 'activities', label: 'Activities' },
  { value: 'all', label: 'Everything' },
];

// Clears a whole section, or everything.
export function ClearData() {
  const router = useRouter();
  const [part, setPart] = useState('contacts');
  const [msg, setMsg] = useState('');

  async function clear() {
    const label = OPTIONS.find((o) => o.value === part).label;
    if (!window.confirm(`Delete all ${label.toLowerCase()} data from the site? This can't be undone, but you can re-upload your Excel file.`)) return;
    try {
      await callDelete({ part });
      setMsg(`${label} cleared.`);
      router.refresh();
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <div className="clear-data">
      <select className="input" value={part} onChange={(e) => setPart(e.target.value)} aria-label="Section to clear">
        {OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <button className="button danger" onClick={clear}>Clear data</button>
      {msg && <span className="muted small">{msg}</span>}
    </div>
  );
}
