import { useRouter } from "expo-router";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ShoppingCart,
  Store,
  XCircle,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  Text,
  View,
  ViewToken,
} from "react-native";

import bossIcon from "@assets/images/icon-512x512.png";
import * as Location from "expo-location";
import { useOnboarding } from "../hooks/use-onboarding";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Step {
  icon: typeof Store | typeof MapPin | typeof ShoppingCart;
  title: string;
  subtitle: string;
  description: string;
  bgColor: string;
  accentColor: string;
  isGeoStep?: boolean;
}

const steps: Step[] = [
  {
    icon: Store,
    title: "Selamat Datang",
    subtitle: "di BOSS App",
    description:
      "Platform pemesanan digital terlengkap untuk kebutuhan Anda. Cepat, mudah, dan terpercaya.",
    bgColor: "#0d1117",
    accentColor: "#4f8ef7",
  },
  {
    icon: MapPin,
    title: "Outlet Terdekat",
    subtitle: "di Sekitar Anda",
    description:
      "Aktifkan lokasi agar kami dapat menampilkan outlet terbaik yang ada di dekat Anda.",
    bgColor: "#0a1628",
    accentColor: "#2dd4bf",
    isGeoStep: true,
  },
  {
    icon: ShoppingCart,
    title: "Pesan Sekarang",
    subtitle: "Pembayaran Mudah",
    description:
      "Pilih menu favoritmu, tambahkan ke keranjang, dan nikmati kemudahan pembayaran digital.",
    bgColor: "#130820",
    accentColor: "#eb2525",
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
  const flatListRef = useRef<FlatList<Step>>(null);

  const [geoStatus, setGeoStatus] = useState<"idle" | "granted" | "denied">(
    "idle",
  );

  // Per-step animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef(steps.map(() => new Animated.Value(0))).current;

  const step = steps[currentStep];

  // Entry animation on each step change
  const animateIn = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(36);
    scaleAnim.setValue(0.78);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 440,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  // Glow pulse loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [glowAnim]);

  // Dot width animations
  useEffect(() => {
    steps.forEach((_, i) => {
      Animated.spring(dotAnims[i], {
        toValue: i === currentStep ? 1 : 0,
        friction: 6,
        tension: 100,
        useNativeDriver: false,
      }).start();
    });
  }, [currentStep]);

  // Trigger entry animation on step change
  useEffect(() => {
    animateIn();
  }, [currentStep]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });
  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const requestGeoPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setGeoStatus(status === "granted" ? "granted" : "denied");
  }, []);

  const handleComplete = useCallback(() => {
    complete();
    router.replace("/(tabs)");
  }, [complete, router]);

  const handleSkip = useCallback(() => {
    skip();
    router.replace("/(tabs)");
  }, [skip, router]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      handleComplete();
      return;
    }
    if (step.isGeoStep && geoStatus === "idle") {
      requestGeoPermission();
    }
    goNext();
    flatListRef.current?.scrollToIndex({
      index: currentStep + 1,
      animated: true,
    });
  }, [
    isLastStep,
    step,
    geoStatus,
    handleComplete,
    goNext,
    currentStep,
    requestGeoPermission,
  ]);

  const handleBack = useCallback(() => {
    goBack();
    flatListRef.current?.scrollToIndex({
      index: currentStep - 1,
      animated: true,
    });
  }, [goBack, currentStep]);

  // Track swipe by viewability
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const idx = viewableItems[0].index;
        setCurrentStep(idx);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: Step; index: number }) => {
      const StepIcon = item.icon;
      return (
        <View
          style={{
            width: SCREEN_WIDTH,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          {/* Icon rings */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 48,
            }}
          >
            {/* Outermost glow ring */}
            <Animated.View
              style={{
                position: "absolute",
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: item.accentColor + "10",
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              }}
            />
            {/* Middle ring */}
            <View
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                borderWidth: 1,
                borderColor: item.accentColor + "30",
                backgroundColor: item.accentColor + "08",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Inner circle */}
              <View
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  borderWidth: 1.5,
                  borderColor: item.accentColor + "55",
                  backgroundColor: item.accentColor + "18",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <StepIcon
                  size={48}
                  color={item.accentColor}
                  strokeWidth={1.5}
                />
              </View>
            </View>
          </Animated.View>

          {/* Text content */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              alignItems: "center",
              width: "100%",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: item.accentColor,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                marginBottom: 10,
                opacity: 0.9,
              }}
            >
              {item.subtitle}
            </Text>

            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: "#ffffff",
                textAlign: "center",
                lineHeight: 36,
                marginBottom: 16,
                letterSpacing: -0.5,
              }}
            >
              {item.title}
            </Text>

            <Text
              style={{
                fontSize: 15,
                color: "rgba(255,255,255,0.55)",
                textAlign: "center",
                lineHeight: 24,
                paddingHorizontal: 4,
              }}
            >
              {item.description}
            </Text>

            {/* Geo permission badge */}
            {item.isGeoStep && geoStatus !== "idle" && (
              <View
                style={{
                  marginTop: 24,
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderRadius: 100,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor:
                    geoStatus === "granted"
                      ? "rgba(45,212,191,0.12)"
                      : "rgba(235,37,37,0.12)",
                  borderWidth: 1,
                  borderColor:
                    geoStatus === "granted"
                      ? "rgba(45,212,191,0.35)"
                      : "rgba(235,37,37,0.35)",
                }}
              >
                {geoStatus === "granted" ? (
                  <CheckCircle size={16} color="#2dd4bf" strokeWidth={2} />
                ) : (
                  <XCircle size={16} color="#eb2525" strokeWidth={2} />
                )}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: geoStatus === "granted" ? "#2dd4bf" : "#eb2525",
                  }}
                >
                  {geoStatus === "granted"
                    ? "Lokasi berhasil diaktifkan"
                    : "Akses lokasi ditolak"}
                </Text>
              </View>
            )}
          </Animated.View>
        </View>
      );
    },
    [fadeAnim, scaleAnim, slideAnim, glowOpacity, glowScale, geoStatus],
  );

  const keyExtractor = useCallback((_: Step, i: number) => String(i), []);

  return (
    <View style={{ flex: 1, backgroundColor: step.bgColor }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Background ambient blobs */}
      <Animated.View
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: step.accentColor + "15",
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          bottom: "30%",
          left: -80,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: step.accentColor + "0a",
          opacity: glowOpacity,
        }}
      />

      {/* Header */}
      <View
        style={{
          paddingTop: 16,
          paddingHorizontal: 24,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Image
          source={bossIcon}
          style={{
            width: 20,
            height: 24,
            borderRadius: 4,
          }}
          height={24}
          width={24}
        />

        <Pressable onPress={handleSkip} hitSlop={12}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "500",
              color: "rgba(255,255,255,0.4)",
              letterSpacing: 0.3,
            }}
          >
            Lewati
          </Text>
        </Pressable>
      </View>

      {/* Dot indicators */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 6,
          marginTop: 20,
        }}
      >
        {steps.map((s, i) => (
          <Animated.View
            key={i}
            style={{
              height: 4,
              borderRadius: 2,
              backgroundColor:
                i === currentStep ? step.accentColor : "rgba(255,255,255,0.2)",
              width: dotAnims[i].interpolate({
                inputRange: [0, 1],
                outputRange: [6, 28],
              }),
            }}
          />
        ))}
      </View>

      {/* Swipeable FlatList */}
      <FlatList
        ref={flatListRef}
        data={steps}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: "center" }}
      />

      {/* Bottom navigation */}
      <View
        style={{
          display: "flex",
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingBottom: 24,
          gap: 8,
        }}
      >
        {/* Next / Mulai button */}
        <Pressable
          onPress={handleNext}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 16,
            backgroundColor: step.accentColor,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            shadowColor: step.accentColor,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.45,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: "#ffffff",
              letterSpacing: 0.3,
            }}
          >
            {isLastStep ? "Mulai Sekarang" : "Berikutnya"}
          </Text>
          {!isLastStep && (
            <ChevronRight size={20} color="#ffffff" strokeWidth={2.5} />
          )}
        </Pressable>

        {/* Back button */}
        {!isFirstStep ? (
          <Pressable
            onPress={handleBack}
            style={{
              height: 44,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: 1,
            }}
          >
            <ChevronLeft
              size={16}
              color="rgba(255,255,255,0.4)"
              strokeWidth={2}
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Kembali
            </Text>
          </Pressable>
        ) : (
          <View style={{ height: 0 }} />
        )}
      </View>
    </View>
  );
}
