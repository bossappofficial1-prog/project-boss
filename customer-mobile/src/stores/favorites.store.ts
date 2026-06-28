import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { debouncedAsyncStorage } from "@/lib/storage";

export interface FavoriteOutlet {
  id: string;
  name: string;
  address: string;
  phone?: string;
  slug?: string;
  image?: string;
}

export interface SavedProduct {
  id: string;
  name: string;
  price: number;
  type: "GOODS" | "SERVICE" | "TICKET";
  image?: string;
  outletId: string;
  outletSlug?: string;
  outletName?: string;
}

interface FavoritesStore {
  favoriteOutlets: FavoriteOutlet[];
  savedProducts: SavedProduct[];
  
  toggleFavoriteOutlet: (outlet: FavoriteOutlet) => void;
  isFavoriteOutlet: (id: string) => boolean;
  
  toggleSavedProduct: (product: SavedProduct) => void;
  isSavedProduct: (id: string) => boolean;
  
  clearAll: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favoriteOutlets: [],
      savedProducts: [],
      
      toggleFavoriteOutlet: (outlet) => {
        const list = get().favoriteOutlets;
        const exists = list.some((item) => item.id === outlet.id);
        if (exists) {
          set({ favoriteOutlets: list.filter((item) => item.id !== outlet.id) });
        } else {
          set({ favoriteOutlets: [...list, outlet] });
        }
      },
      
      isFavoriteOutlet: (id) => {
        return get().favoriteOutlets.some((item) => item.id === id);
      },
      
      toggleSavedProduct: (product) => {
        const list = get().savedProducts;
        const exists = list.some((item) => item.id === product.id);
        if (exists) {
          set({ savedProducts: list.filter((item) => item.id !== product.id) });
        } else {
          set({ savedProducts: [...list, product] });
        }
      },
      
      isSavedProduct: (id) => {
        return get().savedProducts.some((item) => item.id === id);
      },
      
      clearAll: () => set({ favoriteOutlets: [], savedProducts: [] }),
    }),
    {
      name: "favorites-storage",
      storage: createJSONStorage(() => debouncedAsyncStorage(300)),
    }
  )
);
