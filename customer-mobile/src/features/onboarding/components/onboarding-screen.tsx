import { useThemeColors } from "@/src/hooks/use-theme-colors";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  ShoppingCart,
  Store,
} from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useOnboarding } from "../hooks/use-onboarding";
import * as Location from "expo-location";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Step {
  icon: typeof Store | typeof MapPin | typeof ShoppingCart;
  title: string;
  description: string;
  color: string;
  isGeoStep?: boolean;
}

const steps: Step[] = [
  {
    icon: Store,
    title: "Selamat Datang di BOSS",
    description:
      "Temukan outlet terdekat, lakukan pencarian, dan pesan dengan cepat.",
    color: "#2563eb",
  },
  {
    icon: MapPin,
    title: "Temukan Outlet Terdekat",
    description:
      "Aktifkan lokasi agar kami dapat menampilkan outlet di sekitar Anda.",
    color: "#16a34a",
    isGeoStep: true,
  },
  {
    icon: ShoppingCart,
    title: "Pemesanan Mudah",
    description:
      "Pilih outlet, tambahkan item ke keranjang, dan lakukan pembayaran.",
    color: "#eb2525",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const {
    currentStep,
    setCurrentStep,
    goNext,
    goBack,
    complete,
    skip,
    isLastStep,
    isFirstStep,
  } = useOnboarding();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  const handleComplete = useCallback(() => {
    complete();
    router.replace("/(tabs)");
  }, [complete, router]);

  const handleSkip = useCallback(() => {
    skip();
    router.replace("/(tabs)");
  }, [skip, router]);

  const scrollRef = useRef<Animated.FlatList<Step>>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "granted" | "denied">(
    "idle",
  );

  const step = steps[currentStep];

  const requestGeoPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setGeoStatus(status === "granted" ? "granted" : "denied");
  }, []);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleComplete();
      return;
    }

    if (step.isGeoStep && geoStatus === "idle") {
      requestGeoPermission();
    }

    goNext();
    scrollRef.current?.scrollToIndex({ index: currentStep + 1, animated: true });
  }, [isLastStep, step, geoStatus, handleComplete, goNext, currentStep, requestGeoPermission]);

  const onMomentumEnd = useCallback(
    (e: any) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      if (idx !== currentStep) {
        setCurrentStep(idx);
        if (currentStep === 1 && idx !== 1) {
          setGeoStatus("idle");
        }
      }
    },
    [currentStep, setCurrentStep],
  );

  const renderItem = useCallback(
    ({ item: step }: { item: Step }) => {
      const Icon = step.icon;

      return (
        <View
          style={{
            width: SCREEN_WIDTH,
            paddingHorizontal: 32,
            paddingTop: 60,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: c.muted,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 40,
            }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: c.card,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: step.color + "20",
              }}
            >
              <Icon size={44} color={step.color} strokeWidth={1.5} />
            </View>
          </View>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: c.foreground,
              textAlign: "center",
              marginBottom: 12,
              lineHeight: 30,
            }}
          >
            {step.title}
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: c.mutedForeground,
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 24,
              paddingHorizontal: 8,
            }}
          >
            {step.description}
          </Text>

          {step.isGeoStep && geoStatus !== "idle" && (
            <View
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor:
                  geoStatus === "granted" ? "#dcfce7" : "#fef2f2",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: geoStatus === "granted" ? "#16a34a" : "#dc2626",
                }}
              >
                {geoStatus === "granted"
                  ? "Lokasi berhasil diaktifkan"
                  : "Akses lokasi ditolak"}
              </Text>
            </View>
          )}
        </View>
      );
    },
    [c, geoStatus],
  );

  const keyExtractor = useCallback((_: any, i: number) => String(i), []);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ width: 60 }} />

        <View style={{ flexDirection: "row", gap: 5 }}>
          {steps.map((s, i) => (
            <View
              key={i}
              style={{
                width: i === currentStep ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  i === currentStep ? s.color : c.border,
              }}
            />
          ))}
        </View>

        <Pressable onPress={handleSkip} hitSlop={8}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: c.mutedForeground,
            }}
          >
            Lewati
          </Text>
        </Pressable>
      </View>

      <Animated.FlatList
        ref={scrollRef}
        data={steps}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        onMomentumScrollEnd={onMomentumEnd}
        bounces={false}
      />

      <View style={{ flex: 1 }} />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 20,
          gap: 12,
        }}
      >
        {!isFirstStep ? (
          <Pressable
            onPress={goBack}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: c.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={20} color={c.foreground} />
          </Pressable>
        ) : (
          <View style={{ width: 48 }} />
        )}

        <Pressable
          onPress={handleNext}
          style={{
            flex: 1,
            height: 48,
            borderRadius: 12,
            backgroundColor: step.color,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: "#ffffff",
            }}
          >
            {isLastStep ? "Mulai" : "Berikutnya"}
          </Text>
          {!isLastStep && <ArrowRight size={18} color="#ffffff" />}
        </Pressable>
      </View>
    </View>
  );
}
