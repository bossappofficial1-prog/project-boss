import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useRNColorScheme } from "react-native";
import { colors, type ThemeColors } from "@/lib/colors";

type ColorScheme = "light" | "dark";

interface ThemeContextValue {
  colorScheme: ColorScheme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: "light",
  colors: colors.light,
  toggleTheme: () => {},
  setColorScheme: () => {},
});

const THEME_KEY = "app-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [manualScheme, setManualScheme] = useState<ColorScheme | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === "light" || val === "dark") {
        setManualScheme(val);
      }
    });
  }, []);

  const colorScheme = manualScheme || (systemScheme === "dark" ? "dark" : "light");
  const themeColors = colors[colorScheme];

  const toggleTheme = () => {
    const next = colorScheme === "dark" ? "light" : "dark";
    setManualScheme(next);
    AsyncStorage.setItem(THEME_KEY, next);
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setManualScheme(scheme);
    AsyncStorage.setItem(THEME_KEY, scheme);
  };

  const value = useMemo(
    () => ({ colorScheme, colors: themeColors, toggleTheme, setColorScheme }),
    [colorScheme, themeColors, toggleTheme, setColorScheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { useTheme as useThemeContext };
