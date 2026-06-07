"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";
import { MENU_GROUPS, getDynamicMenuName } from "@/features/owner/layout/sidebar/sidebar";
import { ChevronDown, LogOut } from "lucide-react";
import { InstantLink } from "@/components/ui/instant-link";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import { apiClient } from "@/lib/apis/base";

export default function ManagerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    {},
  );

  const { data: cashierData } = useQuery({
    queryKey: ["cashier-auth"],
    queryFn: () => authApi.cashierMe(),
    staleTime: 5 * 60_000,
  });

  const privileges = cashierData?.privileges || [];
  const outletData = cashierData?.outlet;

  const subscriptionPlan = outletData?.business?.subscriptionPlan || "BASIC";
  const hasProAccess = ["TRIAL", "PRO", "ENTERPRISE"].includes(
    subscriptionPlan.toUpperCase(),
  );

  // Mapping menu item ID to backend privilege names
  const privilegeMap = useMemo<Record<string, string>>(
    () => ({
      "business-analytics": "ANALYTICS",
      "dashboard-outlet": "OUTLET_MANAGEMENT",
      "kelola-outlet": "OUTLET_MANAGEMENT",
      "kelola-staff": "OUTLET_MANAGEMENT",
      "transfer-outlet": "OUTLET_MANAGEMENT",
      "stock-transfer": "STOCK_MANAGEMENT",
      "kelola-meja": "OUTLET_MANAGEMENT",
      reservations: "OUTLET_MANAGEMENT",
      products: "PRODUCT_MANAGEMENT",
      stock: "STOCK_MANAGEMENT",
      suppliers: "STOCK_MANAGEMENT",
      ingredients: "INGREDIENT_MANAGEMENT",
      recipes: "RECIPE_MANAGEMENT",
      customers: "CUSTOMER_MANAGEMENT",
      loyalty: "CUSTOMER_MANAGEMENT",
      orders: "ORDER_MANAGEMENT",
      "booking-calendar": "SERVICE_MANAGEMENT",
      "booking-list": "SERVICE_MANAGEMENT",
      reports: "FINANCE_REPORTS",
      "cashier-shifts": "FINANCE_REPORTS",
       expenses: "FINANCE_REPORTS",
      "laporan-absensi": "ATTENDANCE_MANAGEMENT",
      transactions: "TRANSACTION_VIEW",
      "profit-per-product": "ANALYTICS",
      "business-health": "ANALYTICS",
      "jam-ramai": "ANALYTICS",
      "laporan-laba-rugi": "ANALYTICS",
      "calculator-hpp": "TOOLS_CALCULATOR",
      "calculator-bep": "TOOLS_CALCULATOR",
      "sales-target-breakdown": "TOOLS_CALCULATOR",
    }),
    [],
  );

  const mapHref = useCallback((href?: string) => {
    if (!href) return undefined;
    if (href === "/owner") return "/manager/outlets";
    return href.replace(/^\/owner\//, "/manager/");
  }, []);

  const isAllowed = useCallback(
    (itemId: string) => {
      if (itemId === "overview" || itemId === "dashboard-outlet") return true; // Overview & Dashboard Outlet are always allowed as landing page
      const requiredPriv = privilegeMap[itemId];
      if (!requiredPriv) return false;
      return privileges.some((p: any) => {
        const privName = p.privilege || p;
        return privName === requiredPriv;
      });
    },
    [privileges, privilegeMap],
  );

  // Auto-expand menu if a sub-item is active
  useEffect(() => {
    if (isCollapsed || !outletData) return;

    const newExpandedMenus: Record<string, boolean> = {};

    MENU_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        if (item.subItems) {
          const hasActiveSubItem = item.subItems.some(
            (subItem) => pathname === mapHref(subItem.href),
          );
          if (hasActiveSubItem) {
            newExpandedMenus[item.id] = true;
          }
        }
      });
    });

    setExpandedMenus((prev) => ({ ...prev, ...newExpandedMenus }));
  }, [pathname, isCollapsed, outletData, mapHref]);

  const handlePrefetch = useCallback(
    (href: string) => {
      if (!href || typeof window === "undefined") return;
      try {
        router.prefetch(href);
      } catch {}
    },
    [router],
  );

  const toggleMenu = useCallback((menuId: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  }, []);

  const handleLogoutConfirm = async () => {
    try {
      setLogoutLoading(true);
      const res = await apiClient.post("/auth/logout");
      if (res.status === 200) {
        try {
          sessionStorage.removeItem("cashier-auth-cache-v1");
        } catch {}
        window.location.href = "/auth/login/cashier";
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const filteredMenuGroups = useMemo(() => {
    if (!outletData) return [];

    return MENU_GROUPS.filter((group) => {
      // Check if group itself is allowed for this outlet type
      return !group.showOn || group.showOn.includes(outletData.type);
    })
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) => {
            // Explicitly filter out subscription settings/billing
            if (item.id === "subscription") return false;

            // Explicitly filter out overview/ringkasan for managers
            if (item.id === "overview") return false;

            // Check if item type is supported by this outlet
            const itemAllowed =
              !item.requiredTypes ||
              item.requiredTypes.includes(outletData.type);
            if (!itemAllowed) return false;

            // Check manager privileges
            return isAllowed(item.id);
          })
          .map((item) => {
            const clonedItem = { ...item };
            clonedItem.href = mapHref(item.href) || "";
            if (clonedItem.id === "products") {
              clonedItem.name = getDynamicMenuName(outletData.type);
            }

            if (clonedItem.requirePro && !hasProAccess) {
              clonedItem.badge = "PRO";
            }

            if (item.subItems) {
              clonedItem.subItems = item.subItems
                .filter(
                  (sub) =>
                    !sub.requiredTypes ||
                    sub.requiredTypes.includes(outletData.type),
                )
                .map((sub) => {
                  const clonedSub = { ...sub };
                  clonedSub.href = mapHref(sub.href) || "";
                  if (clonedSub.requirePro && !hasProAccess) {
                    clonedSub.badge = "PRO";
                  }
                  return clonedSub;
                });
            }

            return clonedItem;
          })
          .filter((item) => {
            // If all subitems are filtered out, don't show the parent
            if (item.subItems && item.subItems.length === 0) return false;
            return true;
          }),
      }))
      .filter((group) => group.items.length > 0);
  }, [outletData, isAllowed, mapHref, hasProAccess]);

  const isHrefActive = useCallback(
    (href?: string) => {
      if (!href) return false;
      if (href === "/manager/outlets") {
        return pathname === href;
      }
      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname],
  );

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar px-3 py-4">
        <div className="flex items-center justify-center">
          {isCollapsed ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground">
              <Image
                src="/mstile-150x150.png"
                alt="BOSS Logo"
                width={40}
                height={40}
                sizes="40px"
                priority
              />
            </div>
          ) : (
            <div className="flex flex-col items-center py-2">
              <div className="relative h-10 w-28">
                <Image
                  src="/boss-icon-light.png"
                  alt="BOSS Logo"
                  fill
                  sizes="112px"
                  className="dark:hidden object-contain"
                  priority
                />
                <Image
                  src="/boss-icon-dark.png"
                  alt="BOSS Logo"
                  fill
                  sizes="112px"
                  className="hidden dark:block object-contain"
                  priority
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-1">
                MANAGER AREA
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Dynamic Navigation Content */}
      <SidebarContent>
        {filteredMenuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{!isCollapsed && group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isHrefActive(item.href);
                  const hasActiveSubItem = item.subItems?.some((subItem) =>
                    isHrefActive(subItem.href),
                  );

                  // Dropdown/Collapsible menu item for items with subItems
                  if (item.subItems) {
                    const isExpanded = expandedMenus[item.id];

                    if (isCollapsed) {
                      return (
                        <SidebarMenuItem key={item.id}>
                          <DropdownMenu>
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                      className={cn(
                                        "group relative h-11 rounded-lg text-sidebar-foreground",
                                        hasActiveSubItem
                                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                      )}
                                    >
                                      <Icon className="h-5 w-5" />
                                      <span className="flex-1">
                                        {item.name}
                                      </span>
                                    </SidebarMenuButton>
                                  </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p>{item.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <DropdownMenuContent
                              side="right"
                              align="start"
                              sideOffset={16}
                              className="z-100 w-56 rounded-lg border-sidebar-border bg-popover p-1 text-popover-foreground shadow-xl"
                            >
                              <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">
                                {item.name}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="mx-1 mb-1" />
                              {item.subItems.map((subItem) => {
                                const isSubActive = isHrefActive(subItem.href);
                                return (
                                  <DropdownMenuItem
                                    key={subItem.href}
                                    asChild
                                    disabled={subItem.disabled}
                                  >
                                    <InstantLink
                                      href={
                                        subItem.disabled ? "#" : subItem.href
                                      }
                                      onMouseEnter={() =>
                                        !subItem.disabled &&
                                        handlePrefetch(subItem.href)
                                      }
                                      className={cn(
                                        "cursor-pointer flex items-center w-full px-2 py-1.5 text-sm rounded-md outline-none transition-colors",
                                        isSubActive
                                          ? "bg-primary/10 text-primary font-medium"
                                          : "hover:bg-sidebar-accent focus:bg-sidebar-accent",
                                        subItem.disabled &&
                                          "opacity-50 pointer-events-none",
                                      )}
                                    >
                                      <span>{subItem.name}</span>
                                      {subItem.disabled ? (
                                        <Badge
                                          variant="outline"
                                          className="ml-auto rounded-sm px-1 py-0 text-[8px] uppercase tracking-tighter border-muted-foreground/30 text-muted-foreground"
                                        >
                                          Soon
                                        </Badge>
                                      ) : (
                                        subItem.badge && (
                                          <Badge
                                            variant="secondary"
                                            className="ml-auto rounded-sm px-1.5 py-0 text-[10px]"
                                          >
                                            {subItem.badge}
                                          </Badge>
                                        )
                                      )}
                                    </InstantLink>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <Collapsible
                        key={item.id}
                        open={isExpanded}
                        onOpenChange={() => toggleMenu(item.id)}
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              className={cn(
                                "group relative h-11 rounded-lg text-sidebar-foreground",
                                hasActiveSubItem || isExpanded
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              )}
                            >
                              {hasActiveSubItem && (
                                <span className="absolute left-0 top-2 h-7 w-1 rounded-r-full bg-primary" />
                              )}
                              <Icon className="h-5 w-5" />
                              <span className="flex-1">{item.name}</span>
                              <ChevronDown
                                className={cn(
                                  "w-4 h-4 transition-transform",
                                  isExpanded && "rotate-180",
                                )}
                              />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <SidebarMenuSub className="ml-4 border-l border-sidebar-border pl-2">
                              {item.subItems.map((subItem) => {
                                const isSubActive = isHrefActive(subItem.href);
                                return (
                                  <SidebarMenuSubItem key={subItem.href}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isSubActive}
                                      aria-disabled={subItem.disabled}
                                      className={cn(
                                        "h-9",
                                        isSubActive
                                          ? "bg-primary/10 text-primary hover:bg-primary/10"
                                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                        subItem.disabled && "opacity-50",
                                      )}
                                    >
                                      <InstantLink
                                        href={
                                          subItem.disabled ? "#" : subItem.href
                                        }
                                        onMouseEnter={() =>
                                          !subItem.disabled &&
                                          handlePrefetch(subItem.href)
                                        }
                                        className={
                                          subItem.disabled
                                            ? "pointer-events-none"
                                            : ""
                                        }
                                      >
                                        <span>{subItem.name}</span>
                                        {subItem.disabled ? (
                                          <Badge
                                            variant="outline"
                                            className="ml-auto rounded-sm px-1 py-0 text-[8px] uppercase tracking-tighter border-muted-foreground/30 text-muted-foreground"
                                          >
                                            Soon
                                          </Badge>
                                        ) : (
                                          subItem.badge && (
                                            <Badge
                                              variant="secondary"
                                              className="ml-auto rounded-sm px-1.5 py-0 text-[10px]"
                                            >
                                              {subItem.badge}
                                            </Badge>
                                          )
                                        )}
                                      </InstantLink>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  // Standard menu item without subItems
                  return (
                    <SidebarMenuItem key={item.id}>
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className={cn(
                                "group relative h-11 rounded-lg text-sidebar-foreground",
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              )}
                            >
                              <InstantLink
                                href={item.href || "#"}
                                onMouseEnter={() =>
                                  item.href && handlePrefetch(item.href)
                                }
                              >
                                {isActive && (
                                  <span className="absolute left-0 top-2 h-7 w-1 rounded-r-full bg-primary" />
                                )}
                                <Icon className="h-5 w-5" />
                                {!isCollapsed && (
                                  <span className="flex-1">{item.name}</span>
                                )}
                                {!isCollapsed && item.badge && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-auto rounded-sm px-1.5 py-0 text-[10px]"
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                              </InstantLink>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          {isCollapsed && (
                            <TooltipContent side="right">
                              <p>{item.name}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Sidebar Footer with Logout & Outlet Info */}
      <SidebarFooter className="border-t border-sidebar-border bg-sidebar p-3">
        {!isCollapsed && outletData && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-muted/40 border border-border/40">
            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
              Outlet Aktif
            </span>
            <p className="text-xs font-bold text-foreground truncate mt-0.5">
              {outletData.name}
            </p>
          </div>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Keluar"
              onClick={() => setShowLogoutModal(true)}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Keluar</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Logout Confirmation */}
      <ConfirmationModal
        open={showLogoutModal}
        onOpenChange={setShowLogoutModal}
        title="Konfirmasi Keluar"
        description="Apakah Anda yakin ingin keluar dari akun manager Anda? Anda akan diarahkan ke halaman login kasir."
        confirmText={logoutLoading ? "Loading..." : "Keluar"}
        cancelText="Batal"
        confirmVariant="destructive"
        onConfirm={handleLogoutConfirm}
        confirmDisabled={logoutLoading}
        icon={<LogOut className="h-6 w-6 text-red-600" />}
      />
    </Sidebar>
  );
}
