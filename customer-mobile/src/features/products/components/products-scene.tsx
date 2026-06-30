import { EmptyState } from "@/components/ui/empty-state";
import type { OutletProduct } from "@/features/outlet";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { router } from "expo-router";
import { Briefcase, ShoppingBag, Ticket } from "lucide-react-native";
import { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from "react-native";
import { ProductRow } from "./product-row";

export function ProductsScene({
  products,
  slug,
  c,
  onAddToCart,
  outletId,
  type,
  onEndReached,
  isLoadingMore,
}: {
  products: OutletProduct[];
  slug: string;
  c: ReturnType<typeof useThemeColors>;
  onAddToCart: (p: OutletProduct) => void;
  outletId?: string;
  type?: "GOODS" | "SERVICE" | "TICKET";
  onEndReached?: () => void;
  isLoadingMore?: boolean;
}) {
  const loadMoreRef = useRef(false);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      if (distanceFromBottom < 120 && !loadMoreRef.current && onEndReached) {
        loadMoreRef.current = true;
        onEndReached();
      }
      if (distanceFromBottom > 200) {
        loadMoreRef.current = false;
      }
    },
    [onEndReached],
  );

  if (products.length === 0) {
    const emptyTitle =
      type === "GOODS"
        ? "Belum ada barang"
        : type === "SERVICE"
          ? "Belum ada jasa/layanan"
          : type === "TICKET"
            ? "Belum ada tiket"
            : "Belum ada produk";

    const emptyDesc =
      type === "GOODS"
        ? "Outlet ini belum mengunggah barang dagangan."
        : type === "SERVICE"
          ? "Outlet ini belum menyediakan jasa atau layanan."
          : type === "TICKET"
            ? "Belum ada tiket acara atau promo yang tersedia."
            : "Tidak ada produk yang sesuai dengan kategori ini.";

    const Icon =
      type === "GOODS"
        ? ShoppingBag
        : type === "SERVICE"
          ? Briefcase
          : type === "TICKET"
            ? Ticket
            : ShoppingBag;

    return (
      <EmptyState
        icon={Icon}
        title={emptyTitle}
        description={emptyDesc}
        transparent
      />
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {products.map((item, index) => (
        <View key={item.id}>
          <ProductRow
            product={item}
            onPress={() => router.push(`/outlet/${slug}/product/${item.id}`)}
            onAddToCart={() => onAddToCart(item)}
            outletId={outletId}
          />
          {index < products.length - 1 && (
            <View style={{ height: 0.5, backgroundColor: c.border }} />
          )}
        </View>
      ))}
      {isLoadingMore && (
        <View style={{ paddingVertical: 16, alignItems: "center" }}>
          <ActivityIndicator size="small" color={c.primary} />
        </View>
      )}
    </ScrollView>
  );
}
