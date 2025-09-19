import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    const response = NextResponse.next();

    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Accel-Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/account/:path*',
    '/api/user/:path*',
    '/api/orders/:path*',
    '/admin/:path*',  // Add admin routes to middleware
    '/api/admin/:path*',  // Add admin API routes to middleware (re-enabled)
    // Note: /api/donations removed to allow public shoe donations without authentication
    // Specific admin donation endpoints still require auth via individual API route checks
  ],
}; 
