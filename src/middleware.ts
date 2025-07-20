import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

// This function can be marked `async` if using `await` inside
export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    const response = NextResponse.next();
    
    // NUCLEAR CACHE CONTROL - Add aggressive no-cache headers for ALL routes to prevent caching issues
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/api/admin');
    const isAuthRoute = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/api/auth');
    const isAccountRoute = req.nextUrl.pathname.startsWith('/account');
    
    // Apply ZERO CACHE to admin, auth, and account routes
    if (isAdminRoute || isAuthRoute || isAccountRoute) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('X-Accel-Expires', '0'); // Nginx cache control
      response.headers.set('Surrogate-Control', 'no-store'); // CDN cache control
      // Add multiple timestamps to force browser cache busting
      response.headers.set('X-Timestamp', Date.now().toString());
      response.headers.set('X-Cache-Bust', Math.random().toString(36).substring(7));
      response.headers.set('X-Force-Refresh', 'true');
      
      console.log(`🚫 CACHE DISABLED for route: ${req.nextUrl.pathname}`);
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
    '/login',  // Add login route for cache control
    '/api/auth/:path*',  // Add auth routes for cache control
    // Note: /api/donations removed to allow public shoe donations without authentication
    // Specific admin donation endpoints still require auth via individual API route checks
  ],
}; 