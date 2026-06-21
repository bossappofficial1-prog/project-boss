import { View, Text, Pressable } from "react-native";
import { UtensilsCrossed, Coffee, ShoppingBag, Sparkles, LayoutGrid, type LucideIcon } from "lucide-react-native";
import { useThemeColors } from "@/src/hooks/use-theme-colors";

interface CategoryChipProps {
  title: string;
  slug: string;
  isActive?: boolean;
  onPress?: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = { food: UtensilsCrossed, drink: Coffee, shop: ShoppingBag, service: Sparkles };

export function CategoryChip({ title, slug, isActive, onPress }: CategoryChipProps) {
  const c = useThemeColors();
  const Icon = ICON_MAP[slug] || LayoutGrid;
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center", gap: 8 }}>
      <View style={{ width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: isActive ? c.primary : c.muted }}>
        <Icon size={24} color={isActive ? c.primaryForeground : c.mutedForeground} strokeWidth={2} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: "500", color: isActive ? c.primary : c.mutedForeground }}>{title}</Text>
    </Pressable>
  );
}
