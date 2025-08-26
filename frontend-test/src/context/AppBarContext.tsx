import { AppBarProps } from "@/components/shared/AppBar";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

const defaultAppBarState: AppBarProps = {
    title: 'Boss App',
    showBackButton: true,
    showSearch: false,
    showMenu: false,
    variant: 'elevated'
};

interface AppBarContextType {
    appBarState: AppBarProps;
    updateAppbar: (updates: Partial<AppBarProps>) => void;
    resetAppBar: () => void;
}

const AppBarContext = createContext<AppBarContextType | null>(null)

export function AppBarProvider({ children }: { children: React.ReactNode }) {
    const [appBarState, setAppBarState] = useState<AppBarProps>(defaultAppBarState)
    const pathname = usePathname()
    const lastUpdateRef = useRef<string>('')

    // Reset AppBar state when route changes
    useEffect(() => {
        setAppBarState(defaultAppBarState)
        lastUpdateRef.current = ''
    }, [pathname])

    const updateAppbar = useCallback((updates: Partial<AppBarProps>) => {
        // Create a simple hash of the updates to prevent duplicate updates
        const updateHash = JSON.stringify({
            title: updates.title,
            subtitle: updates.subtitle,
            sticky: updates.sticky,
            showSearch: updates.showSearch,
            centerTitle: updates.centerTitle,
            // Include hasRightContent in hash to track when rightContent changes from null to content or vice versa
            hasRightContent: !!updates.rightContent
        });

        // For rightContent, we'll always allow updates since we can't easily compare JSX
        // But we'll use a simple throttling mechanism
        const shouldUpdate = lastUpdateRef.current !== updateHash || updates.rightContent !== undefined;

        if (!shouldUpdate) {
            return;
        }

        lastUpdateRef.current = updateHash;

        setAppBarState(prev => ({
            ...prev,
            ...updates
        }));
    }, [])

    const resetAppBar = useCallback(() => {
        setAppBarState(defaultAppBarState)
    }, [])

    return (
        <AppBarContext.Provider value={{ appBarState, updateAppbar, resetAppBar }}>
            {children}
        </AppBarContext.Provider>
    )
}


export function useAppBar(): AppBarContextType {
    const context = useContext(AppBarContext);
    if (!context) {
        throw new Error('useAppBar must be used within AppBarProvider');
    }
    return context;
}
