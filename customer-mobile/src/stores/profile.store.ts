import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ProfileTheme = "light" | "dark" | "system";

interface ProfileStore {
  fullName: string;
  phone: string;
  theme: ProfileTheme;
  notifEnabled: boolean;
  setFullName: (name: string) => void;
  setPhone: (phone: string) => void;
  setTheme: (theme: ProfileTheme) => void;
  setNotifEnabled: (enabled: boolean) => void;
  reset: () => void;
}

const initial = {
  fullName: "",
  phone: "",
  theme: "system" as ProfileTheme,
  notifEnabled: false,
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      ...initial,
      setFullName: (fullName) => set({ fullName }),
      setPhone: (phone) => set({ phone }),
      setTheme: (theme) => set({ theme }),
      setNotifEnabled: (notifEnabled) => set({ notifEnabled }),
      reset: () => set(initial),
    }),
    {
      name: "profile-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
