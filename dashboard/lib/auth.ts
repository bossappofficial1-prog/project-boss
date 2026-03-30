// Authentication utilities for client-side operations


export type UserRole = 'ADMIN' | 'OWNER';

export interface User {
  id: string;
  avatar?: string;
  phone?: string,
  email: string;
  name: string;
  role: UserRole;
  sessionId: string;
  businessId?: string;
  isVerified?: boolean;
  provider?: string;
}

export interface JwtPayload {
  sessionId: string; // This is actually the userId
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Decode JWT token (client-side only)
 */
export function decodeJWT(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(payload: JwtPayload): boolean {
  if (!payload.exp) return false;
  return Date.now() >= payload.exp * 1000;
}



/**
 * Get token from localStorage/cookies (client-side)
 */
export function getClientToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Try to get from cookies first
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));

  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }

  // Fallback to localStorage (for backward compatibility)
  return localStorage.getItem('token');
}

/**
 * Set token in cookies (client-side)
 */
export function setClientToken(token: string): void {
  if (typeof window === 'undefined') return;

  // Set in cookie with security flags
  const secure = window.location.protocol === 'https:';
  const sameSite = 'strict';
  const maxAge = 24 * 60 * 60; // 24 hours

  document.cookie = `token=${token}; path=/; max-age=${maxAge}; samesite=${sameSite}${secure ? '; secure' : ''}`;

  // Also store in localStorage for backward compatibility
  localStorage.setItem('token', token);
}

/**
 * Remove token (client-side)
 */
export function removeClientToken(): void {
  if (typeof window === 'undefined') return;

  // Remove from cookie
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

  // Remove from localStorage
  localStorage.removeItem('token');
}

/**
 * Get user info from token (client-side)
 */
export function getClientUser(): User | null {
  const token = getClientToken();
  if (!token) return null;

  const payload = decodeJWT(token);
  if (!payload || isTokenExpired(payload)) return null;

  return {
    id: payload.sessionId, // sessionId is actually userId
    email: '', // Will be filled by API call
    name: '', // Will be filled by API call
    role: payload.role,
    sessionId: payload.sessionId
  };
}

/**
 * Check if user has specific role
 */
export function hasRole(requiredRole: UserRole, token?: string): boolean {
  const tokenToUse = token || getClientToken();
  if (!tokenToUse) return false;

  const payload = decodeJWT(tokenToUse);
  if (!payload || isTokenExpired(payload)) return false;

  return payload.role === requiredRole;
}

/**
 * Check if user is admin
 */
export function isAdmin(token?: string): boolean {
  return hasRole('ADMIN', token);
}

/**
 * Check if user is owner
 */
export function isOwner(token?: string): boolean {
  return hasRole('OWNER', token);
}

/**
 * Get default dashboard route based on user role
 */
export function getDefaultDashboard(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'OWNER':
      return '/owner/dashboard';
    default:
      return '/auth/login';
  }
}

/**
 * Check if user can access admin features
 */
export function canAccessAdmin(token?: string): boolean {
  return isAdmin(token);
}

/**
 * Check if user can access owner features  
 */
export function canAccessOwner(token?: string): boolean {
  return isOwner(token);
}

/**
 * Validate token and return user info
 */
export async function validateToken(token: string): Promise<User | null> {
  try {
    const payload = decodeJWT(token);
    if (!payload || isTokenExpired(payload)) {
      return null;
    }

    // Here you could make an API call to validate with server
    // For now, we trust the JWT if it's not expired
    return {
      id: payload.sessionId, // sessionId is actually userId
      email: '', // Would be fetched from API
      name: '', // Would be fetched from API
      role: payload.role,
      sessionId: payload.sessionId
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * Logout user (clear tokens and redirect)
 */
export function logout(): void {
  removeClientToken();

  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
}