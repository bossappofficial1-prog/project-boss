import { useThemeColors } from "@/src/hooks/use-theme-colors";
import { Text, View } from "react-native";

export function DetailRow({
  label,
  value,
  mono,
  valueColor,
  c,
}: {
  label: string;
  value: string;
  c: ReturnType<typeof useThemeColors>;
  mono?: boolean;
  valueColor?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 13, color: c.mutedForeground }}>{label}</Text>
      <Text
        className="line-clamp-1 text-wrap max-w-[230px]"
        style={{
          fontSize: 13,
          fontWeight: "500",
          color: valueColor || c.foreground,
          fontFamily: mono ? "monospace" : undefined,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
