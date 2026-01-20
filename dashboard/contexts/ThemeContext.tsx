'use client';

import React, { createContext, useContext } from 'react';
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

  React.useEffect(() => {
    const cookieTheme = document.cookie
      .split('; ')
      .find(row => row.startsWith('theme='))
      ?.split('=')[1] as Theme | undefined;

    if (cookieTheme && cookieTheme !== theme) {
      setNextTheme(cookieTheme);
    }
  }, []); // ⬅️ hanya sekali saat mount

  const safeTheme = (theme as Theme) || 'system';
  const actualTheme =
    (safeTheme === 'system'
      ? (systemTheme as 'light' | 'dark') || 'light'
      : safeTheme) as 'light' | 'dark';

  const setTheme = (t: Theme) => {
    setNextTheme(t);

    document.cookie = `theme=${t}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem('theme', t); // ⬅️ penting
  };

  return (
    <ThemeContext.Provider value={{ theme: safeTheme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Public ThemeProvider wraps next-themes provider and keeps existing useTheme API
export function ThemeProvider({ children, defaultTheme }: { children: React.ReactNode, defaultTheme: 'light' | 'dark' | 'system'; }) {
  return (
    <NextThemeProvider attribute="class" enableSystem storageKey="theme" defaultTheme={defaultTheme}>
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