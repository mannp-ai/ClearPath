import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that strictly require authentication
const PROTECTED_PREFIXES = ['/overview', '/loans', '/repayment', '/refinancing', '/settings', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    // If neither session token is present, redirect to login with safe return path
    if (!accessToken && !refreshToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/overview/:path*',
    '/loans/:path*',
    '/repayment/:path*',
    '/refinancing/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
};
