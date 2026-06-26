import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { Text, View } from "react-native";

export function SectionLabel({
  label,
  count,
  c,
}: {
  label: string;
  count: number;
  c: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 2,
        marginBottom: 6,
      }}
    >
      <Text
        style={{ fontSize: 12, fontWeight: "600", color: c.mutedForeground }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: 11, color: c.mutedForeground }}>
        {count} pesanan
      </Text>
    </View>
  );
}
