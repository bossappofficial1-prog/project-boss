import { View, Text, Pressable } from "react-native";
import { useThemeColors } from "@/src/hooks/use-theme-colors";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, subtitle, action, onAction }: SectionHeaderProps) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", color: c.foreground }}>{title}</Text>
        {subtitle && <Text style={{ fontSize: 12, color: c.mutedForeground, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {action && onAction && (
        <Pressable onPress={onAction}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: c.primary }}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
