import { View, Text, Pressable } from "react-native";
import type { HomePromo } from "@/features/home";
import { useThemeColors } from "@/src/hooks/use-theme-colors";

interface PromoCardProps {
  promo: HomePromo;
  onPress?: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function PromoCard({ promo, onPress }: PromoCardProps) {
  const c = useThemeColors();
  const isPercent = promo.type === "PERCENTAGE";
  const discountText = isPercent ? `${promo.value}%` : formatCurrency(promo.value);

  return (
    <Pressable onPress={onPress} style={{ width: 220, borderRadius: 14, overflow: "hidden", backgroundColor: c.card, borderWidth: 1, borderColor: c.cardBorder }}>
      <View style={{ padding: 14, backgroundColor: c.primary }}>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: "600", letterSpacing: 1 }}>PROMO</Text>
        <Text style={{ color: "#ffffff", fontSize: 28, fontWeight: "800", marginTop: 4 }}>{discountText}</Text>
      </View>
      <View style={{ padding: 12 }}>
        <View style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, backgroundColor: c.muted, alignSelf: "flex-start", marginBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: c.primary, fontFamily: "monospace" }}>{promo.code}</Text>
        </View>
        {promo.description && <Text style={{ fontSize: 12, color: c.mutedForeground }} numberOfLines={2}>{promo.description}</Text>}
        {promo.minPurchaseAmount != null && promo.minPurchaseAmount > 0 && (
          <Text style={{ fontSize: 11, color: c.mutedForeground, marginTop: 6 }}>Min. belanja {formatCurrency(promo.minPurchaseAmount)}</Text>
        )}
        <Text style={{ fontSize: 11, color: c.mutedForeground, marginTop: 4 }}>{formatDate(promo.validFrom)} – {formatDate(promo.validUntil)}</Text>
      </View>
    </Pressable>
  );
}
