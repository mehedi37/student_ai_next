import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || 
                       path.startsWith('/auth') || 
                       path.startsWith('/api');
  
  // Check if the user is authenticated by looking for the token in the cookies
  const token = request.cookies.get('token')?.value || '';
  
  // Redirect logic
  if (!isPublicPath && !token) {
    // If the user is not logged in and tries to access a protected route,
    // redirect to the login page
    const url = new URL('/auth/login', request.url);
    // Add the original requested URL as a query parameter to redirect back after login
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }
  
  // If the user is logged in and tries to access an auth page,
  // redirect to the dashboard
  if (token && path.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Configure which paths should trigger this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes that don't require authentication
     * 2. /_next (Next.js internals)
     * 3. /_static (static files)
     * 4. /favicon.ico, /site.webmanifest, /robots.txt (static files)
     */
    '/((?!_next|_static|favicon.ico|site.webmanifest|robots.txt).*)',
  ],
};