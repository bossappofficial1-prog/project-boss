import { getOutletsInViewport, type NearbyOutlet } from "@/features/nearby/services/nearby.service";
import { useNearbyOutlets } from "@/features/nearby/hooks/use-nearby";
import { resolveImageSource } from "@/lib/image";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { router } from "expo-router";
import * as Location from "expo-location";
import {
  AlertCircle,
  Clock,
  List,
  Loader2,
  Map as MapIcon,
  Navigation,
  Search,
  Store,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Map, MapControls, MapMarker } from "@/components/ui/map";

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const min = Math.ceil(seconds / 60);
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}j ${m}m` : `${h}j`;
  }
  return `${min}m`;
}

function OutletListItem({ outlet }: { outlet: NearbyOutlet }) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={() => router.push(`/outlet/${outlet.slug}`)}
      style={{
        flexDirection: "row",
        backgroundColor: c.card,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: c.border,
        gap: 10,
      }}
    >
      <Image
        source={
          outlet.image
            ? resolveImageSource(outlet.image)
            : require("@assets/images/default-outlet.webp")
        }
        style={{ width: 100, height: 100 }}
        resizeMode="cover"
      />
      <View style={{ flex: 1, paddingVertical: 10, paddingRight: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground, flex: 1 }} numberOfLines={1}>
            {outlet.name}
          </Text>
          <View style={{ paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6, backgroundColor: outlet.isOpen ? "#dcfce7" : c.muted }}>
            <Text style={{ fontSize: 9, fontWeight: "600", color: outlet.isOpen ? "#16a34a" : c.mutedForeground }}>
              {outlet.isOpen ? "Buka" : "Tutup"}
            </Text>
          </View>
        </View>
        {outlet.address && (
          <Text style={{ fontSize: 11, color: c.mutedForeground, marginTop: 2 }} numberOfLines={2}>
            {outlet.address}
          </Text>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
          {outlet.distance != null && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Navigation size={10} color={c.mutedForeground} />
              <Text style={{ fontSize: 10, color: c.mutedForeground }}>{formatDistance(outlet.distance)}</Text>
            </View>
          )}
          {outlet.duration != null && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Clock size={10} color={c.mutedForeground} />
              <Text style={{ fontSize: 10, color: c.mutedForeground }}>{formatDuration(outlet.duration)}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function MapViewContent({
  outlets,
  onOutletPress,
}: {
  outlets: NearbyOutlet[];
  onOutletPress: (outlet: NearbyOutlet) => void;
}) {
  return (
    <>
      {outlets.map((outlet) => (
        <MapMarker
          key={outlet.id}
          coordinate={[outlet.longitude, outlet.latitude]}
          onPress={() => onOutletPress(outlet)}
        >
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: outlet.isOpen ? "#ea580c" : "#6b7280",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#ffffff",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Store size={16} color="#ffffff" />
            </View>
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 6,
                borderRightWidth: 6,
                borderTopWidth: 6,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: outlet.isOpen ? "#ea580c" : "#6b7280",
                marginTop: -1,
              }}
            />
          </View>
        </MapMarker>
      ))}
    </>
  );
}

function MapViewMode({
  outlets,
  userPosition,
  onOutletPress,
  onRegionChange,
}: {
  outlets: NearbyOutlet[];
  userPosition: { latitude: number; longitude: number } | null;
  onOutletPress: (outlet: NearbyOutlet) => void;
  onRegionChange: (region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) => void;
}) {
  const center: [number, number] = useMemo(
    () => userPosition ? [userPosition.longitude, userPosition.latitude] : [106.8456, -6.2088],
    [userPosition]
  );

  const handleRegionDidChange = useCallback((event: { nativeEvent: { center: [number, number]; zoom: number } }) => {
    const [lng, lat] = event.nativeEvent.center;

    const region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    onRegionChange(region);
  }, [onRegionChange]);

  return (
    <Map
      center={center}
      zoom={14}
      className="flex-1"
      showLoader={false}
      onRegionDidChange={handleRegionDidChange}
    >
      <MapViewContent outlets={outlets} onOutletPress={onOutletPress} />
    </Map>
  );
}

export default function NearbyScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDistance, setSelectedDistance] = useState(10);
  const [userPosition, setUserPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapOutlets, setMapOutlets] = useState<NearbyOutlet[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Izin lokasi diperlukan untuk menampilkan outlet terdekat");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserPosition({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const {
    data: nearbyData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useNearbyOutlets({
    latitude: userPosition?.latitude,
    longitude: userPosition?.longitude,
    radius: selectedDistance,
    search: debouncedSearch || undefined,
    enabled: !!userPosition && viewMode === "list",
  });

  const allOutlets = useMemo(() => nearbyData?.pages.flatMap((p) => p.data) || [], [nearbyData]);

  const fetchMapOutlets = useCallback(async (region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) => {
    setMapLoading(true);
    try {
      const outlets = await getOutletsInViewport({
        latMin: region.latitude - region.latitudeDelta / 2,
        latMax: region.latitude + region.latitudeDelta / 2,
        lngMin: region.longitude - region.longitudeDelta / 2,
        lngMax: region.longitude + region.longitudeDelta / 2,
      });
      setMapOutlets(outlets);
    } catch {}
    setMapLoading(false);
  }, []);

  const handleRegionChange = useCallback((region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(() => fetchMapOutlets(region), 500);
  }, [fetchMapOutlets]);

  const handleOutletPress = useCallback((outlet: NearbyOutlet) => {
    if (outlet.slug) router.push(`/outlet/${outlet.slug}`);
  }, []);

  if (locationError) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <AlertCircle size={40} color={c.destructive} />
        <Text style={{ fontSize: 16, fontWeight: "600", color: c.foreground, marginTop: 12 }}>Lokasi Tidak Tersedia</Text>
        <Text style={{ fontSize: 13, color: c.mutedForeground, marginTop: 4, textAlign: "center" }}>{locationError}</Text>
      </View>
    );
  }

  if (!userPosition) {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={c.primary} />
        <Text style={{ fontSize: 13, color: c.mutedForeground, marginTop: 12 }}>Mendapatkan lokasi...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {viewMode === "list" ? (
        <>
          <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 14, paddingBottom: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: c.foreground }}>Terdekat</Text>
            <Text style={{ fontSize: 12, color: c.mutedForeground, marginTop: 2 }}>Outlet di sekitarmu</Text>
          </View>

          <View style={{ flexDirection: "row", paddingHorizontal: 12, gap: 8, marginBottom: 10 }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: c.border, backgroundColor: c.card }}>
              <Search size={14} color={c.mutedForeground} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Cari outlet..." placeholderTextColor={c.mutedForeground} style={{ flex: 1, fontSize: 12, color: c.foreground, padding: 0 }} />
              {search ? <Pressable onPress={() => setSearch("")} hitSlop={8}><X size={14} color={c.mutedForeground} /></Pressable> : null}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
              {[1, 2, 5, 10, 20].map((d) => (
                <Pressable key={d} onPress={() => setSelectedDistance(d)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: selectedDistance === d ? c.primary : `${c.primary}10` }}>
                  <Text style={{ fontSize: 11, fontWeight: "500", color: selectedDistance === d ? c.primaryForeground : c.primary }}>{d} km</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {isLoading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={c.primary} />
            </View>
          ) : allOutlets.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
              <Store size={40} color={c.mutedForeground} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: c.foreground, marginTop: 12 }}>
                {search ? "Tidak ditemukan" : "Belum ada outlet"}
              </Text>
              <Text style={{ fontSize: 13, color: c.mutedForeground, marginTop: 4, textAlign: "center" }}>
                {search ? `Tidak ada outlet untuk "${search}"` : `Tidak ada outlet dalam radius ${selectedDistance} km`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={allOutlets}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <OutletListItem outlet={item} />}
              contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120, gap: 8 }}
              showsVerticalScrollIndicator={false}
              onEndReached={() => hasNextPage && fetchNextPage()}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View style={{ paddingVertical: 16, alignItems: "center" }}>
                    <ActivityIndicator size="small" color={c.primary} />
                  </View>
                ) : null
              }
            />
          )}
        </>
      ) : (
        <View style={{ flex: 1 }}>
          <MapViewMode
            outlets={mapOutlets}
            userPosition={userPosition}
            onOutletPress={handleOutletPress}
            onRegionChange={handleRegionChange}
          />
          {mapLoading && (
            <View style={{ position: "absolute", top: insets.top + 12, right: 12, backgroundColor: c.card, borderRadius: 20, padding: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 }}>
              <Loader2 size={16} color={c.primary} />
            </View>
          )}
          {mapOutlets.length > 0 && (
            <View style={{ position: "absolute", top: insets.top + 12, left: 12, backgroundColor: c.card, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: c.mutedForeground }}>
                <Text style={{ color: c.primary, fontWeight: "700" }}>{mapOutlets.length}</Text> outlet
              </Text>
            </View>
          )}
          <View style={{ position: "absolute", bottom: insets.bottom + 70, right: 12 }}>
            <MapControls showLocate />
          </View>
        </View>
      )}

      {/* Toggle */}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 16,
          alignSelf: "center",
          flexDirection: "row",
          backgroundColor: c.card,
          borderRadius: 24,
          padding: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
          borderWidth: 1,
          borderColor: c.border,
        }}
      >
        <Pressable onPress={() => setViewMode("list")} style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: viewMode === "list" ? c.primary : "transparent" }}>
          <List size={14} color={viewMode === "list" ? c.primaryForeground : c.mutedForeground} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: viewMode === "list" ? c.primaryForeground : c.mutedForeground }}>Daftar</Text>
        </Pressable>
        <Pressable onPress={() => setViewMode("map")} style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: viewMode === "map" ? c.primary : "transparent" }}>
          <MapIcon size={14} color={viewMode === "map" ? c.primaryForeground : c.mutedForeground} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: viewMode === "map" ? c.primaryForeground : c.mutedForeground }}>Peta</Text>
        </Pressable>
      </View>
    </View>
  );
}
