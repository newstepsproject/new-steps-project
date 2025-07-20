import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

// This function can be marked `async` if using `await` inside
export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    const response = NextResponse.next();
    
    // Add aggressive no-cache headers for admin routes to prevent production caching issues
    if (req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/api/admin')) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      // Add timestamp to force browser cache busting
      response.headers.set('X-Timestamp', Date.now().toString());
    }
    
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
    '/api/admin/:path*',  // Add admin API routes to middleware
    // Note: /api/donations removed to allow public shoe donations without authentication
    // Specific admin donation endpoints still require auth via individual API route checks
  ],
}; 