import { NextResponse } from 'next/server';
import { COOKIE, sessionToken } from '../../../lib/auth.js';

export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  const expected = process.env.SITE_PASSWORD;
  if (!expected) return NextResponse.json({ error: 'SITE_PASSWORD is not set on the server.' }, { status: 500 });
  if (!password || (await sessionToken(password)) !== (await sessionToken(expected))) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await sessionToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
