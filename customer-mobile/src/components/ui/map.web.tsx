import * as Location from "expo-location";
import {
  createContext,
  use,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";

type MapContextValue = {
  mapRef: React.RefObject<any | null>;
  cameraRef: React.RefObject<any | null>;
  isLoaded: boolean;
  theme: "light" | "dark";
};

const MapContext = createContext<MapContextValue | null>(null);

function useMap() {
  const context = use(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a Map component");
  }
  return context;
}

type MapProps = {
  children?: ReactNode;
  styles?: { light?: string; dark?: string };
  center?: [number, number];
  zoom?: number;
  className?: string;
  showLoader?: boolean;
  showUserLocation?: boolean;
  onRegionDidChange?: (event: any) => void;
};

function Map({
  children,
  className,
}: MapProps) {
  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  return (
    <MapContext value={{ mapRef, cameraRef, isLoaded: true, theme: "light" }}>
      <View className={className} style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6" }}>
        <Text style={{ fontSize: 14, color: "#6b7280", textAlign: "center", padding: 16 }}>
          Peta tidak tersedia di web
        </Text>
        {children}
      </View>
    </MapContext>
  );
}

function MapMarker({
  children,
  onPress,
}: {
  children?: ReactNode;
  coordinate?: [number, number];
  onPress?: () => void;
  label?: string;
  anchor?: { x: number; y: number };
  allowOverlap?: boolean;
  longitude?: number;
  latitude?: number;
}) {
  return (
    <Pressable onPress={onPress}>
      {children}
    </Pressable>
  );
}

function MarkerContent({ children, className }: { children?: ReactNode; className?: string }) {
  return <View className={className}>{children}</View>;
}

function MarkerLabel({
  children,
  className,
  classNameText,
  position: _position,
}: {
  children: ReactNode;
  className?: string;
  classNameText?: string;
  position?: "top" | "bottom";
}) {
  return (
    <View className={className}>
      <Text className={classNameText}>{children}</Text>
    </View>
  );
}

function MarkerPopup({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <View className={className}>
      {title ? <Text style={{ fontWeight: "600", marginBottom: 4 }}>{title}</Text> : null}
      <View style={{ padding: 12, minWidth: 100, maxWidth: 300 }}>{children}</View>
    </View>
  );
}

function MapControls({
  showLocate = false,
  className,
  onLocate,
}: {
  position?: string;
  showZoom?: boolean;
  showLocate?: boolean;
  className?: string;
  onLocate?: (coords: { longitude: number; latitude: number }) => void;
}) {
  const { isLoaded } = useMap();
  const [waitingForLocation, setWaitingForLocation] = useState(false);

  const handleLocate = async () => {
    setWaitingForLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      onLocate?.({
        longitude: loc.coords.longitude,
        latitude: loc.coords.latitude,
      });
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setWaitingForLocation(false);
    }
  };

  if (!isLoaded || !showLocate) return null;

  return (
    <View className={className}>
      <Pressable
        onPress={handleLocate}
        disabled={waitingForLocation}
        style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          backgroundColor: "#ffffff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {waitingForLocation ? (
          <ActivityIndicator size="small" color="#666" />
        ) : (
          <Text style={{ fontSize: 16 }}>📍</Text>
        )}
      </Pressable>
    </View>
  );
}

function MapRoute(_props: {
  coordinates?: Array<[number, number]>;
  color?: string;
  width?: number;
  opacity?: number;
  dashArray?: [number, number];
}) {
  return null;
}

function useCurrentPosition() {
  const [position, setPosition] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (mounted) {
            setError("Izin lokasi ditolak");
            setLoading(false);
          }
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (mounted) {
          setPosition({
            longitude: loc.coords.longitude,
            latitude: loc.coords.latitude,
          });
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setError("Gagal mendapatkan lokasi");
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { position, error, loading };
}

export {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
  useCurrentPosition,
  useMap,
};
