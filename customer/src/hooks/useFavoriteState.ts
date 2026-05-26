import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useUserPosition } from "@/hooks/userUserPosition";

export interface OutletData {
  id: string;
  name: string;
  address: string;
  image?: string;
  isOpen?: boolean;
  addedAt: number;
  isValid?: boolean;
  latitude?: number;
  longitude?: number;
  distance?: number; // Calculated distance in km
}

export type SortOption = "name" | "distance" | "dateAdded" | "status";
export type ViewMode = "grid" | "list";

// Standard Haversine formula to calculate distance in kilometers
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export const useFavoritesState = (favorites: OutletData[]) => {
  const [sortBy, setSortBy] = useState<SortOption>("dateAdded");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Real Geolocation hook
  const { position, loading: positionLoading } = useUserPosition();

  // API validation results state
  const [validationResults, setValidationResults] = useState<{
    valid: OutletData[];
    invalid: OutletData[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // 1. Hydrate state from localStorage on client-side mount
  useEffect(() => {
    setIsMounted(true);
    const storedSort = localStorage.getItem("fav-sort") as SortOption;
    const storedView = localStorage.getItem("fav-view") as ViewMode;
    const storedAvailable = localStorage.getItem("fav-available-only");

    if (storedSort) setSortBy(storedSort);
    if (storedView) setViewMode(storedView);
    if (storedAvailable) setShowOnlyAvailable(storedAvailable === "1");
  }, []);

  // 2. Persist state changes to localStorage
  useEffect(() => {
    if (isMounted) localStorage.setItem("fav-sort", sortBy);
  }, [sortBy, isMounted]);

  useEffect(() => {
    if (isMounted) localStorage.setItem("fav-view", viewMode);
  }, [viewMode, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("fav-available-only", showOnlyAvailable ? "1" : "0");
    }
  }, [showOnlyAvailable, isMounted]);

  // 3. Real live validation: Parallel backend API fetches to retrieve live open/closed status & coordinates
  useEffect(() => {
    if (!isMounted) return;

    if (favorites.length === 0) {
      setValidationResults(null);
      return;
    }

    const validateFavorites = async () => {
      try {
        setIsValidating(true);
        const results = await Promise.all(
          favorites.map(async (fav) => {
            try {
              // GET /api/v1/outlets/:id
              const liveData = await api.getData<any>(`/outlets/${fav.id}`);
              return {
                ...fav,
                name: liveData.name || fav.name,
                address: liveData.address || fav.address,
                image: liveData.image || fav.image,
                isOpen: liveData.isOpen !== undefined ? liveData.isOpen : fav.isOpen,
                latitude: liveData.latitude !== undefined ? Number(liveData.latitude) : fav.latitude,
                longitude: liveData.longitude !== undefined ? Number(liveData.longitude) : fav.longitude,
                isValid: true,
              };
            } catch (error) {
              console.warn(`Outlet ${fav.id} is invalid or has been deleted:`, error);
              return {
                ...fav,
                isValid: false,
              };
            }
          })
        );

        const validOutlets = results.filter((o) => o.isValid);
        const invalidOutlets = results.filter((o) => !o.isValid);

        setValidationResults({
          valid: validOutlets,
          invalid: invalidOutlets,
        });
      } catch (err) {
        console.error("Gagal memvalidasi list outlet favorit:", err);
      } finally {
        setIsValidating(false);
      }
    };

    validateFavorites();
  }, [favorites, isMounted]);

  // 4. Advanced filtering, real distance calculations, and premium sorting
  const processedFavorites = useMemo(() => {
    // Return local storage favorites directly before validation completes
    const baseList = validationResults
      ? [
          ...validationResults.valid,
          ...validationResults.invalid.map((o) => ({ ...o, isValid: false })),
        ]
      : favorites.map((o) => ({ ...o, isValid: true }));

    // Inject live distances if user position is available
    let listWithDistances = baseList.map((outlet) => {
      let distance: number | undefined = undefined;
      if (position && outlet.latitude && outlet.longitude) {
        distance = calculateHaversineDistance(
          position[0],
          position[1],
          outlet.latitude,
          outlet.longitude
        );
      }
      return {
        ...outlet,
        distance,
      };
    });

    // Filtering: Only available/valid outlets
    if (showOnlyAvailable) {
      listWithDistances = listWithDistances.filter((outlet) => outlet.isValid !== false);
    }

    // Advanced Sorting logic
    return listWithDistances.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
          
        case "dateAdded":
          return b.addedAt - a.addedAt;
          
        case "distance":
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          // Fallback if coordinates are not available
          return b.addedAt - a.addedAt;
          
        case "status":
          // Open outlets first, then closed, then invalid/deleted
          const getStatusWeight = (outlet: any) => {
            if (outlet.isValid === false) return 3; // Lowest priority
            if (outlet.isOpen === false) return 2; // Mid priority
            return 1; // Highest priority (Open)
          };
          return getStatusWeight(a) - getStatusWeight(b);
          
        default:
          return 0;
      }
    });
  }, [validationResults, favorites, showOnlyAvailable, sortBy, position]);

  return {
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    showOnlyAvailable,
    setShowOnlyAvailable,
    validationResults,
    processedFavorites,
    isValidating,
    isLoading: !isMounted,
  };
};