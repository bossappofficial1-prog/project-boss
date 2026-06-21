import { View, Text } from "react-native";
import { useThemeColors } from "@/src/hooks/use-theme-colors";

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  const c = useThemeColors();
  return (
    <View style={{ marginHorizontal: 16, padding: 24, alignItems: "center", borderWidth: 1, borderStyle: "dashed", borderColor: c.border, borderRadius: 12 }}>
      <Text style={{ fontSize: 14, fontWeight: "500", color: c.foreground, textAlign: "center" }}>{title}</Text>
      {description && <Text style={{ fontSize: 12, color: c.mutedForeground, textAlign: "center", marginTop: 4 }}>{description}</Text>}
    </View>
  );
}
