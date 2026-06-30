import type { OutletProduct } from "@/features/outlet";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { mapProduct } from "@/src/lib/utils";
import { useCartStore } from "@/src/stores/cart.store";
import defaultProduct from "@assets/images/default-product.png";
import { Plus } from "lucide-react-native";
import { useMemo } from "react";
import { Image, Pressable, Text, View } from "react-native";

export function ProductRow({
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

  const mapped = mapProduct[product.type];
  const Icon = mapped.icon;

  // Logika Ketersediaan
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

  const isUnavailable =
    product.status !== "ACTIVE" || isOutOfStock || isTicketSoldOut;

  const canAddToCart = !isUnavailable;

  return (
    <Pressable
      onPress={onPress}
      disabled={isUnavailable}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 12,
        backgroundColor: c.card,
        opacity: isUnavailable ? 0.6 : 1,
      }}
    >
      <View style={{ flexDirection: "row", flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              numberOfLines={2}
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: c.foreground,
                lineHeight: 18,
              }}
            >
              {product.name}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Icon size={12} color={c.mutedForeground} />
                <Text
                  style={{
                    marginLeft: 4,
                    fontSize: 11,
                    color: c.mutedForeground,
                  }}
                >
                  {mapped.label}
                </Text>
              </View>

              {product.type === "GOODS" &&
                product.goods?.currentStock != null &&
                !isUnavailable && (
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                      backgroundColor: c.muted,
                    }}
                  >
                    <Text style={{ fontSize: 10, color: c.foreground }}>
                      Sisa {product.goods.currentStock}
                    </Text>
                  </View>
                )}
            </View>
          </View>

          <View
            style={{
              marginTop: 8,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: c.primary,
                }}
              >
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(price)}
              </Text>

              {cartQty > 0 && (
                <Text
                  style={{
                    marginTop: 2,
                    fontSize: 11,
                    color: c.primary,
                    fontWeight: "600",
                  }}
                >
                  {cartQty} di keranjang
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Kolom Gambar + Tombol/Badge (overlay di atas gambar) */}
        <View
          style={{
            width: 76,
            height: 76,
            marginLeft: 12,
          }}
        >
          <Image
            source={
              product.image
                ? product.image.startsWith("/default")
                  ? defaultProduct
                  : { uri: product.image }
                : defaultProduct
            }
            blurRadius={isUnavailable ? 10 : 0}
            style={{
              width: 76,
              height: 76,
              borderRadius: 10,
              backgroundColor: c.muted,
            }}
          />

          {/* Area Tombol atau Badge Habis, menempel di bagian bawah gambar */}
          {canAddToCart && onAddToCart ? (
            <Pressable
              onPress={onAddToCart}
              style={{
                position: "absolute",
                bottom: -6,
                left: 4,
                right: 4,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 8,
                height: 24,
                borderRadius: 16,
                backgroundColor: c.primary,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Plus size={14} color={c.primaryForeground} />
              <Text
                style={{
                  marginLeft: 4,
                  fontSize: 12,
                  fontWeight: "600",
                  color: c.primaryForeground,
                }}
              >
                Add
              </Text>
            </Pressable>
          ) : isUnavailable ? (
            <View
              style={{
                position: "absolute",
                bottom: 25,
                left: 4,
                right: 4,
                height: 24,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: c.accentForeground,
                }}
              >
                HABIS
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
