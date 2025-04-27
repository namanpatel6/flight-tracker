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
    path.startsWith('/api/auth/') ||
    path.includes('_next') ||  // Next.js assets
    path.includes('favicon.ico');
  
  // Check if user is authenticated with more options for production
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
    cookieName: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
  });

  const isAuthenticated = !!token;
  
  // Add debugging response header in development
  if (process.env.NODE_ENV === 'development') {
    const response = NextResponse.next();
    response.headers.set('x-middleware-cache', 'no-store');
    response.headers.set('x-auth-status', isAuthenticated ? 'authenticated' : 'unauthenticated');
    
    // For debugging only, don't enforce auth in development if needed
    // return response; 
  }
  
  // Redirect logic for protected routes
  if (!isPublicPath && !isAuthenticated) {
    // Store the original URL to redirect back after login
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    
    // Add cache control headers to prevent issues
    const response = NextResponse.redirect(url);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    
    return response;
  }
  
  // Prevent authenticated users from accessing auth pages
  if (isAuthenticated && (path === '/auth/signin' || path === '/auth/signup')) {
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }
  
  // Add response headers to prevent caching of authenticated pages
  // This helps prevent session-related issues when using the back button
  if (!isPublicPath || isAuthenticated) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }

  return NextResponse.next();
}

// Configure which paths this middleware will run on
export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|images|favicon.ico).*)',
  ]
}; 