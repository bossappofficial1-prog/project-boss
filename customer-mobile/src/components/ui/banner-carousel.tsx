import type { HomeBanner } from "@/features/home";
import { router } from "expo-router";
import { ArrowRight } from "lucide-react-native";
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

const LOGO_IMG = require("../../../assets/images/logo.png");
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

  const startAutoPlay = useCallback(() => {
    if (banners.length <= 1) return;
    stopAutoPlay();
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

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  function handleDotPress(index: number) {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  }

  if (banners.length === 0) {
    return (
      <View
        style={{
          height: BANNER_HEIGHT,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
          gap: 4,
        }}
      >
        <Image
          source={LOGO_IMG}
          style={{ width: 40, height: 40, marginBottom: 8 }}
          resizeMode="contain"
        />
        <Text
          style={{
            color: "#ffffff",
            fontSize: 15,
            fontWeight: "700",
            letterSpacing: -0.3,
          }}
        >
          BossApp
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
          Temukan produk terbaik untuk kebutuhan Anda
        </Text>
      </View>
    );
  }

  const hasCta = (banner: HomeBanner) =>
    banner.cta && banner.cta.type !== "none";
  const hasText = (banner: HomeBanner) => banner.title || banner.subtitle;

  return (
    <View style={{ borderRadius: 14, marginTop: 8, overflow: "hidden" }}>
      <FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={stopAutoPlay}
        onScrollEndDrag={startAutoPlay}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              if (!item.cta || item.cta.type === "none") return;
              if (item.cta.type === "deep-link") {
                router.push(item.cta.payload as any);
              } else if (item.cta.type === "url") {
                Linking.openURL(item.cta.payload);
              }
              onBannerPress?.(item);
            }}
            style={{
              width: SCREEN_WIDTH,
              opacity: 1,
            }}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={{
                width: SCREEN_WIDTH,
                height: BANNER_HEIGHT,
                backgroundColor: "#1a1a1a",
              }}
              resizeMode="cover"
            />

            {(hasText(item) || banners.length > 1) && (
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  paddingHorizontal: 14,
                  paddingTop: 10,
                  paddingBottom: 12,
                  backgroundColor: "rgba(0,0,0,0.46)",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      marginRight: banners.length > 1 ? 10 : 0,
                    }}
                  >
                    {item.title && (
                      <Text
                        style={{
                          color: "#ffffff",
                          fontSize: 14,
                          fontWeight: "700",
                          letterSpacing: -0.3,
                        }}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                    )}
                    {item.subtitle && (
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.72)",
                          fontSize: 11.5,
                          marginTop: 1,
                        }}
                        numberOfLines={1}
                      >
                        {item.subtitle}
                      </Text>
                    )}
                    {hasCta(item) && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 6,
                          alignSelf: "flex-start",
                          backgroundColor: "rgba(255,255,255,0.18)",
                          borderWidth: 0.5,
                          borderColor: "rgba(255,255,255,0.3)",
                          borderRadius: 20,
                          paddingHorizontal: 10,
                          paddingVertical: 3,
                        }}
                      >
                        <Text
                          style={{
                            color: "#ffffff",
                            fontSize: 11,
                            fontWeight: "600",
                          }}
                        >
                          Lihat
                        </Text>
                        <ArrowRight size={10} color="#ffffff" />
                      </View>
                    )}
                  </View>

                  {banners.length > 1 && (
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 5,
                        alignItems: "center",
                        paddingBottom: 1,
                      }}
                    >
                      {banners.map((_, index) => (
                        <Pressable
                          key={index}
                          onPress={() => handleDotPress(index)}
                          hitSlop={8}
                        >
                          <View
                            style={{
                              width: activeIndex === index ? 16 : 5,
                              height: 5,
                              borderRadius: 2.5,
                              backgroundColor:
                                activeIndex === index
                                  ? "#ffffff"
                                  : "rgba(255,255,255,0.35)",
                            }}
                          />
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {!hasText(item) && banners.length > 1 && (
              <View
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: 12,
                  flexDirection: "row",
                  gap: 5,
                }}
              >
                {banners.map((_, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleDotPress(index)}
                    hitSlop={8}
                  >
                    <View
                      style={{
                        width: activeIndex === index ? 16 : 5,
                        height: 5,
                        borderRadius: 2.5,
                        backgroundColor:
                          activeIndex === index
                            ? "#ffffff"
                            : "rgba(255,255,255,0.35)",
                      }}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}
