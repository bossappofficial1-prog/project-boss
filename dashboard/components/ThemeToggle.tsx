"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const { theme, setTheme, actualTheme } = useTheme();
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
      color: "text-orange-500",
    },
    {
      value: "dark",
      label: "Gelap",
      icon: Moon,
      color: "text-indigo-400",
    },
    {
      value: "system",
      label: "Sistem",
      icon: Monitor,
      color: "text-slate-400",
    },
  ] as const;

  const currentTheme = themes.find((t) => t.value === theme) || themes[2];
  const DisplayIcon = currentTheme.icon;

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
    );
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
          "bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700",
          "hover:border-red-500/50 dark:hover:border-red-500/50 hover:shadow-md hover:shadow-red-500/5",
          isOpen && "ring-2 ring-red-500/20 border-red-500",
        )}
        title={`Tema saat ini: ${currentTheme.label}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DisplayIcon
              size={20}
              className={cn("transition-colors", currentTheme.color)}
            />
          </motion.div>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10, x: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={cn(
                "absolute right-0 top-full mt-3 w-48 z-50 overflow-hidden",
                "bg-white dark:bg-gray-900 backdrop-blur-xl",
                "border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20",
                "p-1.5",
              )}
            >
              <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">
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
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group/item",
                      isActive
                        ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                        isActive
                          ? "bg-white dark:bg-gray-900 shadow-sm"
                          : "bg-gray-50 dark:bg-gray-800 group-hover/item:bg-white dark:group-hover/item:bg-gray-700",
                      )}
                    >
                      <Icon
                        size={16}
                        className={cn(
                          isActive
                            ? themeOption.color
                            : "text-gray-400 group-hover/item:text-gray-600 dark:group-hover/item:text-gray-300",
                        )}
                      />
                    </div>

                    <span className="text-sm font-medium flex-1">
                      {themeOption.label}
                    </span>

                    {isActive && (
                      <motion.div
                        layoutId="active-check"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      >
                        <Check size={16} className="text-red-500" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
