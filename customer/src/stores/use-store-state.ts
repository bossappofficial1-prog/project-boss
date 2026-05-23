import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StoreState {
    dismissInstallTimeout: number
    setDismissInstallTimeout: (timeout: number) => void
    nearbyViewMode: "list" | "map"
    setNearbyViewMode: (viewMode: "list" | "map") => void
    
    // Persisted route state fields
    activeRouteCoords: [number, number][] | null
    activeRouteOutlet: any | null
    routeInfo: { distance: number; duration: number } | null
    
    // Actions
    setActiveRoute: (
        coords: [number, number][] | null,
        outlet: any | null,
        info: { distance: number; duration: number } | null
    ) => void
    clearActiveRoute: () => void
}

export const useStoreState = create<StoreState>()(
    persist(
        (set) => ({
            dismissInstallTimeout: 0,
            setDismissInstallTimeout: (time) => set({ dismissInstallTimeout: time }),
            nearbyViewMode: "list",
            setNearbyViewMode: (mode) => set({ nearbyViewMode: mode }),
            
            // Initial route states
            activeRouteCoords: null,
            activeRouteOutlet: null,
            routeInfo: null,
            
            // Action implementations
            setActiveRoute: (coords, outlet, info) => set({
                activeRouteCoords: coords,
                activeRouteOutlet: outlet,
                routeInfo: info
            }),
            clearActiveRoute: () => set({
                activeRouteCoords: null,
                activeRouteOutlet: null,
                routeInfo: null
            })
        }),
        { name: "store-state" }
    )
)