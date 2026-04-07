'use client';

import React, { useEffect } from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const hasDark = root.classList.contains("dark");
    
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    
    return () => {
      const currentTheme = localStorage.getItem('theme') ?? 'system';
      if (currentTheme === 'dark' || (currentTheme === 'system' && hasDark)) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      } else {
        root.style.colorScheme = "light";
      }
    };
  }, []);

  return <>{children}</>;
}
