import type { HomeBanner } from "@/features/home";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  Pressable,
  Text,
  View,
  ViewToken,
} from "react-native";

const LOGO_IMG = require("../../assets/images/logo.png");
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_HEIGHT = 180;

interface BannerCarouselProps {
  banners: HomeBanner[];
  onBannerPress?: (banner: HomeBanner) => void;
}

export function BannerCarousel({
  banners,
  onBannerPress,
}: BannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Logika Auto-play yang aman (bisa di-pause saat user scroll manual)
  const startAutoPlay = useCallback(() => {
    if (banners.length <= 1) return;
    stopAutoPlay(); // Pastikan tidak ada interval ganda

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
  }, [banners.length]);

  const stopAutoPlay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay, stopAutoPlay]);

  // 2. Deteksi index banner secara akurat menggunakan ViewabilityConfig
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // 3. State Kosong (Empty State)
  if (banners.length === 0) {
    return (
      <View
        className="h-[180px] items-center justify-center"
        style={{ backgroundColor: "#262626" }}
      >
        <Image
          source={LOGO_IMG}
          className="w-14 h-14 mb-3"
          resizeMode="contain"
        />
        <Text className="text-primary-foreground text-lg font-bold">
          BossApp
        </Text>
        <Text className="text-white/80 text-[13px] mt-1">
          Temukan produk terbaik untuk kebutuhan Anda
        </Text>
      </View>
    );
  }

  return (
    <View className="relative">
      <FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        // Hentikan autoplay saat user menyentuh carousel agar tidak "loncat"
        onScrollBeginDrag={stopAutoPlay}
        onScrollEndDrag={startAutoPlay}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        // getItemLayout sangat penting untuk performa dan akurasi scrollToIndex
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (!item.cta || item.cta.type === "none") return;
              if (item.cta.type === "url" || item.cta.type === "deep-link") {
                Linking.openURL(item.cta.payload);
              }
              onBannerPress?.(item);
            }}
            style={({ pressed }) => ({
              width: SCREEN_WIDTH,
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={{
                width: SCREEN_WIDTH,
                height: BANNER_HEIGHT,
                backgroundColor: "#262626",
              }}
              resizeMode="cover"
            />
            {(item.title || item.subtitle) && (
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  paddingVertical: 20,
                  paddingHorizontal: 16,
                  backgroundColor: "rgba(0,0,0,0.45)",
                }}
              >
                {item.title && (
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    {item.title}
                  </Text>
                )}
                {item.subtitle && (
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.85)",
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    {item.subtitle}
                  </Text>
                )}
              </View>
            )}
          </Pressable>
        )}
      />

      {/* Indikator dengan transisi mulus ala desain minimalis modern */}
      {banners.length > 1 && (
        <View
          style={{
            position: "absolute",
            bottom: 12,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {banners.map((banner, index) => (
            <View
              key={banner.id}
              style={{
                width: activeIndex === index ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  activeIndex === index ? "#ffffff" : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
