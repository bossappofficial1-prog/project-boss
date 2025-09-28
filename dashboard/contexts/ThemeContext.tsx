'use client';

import { createContext, useContext } from 'react';
import { ThemeProvider as NextThemeProvider, useTheme as useNextTheme } from 'next-themes';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Inner provider consumes next-themes' hook (must be rendered inside NextThemeProvider)
function InnerThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, systemTheme, setTheme: setNextTheme } = useNextTheme();

  // theme from next-themes can be 'light' | 'dark' | 'system' | undefined
  const safeTheme = (theme as Theme) || 'system';
  const actualTheme = (safeTheme === 'system' ? (systemTheme as 'light' | 'dark') || 'light' : safeTheme) as 'light' | 'dark';

  const setTheme = (t: Theme) => {
    // forward to next-themes setter
    setNextTheme(t);
  };

  return (
    <ThemeContext.Provider value={{ theme: safeTheme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Public ThemeProvider wraps next-themes provider and keeps existing useTheme API
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider attribute="class" enableSystem defaultTheme="system">
      <InnerThemeProvider>{children}</InnerThemeProvider>
    </NextThemeProvider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}