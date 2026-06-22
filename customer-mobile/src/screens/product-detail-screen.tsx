import { useSnackbar } from "@/components/ui/snackbar";
import { ScheduleModal } from "@/features/cart/components/schedule-modal";
import {
  useGetOutletBySlug,
  useGetProductDetail,
} from "@/features/outlet/hooks/use-outlet";
import { resolveImageUrl } from "@/lib/image";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { mapProduct } from "@/src/lib/utils";
import { useCartStore } from "@/src/stores/cart.store";
import defaultProduct from "@assets/images/default-product.png";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  ArrowLeft,
  Calendar1Icon,
  Clock,
  MapPin,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Tag,
  Ticket as TicketIcon,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = 260;

type GalleryItem = {
  type: "IMAGE" | "VIDEO";
  url: string;
  source?: "UPLOAD" | "EMBED";
};

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

function isInstagramUrl(url: string): boolean {
  return url.includes("instagram.com");
}

function getInstagramEmbedUrl(url: string): string {
  const clean = url.split("?")[0].replace(/\/$/, "");
  return `${clean}/embed`;
}

function getEmbedSrc(url: string): {
  kind: "youtube" | "instagram" | "unknown";
  src: string;
} {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return {
      kind: "youtube",
      src: `https://www.youtube.com/embed/${ytId}?playsinline=1&rel=0&modestbranding=1&enablejsapi=1&controls=1&fs=1&origin=https://customer.bossapp.id`,
    };
  }
  if (isInstagramUrl(url)) {
    return { kind: "instagram", src: getInstagramEmbedUrl(url) };
  }
  return { kind: "unknown", src: url };
}

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
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { data: product, isLoading, error } = useGetProductDetail(id || "");
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
    product?.type === "TICKET" && product.ticket?.eventEndDate
      ? new Date(product.ticket.eventEndDate) < new Date()
      : product?.type === "TICKET" && product.ticket?.eventDate
        ? new Date(product.ticket.eventDate) < new Date()
        : false;
  const ticketMaxPerOrder =
    product?.type === "TICKET"
      ? Math.min(product.ticket?.maxPerOrder ?? 99, ticketAvailableQuota)
      : 99;

  const maxQuantity =
    product?.type === "GOODS"
      ? (product.goods?.currentStock ?? 1)
      : product?.type === "TICKET"
        ? ticketMaxPerOrder
        : 1;

  const unavailableReason = !product
    ? null
    : isProductInactive
      ? "Produk tidak tersedia"
      : productOutOfStock
        ? "Stok habis"
        : ticketSoldOut
          ? "Tiket habis"
          : ticketEventPassed
            ? "Event telah berakhir"
            : null;

  const isUnavailable = !!unavailableReason;
  const showQuantityStepper = product?.type !== "SERVICE" && !isUnavailable;

  const galleryItems: GalleryItem[] = useMemo(() => {
    if (!product) return [];
    const items: GalleryItem[] = [];
    if (product.image) items.push({ type: "IMAGE", url: product.image });
    product.media?.forEach((m) => {
      if (!m.url) return;
      items.push({ type: m.type, url: m.url, source: m.source });
    });
    return items.length ? items : [{ type: "IMAGE", url: "" }];
  }, [product]);

  const handleQuantityChange = (delta: number) => {
    setQuantity((q) => Math.min(Math.max(q + delta, 1), maxQuantity || 1));
  };

  const handleAddToCart = () => {
    if (!product || !outlet) return;

    if (unavailableReason) {
      snackbar.error(unavailableReason);
      return;
    }

    if (product.type === "SERVICE") {
      setShowScheduleModal(true);
      return;
    }

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
      quantity,
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
        <ActivityIndicator size="large" color={c.primary} />
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
            fontSize: 15,
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
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
              );
              setActiveImageIndex(idx);
            }}
          >
            {galleryItems.map((item, idx) => (
              <GallerySlide
                key={idx}
                item={item}
                isActive={idx === activeImageIndex}
                c={c}
                productName={product.name}
              />
            ))}
          </ScrollView>

          {galleryItems.length > 1 && (
            <View
              style={{
                position: "absolute",
                bottom: 12,
                left: 0,
                right: 0,
                flexDirection: "row",
                justifyContent: "center",
                gap: 5,
              }}
            >
              {galleryItems.map((_, idx) => (
                <View
                  key={idx}
                  style={{
                    width: idx === activeImageIndex ? 16 : 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor:
                      idx === activeImageIndex
                        ? "#ffffff"
                        : "rgba(255,255,255,0.5)",
                  }}
                />
              ))}
            </View>
          )}

          {isUnavailable && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.35)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  backgroundColor: "rgba(0,0,0,0.6)",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    color: "#ffffff",
                  }}
                >
                  {unavailableReason}
                </Text>
              </View>
            </View>
          )}
        </View>

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
            gap: 18,
          }}
        >
          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                alignSelf: "flex-start",
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 8,
                borderWidth: 0.5,
                borderColor: c.border,
              }}
            >
              <Icon color={c.mutedForeground} size={13} />
              <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                {mapProduct[product.type].label}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 20,
                fontWeight: "500",
                color: c.foreground,
                lineHeight: 26,
              }}
            >
              {product.name}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "500",
                  color: c.primary,
                }}
              >
                {formatPrice(price)}
              </Text>
              {product.type === "GOODS" && product.goods?.unit && (
                <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                  / {product.goods.unit}
                </Text>
              )}
              {product.taxPercentage != null && product.taxPercentage > 0 && (
                <Text style={{ fontSize: 12, color: c.mutedForeground }}>
                  belum termasuk {product.taxName || "pajak"}{" "}
                  {product.taxPercentage}%
                </Text>
              )}
            </View>
          </View>

          {product.type === "GOODS" && product.goods && (
            <InfoCard c={c} title="Informasi produk">
              <InfoRow
                c={c}
                icon={<Package size={14} color={c.mutedForeground} />}
                label="Stok tersedia"
                value={`${product.goods.currentStock} ${product.goods.unit || "pcs"}`}
              />
              {product.goods.sku && (
                <InfoRow
                  c={c}
                  icon={<Tag size={14} color={c.mutedForeground} />}
                  label="SKU"
                  value={product.goods.sku}
                />
              )}
            </InfoCard>
          )}

          {product.type === "SERVICE" && product.service && (
            <InfoCard c={c} title="Informasi layanan">
              <InfoRow
                c={c}
                icon={<Clock size={14} color={c.mutedForeground} />}
                label="Durasi"
                value={
                  product.service.durationMinutes
                    ? `${product.service.durationMinutes} menit`
                    : "Tidak ditentukan"
                }
              />
            </InfoCard>
          )}

          {product.type === "TICKET" && product.ticket && (
            <InfoCard c={c} title="Informasi tiket">
              {product.ticket.eventDate && (
                <InfoRow
                  c={c}
                  icon={<Calendar1Icon size={14} color={c.mutedForeground} />}
                  label="Tanggal event"
                  value={new Date(product.ticket.eventDate).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                />
              )}
              {product.ticket.venue && (
                <InfoRow
                  c={c}
                  icon={<MapPin size={14} color={c.mutedForeground} />}
                  label="Lokasi"
                  value={product.ticket.venue}
                />
              )}
              {!ticketSoldOut && !ticketEventPassed && (
                <InfoRow
                  c={c}
                  icon={<TicketIcon size={14} color={c.mutedForeground} />}
                  label="Sisa kuota"
                  value={`${ticketAvailableQuota} tiket`}
                />
              )}
            </InfoCard>
          )}

          {product.description && (
            <View style={{ gap: 6 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: c.foreground,
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

          <View style={{ height: 8 }} />
        </View>
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: c.card,
          borderTopWidth: 0.5,
          borderTopColor: c.border,
        }}
      >
        {showQuantityStepper && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 0.5,
              borderColor: c.border,
              borderRadius: 10,
            }}
          >
            <Pressable
              onPress={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              style={{
                width: 36,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Minus
                size={15}
                color={quantity <= 1 ? c.border : c.foreground}
              />
            </Pressable>
            <Text
              style={{
                minWidth: 28,
                textAlign: "center",
                fontSize: 14,
                fontWeight: "500",
                color: c.foreground,
              }}
            >
              {quantity}
            </Text>
            <Pressable
              onPress={() => handleQuantityChange(1)}
              disabled={quantity >= (maxQuantity || 1)}
              style={{
                width: 36,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus
                size={15}
                color={quantity >= (maxQuantity || 1) ? c.border : c.foreground}
              />
            </Pressable>
          </View>
        )}

        <Pressable
          onPress={handleAddToCart}
          disabled={isUnavailable}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 13,
            borderRadius: 10,
            backgroundColor: isUnavailable ? c.muted : c.primary,
          }}
        >
          <ShoppingCart
            size={17}
            color={isUnavailable ? c.mutedForeground : c.primaryForeground}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: isUnavailable ? c.mutedForeground : c.primaryForeground,
            }}
          >
            {isUnavailable
              ? unavailableReason
              : product.type === "SERVICE"
                ? "Pilih jadwal"
                : "Tambah ke keranjang"}
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

function GallerySlide({
  item,
  isActive,
  c,
  productName,
}: {
  item: GalleryItem;
  isActive: boolean;
  c: any;
  productName: string;
}) {
  if (item.type === "VIDEO" && item.source === "UPLOAD") {
    return <UploadVideoSlide url={item.url} isActive={isActive} c={c} />;
  }

  if (item.type === "VIDEO" && item.source === "EMBED") {
    return <EmbedVideoSlide url={item.url} isActive={isActive} c={c} />;
  }

  if (item.url) {
    return (
      <Image
        source={
          item.url.startsWith("/default") ? defaultProduct : { uri: item.url }
        }
        style={{
          width: SCREEN_WIDTH,
          height: HERO_HEIGHT,
          backgroundColor: c.muted,
        }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: SCREEN_WIDTH,
        height: HERO_HEIGHT,
        backgroundColor: c.muted,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          borderWidth: 0.5,
          borderColor: c.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{ fontSize: 22, fontWeight: "500", color: c.mutedForeground }}
        >
          {getInitials(productName)}
        </Text>
      </View>
    </View>
  );
}

function UploadVideoSlide({
  url,
  isActive,
  c,
}: {
  url: string;
  isActive: boolean;
  c: any;
}) {
  const player = useVideoPlayer(resolveImageUrl(url), (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <VideoView
      player={player}
      style={{
        width: SCREEN_WIDTH,
        height: HERO_HEIGHT,
        backgroundColor: c.muted,
      }}
      contentFit="cover"
      nativeControls
    />
  );
}

function EmbedVideoSlide({
  url,
  isActive,
  c,
}: {
  url: string;
  isActive: boolean;
  c: any;
}) {
  const [hasBeenActive, setHasBeenActive] = useState(isActive);

  useEffect(() => {
    if (isActive) setHasBeenActive(true);
  }, [isActive]);

  if (!hasBeenActive) {
    return (
      <View
        style={{
          width: SCREEN_WIDTH,
          height: HERO_HEIGHT,
          backgroundColor: c.muted,
        }}
      />
    );
  }

  if (!isActive) {
    return (
      <View
        style={{
          width: SCREEN_WIDTH,
          height: HERO_HEIGHT,
          backgroundColor: c.muted,
        }}
      />
    );
  }

  const { kind, src } = getEmbedSrc(url);

  const injectedJavaScript =
    kind === "youtube"
      ? `
      (function() {
        var style = document.createElement('style');
        style.textContent = 'body,html{margin:0;padding:0;overflow:hidden;background:#000;} iframe{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);min-width:100%;min-height:100%;}';
        document.head.appendChild(style);
      })();
    `
      : `
      (function() {
        var style = document.createElement('style');
        style.textContent = 'body,html{margin:0;padding:0;overflow:hidden;background:#fff;}';
        document.head.appendChild(style);
      })();
    `;

  return (
    <WebView
      source={{
        uri: src,
        headers: {
          Referer: "https://customer.bossapp.id",
        },
      }}
      style={{
        width: SCREEN_WIDTH,
        height: HERO_HEIGHT,
        backgroundColor: kind === "youtube" ? "#000" : c.muted,
      }}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      domStorageEnabled
      injectedJavaScript={injectedJavaScript}
      originWhitelist={["*"]}
      allowsFullscreenVideo
      allowsProtectedMedia
      setSupportMultipleWindows={false}
      bounces={false}
      scrollEnabled={false}
      userAgent="Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    />
  );
}

function InfoCard({
  c,
  title,
  children,
}: {
  c: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        padding: 12,
        borderRadius: 12,
        backgroundColor: c.muted,
        gap: 8,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "500",
          color: c.foreground,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function InfoRow({
  c,
  icon,
  label,
  value,
}: {
  c: any;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {icon}
        <Text style={{ fontSize: 13, color: c.mutedForeground }}>{label}</Text>
      </View>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "500",
          color: c.foreground,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
