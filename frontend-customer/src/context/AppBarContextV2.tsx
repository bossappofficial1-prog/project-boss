'use client'

import { AppBarProps } from "@/components/shared/AppBar";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react"

const initialState: AppBarProps = {
    title: '',
    subtitle: '',
    showBackButton: false,
    variant: "transparent"
};

const AppBarrContextV2 = createContext<{ appBarConfig: AppBarProps; setAppBar: (config: Partial<AppBarProps>) => void; resetAppBar: () => void } | null>(null)

export function AppBarProviderV2({ children }: { children: React.ReactNode }) {
    const [appBarConfig, setAppBarConfig] = useState(initialState)

    const setAppBar = useCallback((config: Partial<AppBarProps>) => {
        setAppBarConfig(prev => ({ ...prev, ...config }))
    }, [])

    const resetAppBar = useCallback(() => {
        setAppBarConfig(initialState);
    }, []);

    const value = useMemo(() => ({
        appBarConfig,
        setAppBar,
        resetAppBar
    }), [appBarConfig, setAppBar, resetAppBar])

    return (
        <AppBarrContextV2.Provider value={value}>
            {children}
        </AppBarrContextV2.Provider>
    )
}

export function useAppBarV2() {
    const context = useContext(AppBarrContextV2)

    if (!context) throw new Error("useAppBarV2 harus digunakan di dalam AppBarProviderV2");

    return context
}