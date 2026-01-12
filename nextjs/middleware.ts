import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Protected routes - require authentication
  const protectedRoutes = ['/dashboard', '/campaigns/create'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    // Redirect to login if accessing protected route without token
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Guest-only routes - redirect to dashboard if already logged in
  const guestRoutes = ['/login', '/register'];
  const isGuestRoute = guestRoutes.some(route => pathname === route);

  if (isGuestRoute && token) {
    // Redirect to dashboard if accessing guest route with token
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/campaigns/create',
    '/campaigns/:id/logo-approval',
    '/login',
    '/register',
  ],
};

