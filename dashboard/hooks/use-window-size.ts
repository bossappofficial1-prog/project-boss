'use client';

import { useState, useEffect } from 'react';

interface WindowSize {
    width: number;
    height: number;
}

interface UseWindowSizeReturn extends WindowSize {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isLargeDesktop: boolean;
}

export function useWindowSize(): UseWindowSizeReturn {
    const [windowSize, setWindowSize] = useState<WindowSize>({
        width: 0,
        height: 0,
    });

    useEffect(() => {
        function handleResize() {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }

        // Set initial size
        if (typeof window !== 'undefined') {
            handleResize();
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    return {
        ...windowSize,
        isMobile: windowSize.width < 768,
        isTablet: windowSize.width >= 768 && windowSize.width < 1024,
        isDesktop: windowSize.width >= 1024,
        isLargeDesktop: windowSize.width >= 1280,
    };
}