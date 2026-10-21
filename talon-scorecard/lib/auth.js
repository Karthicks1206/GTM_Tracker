// Works in both the Edge middleware and Node route handlers (Web Crypto).
export const COOKIE = 'talon_session';

export async function sessionToken(password) {
  const bytes = new TextEncoder().encode(`talon-gtm:${password}`);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function isAuthed(cookieValue) {
  const pw = process.env.SITE_PASSWORD;
  if (!pw || !cookieValue) return false;
  const expected = await sessionToken(pw);
  if (expected.length !== cookieValue.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ cookieValue.charCodeAt(i);
  return diff === 0;
}
