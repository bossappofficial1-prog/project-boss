import logoBossDark from "@assets/images/boss-icon-dark.png";
import logoBossLight from "@assets/images/boss-icon-light.png";
import { router } from "expo-router";
import { ChevronRight, Search } from "lucide-react-native";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/components/ThemeProvider";
import { BannerCarousel } from "@/components/ui/banner-carousel";
import { CategoryChip } from "@/components/ui/category-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { OutletCard } from "@/components/ui/outlet-card";
import { ProductCard } from "@/components/ui/product-card";
import { PromoCard } from "@/components/ui/promo-card";
import { SectionHeader } from "@/components/ui/section-header";
import { useGetHomeSummary } from "@/features/home/hooks/use-home";
import { useThemeColors } from "@/src/hooks/use-theme-colors";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const { colorScheme } = useTheme();
  const { data, isLoading, error, isRefetching, refetch } = useGetHomeSummary();

  const handleRefresh = () => refetch();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: insets.top,
          backgroundColor: c.background,
        }}
      >
        <ActivityIndicator size="large" color={c.primary} />
        <Text style={{ fontSize: 13, color: c.mutedForeground, marginTop: 12 }}>
          Memuat data...
        </Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: insets.top,
          backgroundColor: c.background,
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: c.foreground,
            textAlign: "center",
          }}
        >
          {error?.message || "Gagal memuat data"}
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={{
            marginTop: 16,
            paddingVertical: 12,
            paddingHorizontal: 28,
            backgroundColor: c.primary,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: c.primaryForeground,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            Coba Lagi
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.card }}>
      {/* Top Bar */}
      <View
        style={{
          backgroundColor: c.topBar.bg,
          borderBottomWidth: 1,
          borderBottomColor: c.topBar.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Image
            source={logoBossDark}
            style={{
              width: 68,
              height: 30,
              ...(colorScheme === "light" ? { display: "none" } : {}),
            }}
            resizeMode="contain"
          />
          <Image
            source={logoBossLight}
            style={{
              width: 68,
              height: 30,
              ...(colorScheme === "dark" ? { display: "none" } : {}),
            }}
            resizeMode="contain"
          />

          <Pressable
            onPress={() => router.push("/search")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: c.muted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Search size={20} color={c.mutedForeground} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={c.primary}
          />
        }
      >
        <BannerCarousel banners={data?.banners || []} />

        {/* Categories */}
        {data?.categories && data.categories.length > 0 && (
          <View
            style={{
              backgroundColor: c.section.bg,
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            <SectionHeader
              title="Kategori"
              action="Lihat Semua"
              onAction={() => router.push("/search")}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingLeft: 16,
                paddingRight: 16,
                gap: 20,
              }}
            >
              {data.categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  title={cat.title}
                  slug={cat.slug}
                  onPress={() =>
                    router.push(`/search?q=${encodeURIComponent(cat.title)}`)
                  }
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Outlets */}
        {data?.outlets && data.outlets.length > 0 && (
          <View
            style={{
              backgroundColor: c.section.bg,
              paddingTop: 16,
              paddingBottom: 16,
            }}
          >
            <SectionHeader
              title="Outlet Terpopuler"
              subtitle="Berdasarkan jumlah pesanan"
              action="Lihat Semua"
              onAction={() => router.push("/search")}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingLeft: 16,
                paddingRight: 16,
                gap: 12,
              }}
            >
              {data.outlets.map((outlet) => (
                <OutletCard
                  key={outlet.id}
                  outlet={outlet}
                  onPress={() => {
                    if (outlet.slug) router.push(`/outlet/${outlet.slug}`);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {data?.outlets && data.outlets.length === 0 && (
          <View
            style={{
              backgroundColor: c.section.bg,
              paddingTop: 16,
            }}
          >
            <SectionHeader title="Outlet Terpopuler" />
            <EmptyState
              title="Belum ada outlet"
              description="Outlet akan muncul di sini"
            />
          </View>
        )}

        {/* Popular Items */}
        {data?.popularItems && data.popularItems.length > 0 && (
          <View
            style={{
              backgroundColor: c.section.bg,
            }}
          >
            <SectionHeader
              title="Produk Populer"
              subtitle="Paling banyak dipesan"
            />
            <View style={{ marginHorizontal: 0 }}>
              {data.popularItems.slice(0, 8).map((item, index) => (
                <View key={item.id}>
                  <ProductCard
                    item={item}
                    onPress={() =>
                      router.push(`/outlet/${item.slug}/product/${item.id}`)
                    }
                    rank={index + 1}
                  />
                  {index < Math.min(data.popularItems.length, 8) - 1 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: c.divider,
                        marginLeft: 52,
                      }}
                    />
                  )}
                </View>
              ))}
            </View>
            {data.popularItems.length > 8 && (
              <Pressable
                onPress={() => router.push("/search")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,

                  paddingVertical: 10,
                  marginHorizontal: 16,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: c.mutedForeground,
                  }}
                >
                  Lihat Semua
                </Text>
                <ChevronRight size={16} color={c.mutedForeground} />
              </Pressable>
            )}
          </View>
        )}

        {/* Promos */}
        {data?.promos && data.promos.length > 0 && (
          <View
            style={{
              backgroundColor: c.section.bg,
              paddingTop: 16,
              paddingBottom: 16,
            }}
          >
            <SectionHeader title="Promo Aktif" subtitle="Jangan lewatkan!" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingLeft: 16,
                paddingRight: 16,
                gap: 12,
              }}
            >
              {data.promos.map((promo) => (
                <PromoCard key={promo.id} promo={promo} />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}
