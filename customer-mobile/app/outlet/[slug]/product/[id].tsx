import { ScheduleModal } from "@/features/cart/components/schedule-modal";
import { useGetOutletBySlug, useGetProductDetail } from "@/features/outlet/hooks/use-outlet";
import { resolveImageUrl } from "@/lib/image";
import { useSnackbar } from "@/components/ui/snackbar";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { mapProduct } from "@/src/lib/utils";
import { useCartStore } from "@/src/stores/cart.store";
import defaultProduct from "@assets/images/default-product.png";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Calendar1Icon,
  Clock,
  MapPin,
  Package,
  ShoppingCart,
} from "lucide-react-native";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function ProductDetailScreen() {
  const c = useThemeColors();
  const { slug, id } = useLocalSearchParams<{ slug: string; id: string }>();
  const insets = useSafeAreaInsets();
  const snackbar = useSnackbar();
  const addItem = useCartStore((s) => s.addItem);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const {
    data: product,
    isLoading,
    error,
  } = useGetProductDetail(id || "");
  const { data: outlet } = useGetOutletBySlug(slug || "");

  const price =
    product?.goods?.sellingPrice ||
    product?.service?.sellingPrice ||
    product?.ticket?.sellingPrice ||
    0;

  const Icon = mapProduct[product?.type || "GOODS"]?.icon || Package;

  const isProductInactive = product?.status !== "ACTIVE";
  const productOutOfStock =
    product?.type === "GOODS" &&
    (product.goods?.currentStock == null || product.goods.currentStock <= 0);

  const ticketAvailableQuota =
    product?.type === "TICKET" && product.ticket
      ? Math.max(
          (product.ticket.totalQuota ?? 0) - (product.ticket.soldCount ?? 0),
          0,
        )
      : 0;
  const ticketSoldOut = product?.type === "TICKET" && ticketAvailableQuota <= 0;
  const ticketEventPassed =
    product?.type === "TICKET" &&
    product.ticket?.eventEndDate
      ? new Date(product.ticket.eventEndDate) < new Date()
      : product?.type === "TICKET" && product.ticket?.eventDate
        ? new Date(product.ticket.eventDate) < new Date()
        : false;
  const ticketMaxPerOrder = product?.type === "TICKET"
    ? Math.min(product.ticket?.maxPerOrder ?? 99, ticketAvailableQuota)
    : 99;

  const handleAddToCart = () => {
    if (!product || !outlet) return;

    if (isProductInactive) {
      snackbar.error("Produk tidak tersedia");
      return;
    }
    if (productOutOfStock) {
      snackbar.error("Produk sudah habis");
      return;
    }
    if (ticketSoldOut) {
      snackbar.error("Tiket sudah habis");
      return;
    }
    if (ticketEventPassed) {
      snackbar.error("Event sudah selesai");
      return;
    }

    // For SERVICE, open schedule modal instead
    if (product.type === "SERVICE") {
      setShowScheduleModal(true);
      return;
    }

    const maxQuantity =
      product.type === "GOODS"
        ? product.goods?.currentStock ?? undefined
        : product.type === "TICKET"
          ? ticketMaxPerOrder
          : undefined;

    const added = addItem(
      outlet.id,
      outlet.name,
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
    if (!product || !outlet) return;

    const added = addItem(
      outlet.id,
      outlet.name,
      slug || "",
      {
        id: product.id,
        name: product.name,
        type: product.type,
        image: product.image,
        taxPercentage: product.taxPercentage,
        taxName: product.taxName,
        price,
        serviceDurationMinutes: product.service?.durationMinutes,
      },
      1,
      schedule,
    );

    if (added) {
      snackbar.success("Berhasil ditambahkan ke keranjang");
    } else {
      snackbar.error("Waktu bentrok dengan layanan lain di keranjang");
    }
  };

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

  if (error || !product) {
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
          {error?.message || "Produk tidak ditemukan"}
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
        {product.image ? (
          <Image
            source={
              product.image.startsWith("/default")
                ? defaultProduct
                : { uri: resolveImageUrl(product.image) }
            }
            style={{
              width: SCREEN_WIDTH,
              height: 300,
              backgroundColor: c.muted,
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: 300,
              backgroundColor: c.muted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: c.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "600",
                  color: c.mutedForeground,
                }}
              >
                {getInitials(product.name)}
              </Text>
            </View>
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
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 12,
                backgroundColor: c.muted,
              }}
            >
              <Icon color={`#${mapProduct[product.type].color}`} size={14} />
              <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                {mapProduct[product.type].label}
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "600",
              color: c.foreground,
              marginBottom: 4,
            }}
          >
            {product.name}
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: c.primary,
              marginBottom: 16,
            }}
          >
            {formatPrice(price)}
          </Text>

          {product.description && (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: c.foreground,
                  marginBottom: 6,
                }}
              >
                Deskripsi
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: c.mutedForeground,
                  lineHeight: 20,
                }}
              >
                {product.description}
              </Text>
            </View>
          )}

          {product.type === "GOODS" && product.goods && (
            <View
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.border,
                backgroundColor: c.muted,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: c.foreground,
                  marginBottom: 6,
                }}
              >
                Informasi Produk
              </Text>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View>
                  <Text style={{ fontSize: 11, color: c.mutedForeground }}>
                    Stok
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: c.mutedForeground,
                    }}
                  >
                    {product.goods.currentStock} {product.goods.unit || "pcs"}
                  </Text>
                </View>
                {product.goods.sku && (
                  <View>
                    <Text style={{ fontSize: 11, color: c.mutedForeground }}>
                      SKU
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: c.mutedForeground,
                      }}
                    >
                      {product.goods.sku}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {product.type === "SERVICE" && product.service && (
            <View
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.border,
                backgroundColor: c.muted,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: c.foreground,
                  marginBottom: 6,
                }}
              >
                Informasi Layanan
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Clock size={14} color="#a3a3a3" />
                <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                  {product.service.durationMinutes
                    ? `${product.service.durationMinutes} menit`
                    : "Durasi tidak ditentukan"}
                </Text>
              </View>
            </View>
          )}

          {product.type === "TICKET" && product.ticket && (
            <View
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.border,
                backgroundColor: c.muted,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: c.foreground,
                  marginBottom: 6,
                }}
              >
                Informasi Tiket
              </Text>
              {product.ticket.eventDate && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Calendar1Icon size={14} color={c.mutedForeground} />
                  <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                    {new Date(product.ticket.eventDate).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </Text>
                </View>
              )}
              {product.ticket.venue && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <MapPin size={14} color={c.mutedForeground} />
                  <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                    {product.ticket.venue}
                  </Text>
                </View>
              )}
            </View>
          )}

          {product.taxPercentage != null && product.taxPercentage > 0 && (
            <View
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 12,
                backgroundColor: `${c.warning}10`,
                borderWidth: 1,
                borderColor: `${c.warning}30`,
              }}
            >
              <Text style={{ fontSize: 12, color: c.warning }}>
                {product.taxName || "Pajak"}: {product.taxPercentage}%
              </Text>
            </View>
          )}

          {product.media && product.media.length > 1 && (
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: c.foreground,
                  marginBottom: 8,
                }}
              >
                Galeri
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {product.media.map((m: any) => (
                  <Image
                    key={m.id}
                    source={
                      m.url ? { uri: resolveImageUrl(m.url) } : defaultProduct
                    }
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                      backgroundColor: c.muted,
                    }}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: c.card,
          borderTopWidth: 1,
          borderTopColor: c.border,
        }}
      >
        <Pressable
          onPress={handleAddToCart}
          disabled={isProductInactive || productOutOfStock}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor:
              isProductInactive || productOutOfStock ? c.muted : c.primary,
          }}
        >
          <ShoppingCart size={18} color="#ffffff" />
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: c.primaryForeground,
            }}
          >
            {product?.type === "SERVICE"
              ? "Pilih Jadwal"
              : "Tambah ke Keranjang"}
          </Text>
        </Pressable>
      </View>

      {product && outlet && showScheduleModal && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSelectSchedule={handleScheduleSelect}
          productName={product.name}
          productId={product.id}
          outletId={outlet.id}
          durationMinutes={product.service?.durationMinutes}
          isOutletOpen={outlet.isOpen}
        />
      )}
    </View>
  );
}
