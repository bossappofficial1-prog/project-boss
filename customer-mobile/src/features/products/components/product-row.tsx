import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { useCartStore } from "@/src/stores/cart.store";
import { mapProduct } from "@/src/lib/utils";
import defaultProduct from "@assets/images/default-product.png";
import type { OutletProduct } from "@/features/outlet";
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
        paddingVertical: 10,
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
            width: 50,
            height: 50,
            borderRadius: 8,
            backgroundColor: c.muted,
          }}
          resizeMode="cover"
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{ fontSize: 13, fontWeight: "500", color: c.foreground }}
            numberOfLines={1}
          >
            {product.name}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon color={c.mutedForeground} size={14} />
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
        <Text style={{ fontSize: 13, fontWeight: "600", color: c.primary, marginRight: 4 }}>
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
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: c.primary,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
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
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: c.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={16} color={c.primaryForeground} strokeWidth={3} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
