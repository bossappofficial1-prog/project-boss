import { NextRequest, NextResponse } from 'next/server';
import type { NextMiddleware } from 'next/server';

// JWT payload interface based on backend
interface JwtPayload {
  sessionId: string; // This is actually the userId
  role: 'ADMIN' | 'OWNER';
  iat?: number;
  exp?: number;
}

// Route configuration for role-based access
const ROUTE_CONFIG = {
  // Public routes (no authentication required)
  publicRoutes: [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/unauthorized'
  ],

  // Admin only routes
  adminOnlyRoutes: [
    '/admin',
    '/admin/dashboard',
    '/admin/businesses',
    '/admin/users',
    '/admin/analytics',
    '/admin/reports',
    '/admin/settings',
    '/admin/system',
    '/admin/support',
    '/admin/withdrawals'
  ],

  // Owner only routes  
  ownerOnlyRoutes: [
    '/owner',
    '/owner/dashboard'
  ],

  // Shared routes (both ADMIN and OWNER can access)
  sharedRoutes: [
    '/profile',
    '/notifications'
  ]
} as const;

// Default redirects based on role
const DEFAULT_REDIRECTS = {
  ADMIN: '/admin/dashboard',
  OWNER: '/owner/dashboard'
} as const;

// Helper function to convert base64url to ArrayBuffer
function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  // Convert base64url to base64
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);

  // Decode base64 to binary string
  const binaryString = atob(padded);

  // Convert binary string to ArrayBuffer
  const buffer = new ArrayBuffer(binaryString.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binaryString.length; i++) {
    view[i] = binaryString.charCodeAt(i);
  }

  return buffer;
}

// Function to verify JWT signature using Web Crypto API (Edge Runtime compatible)
async function verifyJWTSignature(token: string): Promise<JwtPayload | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');

    if (!headerB64 || !payloadB64 || !signatureB64) {
      console.error('Invalid JWT format: missing parts');
      return null;
    }

    // Get JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable not found');
      return null;
    }

    // Convert base64url to ArrayBuffer for signature comparison
    const signature = base64urlToArrayBuffer(signatureB64);

    // Create data to verify
    const data = `${headerB64}.${payloadB64}`;
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const secretBytes = encoder.encode(jwtSecret);

    // Import secret key for HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    // Verify signature
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      dataBytes
    );

    if (!isValid) {
      console.error('JWT signature verification failed');
      return null;
    }

    // Decode and validate payload
    const payload = decodeJWT(token);
    if (!payload) {
      console.error('Failed to decode JWT payload');
      return null;
    }

    // Check token expiration
    if (isTokenExpired(payload)) {
      console.error('JWT token has expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('JWT signature verification error:', error);
    return null;
  }
}// Function to decode JWT token (client-side only, for fallback)
function decodeJWT(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const decoded = JSON.parse(jsonPayload) as JwtPayload;

    // Basic validation
    if (!decoded.sessionId || !decoded.role) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

// Check if token is expired
function isTokenExpired(payload: JwtPayload): boolean {
  if (!payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

// Check if user has permission to access route
function hasPermission(userRole: 'ADMIN' | 'OWNER', pathname: string): boolean {
  // Check admin only routes
  if (ROUTE_CONFIG.adminOnlyRoutes.some(route => pathname.startsWith(route))) {
    return userRole === 'ADMIN';
  }

  // Check owner only routes
  if (ROUTE_CONFIG.ownerOnlyRoutes.some(route => pathname.startsWith(route))) {
    return userRole === 'OWNER';
  }

  // Shared routes are accessible by both roles
  if (ROUTE_CONFIG.sharedRoutes.some(route => pathname.startsWith(route))) {
    return true;
  }

  // Default allow for unspecified routes
  return true;
}

// Get appropriate redirect URL based on role
function getRoleBasedRedirect(userRole: 'ADMIN' | 'OWNER'): string {
  return DEFAULT_REDIRECTS[userRole];
}

// Main middleware function
export const middleware: NextMiddleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('token')?.value;

  // Check if route is public
  const isPublicRoute = ROUTE_CONFIG.publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  );

  // If no token and not public route, redirect to login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If token exists and accessing public route (except unauthorized), redirect to dashboard
  if (token && isPublicRoute && pathname !== '/unauthorized') {
    try {
      // Verify JWT signature using secret key
      const payload = await verifyJWTSignature(token);

      if (payload && !isTokenExpired(payload)) {
        const dashboardUrl = new URL(getRoleBasedRedirect(payload.role), request.url);
        return NextResponse.redirect(dashboardUrl);
      } else {
        // Token invalid or expired, clear it and continue to public route
        const response = NextResponse.next();
        response.cookies.delete('token');
        return response;
      }
    } catch (error) {
      // If token is invalid, clear it and continue to login page
      console.error('Token validation error:', error);
      const response = NextResponse.next();
      response.cookies.delete('token');
      return response;
    }
  }

  // If token exists, validate and check permissions
  if (token && !isPublicRoute) {
    try {
      // Verify JWT signature using secret key (secure and efficient)
      const payload = await verifyJWTSignature(token);

      // Check if token is valid and not expired
      if (!payload || isTokenExpired(payload)) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        loginUrl.searchParams.set('reason', 'token_expired');
        const response = NextResponse.redirect(loginUrl);

        // Clear invalid/expired token
        response.cookies.delete('token');
        return response;
      }

      // Check if JWT payload is complete (has sessionId and role)
      if (!payload.sessionId || !payload.role) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('reason', 'invalid_token');
        const response = NextResponse.redirect(loginUrl);

        // Clear incomplete token
        response.cookies.delete('token');
        return response;
      }

      // Validate role enum
      if (!['ADMIN', 'OWNER'].includes(payload.role)) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('reason', 'invalid_role');
        const response = NextResponse.redirect(loginUrl);

        // Clear invalid role token
        response.cookies.delete('token');
        return response;
      }

      // Check role-based permissions
      if (!hasPermission(payload.role, pathname)) {
        const unauthorizedUrl = new URL('/unauthorized', request.url);
        unauthorizedUrl.searchParams.set('reason', 'insufficient_permissions');
        return NextResponse.redirect(unauthorizedUrl);
      }

      // Handle root path redirect based on role
      if (pathname === '/') {
        const dashboardUrl = new URL(getRoleBasedRedirect(payload.role), request.url);
        return NextResponse.redirect(dashboardUrl);
      }

      // Add user info to headers for server components
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.sessionId);
      requestHeaders.set('x-user-role', payload.role);
      requestHeaders.set('x-session-id', payload.sessionId);
      requestHeaders.set('x-token-verified', 'true');

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

    } catch (error) {
      console.error('Middleware token validation error:', error);

      // If there's an error processing the token, redirect to login with error info
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('reason', 'validation_error');
      loginUrl.searchParams.set('redirect', pathname);

      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('token');
      return response;
    }
  } return NextResponse.next();
};

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|.*\\..*$).*)',
  ],
};

export default middleware;