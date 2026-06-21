import type { HomePopularItem } from "@/features/home";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import defaultProduct from "@assets/images/default-product.png";
import { Package } from "lucide-react-native";
import { Image, Pressable, Text, View } from "react-native";

interface ProductCardProps {
  item: HomePopularItem;
  rank?: number;
  onPress?: () => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatSold(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}rb`;
  return `${count} terjual`;
}

export function ProductCard({ item, rank, onPress }: ProductCardProps) {
  const c = useThemeColors();
  const isTop3 = rank != null && rank <= 3;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
      }}
    >
      {rank != null && (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isTop3 ? c.primary : c.muted,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: isTop3 ? c.primaryForeground : c.mutedForeground,
            }}
          >
            {rank}
          </Text>
        </View>
      )}
      <Image
        source={
          item.image?.startsWith("/") ? defaultProduct : { uri: item.image }
        }
        style={{
          width: 56,
          height: 56,
          borderRadius: 10,
          backgroundColor: c.skeleton,
        }}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 14, fontWeight: "500", color: c.foreground }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginTop: 3,
          }}
        >
          <Package size={12} color={c.mutedForeground} />
          <Text style={{ fontSize: 12, color: c.mutedForeground }}>
            {formatSold(item.soldCount)}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 14, fontWeight: "700", color: c.primary }}>
        {formatPrice(item.price)}
      </Text>
    </Pressable>
  );
}
