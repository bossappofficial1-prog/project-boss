"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import { useAppBar } from '@/context/AppBarContext';

interface AppBarConfig {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    showSearch?: boolean;
    showMenu?: boolean;
    variant?: 'default' | 'primary' | 'transparent' | 'elevated';
    rightContent?: React.ReactNode;
    loading?: boolean;
    centerTitle?: boolean;
}

export function useAppBarConfig(config: AppBarConfig) {
    const { updateAppbar } = useAppBar();

    // Memoize the config to prevent unnecessary re-renders
    const memoizedConfig = useMemo(() => ({
        showBackButton: true,
        showSearch: false,
        showMenu: false,
        variant: 'default' as const,
        ...config
    }), [config]);

    // Use a ref to track if this is the first mount
    const isFirstMount = useRef(true);

    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            updateAppbar(memoizedConfig);
        }
    }, [updateAppbar, memoizedConfig]);

    return { updateAppbar };
}
