'use client';
import { useState } from 'react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) window.location.href = '/';
    else setError((await res.json().catch(() => ({}))).error || 'Sign-in failed.');
  }

  return (
    <main className="login">
      <form className="card login-card" onSubmit={submit}>
        <h1 className="title">Talon GTM scorecard</h1>
        <p className="muted">Enter the team password to continue.</p>
        <input
          className="input"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Team password"
          placeholder="Team password"
        />
        {error && <p className="error">{error}</p>}
        <button className="button primary" disabled={busy || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
