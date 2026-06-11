"use client";

import { cn } from "@/lib/utils";
import {
  User,
  Shield,
  Building2,
  Palette,
  Plug,
  CreditCard,
  LucideIcon,
} from "lucide-react";

export type SettingsSection =
  | "profile"
  | "security"
  | "business"
  | "appearance"
  | "integrations"
  | "subscription";

interface SettingsNavItem {
  id: SettingsSection;
  label: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
  hidden?: boolean;
}

interface SettingsNavProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  isLocalAuth: boolean;
  hasBusiness: boolean;
}

export function SettingsNav({
  activeSection,
  onSectionChange,
  isLocalAuth,
  hasBusiness,
}: SettingsNavProps) {
  const items: SettingsNavItem[] = [
    {
      id: "profile",
      label: "Profil",
      icon: User,
      description: "Info pribadi & foto",
    },
    {
      id: "security",
      label: "Keamanan",
      icon: Shield,
      description: "Password & sesi",
      hidden: !isLocalAuth,
    },
    {
      id: "business",
      label: "Bisnis",
      icon: Building2,
      description: "Info usaha & rekening",
    },
    {
      id: "appearance",
      label: "Tampilan",
      icon: Palette,
      description: "Tema & preferensi",
    },
    {
      id: "integrations",
      label: "Integrasi",
      icon: Plug,
      description: "Google & WhatsApp",
    },
    {
      id: "subscription",
      label: "Langganan",
      icon: CreditCard,
      description: "Paket & tagihan",
    },
  ];

  const visibleItems = items.filter((item) => !item.hidden);

  return (
    <>
      {/* Desktop: vertical sidebar nav */}
      <nav className="hidden md:flex flex-col gap-1 w-56 lg:w-64 shrink-0">
        {visibleItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent",
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 mt-0.5 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium truncate",
                      isActive && "font-semibold",
                    )}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Mobile: horizontal scrollable tabs */}
      <nav className="md:hidden max-w-[92dvw] overflow-x-auto whitespace-nowrap scrollbar-none">
        <div className="flex w-max gap-1.5 px-1 pb-2">
          {visibleItems.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
