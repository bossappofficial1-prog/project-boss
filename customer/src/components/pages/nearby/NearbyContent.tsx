"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNearbyOutlets } from "@/hooks/useNearbyOutlets";
import { useUserPosition } from "@/hooks/userUserPosition";
import { OutletCard } from "@/components/pages/home/OutletCard";
import { LoadingState, EmptyState, ErrorState } from "@/components/Base";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Map as MapIcon,
  List as ListIcon,
  Search as SearchIcon,
  X,
  Store,
  Navigation,
} from "lucide-react";
import { useTranslations } from "@/hooks/useI18n";
import {
  Search,
  SearchDropdown,
  SearchInput,
} from "@/components/shared/search";
import { DistanceSelector } from "@/components/shared/DistanceSelector";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import { OutletDetails } from "@/types";
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
  MapRoute,
} from "@/components/ui/map";
import { getOutletsInViewport, searchOutlets } from "@/lib/api";
import { useStoreState } from "@/stores/use-store-state";

const LAST_POSITION_KEY = "lastPosition";
const LAST_POSITION_TTL_MS = 3 * 60 * 1000;

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours} jam ${remainingMinutes} mnt`
      : `${hours} jam`;
  }
  return `${minutes} mnt`;
}

function formatDurationCompact(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}j ${remainingMinutes}m`
      : `${hours}j`;
  }
  return `${minutes}m`;
}
const normalizeOutlet = (outlet: OutletDetails) => ({
  ...outlet,
  createdAt: outlet.createdAt ?? new Date().toISOString(),
  updatedAt: outlet.updatedAt ?? new Date().toISOString(),
  businessId: outlet.businessId ?? outlet.id ?? "",
  operatingHours: outlet.operatingHours ?? [],
});

export function NearbyOutletContent() {
  const t = useTranslations("nearbyPage");
  const { position, loading: positionLoading } = useUserPosition();
  const { setAppBar } = useAppBarV2();

  const [search, setSearch] = useState("");
  const [mapSearch, setMapSearch] = useState("");
  const [showMapSearch, setShowMapSearch] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDistance, setSelectedDistance] = useState(10);
  const {
    nearbyViewMode: viewMode,
    setNearbyViewMode: setViewMode,
    activeRouteCoords,
    activeRouteOutlet,
    routeInfo,
    setActiveRoute,
    clearActiveRoute,
  } = useStoreState();
  const [hasLastPosition, setHasLastPosition] = useState<{
    latitude: number;
    longitude: number;
    expireTo: string;
  } | null>(null);

  // Viewport map state
  const [mapOutlets, setMapOutlets] = useState<OutletDetails[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [activeOutletId, setActiveOutletId] = useState<string | null>(null);
  const [mapSuggestions, setMapSuggestions] = useState<OutletDetails[]>([]);
  const [heading, setHeading] = useState<number | null>(null);
  const [mapBearing, setMapBearing] = useState(0);
  const mapRef = useRef<any>(null);
  const viewportFetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref untuk Infinite Scroll
  const loadMoreRef = useRef(null);

  const debouncedMapSearch = useDebounce(mapSearch, 400);

  // 1. Initial Load & AppBar Setup
  useEffect(() => {
    setAppBar({ title: t("appBarTitle"), showPartnerToggle: false });

    const raw = localStorage.getItem(LAST_POSITION_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (new Date(parsed.expireTo).getTime() > Date.now()) {
          setHasLastPosition(parsed);
        } else {
          localStorage.removeItem(LAST_POSITION_KEY);
        }
      } catch {
        localStorage.removeItem(LAST_POSITION_KEY);
      }
    }
  }, [t, setAppBar]);

  // 2. Persist Position to LocalStorage
  useEffect(() => {
    if (position?.[0] && position?.[1]) {
      const data = {
        latitude: position[0],
        longitude: position[1],
        expireTo: new Date(Date.now() + LAST_POSITION_TTL_MS).toISOString(),
      };
      localStorage.setItem(LAST_POSITION_KEY, JSON.stringify(data));
      setHasLastPosition(data);
    }
  }, [position]);

  // 3. Memoized Effective Position
  const effectivePosition = useMemo(() => {
    if (position?.[0] && position?.[1]) return position;
    if (hasLastPosition)
      return [hasLastPosition.latitude, hasLastPosition.longitude];
    return null;
  }, [position, hasLastPosition]);

  // 4. Optimized Debounce Search (untuk mode list)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 5. Data Fetching (List Mode)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useNearbyOutlets({
    latitude: effectivePosition?.[0],
    longitude: effectivePosition?.[1],
    radius: selectedDistance,
    take: 10,
    search: debouncedSearch || undefined,
    enabled: Boolean(effectivePosition) && String(viewMode) === "list",
  });

  // 6. Memoized Normalized Data (list mode)
  const allOutlets = useMemo(() => {
    return data?.pages.flatMap((page) => page.data.map(normalizeOutlet)) || [];
  }, [data]);

  // 7. Viewport-based outlet fetching (Map Mode)
  const fetchViewportOutlets = useCallback(async () => {
    if (!mapRef.current || activeRouteOutlet) return;
    const bounds = mapRef.current.getBounds();
    if (!bounds) return;

    setMapLoading(true);
    try {
      const outlets = await getOutletsInViewport({
        latMin: bounds.getSouth(),
        latMax: bounds.getNorth(),
        lngMin: bounds.getWest(),
        lngMax: bounds.getEast(),
        search: undefined,
      });
      setMapOutlets(outlets.map(normalizeOutlet));
    } catch {
      // Silent fail — markers stay as they are
    } finally {
      setMapLoading(false);
    }
  }, [activeRouteOutlet]);

  // 7.5. Fetch and show route coordinates to outlet
  const handleShowRoute = useCallback(
    async (outlet: OutletDetails) => {
      if (!effectivePosition) return;
      setMapLoading(true);
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${effectivePosition[1]},${effectivePosition[0]};${outlet.longitude},${outlet.latitude}?overview=full&geometries=geojson`,
        );
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const routeGeojson = data.routes[0].geometry;
          const coords = routeGeojson.coordinates as [number, number][];
          setActiveRoute(coords, outlet, {
            distance: data.routes[0].distance,
            duration: data.routes[0].duration,
          });

          const lngs = coords.map((c) => c[0]);
          const lats = coords.map((c) => c[1]);
          const lngMin = Math.min(...lngs);
          const lngMax = Math.max(...lngs);
          const latMin = Math.min(...lats);
          const latMax = Math.max(...lats);

          mapRef.current?.fitBounds(
            [
              [lngMin, latMin],
              [lngMax, latMax],
            ],
            { padding: 80, duration: 1200 },
          );
        }
      } catch (error) {
        console.error("Gagal memuat rute:", error);
      } finally {
        setMapLoading(false);
      }
    },
    [effectivePosition, setActiveRoute],
  );

  // 8. Register moveend / zoomend listeners + initial fetch saat map siap
  //    FIX: gunakan 'load' event untuk initial fetch, bukan hanya useEffect
  useEffect(() => {
    if (viewMode !== "map") return;

    // Reset mapReady saat mode baru aktif
    setMapReady(false);
    setMapOutlets([]);
    setActiveOutletId(null);
    setMapSuggestions([]);

    // Poll sampai mapRef tersedia (Map component butuh sedikit waktu mount)
    const waitForMap = setInterval(() => {
      if (!mapRef.current) return;
      clearInterval(waitForMap);

      const map = mapRef.current;

      const handleMoveEnd = () => {
        if (viewportFetchTimer.current)
          clearTimeout(viewportFetchTimer.current);
        viewportFetchTimer.current = setTimeout(() => {
          fetchViewportOutlets();
        }, 400);
      };

      const handleLoad = () => {
        setMapReady(true);
        fetchViewportOutlets();
      };

      // Kalau map sudah loaded (pindah dari mode list), langsung fetch
      if (map.loaded()) {
        setMapReady(true);
        fetchViewportOutlets();
      } else {
        map.once("load", handleLoad);
      }

      const handleRotate = () => {
        setMapBearing(map.getBearing());
      };

      map.on("moveend", handleMoveEnd);
      map.on("zoomend", handleMoveEnd);
      map.on("rotate", handleRotate);

      // set initial bearing
      setMapBearing(map.getBearing());

      // cleanup
      (map as any).__nearbyCleanup = () => {
        map.off("moveend", handleMoveEnd);
        map.off("zoomend", handleMoveEnd);
        map.off("rotate", handleRotate);
        if (viewportFetchTimer.current)
          clearTimeout(viewportFetchTimer.current);
      };
    }, 50);

    return () => {
      clearInterval(waitForMap);
      if ((mapRef.current as any)?.__nearbyCleanup) {
        (mapRef.current as any).__nearbyCleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // 9. Re-fetch saat map mode aktif dan siap
  useEffect(() => {
    if (viewMode === "map" && mapReady) {
      fetchViewportOutlets();
    }
  }, [viewMode, mapReady, fetchViewportOutlets]);

  // 9.5. Fetch global suggestions when map search query changes
  useEffect(() => {
    if (viewMode !== "map" || !debouncedMapSearch.trim()) {
      setMapSuggestions([]);
      return;
    }

    let active = true;
    const fetchSuggestions = async () => {
      setMapLoading(true);
      try {
        const result = await searchOutlets({
          search: debouncedMapSearch,
          take: 10,
        });
        if (active) {
          setMapSuggestions(result.data.map(normalizeOutlet));
        }
      } catch (err) {
        if (active) setMapSuggestions([]);
      } finally {
        if (active) setMapLoading(false);
      }
    };

    fetchSuggestions();

    return () => {
      active = false;
    };
  }, [debouncedMapSearch, viewMode]);

  // 9.6. Auto-update active route path if user's live position changes
  useEffect(() => {
    if (!activeRouteOutlet || !effectivePosition) return;

    const updateRouteSilently = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${effectivePosition[1]},${effectivePosition[0]};${activeRouteOutlet.longitude},${activeRouteOutlet.latitude}?overview=full&geometries=geojson`,
        );
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const routeGeojson = data.routes[0].geometry;
          setActiveRoute(
            routeGeojson.coordinates as [number, number][],
            activeRouteOutlet,
            {
              distance: data.routes[0].distance,
              duration: data.routes[0].duration,
            }
          );
        }
      } catch (error) {
        // Silent catch
      }
    };

    updateRouteSilently();
  }, [effectivePosition, activeRouteOutlet, setActiveRoute]);

  // 9.7. Listen to device compass heading orientation in Map Mode
  useEffect(() => {
    if (viewMode !== "map") {
      setHeading(null);
      return;
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if ((e as any).webkitCompassHeading !== undefined) {
        setHeading((e as any).webkitCompassHeading);
      } else if (e.alpha !== null) {
        setHeading(360 - e.alpha);
      }
    };

    const requestDeviceOrientation = async () => {
      const DeviceOrientationEventClass = (window as any)
        .DeviceOrientationEvent;
      if (
        DeviceOrientationEventClass &&
        typeof DeviceOrientationEventClass.requestPermission === "function"
      ) {
        try {
          const permissionState =
            await DeviceOrientationEventClass.requestPermission();
          if (permissionState === "granted") {
            (window as any).addEventListener(
              "deviceorientation",
              handleOrientation,
            );
          }
        } catch (error) {
          console.error(
            "Error requesting device orientation permission:",
            error,
          );
        }
      } else {
        if ("ondeviceorientationabsolute" in window) {
          (window as any).addEventListener(
            "deviceorientationabsolute",
            handleOrientation,
          );
        } else {
          (window as any).addEventListener(
            "deviceorientation",
            handleOrientation,
          );
        }
      }
    };

    requestDeviceOrientation();

    return () => {
      (window as any).removeEventListener(
        "deviceorientation",
        handleOrientation,
      );
      (window as any).removeEventListener(
        "deviceorientationabsolute",
        handleOrientation,
      );
    };
  }, [viewMode]);

  // 10. Infinite Scroll
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Conditional Rendering logic
  if (!effectivePosition) {
    return (
      <div className="max-w-md mx-auto p-4">
        {positionLoading ? (
          <LoadingState message={t("loadingLocation")} />
        ) : (
          <EmptyState
            title={t("locationRequired")}
            description={t("locationRequiredDesc")}
            action={{
              label: t("retry"),
              onClick: () => window.location.reload(),
            }}
          />
        )}
      </div>
    );
  }

  if (viewMode === "map") {
    return (
      <div
        className="fixed inset-0 z-10"
        style={{
          top: "var(--appbar-height, 56px)",
          bottom: "var(--bottomnav-height, 64px)",
        }}
      >
        {/* Map fills the entire remaining space */}
        <Map
          ref={mapRef}
          center={[effectivePosition[1], effectivePosition[0]]}
          zoom={13}
          className="w-full h-full"
        >
          <MapControls
            showZoom={true}
            showLocate={true}
            showCompass={true}
            showFullscreen={true}
            className="!bottom-28 md:!bottom-10"
          />

          {/* Active Route Path */}
          {activeRouteCoords && (
            <MapRoute
              coordinates={activeRouteCoords}
              color="#ea580c"
              width={5}
            />
          )}

          {/* User Location Pin */}
          <MapMarker
            longitude={effectivePosition[1]}
            latitude={effectivePosition[0]}
          >
            <MarkerContent>
              <div className="relative flex items-center justify-center">
                {/* Heading indicator cone */}
                {heading !== null && (
                  <div
                    className="absolute w-20 h-20 origin-bottom"
                    style={{
                      transform: `rotate(${heading - mapBearing}deg)`,
                      bottom: "50%",
                      // Soft transparent blue gradient cone to represent field of view
                      background:
                        "radial-gradient(circle at bottom, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0) 70%)",
                      clipPath: "polygon(20% 0%, 80% 0%, 50% 100%)",
                      pointerEvents: "none",
                    }}
                  />
                )}
                {/* Core blue pulse dot */}
                <div className="relative">
                  <div className="w-4 h-4 rounded-full border-2 border-white bg-blue-500 shadow-lg animate-pulse" />
                  <div className="absolute inset-0 w-4 h-4 rounded-full bg-blue-500/40 animate-ping" />
                </div>
              </div>
            </MarkerContent>
          </MapMarker>

          {/* Outlet Markers */}
          {(activeRouteOutlet ? [activeRouteOutlet] : mapOutlets).map((outlet) => {
            const isActive = activeOutletId === outlet.id;
            return (
              <MapMarker
                key={outlet.id}
                longitude={outlet.longitude}
                latitude={outlet.latitude}
                onClick={() => {
                  setActiveOutletId(outlet.id);
                  mapRef.current?.flyTo({
                    center: [outlet.longitude, outlet.latitude],
                    zoom: 15,
                    duration: 1200,
                  });
                }}
              >
                <MarkerContent>
                  <div className="relative group">
                    <div className="w-9 h-9 bg-linear-to-tr from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 border-2 border-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95">
                      <Store className="w-4 h-4 text-white shrink-0" />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-rose-600 transition-colors" />
                  </div>
                </MarkerContent>

                {isActive && (
                  <MarkerPopup
                    closeButton={true}
                    onClose={() => setActiveOutletId(null)}
                    className="min-w-55 p-0! overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
                  >
                    <div className="flex flex-col">
                      {outlet.image && (
                        <div className="w-full h-28 relative bg-muted">
                          <img
                            src={outlet.image}
                            alt={outlet.name}
                            className="w-full h-full object-cover"
                          />
                          <span
                            className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm ${
                              outlet.isOpen
                                ? "bg-green-500 text-white"
                                : "bg-gray-700 text-white"
                            }`}
                          >
                            {outlet.isOpen ? "Buka" : "Tutup"}
                          </span>
                        </div>
                      )}
                      <div className="p-3">
                        <h4 className="font-bold text-sm text-foreground mb-0.5 leading-tight line-clamp-1">
                          {outlet.name}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-snug mb-3">
                          {outlet.address || ""}
                        </p>
                        <div className="flex gap-2">
                          <a
                            href={`/outlet/${outlet.slug}?from=nearby`}
                            className="flex-1 text-center text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md transition-colors flex items-center justify-center"
                          >
                            Pesan
                          </a>
                          <button
                            onClick={() => handleShowRoute(outlet)}
                            className="flex items-center justify-center gap-1.5 text-xs font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground px-3 py-2 rounded-md transition-all duration-200 text-foreground shadow-sm active:scale-95 cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>Rute</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </MarkerPopup>
                )}
              </MapMarker>
            );
          })}
        </Map>

        <div
          className="absolute top-3 left-3 z-20 flex items-center"
          style={{ maxWidth: "calc(100% - 24px)" }}
        >
          {showMapSearch ? (
            <div className="relative">
              <div className="flex items-center gap-2 bg-background/95 backdrop-blur rounded-full shadow-lg border border-border px-3 py-2 w-64">
                <SearchIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  autoFocus
                  value={mapSearch}
                  onChange={(e) => setMapSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground min-w-0"
                />
                {mapSearch && (
                  <button
                    onClick={() => {
                      setMapSearch("");
                    }}
                    className="shrink-0 mr-1"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setMapSearch("");
                    setShowMapSearch(false);
                  }}
                  className="shrink-0 border-l pl-1.5 border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Tutup
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {mapSearch.trim() !== "" && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur border border-border shadow-xl rounded-2xl p-1.5 max-h-64 overflow-y-auto z-30 flex flex-col gap-1 w-64 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  {mapSuggestions.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-3 text-center">
                      {mapLoading ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          <span>Mencari...</span>
                        </div>
                      ) : (
                        "Tidak ada outlet yang cocok"
                      )}
                    </div>
                  ) : (
                    mapSuggestions.map((outlet) => (
                      <button
                        key={outlet.id}
                        onClick={() => {
                          // Make sure the outlet is present in mapOutlets so its marker renders instantly
                          setMapOutlets((prev) => {
                            if (prev.some((o) => o.id === outlet.id))
                              return prev;
                            return [...prev, outlet];
                          });

                          mapRef.current?.flyTo({
                            center: [outlet.longitude, outlet.latitude],
                            zoom: 16,
                            duration: 1200,
                          });
                          setActiveOutletId(outlet.id);
                        }}
                        className="w-full text-left p-2 hover:bg-accent rounded-xl transition-all duration-150 flex flex-col gap-0.5 border border-transparent hover:border-border/50"
                      >
                        <span className="font-semibold text-xs text-foreground line-clamp-1">
                          {outlet.name}
                        </span>
                        {outlet.address && (
                          <span className="text-[10px] text-muted-foreground line-clamp-1 leading-normal">
                            {outlet.address}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowMapSearch(true)}
              className="flex items-center gap-2 bg-background/95 backdrop-blur rounded-full shadow-lg border border-border px-3 py-2 text-sm text-muted-foreground pointer-events-auto"
            >
              <SearchIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-xs">{t("searchPlaceholder")}</span>
            </button>
          )}
        </div>

        {/* Loading indicator */}
        {mapLoading && (
          <div className="absolute top-3 right-3 z-20 bg-background/90 backdrop-blur rounded-full p-2 shadow-md border border-border">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none w-full max-w-[calc(100vw-32px)] sm:max-w-md">
          {activeRouteCoords && routeInfo && activeRouteOutlet ? (
            /* Unified premium Route + Toggle Capsule when route is active */
            <div className="pointer-events-auto bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-full p-1 flex items-center gap-1 select-none hover:shadow-2xl transition-all duration-300">
              <button
                onClick={() => setViewMode("list")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>Daftar</span>
              </button>

              <div className="w-px h-5 bg-border/80" />

              <div className="flex items-center gap-1.5 pl-1 pr-1.5">
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-md transition-all duration-200">
                  <MapIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="shrink-0">Peta</span>
                  <div className="w-px h-3 bg-primary-foreground/30 mx-0.5" />
                  <Navigation className="w-3.5 h-3.5 text-primary-foreground rotate-45 animate-pulse shrink-0" />
                  <span className="shrink-0">{formatDurationCompact(routeInfo.duration)}</span>
                  <span className="text-primary-foreground/60 text-[10px] font-normal">•</span>
                  <span className="shrink-0 text-[10px] font-semibold text-primary-foreground/90">
                    {formatDistance(routeInfo.distance)}
                  </span>
                </div>

                <button
                  onClick={() => {
                    clearActiveRoute();
                  }}
                  className="w-6 h-6 rounded-full bg-muted/80 hover:bg-muted border border-border/50 flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
                  title="Hapus Rute"
                >
                  <X className="w-3.5 h-3.5 text-foreground" />
                </button>
              </div>
            </div>
          ) : (
            /* Standard Separated controls when no route is active */
            <>
              {/* Outlet count capsule */}
              {!mapLoading && mapOutlets.length > 0 && (
                <div className="pointer-events-auto bg-background/90 backdrop-blur rounded-full px-3 py-1 shadow-md border border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider scale-90 select-none animate-in fade-in duration-200">
                  <span className="text-primary font-bold">
                    {mapOutlets.length}
                  </span>{" "}
                  outlet di area ini
                </div>
              )}
              {mapLoading && (
                <div className="pointer-events-auto bg-background/90 backdrop-blur rounded-full px-3 py-1 shadow-md border border-border text-[10px] font-semibold text-muted-foreground flex items-center gap-1 scale-90 select-none animate-in fade-in duration-200">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span>Memuat Outlet...</span>
                </div>
              )}

              {/* Segmented Control Toggle */}
              <div className="pointer-events-auto bg-background/95 backdrop-blur border border-border shadow-xl rounded-full p-1 flex items-center gap-1 select-none hover:shadow-2xl transition-all duration-300">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 ${
                    String(viewMode) === "list"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ListIcon className="w-3.5 h-3.5" />
                  <span>Daftar</span>
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 ${
                    String(viewMode) === "map"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Peta</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Compact Filter Bar — hanya di list mode */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 py-2 mb-4">
        <div className="flex items-center gap-1 p-1 bg-background/90 backdrop-blur border border-border/80 shadow-md rounded-2xl">
          <div className="flex-1 relative">
            <Search
              value={search}
              onChange={setSearch}
              namespace="nearby"
              size="sm"
              onSearch={setSearch}
              className="mb-0"
            >
              <SearchInput
                placeholder={t("searchPlaceholder")}
                className="rounded-xl border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <SearchDropdown />
            </Search>
          </div>

          <div className="h-6 w-px bg-border/80" />

          <div className="w-24 sm:w-28 relative flex items-center justify-center">
            <DistanceSelector
              value={selectedDistance}
              onChange={setSelectedDistance}
              className="mb-0 border-0 bg-transparent focus:ring-0 text-xs font-semibold text-foreground/80 hover:text-foreground transition-colors"
            />
          </div>
        </div>
      </div>

      {/* States handling */}
      {isLoading && <LoadingState message={t("findingOutlets")} />}
      {isError && (
        <ErrorState
          title={t("failedToLoad")}
          message={error?.message || t("somethingWrong")}
          onRetry={refetch}
        />
      )}

      {!isLoading && !isError && (
        <>
          {allOutlets.length === 0 ? (
            <EmptyState
              title={search ? t("noOutletsFound") : t("noNearbyOutlets")}
              description={
                search
                  ? `${t("noOutletsForSearch")} "${search}"`
                  : t("noOutletsWithinRange")
              }
              action={
                search
                  ? { label: t("clearSearch"), onClick: () => setSearch("") }
                  : undefined
              }
            />
          ) : (
            <>
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {data?.pages[0]?.total || allOutlets.length}{" "}
                  {t("outletCount")}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {allOutlets.map((outlet) => (
                  <OutletCard
                    key={outlet.id}
                    outlet={outlet as any}
                    alignment="horizontal"
                    from="nearby"
                  />
                ))}
              </div>

              {/* Sentinel element for Infinite Scroll */}
              <div ref={loadMoreRef} className="py-8 flex justify-center">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("loadingMore")}
                  </div>
                ) : hasNextPage ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchNextPage()}
                  >
                    {t("loadMore")}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("noMoreOutlets")}
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/*
       * FIX: Tinggi tombol konsisten h-10 menggunakan size default Button.
       * Rounded-full + px-5 untuk tampilan yang lebih clean.
       */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-background/95 backdrop-blur border border-border shadow-xl rounded-full p-1 flex items-center gap-1 select-none hover:shadow-2xl transition-all duration-300">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>Daftar</span>
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 ${
              String(viewMode) === "map"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Peta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
