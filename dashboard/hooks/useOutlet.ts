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
        const fromStorage = localStorage.getItem('selectedOutletId') || undefined;
        const candidate = fromQuery || fromStorage;
        if (candidate) {
          if (!cancelled) setOutletId(candidate);
          return;
        }
        // Fallback: fetch auth/me to get first outlet
        const me = await authApi.me();
        const firstOutlet = me?.outlets?.[0]?.id;
        if (firstOutlet) {
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

  return { outletId, loading };
}
