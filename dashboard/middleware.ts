import { NextRequest, NextResponse } from 'next/server';
import type { NextMiddleware } from 'next/server';
import * as jose from 'jose';

interface JwtPayload {
  sessionId: string;
  role: 'ADMIN' | 'OWNER';
  name: string;
  businessId?: string;
  iat?: number;
  exp?: number;
  provider?: 'local' | 'google';
  isVerified?: boolean;
  email?: string;
  subscriptionStatus?: 'ACTIVE' | 'AWAITING_PAYMENT' | 'PROOF_SUBMITTED' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED' | 'PAST_DUE' | 'TRIAL';
}

const ROUTE_CONFIG = {
  publicRoutes: new Set([
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/login/cashier',
    '/unauthorized'
  ]),
} as const;

const DEFAULT_REDIRECTS = {
  ADMIN: '/admin/dashboard',
  OWNER: '/owner/dashboard'
} as const;

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || '');

function isPublicRoute(pathname: string): boolean {
  return ROUTE_CONFIG.publicRoutes.has(pathname) || Array.from(ROUTE_CONFIG.publicRoutes).some(route => pathname.startsWith(route));
}

async function verifyJWT(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);

    if (!payload || !payload.sessionId || !payload.role) return null;
    if (payload.role !== 'ADMIN' && payload.role !== 'OWNER') return null;

    return {
      sessionId: String(payload.sessionId),
      role: payload.role as 'ADMIN' | 'OWNER',
      name: payload.name as string,
      isVerified: payload.isVerified as boolean,
      provider: payload.provider as 'local' | 'google',
      email: payload.email as string,
      businessId: payload.businessId as string | undefined,
      iat: typeof payload.iat === 'number' ? payload.iat : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
      subscriptionStatus: payload.subscriptionStatus as JwtPayload['subscriptionStatus'],
    };
  } catch {
    return null;
  }
}

function isTokenExpired(payload: JwtPayload): boolean {
  if (!payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

export const middleware: NextMiddleware = async (request: NextRequest) => {
  const isPrefetch = request.headers.get('next-router-prefetch') === '1' || request.headers.get('x-middleware-prefetch') === '1';
  if (isPrefetch) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const isPublic = isPublicRoute(pathname);

  // No token — let request through (layouts handle auth redirect)
  if (!token) {
    return NextResponse.next();
  }

  // Token exists — try to verify
  const payload = await verifyJWT(token);

  // Invalid or expired token — let request through (layouts handle redirect)
  if (!payload || isTokenExpired(payload)) {
    const response = NextResponse.next();
    response.cookies.delete('token');
    return response;
  }

  // Valid token + public route (except /unauthorized and /auth/register with step) → redirect to dashboard
  if (isPublic && pathname !== '/unauthorized') {
    if (pathname.startsWith('/auth/register') && request.nextUrl.searchParams.get('step')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(DEFAULT_REDIRECTS[payload.role], request.url));
  }

  // Subscription gating for OWNER
  if (payload.role === 'OWNER' && payload.subscriptionStatus && ['AWAITING_PAYMENT', 'PROOF_SUBMITTED'].includes(payload.subscriptionStatus)) {
    if (pathname.startsWith('/subscription/payment') || pathname.startsWith('/subscription/verification-pending')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/subscription/verification-pending', request.url));
  }

  // Root path → redirect to role-based dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECTS[payload.role], request.url));
  }

  // Inject headers if token is valid
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.sessionId);
  response.headers.set('x-user-role', payload.role);
  if (payload.businessId) response.headers.set('x-business-id', payload.businessId);
  response.headers.set('x-session-id', payload.sessionId);
  response.headers.set('x-token-verified', 'true');

  return response;
};

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public|.*\\..*$).*)'],
};