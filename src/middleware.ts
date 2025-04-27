import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware to handle authentication and session management
 * This runs on every request to check authentication state
 * and helps with managing sessions properly
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = 
    path === '/' || 
    path === '/auth/signin' || 
    path === '/auth/signup' || 
    path === '/api/auth/session' ||
    path.startsWith('/api/auth/');
  
  // Check if user is authenticated
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  
  // Redirect logic for protected routes
  if (!isPublicPath && !isAuthenticated) {
    // Store the original URL to redirect back after login
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // Prevent authenticated users from accessing auth pages
  if (isAuthenticated && (path === '/auth/signin' || path === '/auth/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Add response headers to prevent caching of authenticated pages
  // This helps prevent session-related issues when using the back button
  if (isAuthenticated && !path.startsWith('/api/')) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }

  return NextResponse.next();
}

// Configure which paths this middleware will run on
export const config = {
  matcher: [
    // Auth routes
    '/auth/:path*',
    // Dashboard routes
    '/dashboard/:path*',
    // Profile routes
    '/profile/:path*',
    // Flight routes - now protected
    '/flights/:path*',
    // API routes except public ones
    '/api/:path*',
  ]
}; 