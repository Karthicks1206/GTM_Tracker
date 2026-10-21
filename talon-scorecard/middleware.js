import { NextResponse } from 'next/server';
import { COOKIE, isAuthed } from './lib/auth.js';

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (pathname === '/login' || pathname === '/api/login') return NextResponse.next();

  if (!process.env.SITE_PASSWORD) {
    return new NextResponse('SITE_PASSWORD is not set. Add it in Vercel → Settings → Environment Variables, then redeploy.', { status: 500 });
  }
  if (await isAuthed(req.cookies.get(COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
