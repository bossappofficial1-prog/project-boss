import { Pressable } from "react-native";
import { Sun, Moon } from "lucide-react-native";
import { useTheme } from "@/components/ThemeProvider";
import { useThemeColors } from "@/src/hooks/use-theme-colors";

export function ThemeToggle() {
  const { colorScheme, toggleTheme } = useTheme();
  const c = useThemeColors();
  const isDark = colorScheme === "dark";

  return (
    <Pressable onPress={toggleTheme} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.muted, alignItems: "center", justifyContent: "center" }}>
      {isDark ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} color={c.mutedForeground} />}
    </Pressable>
  );
}
