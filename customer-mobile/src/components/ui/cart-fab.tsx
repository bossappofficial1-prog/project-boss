import { useThemeColors } from "@/src/hooks/use-theme-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { ShoppingCart } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, PanResponder, Text, View } from "react-native";

interface CartFABProps {
  count: number;
  visible?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const FAB_SIZE = 56; // estimasi diameter/tinggi tombol, dipakai untuk clamping
const EDGE_MARGIN = 16; // jarak minimum dari tepi layar
const TOP_SAFE = 60; // batas atas (hindari notch/header)
const BOTTOM_SAFE = 24; // batas bawah default (posisi awal)
const STORAGE_KEY = "cart-fab-position";

const DEFAULT_POS = {
  x: SCREEN_WIDTH - FAB_SIZE - EDGE_MARGIN,
  y: SCREEN_HEIGHT - FAB_SIZE - BOTTOM_SAFE - 80,
};

export function CartFAB({ count, visible = true }: CartFABProps) {
  const c = useThemeColors();

  const pan = useRef(new Animated.ValueXY(DEFAULT_POS)).current;

  const lastPos = useRef({ ...DEFAULT_POS }).current;

  const isDragging = useRef(false);

  // Muat posisi terakhir yang tersimpan saat komponen pertama kali mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { x, y } = JSON.parse(saved);

          // Validasi ulang batas layar, jaga-jaga kalau ukuran layar berubah
          const clampedX =
            x > SCREEN_WIDTH / 2
              ? SCREEN_WIDTH - FAB_SIZE - EDGE_MARGIN
              : EDGE_MARGIN;
          const clampedY = Math.min(
            Math.max(y, TOP_SAFE),
            SCREEN_HEIGHT - FAB_SIZE - BOTTOM_SAFE,
          );

          lastPos.x = clampedX;
          lastPos.y = clampedY;
          pan.setValue({ x: clampedX, y: clampedY });
        }
      } catch (e) {
        // Gagal baca storage, biarkan pakai posisi default
      }
    })();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      // Hanya mulai drag kalau ada pergerakan jari yang cukup (>5px),
      // supaya tap singkat tetap terdeteksi sebagai "press" bukan "drag"
      onMoveShouldSetPanResponder: (_, gesture) => {
        return Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5;
      },
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({ x: lastPos.x, y: lastPos.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5) {
          isDragging.current = true;
        }
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(_, gesture);
      },
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();

        const finalX = lastPos.x + gesture.dx;
        const finalY = lastPos.y + gesture.dy;

        // Clamp vertikal supaya tidak keluar layar / nutup safe area
        const clampedY = Math.min(
          Math.max(finalY, TOP_SAFE),
          SCREEN_HEIGHT - FAB_SIZE - BOTTOM_SAFE,
        );

        // Tentukan sisi terdekat: kiri atau kanan, berdasarkan titik tengah FAB
        const fabCenterX = finalX + FAB_SIZE / 2;
        const snapToRight = fabCenterX > SCREEN_WIDTH / 2;
        const snappedX = snapToRight
          ? SCREEN_WIDTH - FAB_SIZE - EDGE_MARGIN
          : EDGE_MARGIN;

        lastPos.x = snappedX;
        lastPos.y = clampedY;

        Animated.spring(pan, {
          toValue: { x: snappedX, y: clampedY },
          useNativeDriver: false,
          friction: 7,
          tension: 60,
        }).start();

        // Simpan posisi terakhir agar tetap diingat saat app dibuka lagi
        AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ x: snappedX, y: clampedY }),
        ).catch(() => {});
      },
    }),
  ).current;

  if (!visible || count <= 0) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: "absolute",
        transform: pan.getTranslateTransform(),
        zIndex: 50,
      }}
    >
      <View
        onTouchEnd={() => {
          // Hanya navigasi kalau ini bukan hasil drag (murni tap)
          if (!isDragging.current) {
            router.push("/(tabs)/cart");
          }
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 28,
          backgroundColor: c.primary,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <View style={{ position: "relative" }}>
          <ShoppingCart size={20} color={c.primaryForeground} />
          <View
            style={{
              position: "absolute",
              top: -6,
              right: -8,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 4,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: c.primary }}>
              {count}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
