import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useSnackbar } from "@/components/ui/snackbar";
import { ScheduleModal } from "@/features/cart/components/schedule-modal";
import { HoursScene, type OutletProduct } from "@/features/outlet";
import {
  useGetOutletBySlug,
  useGetOutletProducts,
} from "@/features/outlet/hooks/use-outlet";
import { ProductsScene } from "@/features/products";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { formatTime, openInstagram, openWhatsApp } from "@/src/lib/utils";
import { useCartStore } from "@/src/stores/cart.store";
import { useFavoritesStore } from "@/src/stores/favorites.store";
import defaultOutlet from "@assets/images/default-outlet.webp";
import InstagramIcon from "@assets/svgs/instagram.svg";
import WhatsAppIcon from "@assets/svgs/whatsapp.svg";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Clock,
  Heart,
  MapPin,
  Search,
  Share2,
  ShoppingCart,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OutletDetailScreen() {
  const c = useThemeColors();
  const layout = useWindowDimensions();
  const { slug, tableId, tableName } = useLocalSearchParams<{
    slug: string;
    tableId?: string;
    tableName?: string;
  }>();
  const insets = useSafeAreaInsets();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [index, setIndex] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const [productForSchedule, setProductForSchedule] =
    useState<OutletProduct | null>(null);
  const snackbar = useSnackbar();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const setTableId = useCartStore((s) => s.setTableId);
  const storedTableId = useCartStore((s) => s.tableId);
  const storedTableName = useCartStore((s) => s.tableName);
  const storedTableOutletId = useCartStore((s) => s.tableOutletId);

  const {
    data: outletData,
    isLoading: outletLoading,
    error: outletError,
  } = useGetOutletBySlug(slug || "");

  const routes = useMemo(() => {
    if (!outletData) {
      return [
        { key: "products", title: "Produk", type: undefined },
        { key: "hours", title: "Jam buka", type: undefined },
      ];
    }

    const type = outletData.type;
    const result: Array<{
      key: string;
      title: string;
      type?: "GOODS" | "SERVICE" | "TICKET";
    }> = [];

    if (type === "CUSTOM") {
      result.push({ key: "goods", title: "Barang", type: "GOODS" });
      result.push({ key: "service", title: "Jasa", type: "SERVICE" });
      result.push({ key: "ticket", title: "Tiket", type: "TICKET" });
    } else if (type === "SERVICE") {
      result.push({ key: "service", title: "Jasa", type: "SERVICE" });
    } else if (type === "RETAIL" || type === "FNB") {
      result.push({ key: "goods", title: "Barang", type: "GOODS" });
    } else if (type === "EVENT") {
      result.push({ key: "ticket", title: "Tiket", type: "TICKET" });
    }

    result.push({ key: "hours", title: "Jam buka" });
    return result;
  }, [outletData]);

  useEffect(() => {
    if (index >= routes.length) {
      setIndex(0);
      pagerRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [routes.length, index]);

  const { toggleFavoriteOutlet, isFavoriteOutlet } = useFavoritesStore();
  const isFav = outletData ? isFavoriteOutlet(outletData.id) : false;
  const handleToggleFavorite = () => {
    if (!outletData) return;
    toggleFavoriteOutlet({
      id: outletData.id,
      name: outletData.name,
      address: outletData.address || "",
      phone: outletData.phone || undefined,
      slug: slug || undefined,
      image: outletData.image || undefined,
    });
  };

  const handleOpenMap = () => {
    if (!outletData) return;
    let url = "";
    if (outletData.latitude && outletData.longitude) {
      url = `https://www.google.com/maps/search/?api=1&query=${outletData.latitude},${outletData.longitude}`;
    } else if (outletData.address) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(outletData.address)}`;
    }

    if (url) {
      Linking.openURL(url).catch(() => {
        snackbar.error("Gagal membuka aplikasi peta");
      });
    }
  };

  useEffect(() => {
    if (tableId && outletData) {
      setTableId(tableId, tableName || null, outletData.id);
    }
  }, [tableId, tableName, outletData, setTableId]);

  const outletCartCount = useMemo(() => {
    if (!outletData) return 0;
    return cartItems
      .filter((item) => item.outletId === outletData.id)
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems, outletData]);

  const { data: productsRes, isLoading: productsLoading } =
    useGetOutletProducts(slug || "", { limit: 50 });

  const products = productsRes?.data || [];
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase().trim();
    return products.filter((p) => p.name.toLowerCase().includes(query));
  }, [products, searchQuery]);
  const isLoading = outletLoading || productsLoading;
  const error = outletError;

  const handleAddToCartSimple = (product: OutletProduct) => {
    if (!outletData) return;

    if (product.type === "SERVICE") {
      setProductForSchedule(product);
      setShowScheduleModal(true);
      return;
    }

    const price =
      product.goods?.sellingPrice ||
      product.service?.sellingPrice ||
      product.ticket?.sellingPrice ||
      0;

    const ticketAvailableQuota =
      product.type === "TICKET" && product.ticket
        ? Math.max(
            (product.ticket.totalQuota ?? 0) - (product.ticket.soldCount ?? 0),
            0,
          )
        : 0;

    const maxQuantity =
      product.type === "GOODS"
        ? (product.goods?.currentStock ?? undefined)
        : product.type === "TICKET"
          ? Math.min(product.ticket?.maxPerOrder ?? 99, ticketAvailableQuota)
          : undefined;

    const added = addItem(
      outletData.id,
      outletData.name,
      slug || "",
      {
        id: product.id,
        name: product.name,
        type: product.type,
        image: product.image,
        taxPercentage: product.taxPercentage,
        taxName: product.taxName,
        price,
        unit:
          product.type === "GOODS"
            ? product.goods?.unit
            : product.type === "TICKET"
              ? "tiket"
              : undefined,
        maxQuantity,
        serviceDurationMinutes: undefined,
      },
      1,
    );

    if (added) {
      snackbar.success("Berhasil ditambahkan ke keranjang");
    } else {
      snackbar.error("Gagal menambahkan ke keranjang");
    }
  };

  const handleScheduleSelect = (schedule: any) => {
    if (!outletData || !productForSchedule) return;

    const price =
      productForSchedule.goods?.sellingPrice ||
      productForSchedule.service?.sellingPrice ||
      productForSchedule.ticket?.sellingPrice ||
      0;

    const added = addItem(
      outletData.id,
      outletData.name,
      slug || "",
      {
        id: productForSchedule.id,
        name: productForSchedule.name,
        type: productForSchedule.type,
        image: productForSchedule.image,
        taxPercentage: productForSchedule.taxPercentage,
        taxName: productForSchedule.taxName,
        price,
        serviceDurationMinutes: productForSchedule.service?.durationMinutes,
      },
      1,
      schedule,
    );

    if (added) {
      snackbar.success("Berhasil ditambahkan ke keranjang");
    } else {
      snackbar.error("Waktu bentrok dengan layanan lain di keranjang");
    }

    setProductForSchedule(null);
  };

  const onShare = async () => {
    if (!outletData) return;
    const outletUrl = `https://customer.bossapp.id/outlet/${outletData.slug}`;
    await Share.share({
      title: `Lihat outlet ini: ${outletData.name}`,
      message: `${outletData.name}\n\n${outletData.description || ""}\n\n${outletUrl}`,
      url: outletUrl,
    });
  };

  const isOpen = outletData?.isOpen === true;
  const isBreak = outletData?.isBreak === true;
  const statusText = isOpen ? "Buka" : isBreak ? "Istirahat" : "Tutup";
  const today = new Date().getDay();
  const todayHours = outletData?.operatingHours?.find(
    (h) => h.dayOfWeek === today,
  );

  const goToTab = (i: number) => {
    setIndex(i);
    pagerRef.current?.scrollTo({ x: i * layout.width, animated: true });
  };

  const handlePagerScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / layout.width);
    setIndex(i);
  };

  if (isLoading) {
    return <LoadingState fullScreen />;
  }

  if (error || !outletData) {
    return (
      <ErrorState
        variant="notFound"
        title="Outlet tidak ditemukan"
        description={error?.message}
        onBack={() => router.back()}
      />
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.card,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        stickyHeaderIndices={[1]}
      >
        <View>
          {outletData.image ? (
            <Image
              source={
                outletData.image.startsWith("/default")
                  ? defaultOutlet
                  : { uri: outletData.image }
              }
              style={{ width: "100%", height: 220, backgroundColor: c.muted }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: 220,
                backgroundColor: c.muted,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Store size={48} color={c.mutedForeground} strokeWidth={1.5} />
            </View>
          )}

          <Pressable
            onPress={() => router.back()}
            style={{
              position: "absolute",
              top: 8,
              left: 12,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.45)",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <ArrowLeft size={18} color="#ffffff" />
          </Pressable>

          <Pressable
            onPress={handleToggleFavorite}
            style={{
              position: "absolute",
              top: 8,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.45)",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <Heart
              size={18}
              color={isFav ? c.destructive : "#ffffff"}
              fill={isFav ? c.destructive : "transparent"}
            />
          </Pressable>

          <View
            style={{
              backgroundColor: c.background,
              paddingTop: 12,
              paddingHorizontal: 16,
              paddingBottom: 12,
              gap: 6,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: c.foreground,
                  flex: 1,
                  marginRight: 8,
                }}
                numberOfLines={1}
              >
                {outletData.name}
              </Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <View
                  style={{
                    paddingVertical: 2,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                    backgroundColor: c.muted,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: isOpen
                        ? c.success
                        : isBreak
                          ? c.warning
                          : c.destructive,
                    }}
                  >
                    {statusText}
                  </Text>
                </View>
                <View
                  style={{
                    paddingVertical: 2,
                    paddingHorizontal: 8,
                    borderRadius: 6,
                    backgroundColor: c.muted,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      color: c.mutedForeground,
                      fontWeight: "600",
                    }}
                  >
                    {outletData.type}
                  </Text>
                </View>
              </View>
            </View>

            {outletData.description && (
              <Text
                style={{ fontSize: 12, color: c.mutedForeground }}
                numberOfLines={1}
              >
                {outletData.description}
              </Text>
            )}

            {outletData.address && (
              <Pressable
                onPress={handleOpenMap}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 6,
                  marginTop: 2,
                  opacity: 1,
                }}
              >
                <MapPin size={12} color={c.primary} style={{ marginTop: 2 }} />
                <Text
                  style={{
                    fontSize: 11,
                    color: c.primary,
                    textDecorationLine: "underline",
                    flex: 1,
                    lineHeight: 15,
                  }}
                  numberOfLines={2}
                >
                  {outletData.address}
                </Text>
              </Pressable>
            )}

            {todayHours && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 2,
                }}
              >
                <Clock size={12} color={c.mutedForeground} />
                <Text style={{ fontSize: 11, color: c.mutedForeground }}>
                  {todayHours.isOpen
                    ? `${formatTime(todayHours.openTime)} - ${formatTime(todayHours.closeTime)}`
                    : "Hari ini tutup"}
                </Text>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              {outletData.phone && (
                <Pressable
                  onPress={() => openWhatsApp(outletData.phone!)}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 0.5,
                    borderColor: c.border,
                    backgroundColor: c.card,
                  }}
                >
                  <WhatsAppIcon width={16} height={16} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: c.foreground,
                    }}
                  >
                    WhatsApp
                  </Text>
                </Pressable>
              )}
              {outletData.instagramUrl && (
                <Pressable
                  onPress={() => openInstagram(outletData.instagramUrl!)}
                  style={{
                    width: 38,
                    height: 34,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    borderWidth: 0.5,
                    borderColor: c.border,
                    backgroundColor: c.card,
                  }}
                >
                  <InstagramIcon width={16} height={16} />
                </Pressable>
              )}
              <Pressable
                onPress={onShare}
                style={{
                  width: 38,
                  height: 34,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  borderWidth: 0.5,
                  borderColor: c.border,
                  backgroundColor: c.card,
                }}
              >
                <Share2 color={c.foreground} size={14} />
              </Pressable>
            </View>

            {/* Search Bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: c.muted,
                borderRadius: 8,
                paddingHorizontal: 10,
                height: 36,
                borderWidth: 0.5,
                borderColor: c.border,
                marginTop: 4,
              }}
            >
              <Search size={14} color={c.mutedForeground} />
              <TextInput
                placeholder="Cari produk di outlet ini..."
                placeholderTextColor={c.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  marginLeft: 6,
                  fontSize: 12,
                  color: c.foreground,
                  padding: 0,
                }}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <X size={14} color={c.mutedForeground} />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <View style={{ display: "none" }} />

        <View
          style={{
            flexDirection: "row",
            backgroundColor: c.background,
            borderBottomWidth: 0.5,
            borderBottomColor: c.border,
          }}
        >
          {routes.map((route, i) => {
            const isActive = index === i;
            const count = route.type
              ? filteredProducts.filter((p) => p.type === route.type).length
              : undefined;
            return (
              <Pressable
                key={route.key}
                onPress={() => goToTab(i)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 12,
                  borderBottomWidth: 2,
                  borderBottomColor: isActive ? c.primary : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? "500" : "400",
                    color: isActive ? c.foreground : c.mutedForeground,
                  }}
                >
                  {route.title}
                  {count !== undefined ? ` (${count})` : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handlePagerScrollEnd}
        >
          {routes.map((route) => (
            <View key={route.key} style={{ width: layout.width }}>
              {route.key === "hours" ? (
                <HoursScene operatingHours={outletData.operatingHours} c={c} />
              ) : (
                <ProductsScene
                  products={filteredProducts.filter(
                    (p) => p.type === route.type,
                  )}
                  slug={slug || ""}
                  c={c}
                  onAddToCart={handleAddToCartSimple}
                  outletId={outletData.id}
                  type={route.type}
                />
              )}
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      {storedTableOutletId !== outletData.id && outletCartCount > 0 && (
        <Pressable
          onPress={() => router.push("/(tabs)/cart")}
          style={{
            position: "absolute",
            bottom: 24,
            right: 16,
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
              <Text
                style={{ fontSize: 10, fontWeight: "700", color: c.primary }}
              >
                {outletCartCount}
              </Text>
            </View>
          </View>
        </Pressable>
      )}

      {storedTableId && storedTableOutletId === outletData.id && (
        <View
          style={{
            position: "absolute",
            bottom: 24,
            left: 16,
            right: 16,
            backgroundColor: "#eb2525eb",
            borderRadius: 12,
            paddingVertical: 8,
            paddingLeft: 8,
            paddingRight: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            elevation: 5,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.15)",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              flex: 1,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                width: 30,
                height: 30,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UtensilsCrossed size={15} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: "rgba(255,255,255,0.75)",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                Meja aktif
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#ffffff",
                  lineHeight: 17,
                }}
              >
                {`Meja ${
                  (storedTableName?.toLowerCase()?.includes("meja")
                    ? storedTableName.toLowerCase().replace("meja", "").trim()
                    : storedTableName) || storedTableId
                }`}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(255,255,255,0.15)",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 99,
              }}
            >
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: "#ffffff",
                }}
              />
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "700",
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                Aktif
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/(tabs)/cart")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderRadius: 28,
                marginRight: 4,
                paddingVertical: 8,
                paddingHorizontal: 8,
                backgroundColor: `rgba(255,255,255,0.15)`,
              }}
            >
              <View style={{ position: "relative" }}>
                <ShoppingCart size={14} color={c.primaryForeground} />
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    minWidth: 10,
                    height: 12,
                    borderRadius: 9,
                    backgroundColor: "#ffffff",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 8,
                      fontWeight: "700",
                      color: c.primary,
                    }}
                  >
                    {outletCartCount}
                  </Text>
                </View>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setTableId(null, null, null)}
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                width: 26,
                height: 26,
                borderRadius: 99,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
              hitSlop={8}
            >
              <X size={13} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      )}

      {outletData && productForSchedule && showScheduleModal && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setProductForSchedule(null);
          }}
          onSelectSchedule={handleScheduleSelect}
          productName={productForSchedule.name}
          productId={productForSchedule.id}
          outletId={outletData.id}
          durationMinutes={productForSchedule.service?.durationMinutes}
          isOutletOpen={outletData.isOpen}
        />
      )}
    </View>
  );
}
