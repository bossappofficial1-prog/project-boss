import { NextRequest, NextResponse } from 'next/server';
import type { NextMiddleware } from 'next/server';
import * as jose from 'jose';

interface JwtPayload {
  sessionId: string;
  role: 'ADMIN' | 'OWNER';
  iat?: number;
  exp?: number;
}

// Route configuration with Sets for O(1) lookups
const ROUTE_CONFIG = {
  publicRoutes: new Set([
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/login/cashier',
    '/unauthorized'
  ]),
  adminOnlyRoutes: new Set([
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
  ]),
  ownerOnlyRoutes: new Set(['/owner', '/owner/dashboard']),
  cashierRoutes: new Set(['/cashier', '/cashier/pos', '/cashier/queue']),
  sharedRoutes: new Set(['/profile', '/notifications'])
} as const;

const DEFAULT_REDIRECTS = {
  ADMIN: '/admin/dashboard',
  OWNER: '/owner/dashboard'
} as const;

// Helper functions for route checking
function isPublicRoute(pathname: string): boolean {
  return ROUTE_CONFIG.publicRoutes.has(pathname) ||
    Array.from(ROUTE_CONFIG.publicRoutes).some(route => pathname.startsWith(route));
}

function isAdminOnlyRoute(pathname: string): boolean {
  return Array.from(ROUTE_CONFIG.adminOnlyRoutes).some(route => pathname.startsWith(route));
}

function isOwnerOnlyRoute(pathname: string): boolean {
  return Array.from(ROUTE_CONFIG.ownerOnlyRoutes).some(route => pathname.startsWith(route));
}

function isCashierRoute(pathname: string): boolean {
  return Array.from(ROUTE_CONFIG.cashierRoutes).some(route => pathname.startsWith(route));
}

function isSharedRoute(pathname: string): boolean {
  return Array.from(ROUTE_CONFIG.sharedRoutes).some(route => pathname.startsWith(route));
}

async function verifyJWT(token: string): Promise<JwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    if (!payload || !payload.sessionId || !payload.role) {
      return null;
    }

    if (payload.role !== 'ADMIN' && payload.role !== 'OWNER') {
      return null;
    }

    const result: JwtPayload = {
      sessionId: String(payload.sessionId),
      role: payload.role,
      iat: typeof payload.iat === 'number' ? payload.iat : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    };

    return result;
  } catch (err) {
    console.error('JWT verification error:', err);
    return null;
  }
}

function isTokenExpired(payload: JwtPayload): boolean {
  if (!payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

function hasPermission(userRole: 'ADMIN' | 'OWNER', pathname: string): boolean {
  if (isAdminOnlyRoute(pathname)) return userRole === 'ADMIN';
  if (isOwnerOnlyRoute(pathname)) return userRole === 'OWNER';
  if (isSharedRoute(pathname)) return true;
  return true; // Default allow for other routes
}

function getRoleBasedRedirect(userRole: 'ADMIN' | 'OWNER'): string {
  return DEFAULT_REDIRECTS[userRole];
}

function createRedirectResponse(url: URL, reason?: string): NextResponse {
  const redirectUrl = new URL(url);
  if (reason) {
    redirectUrl.searchParams.set('reason', reason);
  }
  return NextResponse.redirect(redirectUrl);
}

function createLoginRedirect(request: NextRequest, pathname: string, reason?: string): NextResponse {
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  if (reason) {
    loginUrl.searchParams.set('reason', reason);
  }

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete('token');
  return response;
}

// --- Middleware ---
export const middleware: NextMiddleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;
  const cashierToken = request.cookies.get('cashier_token')?.value;
  const isPublic = isPublicRoute(pathname);
  const isCashier = isCashierRoute(pathname);

  // Debug logging for cashier routes
  if (pathname.startsWith('/cashier') || pathname.startsWith('/auth/login/cashier')) {
    console.log('[Middleware] Cashier route detected:', {
      pathname,
      hasCashierToken: !!cashierToken,
      hasOwnerToken: !!token
    });
  }

  // Handle cashier routes separately (check this FIRST before other auth logic)
  if (pathname.startsWith('/cashier')) {
    // Other cashier routes require cashier_token
    if (!cashierToken) {
      const loginUrl = new URL('/auth/login/cashier', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Cashier authenticated - allow access to cashier routes
    return NextResponse.next();
  }

  // No token and accessing protected route → redirect to owner/admin login
  if (!token && !isPublic) {
    return createLoginRedirect(request, pathname);
  }

  // Has token → validate it
  if (token) {
    const payload = await verifyJWT(token);

    // Invalid or expired token → redirect to login
    if (!payload || isTokenExpired(payload)) {
      return createLoginRedirect(request, pathname, 'token_invalid_or_expired');
    }

    // Valid token on public route (except unauthorized) → redirect to dashboard
    if (isPublic && pathname !== '/unauthorized') {
      return NextResponse.redirect(new URL(getRoleBasedRedirect(payload.role), request.url));
    }

    // Invalid role → redirect to login
    if (!['ADMIN', 'OWNER'].includes(payload.role)) {
      return createLoginRedirect(request, pathname, 'invalid_role');
    }

    // Insufficient permissions → redirect to unauthorized
    if (!hasPermission(payload.role, pathname)) {
      return createRedirectResponse(new URL('/unauthorized', request.url), 'insufficient_permissions');
    }

    // Root path → redirect to role-based dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL(getRoleBasedRedirect(payload.role), request.url));
    }

    // Add user info to headers for server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sessionId);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-session-id', payload.sessionId);
    requestHeaders.set('x-token-verified', 'true');

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public|.*\\..*$).*)',
  ],
};
