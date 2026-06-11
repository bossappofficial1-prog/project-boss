"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themes = [
    {
      value: "light",
      label: "Terang",
      icon: Sun,
    },
    {
      value: "dark",
      label: "Gelap",
      icon: Moon,
    },
    {
      value: "system",
      label: "Sistem",
      icon: Monitor,
    },
  ] as const;

  const currentTheme = themes.find((t) => t.value === theme) || themes[2];
  const DisplayIcon = currentTheme.icon;

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
          "bg-background border border-border",
          "hover:bg-accent hover:text-accent-foreground",
          isOpen && "ring-2 ring-ring"
        )}
        title={`Tema: ${currentTheme.label}`}
      >
        <DisplayIcon className="w-4 h-4 text-foreground" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={cn(
              "absolute right-0 top-full mt-2 w-44 z-50",
              "bg-popover border border-border rounded-lg shadow-md",
              "p-1 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
            )}
          >
            <div className="px-2 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Pilih Tema
            </div>

            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isActive = theme === themeOption.value;

              return (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value as any);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-7 h-7 rounded-md transition-colors",
                      isActive
                        ? "bg-background shadow-xs"
                        : "bg-muted"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <span className="text-sm font-medium flex-1">
                    {themeOption.label}
                  </span>

                  {isActive && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
