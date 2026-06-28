import { useThemeColors } from "@/src/hooks/use-theme-colors";
import type { OutletProduct } from "@/features/outlet";
import { ProductRow } from "./product-row";
import { router } from "expo-router";
import { View } from "react-native";
import { EmptyState } from "@/components/ui/empty-state";
import { ShoppingBag, Briefcase, Ticket } from "lucide-react-native";

export function ProductsScene({
  products,
  slug,
  c,
  onAddToCart,
  outletId,
  type,
}: {
  products: OutletProduct[];
  slug: string;
  c: ReturnType<typeof useThemeColors>;
  onAddToCart: (p: OutletProduct) => void;
  outletId?: string;
  type?: "GOODS" | "SERVICE" | "TICKET";
}) {
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
