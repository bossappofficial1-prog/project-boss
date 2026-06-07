import { create } from 'zustand';
import { Outlet, OutletType, ProductType } from '@/types';

interface OutletState {
  selectedOutlet: Outlet | null;
  selectedOutletId: string | null;
  outlets: Outlet[];
  isLoading: boolean;
  error: string | null;
  allowedProductTypes: string[];
  isPlanMismatch: boolean;

  setSelectedOutlet: (outlet: Outlet | null) => void;
  setOutlets: (outlets: Outlet[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refetch: () => void;
}

function getInitialSelectedOutlet(outlets: Outlet[]): Outlet | null {
  if (!outlets?.length) return null;

  const savedOutletId = localStorage.getItem('selectedOutlet');

  if (savedOutletId) {
    const savedOutlet = outlets.find(outlet => outlet.id === savedOutletId);
    if (savedOutlet) return savedOutlet;
  }

  const oldSavedOutlet = localStorage.getItem('selectedOutletId');
  if (oldSavedOutlet) {
    try {
      const exists = outlets.find(outlet => outlet.id === oldSavedOutlet);
      if (exists) {
        localStorage.setItem('selectedOutlet', exists.id);
        localStorage.removeItem('selectedOutletId');
        return exists;
      }

      const parsed = JSON.parse(oldSavedOutlet);
      const existsParsed = outlets.find(outlet => outlet.id === parsed.id);
      if (existsParsed) {
        localStorage.setItem('selectedOutlet', existsParsed.id);
        localStorage.removeItem('selectedOutletId');
        return existsParsed;
      }
    } catch {
      // Invalid JSON
    }
  }

  const firstOutlet = outlets[0];
  if (firstOutlet) {
    localStorage.setItem('selectedOutlet', firstOutlet.id);
    localStorage.removeItem('selectedOutletId');
  }

  return firstOutlet;
}

function saveOutletToStorage(outlet: Outlet | null) {
  if (typeof window === 'undefined') return;

  if (outlet) {
    localStorage.setItem('selectedOutlet', outlet.id);
    localStorage.removeItem('selectedOutletId');
    document.cookie = `selectedOutlet=${outlet.id}; path=/; max-age=${30 * 24 * 60 * 60}`;
    document.cookie = `selectedOutletType=${outlet.type}; path=/; max-age=${30 * 24 * 60 * 60}`;
  } else {
    localStorage.removeItem('selectedOutlet');
    localStorage.removeItem('selectedOutletId');
    document.cookie = `selectedOutlet=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `selectedOutletType=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

function calculateAllowedProductTypes(outlet: Outlet | null, isPlanMismatch: boolean): string[] {
  if (!outlet) return [ProductType.GOODS, ProductType.SERVICE, ProductType.TICKET];

  const type = (outlet.type === OutletType.CUSTOM && isPlanMismatch)
    ? OutletType.FNB
    : outlet.type;

  switch (type) {
    case OutletType.FNB:
    case OutletType.RETAIL:
      return [ProductType.GOODS];
    case OutletType.EVENT:
      return [ProductType.TICKET];
    case OutletType.SERVICE:
      return [ProductType.SERVICE];
    case OutletType.CUSTOM:
    default:
      return [ProductType.GOODS, ProductType.SERVICE, ProductType.TICKET];
  }
}

export const useOutletStore = create<OutletState>((set, get) => ({
  selectedOutlet: null,
  selectedOutletId: null,
  outlets: [],
  isLoading: false,
  error: null,
  allowedProductTypes: [ProductType.GOODS, ProductType.SERVICE, ProductType.TICKET],
  isPlanMismatch: false,

  setSelectedOutlet: (outlet) => {
    saveOutletToStorage(outlet);
    const state = get();
    const allowedProductTypes = calculateAllowedProductTypes(outlet, state.isPlanMismatch);
    set({
      selectedOutlet: outlet,
      selectedOutletId: outlet?.id || null,
      allowedProductTypes,
    });
  },

  setOutlets: (outlets) => {
    const state = get();
    let selectedOutlet = state.selectedOutlet;

    if (outlets.length === 0) {
      selectedOutlet = null;
    } else if (!selectedOutlet) {
      selectedOutlet = getInitialSelectedOutlet(outlets);
      saveOutletToStorage(selectedOutlet);
    } else {
      const matchedOutlet = outlets.find(o => o.id === selectedOutlet!.id);
      if (matchedOutlet) {
        selectedOutlet = matchedOutlet;
      } else {
        selectedOutlet = getInitialSelectedOutlet(outlets);
        saveOutletToStorage(selectedOutlet);
      }
    }

    const allowedProductTypes = calculateAllowedProductTypes(selectedOutlet, state.isPlanMismatch);

    set({
      outlets,
      selectedOutlet,
      selectedOutletId: selectedOutlet?.id || null,
      allowedProductTypes,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  refetch: () => {
    // This will be called by the query hook
  },
}));
