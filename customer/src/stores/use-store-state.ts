import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StoreState {
    dismissInstallTimeout: number
    setDismissInstallTimeout: (timeout: number) => void
}

export const useStoreState = create<StoreState>()(
    persist(
        (set) => ({
            dismissInstallTimeout: 0,
            setDismissInstallTimeout: (time) => set({ dismissInstallTimeout: time })
        }),
        { name: "store-state" }
    )
)