"use client";

import { useEffect, useState } from "react";

export interface Breakpoints {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isLargeDesktop: boolean;
}

export function useResponsiveBreakpoints(): Breakpoints {
    const [state, setState] = useState<Breakpoints>({
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        isLargeDesktop: false,
    });

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) {
            return;
        }

        const queries = {
            isMobile: window.matchMedia("(max-width: 767px)"),
            isTablet: window.matchMedia("(min-width: 768px) and (max-width: 1023px)"),
            isDesktop: window.matchMedia("(min-width: 1024px)"),
            isLargeDesktop: window.matchMedia("(min-width: 1280px)"),
        } as const;

        const updateState = () => {
            setState({
                isMobile: queries.isMobile.matches,
                isTablet: queries.isTablet.matches,
                isDesktop: queries.isDesktop.matches,
                isLargeDesktop: queries.isLargeDesktop.matches,
            });
        };

        updateState();

        const cleanupListeners = Object.values(queries).map((mediaQuery) => {
            const listener = () => updateState();
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener("change", listener);
                return () => mediaQuery.removeEventListener("change", listener);
            }
            mediaQuery.addListener(listener);
            return () => mediaQuery.removeListener(listener);
        });

        return () => {
            cleanupListeners.forEach((cleanup) => cleanup());
        };
    }, []);

    return state;
}
