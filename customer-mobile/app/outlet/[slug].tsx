import { useSnackbar } from "@/components/ui/snackbar";
import { ScheduleModal } from "@/features/cart/components/schedule-modal";
import type { OutletProduct } from "@/features/outlet";
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
  Store,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  Text,
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
}: {
  product: OutletProduct;
  onPress?: () => void;
  onAddToCart?: () => void;
}) {
  const c = useThemeColors();
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
              ? product.image?.startsWith("/default")
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
            <Icon color={`#${mappedProduct.color}`} size={16} />
            <Text style={{ fontSize: 11, color: c.mutedForeground }}>
              {mapProduct[product.type].label}
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
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: c.primary,
          }}
        >
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(price)}
        </Text>
      </Pressable>

      {canAddToCart && onAddToCart && (
        <Pressable
          onPress={onAddToCart}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: c.primary,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 4,
          }}
        >
          <Plus size={18} color="#ffffff" strokeWidth={3} />
        </Pressable>
      )}
    </View>
  );
}

export default function OutletDetailScreen() {
  const c = useThemeColors();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"products" | "hours">("products");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [productForSchedule, setProductForSchedule] =
    useState<OutletProduct | null>(null);
  const snackbar = useSnackbar();
  const addItem = useCartStore((s) => s.addItem);

  const {
    data: outlet,
    isLoading: outletLoading,
    error: outletError,
  } = useGetOutletBySlug(slug || "");

  const { data: productsRes, isLoading: productsLoading } =
    useGetOutletProducts(slug || "", { limit: 50 });

  const products = productsRes?.data || [];
  const isLoading = outletLoading || productsLoading;
  const error = outletError;
  const outletData = outlet;

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
    const outletUrl = `https://customer.bossapp.id/outlet/${outletData?.slug}`;
    await Share.share({
      title: `Lihat outlet ini: ${outletData?.name}`,
      message: `${outletData?.name}\n\n${outletData?.description || ""}\n\n${outletUrl}`,
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
        <ActivityIndicator size="large" color="#eb2525" />
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
          paddingTop: insets.top,
          backgroundColor: c.background,
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontSize: 16,
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
            borderRadius: 12,
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
    <View style={{ flex: 1, backgroundColor: c.card }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {outletData.image ? (
          <Image
            source={
              outletData.image.startsWith("/defaults")
                ? defaultOutlet
                : { uri: outletData.image }
            }
            style={{ width: "100%", height: 280, backgroundColor: c.skeleton }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: 280,
              backgroundColor: c.muted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Store size={48} color="#a3a3a3" strokeWidth={1.5} />
          </View>
        )}

        <Pressable
          onPress={() => router.back()}
          style={{
            position: "absolute",
            top: insets.top + 8,
            left: 12,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={18} color="#ffffff" />
        </Pressable>

        <View
          style={{
            backgroundColor: c.card,
            marginTop: -20,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 20,
            paddingHorizontal: 16,
            paddingBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 12,
                backgroundColor: isOpen
                  ? `${c.success}20`
                  : isBreak
                    ? `${c.warning}15`
                    : `${c.destructive}20`,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
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
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 12,
                backgroundColor: c.muted,
              }}
            >
              <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                {outletData.type}
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: c.foreground,
              marginBottom: 4,
            }}
          >
            {outletData.name}
          </Text>
          {outletData.description && (
            <Text
              style={{
                fontSize: 13,
                color: c.mutedForeground,
                marginBottom: 8,
              }}
            >
              {outletData.description}
            </Text>
          )}

          {outletData.address && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 6,
                marginBottom: 6,
              }}
            >
              <MapPin size={14} color="#a3a3a3" style={{ marginTop: 2 }} />
              <Text style={{ fontSize: 13, color: c.mutedForeground, flex: 1 }}>
                {outletData.address}
              </Text>
            </View>
          )}

          {todayHours && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
              }}
            >
              <Clock size={14} color="#a3a3a3" />
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                {todayHours.isOpen
                  ? `${formatTime(todayHours.openTime)} - ${formatTime(todayHours.closeTime)}`
                  : "Hari ini tutup"}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 8 }}>
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
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <WhatsAppIcon width={20} height={20} />
                <Text
                  style={{ fontSize: 13, fontWeight: "500", color: "green" }}
                >
                  WhatsApp
                </Text>
              </Pressable>
            )}
            {outletData.instagramUrl && (
              <Pressable
                onPress={() => openInstagram(outletData.instagramUrl!)}
                style={{
                  width: 48,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <InstagramIcon width={20} height={20} />
              </Pressable>
            )}
            <Pressable
              onPress={onShare}
              style={{
                width: 48,
                height: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.border,
              }}
            >
              <Share2 color={c.foreground} size={16} />
            </Pressable>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: c.card,
            borderTopWidth: 1,
            borderTopColor: c.border,
          }}
        >
          <Pressable
            onPress={() => setActiveTab("products")}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: "center",
              borderBottomWidth: 2,
              borderBottomColor:
                activeTab === "products" ? c.primary : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: activeTab === "products" ? "600" : "400",
                color: activeTab === "products" ? c.primary : c.mutedForeground,
              }}
            >
              Produk ({products.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("hours")}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: "center",
              borderBottomWidth: 2,
              borderBottomColor:
                activeTab === "hours" ? c.primary : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: activeTab === "hours" ? "600" : "400",
                color: activeTab === "hours" ? c.primary : c.mutedForeground,
              }}
            >
              Jam Buka
            </Text>
          </Pressable>
        </View>

        {activeTab === "products" && (
          <View style={{ backgroundColor: c.card, paddingBottom: 16 }}>
            {products.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                  Belum ada produk
                </Text>
              </View>
            ) : (
              products.map((product, index) => (
                <View key={product.id}>
                  <ProductRow
                    product={product}
                    onPress={() =>
                      router.push(`/outlet/${slug}/product/${product.id}`)
                    }
                    onAddToCart={() => handleAddToCartSimple(product)}
                  />
                  {index < products.length - 1 && (
                    <View style={{ height: 1, backgroundColor: c.border }} />
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === "hours" && (
          <View style={{ backgroundColor: c.card, padding: 16 }}>
            {outletData.operatingHours?.length > 0 ? (
              outletData.operatingHours.map((hour) => {
                const isToday = hour.dayOfWeek === today;
                return (
                  <View
                    key={hour.id}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: c.border,
                      ...(isToday
                        ? {
                            backgroundColor: `${c.primary}08`,
                            marginHorizontal: -16,
                            paddingHorizontal: 16,
                          }
                        : {}),
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: isToday ? "600" : "400",
                        color: isToday ? c.primary : c.mutedForeground,
                      }}
                    >
                      {DAY_NAMES[hour.dayOfWeek]}
                      {isToday && " (Hari ini)"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: hour.isOpen
                          ? c.mutedForeground
                          : `${c.mutedForeground}80`,
                      }}
                    >
                      {hour.isOpen
                        ? `${formatTime(hour.openTime)} – ${formatTime(hour.closeTime)}`
                        : "Tutup"}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text
                style={{
                  fontSize: 13,
                  color: c.mutedForeground,
                  textAlign: "center",
                  paddingVertical: 24,
                }}
              >
                Belum ada jam buka
              </Text>
            )}
          </View>
        )}
      </ScrollView>

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
