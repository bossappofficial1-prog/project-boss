// Server-side authentication utilities
import { cookies } from 'next/headers';
import type { User, JwtPayload } from './auth';
import { decodeJWT, isTokenExpired } from './auth';

/**
 * Get token from cookies (server-side)
 */

export async function getServerToken(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        return cookieStore.get('token')?.value || null;
    } catch (error) {
        console.error('Error getting server token:', error);
        return null;
    }
}

/**
 * Get user info from token (server-side)
 */

export async function getServerUser(): Promise<User | null> {
    const token = await getServerToken();
    if (!token) return null;
    const payload = decodeJWT(token);
    if (!payload || isTokenExpired(payload)) return null;
    return {
        id: payload.sessionId,
        email: '', // Will be filled by API call
        name: '', // Will be filled by API call  
        role: payload.role,
        sessionId: payload.sessionId
    };
}
