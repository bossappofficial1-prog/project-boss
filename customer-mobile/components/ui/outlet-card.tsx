import type { HomeOutletSummary } from "@/features/home";
import { useThemeColors } from "@/src/hooks/use-theme-colors";
import defaultOutlet from "@assets/images/default-outlet.webp";
import { MapPin } from "lucide-react-native";
import { Image, Pressable, Text, View } from "react-native";

interface OutletCardProps {
  outlet: HomeOutletSummary;
  onPress?: () => void;
}

export function OutletCard({ outlet, onPress }: OutletCardProps) {
  const c = useThemeColors();
  const isBreak = outlet.isBreak === true;
  const isOpen = outlet.isOpen === true && outlet.isBreak !== true;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 200,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.cardBorder,
      }}
    >
      <View style={{ position: "relative" }}>
        <Image
          source={
            outlet.image?.startsWith("/defaults")
              ? defaultOutlet
              : { uri: outlet.image }
          }
          style={{ width: "100%", height: 110, backgroundColor: c.skeleton }}
          resizeMode="cover"
        />
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            paddingVertical: 3,
            paddingHorizontal: 8,
            borderRadius: 10,
            backgroundColor: isBreak
              ? "orange"
              : isOpen
                ? c.success
                : c.destructive,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "600", color: "#ffffff" }}>
            {isBreak ? "Istirahat" : isOpen ? "Buka" : "Tutup"}
          </Text>
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: c.foreground,
            marginBottom: 4,
          }}
          numberOfLines={1}
        >
          {outlet.name}
        </Text>
        {outlet.address && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginBottom: 4,
            }}
          >
            <MapPin size={11} color={c.mutedForeground} />
            <Text
              style={{ fontSize: 11, color: c.mutedForeground }}
              numberOfLines={1}
            >
              {outlet.address}
            </Text>
          </View>
        )}
        {outlet._count?.orders != null && outlet._count.orders > 0 && (
          <Text style={{ fontSize: 11, color: c.primary, fontWeight: "500" }}>
            {outlet._count.orders}+ pesanan
          </Text>
        )}
      </View>
    </Pressable>
  );
}
