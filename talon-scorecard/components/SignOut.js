'use client';

export default function SignOut() {
  return (
    <button
      className="button"
      onClick={async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login';
      }}
    >
      Sign out
    </button>
  );
}
