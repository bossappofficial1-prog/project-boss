import { useMemo } from "react";
import { useTheme } from "@/components/ThemeProvider";

export function useThemeColors() {
  const { colors, colorScheme } = useTheme();

  return useMemo(() => ({
    ...colors,
    // Convenience colors for common patterns
    cardBorder: colorScheme === "dark" ? "#262626" : "#e5e5e5",
    skeleton: colorScheme === "dark" ? "#262626" : "#f5f5f5",
    divider: colorScheme === "dark" ? "#262626" : "#f5f5f5",
    topBar: {
      bg: colorScheme === "dark" ? "#171717" : "#ffffff",
      border: colorScheme === "dark" ? "#262626" : "#f0f0f0",
    },
    tab: {
      bg: colorScheme === "dark" ? "#171717" : "#ffffff",
      border: colorScheme === "dark" ? "#262626" : "#e5e5e5",
    },
    search: {
      bg: colorScheme === "dark" ? "#262626" : "#f5f5f5",
    },
    section: {
      bg: colorScheme === "dark" ? "#171717" : "#ffffff",
    },
    quickAction: {
      bg: colorScheme === "dark" ? "#171717" : "#fafafa",
    },
  }), [colors, colorScheme]);
}
