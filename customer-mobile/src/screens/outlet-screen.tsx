import { useSnackbar } from "@/components/ui/snackbar";
import { ScheduleModal } from "@/features/cart/components/schedule-modal";
import type { OutletDetail, OutletProduct } from "@/features/outlet";
import {
  useGetOutletBySlug,
  useGetOutletProducts,
} from "@/features/outlet/hooks/use-outlet";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import {
  formatTime,
  mapProduct,
  openInstagram,
  openWhatsApp,
} from "@/src/lib/utils";
import { useCartStore } from "@/src/stores/cart.store";
import defaultOutlet from "@assets/images/default-outlet.webp";
import defaultProduct from "@assets/images/default-product.png";
import InstagramIcon from "@assets/svgs/instagram.svg";
import WhatsAppIcon from "@assets/svgs/whatsapp.svg";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Plus,
  Share2,
  ShoppingCart,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

function ProductRow({
  product,
  onPress,
  onAddToCart,
  outletId,
}: {
  product: OutletProduct;
  onPress?: () => void;
  onAddToCart?: () => void;
  outletId?: string;
}) {
  const c = useThemeColors();
  const cartItems = useCartStore((s) => s.items);
  const cartQty = useMemo(() => {
    if (!outletId) return 0;
    return cartItems
      .filter(
        (item) => item.outletId === outletId && item.productId === product.id,
      )
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems, outletId, product.id]);
  const price =
    product.goods?.sellingPrice ||
    product.service?.sellingPrice ||
    product.ticket?.sellingPrice ||
    0;

  const mappedProduct = mapProduct[product.type];
  const Icon = mappedProduct.icon;

  const isOutOfStock =
    product.type === "GOODS" &&
    (product.goods?.currentStock == null || product.goods.currentStock <= 0);

  const ticketAvailableQuota =
    product.type === "TICKET" && product.ticket
      ? Math.max(
          (product.ticket.totalQuota ?? 0) - (product.ticket.soldCount ?? 0),
          0,
        )
      : 0;
  const isTicketSoldOut =
    product.type === "TICKET" && ticketAvailableQuota <= 0;

  const canAddToCart =
    product.status === "ACTIVE" && !isOutOfStock && !isTicketSoldOut;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
        backgroundColor: c.card,
      }}
    >
      <Pressable
        onPress={onPress}
        style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}
      >
        <Image
          source={
            product.image
              ? product.image.startsWith("/default")
                ? defaultProduct
                : { uri: product.image }
              : defaultProduct
          }
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: c.muted,
          }}
          resizeMode="cover"
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 14, fontWeight: "500", color: c.foreground }}
            numberOfLines={1}
          >
            {product.name}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginTop: 4,
            }}
          >
            <Icon color={c.mutedForeground} size={16} />
            <Text style={{ fontSize: 11, color: c.mutedForeground }}>
              {mappedProduct.label}
            </Text>
            {product.type === "GOODS" &&
              product.goods?.currentStock != null && (
                <Text style={{ fontSize: 11, color: c.mutedForeground }}>
                  · Stok {product.goods.currentStock}
                </Text>
              )}
            {isTicketSoldOut && (
              <Text style={{ fontSize: 11, color: c.destructive }}>
                · Habis
              </Text>
            )}
          </View>
        </View>
        <Text style={{ fontSize: 14, fontWeight: "500", color: c.primary }}>
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(price)}
        </Text>
      </Pressable>

      {canAddToCart && onAddToCart && (
        <View style={{ alignItems: "center", gap: 4, marginLeft: 4 }}>
          {cartQty > 0 && (
            <View
              style={{
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: c.primary,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: c.primaryForeground,
                }}
              >
                {cartQty}
              </Text>
            </View>
          )}
          <Pressable
            onPress={onAddToCart}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: c.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={18} color={c.primaryForeground} strokeWidth={3} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ProductsScene({
  products,
  slug,
  c,
  onAddToCart,
  outletId,
}: {
  products: OutletProduct[];
  slug: string;
  c: ReturnType<typeof useThemeColors>;
  onAddToCart: (p: OutletProduct) => void;
  outletId?: string;
}) {
  if (products.length === 0) {
    return (
      <View
        style={{
          backgroundColor: c.card,
          paddingVertical: 32,
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 13, color: c.mutedForeground }}>
          Belum ada produk
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: c.card, paddingBottom: 16 }}>
      {products.map((product, index) => (
        <View key={product.id}>
          <ProductRow
            product={product}
            onPress={() => router.push(`/outlet/${slug}/product/${product.id}`)}
            onAddToCart={() => onAddToCart(product)}
            outletId={outletId}
          />
          {index < products.length - 1 && (
            <View style={{ height: 0.5, backgroundColor: c.border }} />
          )}
        </View>
      ))}
    </View>
  );
}

function HoursScene({
  operatingHours,
  c,
}: {
  operatingHours: OutletDetail["operatingHours"];
  c: ReturnType<typeof useThemeColors>;
}) {
  const today = new Date().getDay();

  if (!operatingHours || operatingHours.length === 0) {
    return (
      <Text
        style={{
          fontSize: 13,
          color: c.mutedForeground,
          textAlign: "center",
          paddingVertical: 24,
          backgroundColor: c.card,
        }}
      >
        Belum ada jam buka
      </Text>
    );
  }

  return (
    <View style={{ backgroundColor: c.card, padding: 16 }}>
      {operatingHours.map((hour) => {
        const isToday = hour.dayOfWeek === today;
        return (
          <View
            key={hour.id}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 10,
              paddingHorizontal: isToday ? 12 : 0,
              marginHorizontal: isToday ? -12 : 0,
              borderRadius: isToday ? 10 : 0,
              borderBottomWidth: isToday ? 0 : 0.5,
              borderBottomColor: c.border,
              backgroundColor: isToday ? c.muted : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: isToday ? "500" : "400",
                color: isToday ? c.primary : c.mutedForeground,
              }}
            >
              {DAY_NAMES[hour.dayOfWeek]}
            </Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  fontSize: 13,
                  color: hour.isOpen ? c.foreground : c.mutedForeground,
                }}
              >
                {hour.isOpen
                  ? `${formatTime(hour.openTime)} – ${formatTime(hour.closeTime)}`
                  : "Tutup"}
              </Text>
              {hour.breakStart && hour.breakEnd && (
                <Text style={{ fontSize: 10, color: c.warning }}>
                  {`Istirahat ${formatTime(hour.breakStart)} – ${formatTime(hour.breakEnd)}`}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

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
  const [index, setIndex] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const routes = [
    { key: "products", title: "Produk" },
    { key: "hours", title: "Jam buka" },
  ] as const;
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
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: c.background,
        }}
      >
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (error || !outletData) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: c.background,
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "500",
            color: c.foreground,
            textAlign: "center",
          }}
        >
          {error?.message || "Outlet tidak ditemukan"}
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            marginTop: 16,
            paddingVertical: 10,
            paddingHorizontal: 24,
            borderRadius: 10,
            backgroundColor: c.primary,
          }}
        >
          <Text
            style={{
              color: c.primaryForeground,
              fontSize: 14,
              fontWeight: "500",
            }}
          >
            Kembali
          </Text>
        </Pressable>
      </View>
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
            }}
          >
            <ArrowLeft size={18} color="#ffffff" />
          </Pressable>

          <View
            style={{
              backgroundColor: c.background,
              paddingTop: 18,
              paddingHorizontal: 16,
              paddingBottom: 16,
              gap: 8,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: c.muted,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
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
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: c.muted,
                }}
              >
                <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                  {outletData.type}
                </Text>
              </View>
            </View>

            <Text
              style={{ fontSize: 20, fontWeight: "500", color: c.foreground }}
            >
              {outletData.name}
            </Text>

            {outletData.description && (
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                {outletData.description}
              </Text>
            )}

            {outletData.address && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 6,
                }}
              >
                <MapPin
                  size={14}
                  color={c.mutedForeground}
                  style={{ marginTop: 2 }}
                />
                <Text
                  style={{ fontSize: 13, color: c.mutedForeground, flex: 1 }}
                >
                  {outletData.address}
                </Text>
              </View>
            )}

            {todayHours && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Clock size={14} color={c.mutedForeground} />
                <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                  {todayHours.isOpen
                    ? `${formatTime(todayHours.openTime)} - ${formatTime(todayHours.closeTime)}`
                    : "Hari ini tutup"}
                </Text>
              </View>
            )}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              {outletData.phone && (
                <Pressable
                  onPress={() => openWhatsApp(outletData.phone!)}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 0.5,
                    borderColor: c.border,
                  }}
                >
                  <WhatsAppIcon width={18} height={18} />
                  <Text
                    style={{
                      fontSize: 13,
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
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 10,
                    borderWidth: 0.5,
                    borderColor: c.border,
                  }}
                >
                  <InstagramIcon width={18} height={18} />
                </Pressable>
              )}
              <Pressable
                onPress={onShare}
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  borderWidth: 0.5,
                  borderColor: c.border,
                }}
              >
                <Share2 color={c.foreground} size={16} />
              </Pressable>
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
            return (
              <Pressable
                key={route.key}
                onPress={() => goToTab(i)}
                style={{
                  flex: 2,
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
                  {route.key === "products" ? ` (${products.length})` : ""}
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
          <View style={{ width: layout.width }}>
            <ProductsScene
              products={products}
              slug={slug || ""}
              c={c}
              onAddToCart={handleAddToCartSimple}
              outletId={outletData.id}
            />
          </View>
          <View style={{ width: layout.width }}>
            <HoursScene operatingHours={outletData.operatingHours} c={c} />
          </View>
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
