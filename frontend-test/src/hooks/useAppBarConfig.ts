"use client";

import { useEffect, useRef } from 'react';
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

/**
 * Custom hook untuk mengkonfigurasi AppBar dengan mudah
 * Secara otomatis akan mengupdate AppBar ketika komponen mount
 */
export function useAppBarConfig(config: AppBarConfig) {
    const { updateAppbar } = useAppBar();

    // Use a ref to track if this is the first mount
    const isFirstMount = useRef(true);

    useEffect(() => {
        // Only update if this is the first mount or if props actually changed
        if (isFirstMount.current) {
            isFirstMount.current = false;
            updateAppbar({
                showBackButton: true,
                showSearch: false,
                showMenu: false,
                variant: 'default',
                ...config
            });
        } else {
            // For subsequent updates, only pass the config without defaults
            updateAppbar(config);
        }
    }, [updateAppbar, config]);

    return { updateAppbar };
}
