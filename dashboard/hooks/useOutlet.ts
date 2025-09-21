"use client";

import { useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/apis/auth";

export function useSelectedOutletId() {
  const [outletId, setOutletId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      try {
        if (typeof window === 'undefined') return;
        const url = new URL(window.location.href);
        const fromQuery = url.searchParams.get('outletId') || undefined;
        // Prefer the global key used by Sidebar ('selectedOutlet'); fall back to historical key
        const fromStoragePrimary = localStorage.getItem('selectedOutlet') || undefined;
        const fromStorageLegacy = localStorage.getItem('selectedOutletId') || undefined;
        const candidate = fromQuery || fromStoragePrimary || fromStorageLegacy;
        if (candidate) {
          if (!cancelled) setOutletId(candidate);
          // Keep both keys in sync for other parts of the app that may read either
          localStorage.setItem('selectedOutlet', candidate);
          localStorage.setItem('selectedOutletId', candidate);
          return;
        }
        // Fallback: fetch auth/me to get first outlet
        const me = await authApi.me();
        const firstOutlet = me?.outlets?.[0]?.id;
        if (firstOutlet) {
          localStorage.setItem('selectedOutlet', firstOutlet);
          localStorage.setItem('selectedOutletId', firstOutlet);
          if (!cancelled) setOutletId(firstOutlet);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // React to outlet changes triggered from Sidebar (dispatches 'outletChanged')
  useEffect(() => {
    const handleOutletChanged = (event: Event) => {
      const detail = (event as CustomEvent).detail as { outletId?: string };
      const newId = detail?.outletId;
      if (newId) {
        setOutletId(newId);
        // Sync both storage keys
        localStorage.setItem('selectedOutlet', newId);
        localStorage.setItem('selectedOutletId', newId);
      }
    };

    window.addEventListener('outletChanged', handleOutletChanged as EventListener);
    return () => {
      window.removeEventListener('outletChanged', handleOutletChanged as EventListener);
    };
  }, []);

  return { outletId, loading };
}
