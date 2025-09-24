'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Hook for preventing XSS attacks by sanitizing HTML content
export function useSanitizeHtml() {
    const sanitize = (html: string): string => {
        // Basic XSS prevention - remove script tags and event handlers
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/data:/gi, '')
            .replace(/vbscript:/gi, '');
    };

    return { sanitize };
}

// Hook for implementing Content Security Policy helpers
export function useCSP() {
    const generateNonce = (): string => {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            const array = new Uint8Array(16);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        }
        // Fallback for environments without crypto API
        return Math.random().toString(36).substring(2, 15);
    };

    return { generateNonce };
}

// Hook for session security and timeout management
export function useSessionSecurity(timeoutMinutes: number = 30) {
    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (warningRef.current) {
            clearTimeout(warningRef.current);
        }

        // Set warning 5 minutes before timeout
        const warningTime = Math.max((timeoutMinutes - 5) * 60 * 1000, 60000); // Minimum 1 minute warning
        warningRef.current = setTimeout(() => {
            console.warn('Session will expire in 5 minutes');
            // You could show a warning modal here
        }, warningTime);

        // Set actual timeout
        timeoutRef.current = setTimeout(() => {
            console.warn('Session expired due to inactivity');
            localStorage.removeItem('token');
            router.push('/auth/login?reason=session_timeout');
        }, timeoutMinutes * 60 * 1000);
    };

    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        const resetTimeoutHandler = () => resetTimeout();

        // Set initial timeout
        resetTimeout();

        // Add event listeners for user activity
        events.forEach(event => {
            document.addEventListener(event, resetTimeoutHandler, true);
        });

        return () => {
            // Cleanup
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (warningRef.current) {
                clearTimeout(warningRef.current);
            }
            events.forEach(event => {
                document.removeEventListener(event, resetTimeoutHandler, true);
            });
        };
    }, [timeoutMinutes, router]);

    return { resetTimeout };
}

// Hook for preventing common security issues
export function useSecurityHeaders() {
    useEffect(() => {
        // Set security-related meta tags and headers via client-side
        const setSecurityMeta = () => {
            // Prevent clickjacking
            if (window.self !== window.top) {
                console.warn('Potential clickjacking detected');
                // You might want to break out of frames in production
                // window.top.location = window.self.location;
            }

            // Check for HTTPS in production
            if (process.env.NODE_ENV === 'production' && location.protocol !== 'https:') {
                console.warn('Application should be served over HTTPS in production');
            }

            // Disable developer tools in production (controversial, use with caution)
            if (process.env.NODE_ENV === 'production') {
                const detectDevTools = () => {
                    const threshold = 160;
                    if (window.outerHeight - window.innerHeight > threshold ||
                        window.outerWidth - window.innerWidth > threshold) {
                        console.warn('Developer tools detected');
                        // You might want to take action here
                    }
                };

                setInterval(detectDevTools, 1000);
            }
        };

        setSecurityMeta();
    }, []);
}

// Hook for rate limiting client-side actions
export function useRateLimit(maxActions: number, windowMs: number) {
    const actionsRef = useRef<number[]>([]);

    const canPerformAction = (): boolean => {
        const now = Date.now();
        const windowStart = now - windowMs;

        // Remove old actions outside the window
        actionsRef.current = actionsRef.current.filter(time => time > windowStart);

        // Check if we can perform another action
        if (actionsRef.current.length >= maxActions) {
            return false;
        }

        // Record this action
        actionsRef.current.push(now);
        return true;
    };

    const getRemainingActions = (): number => {
        const now = Date.now();
        const windowStart = now - windowMs;
        const recentActions = actionsRef.current.filter(time => time > windowStart);
        return Math.max(0, maxActions - recentActions.length);
    };

    return { canPerformAction, getRemainingActions };
}