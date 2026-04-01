'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface LoadingContextType {
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    startLoading: () => void
    stopLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false)

    const startLoading = useCallback(() => setIsLoading(true), [])
    const stopLoading = useCallback(() => setIsLoading(false), [])

    return (
        <LoadingContext.Provider
            value={{
                isLoading,
                setIsLoading,
                startLoading,
                stopLoading,
            }}
        >
            {children}
        </LoadingContext.Provider>
    )
}

export function useGlobalLoading() {
    const context = useContext(LoadingContext)
    if (!context) {
        throw new Error('useGlobalLoading must be used within LoadingProvider')
    }
    return context
}
