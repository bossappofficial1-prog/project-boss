'use client';

import { useEffect } from 'react';

interface PerformanceMetrics {
    componentName: string;
    renderTime?: number;
    memoryUsage?: number;
}

export function usePerformanceMonitor(componentName: string) {
    useEffect(() => {
        const startTime = performance.now();
        let rafId: number;

        const measureRender = () => {
            const endTime = performance.now();
            const renderTime = endTime - startTime;

            // Log performance metrics in development
            if (process.env.NODE_ENV === 'development' && renderTime > 100) {
                console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
            }

            // Monitor memory usage if available
            if ('memory' in performance) {
                const memory = (performance as any).memory;
                if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB threshold
                    console.warn(`High memory usage detected: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
                }
            }
        };

        rafId = requestAnimationFrame(measureRender);

        return () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
        };
    }, [componentName]);
}

// Hook for tracking user interactions
export function useAnalytics() {
    const trackEvent = (eventName: string, properties?: Record<string, any>) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Analytics Event:', eventName, properties);
            return;
        }

        // In production, send to analytics service
        // Example: analytics.track(eventName, properties);
    };

    const trackPageView = (pageName: string, properties?: Record<string, any>) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Page View:', pageName, properties);
            return;
        }

        // In production, send to analytics service
        // Example: analytics.page(pageName, properties);
    };

    return { trackEvent, trackPageView };
}

// Hook for monitoring component performance and errors
export function useComponentMonitor(componentName: string) {
    const { trackEvent } = useAnalytics();

    useEffect(() => {
        const startTime = Date.now();

        return () => {
            const endTime = Date.now();
            const mountTime = endTime - startTime;

            if (mountTime > 1000) { // 1 second threshold
                trackEvent('slow_component_mount', {
                    component: componentName,
                    mountTime,
                });
            }
        };
    }, [componentName, trackEvent]);

    const reportError = (error: Error, context?: string) => {
        trackEvent('component_error', {
            component: componentName,
            error: error.message,
            context,
            stack: error.stack,
        });
    };

    return { reportError };
}