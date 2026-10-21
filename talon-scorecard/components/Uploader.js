'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Uploader() {
  const router = useRouter();
  const input = useRef(null);
  const [drag, setDrag] = useState(false);
  const [state, setState] = useState({ status: 'idle' });

  async function upload(file) {
    if (!file) return;
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      setState({ status: 'error', message: 'Upload an .xlsx or .csv file.' });
      return;
    }
    setState({ status: 'busy', message: `Reading ${file.name}…` });
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setState({ status: 'error', message: json.error || 'Upload failed.' });
      return;
    }
    setState({ status: 'done', ...json });
    router.refresh();
  }

  return (
    <div className="uploader">
      <div
        className={`dropzone${drag ? ' drag' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files?.[0]); }}
      >
        <strong>Drop the tracker here</strong>
        <span className="muted"> or click to choose · .xlsx or .csv · replaces the data for each sheet in the file</span>
        <input
          ref={input}
          type="file"
          accept=".xlsx,.csv"
          hidden
          onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }}
        />
      </div>
      {state.status === 'busy' && <p className="muted small">{state.message}</p>}
      {state.status === 'error' && <p className="error small">{state.message}</p>}
      {state.status === 'done' && (
        <div className="small upload-result">
          <p className="ok">Updated · {state.replaced.join(' · ')}</p>
          {state.kept.length > 0 && <p className="muted">Not in this file, kept as before: {state.kept.join(', ')}</p>}
          {state.warnings.length > 0 && (
            <details>
              <summary className="warn">{state.warnings.length} warning{state.warnings.length > 1 ? 's' : ''}</summary>
              <ul>{state.warnings.slice(0, 50).map((w, i) => <li key={i}>{w}</li>)}</ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
