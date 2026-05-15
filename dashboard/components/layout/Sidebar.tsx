"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useUserData } from "@/hooks/useUserData";
import { useOutletContext } from "@/components/providers/OutletProvider";
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
import { MENU_GROUPS } from "./sidebar/sidebar";
import { OutletSelector } from "./sidebar/OutletSelector";
import { ChevronDown, ChevronRight, Settings } from "lucide-react";
import { InstantLink } from "../ui/instant-link";

export default function AppSidebar() {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    {},
  );
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const {
    selectedOutlet = null,
    outlets = [],
    isLoading: outletLoading = true,
    setSelectedOutlet = () => console.warn("setSelectedOutlet not available"),
  } = (() => {
    try {
      return useOutletContext();
    } catch {
      if (typeof window !== "undefined") {
        const oldSavedOutlet = localStorage.getItem("selectedOutletId");

        if (oldSavedOutlet) {
          try {
            const parsed = JSON.parse(oldSavedOutlet);
            if (parsed?.id) {
              localStorage.setItem("selectedOutlet", parsed.id);
              localStorage.removeItem("selectedOutletId");
              return {
                selectedOutlet: parsed,
                outlets: [parsed],
                isLoading: false,
                setSelectedOutlet: () => { },
              };
            }
          } catch {
            if (oldSavedOutlet) {
              localStorage.setItem("selectedOutlet", oldSavedOutlet);
              localStorage.removeItem("selectedOutletId");
            }
          }
        }
      }
      return {
        selectedOutlet: null,
        outlets: [],
        isLoading: true,
        setSelectedOutlet: () => { },
      };
    }
  })();

  const { data: userData, isLoading, error, refetch } = useUserData();
  const hasProAccess = ["TRIAL", "PRO", "ENTERPRISE"].includes(
    userData?.business?.subscriptionPlan?.toUpperCase() || "BASIC"
  );

  // Auto-expand menu if a sub-item is active
  useEffect(() => {
    if (isCollapsed) return;

    const newExpandedMenus: Record<string, boolean> = {};

    MENU_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        if (item.subItems) {
          const hasActiveSubItem = item.subItems.some(
            (subItem) => pathname === subItem.href,
          );
          if (hasActiveSubItem) {
            newExpandedMenus[item.id] = true;
          }
        }
      });
    });

    setExpandedMenus((prev) => ({ ...prev, ...newExpandedMenus }));
  }, [pathname, isCollapsed]);

  const router = useRouter();

  // Prefetch on hover for better performance (lazy prefetch)
  const handlePrefetch = useCallback((href: string) => {
    if (!href || typeof window === "undefined") return;
    try {
      router.prefetch(href);
    } catch {
      // Prefetch failures are non-blocking
    }
  }, [router]);

  const handleOutletChange = useCallback(
    (outletId: string) => {
      const outlet = outlets.find((o) => o.id === outletId);
      if (outlet && setSelectedOutlet) {
        setSelectedOutlet(outlet);
      }
    },
    [outlets, setSelectedOutlet],
  );

  const toggleMenu = useCallback((menuId: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  }, []);

  const filteredMenuGroups = useMemo(() => {
    if (!selectedOutlet) return MENU_GROUPS;

    return MENU_GROUPS.map((group) => ({
      ...group,
      items: group.items
        .map((item) => {
          const clonedItem = { ...item };
          if (clonedItem.requirePro && !hasProAccess) {
            clonedItem.badge = "PRO";
          }
          return clonedItem;
        }) // Clone item to avoid mutating original MENU_GROUPS
        .filter((item) => {
          // Check if item itself is allowed
          const itemAllowed =
            !item.requiredTypes ||
            item.requiredTypes.includes(selectedOutlet.type);
          if (!itemAllowed) return false;

          // If it has subitems, filter them too
          if (item.subItems) {
            const originalSubItems = [...item.subItems];
            const filteredSubItems = originalSubItems.filter(
              (sub) =>
                !sub.requiredTypes ||
                sub.requiredTypes.includes(selectedOutlet.type),
            ).map((sub) => {
              const clonedSub = { ...sub };
              if (clonedSub.requirePro && !hasProAccess) {
                clonedSub.badge = "PRO";
              }
              return clonedSub;
            });

            // If all subitems are filtered out, don't show the parent either
            if (filteredSubItems.length === 0) return false;

            // Note: we're creating a shallow copy with filtered subitems
            item.subItems = filteredSubItems;
          }

          return true;
        }),
    })).filter((group) => group.items.length > 0);
  }, [selectedOutlet, hasProAccess]);
  const isHrefActive = useCallback(
    (href?: string) => {
      if (!href) return false;
      if (href === "/owner")
        return pathname === href || pathname === "/owner/dashboard";
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <span className="text-lg font-bold">B</span>
            </div>
          ) : (
            <div className="relative h-14 w-36">
              <Image
                src="/Logo Boss.png"
                alt="BOSS Logo"
                fill
                sizes="144px"
                className="object-contain"
                unoptimized
                priority
              />
            </div>
          )}
        </div>

        {/* Outlet Selector */}
        <div className="mt-4">
          {!isCollapsed && (
            <label className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase text-muted-foreground">
              <span>Outlet</span>
              {outlets.length > 0 && (
                <Badge
                  variant="secondary"
                  className="rounded-sm bg-sidebar-accent px-2 py-0.5 text-xs text-sidebar-accent-foreground"
                >
                  {outlets.length}
                </Badge>
              )}
            </label>
          )}
          <OutletSelector
            selectedOutlet={selectedOutlet}
            outlets={outlets}
            isLoading={isLoading || outletLoading}
            error={error}
            onOutletChange={handleOutletChange}
            onRefetch={refetch}
          />
        </div>
      </SidebarHeader>

      {/* Navigation Content */}
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
                              className="z-[100] w-56 rounded-lg border-sidebar-border bg-popover p-1 text-popover-foreground shadow-xl"
                            >
                              <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">
                                {item.name}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="mx-1 mb-1" />
                              {item.subItems.map((subItem) => {
                                const isSubActive = isHrefActive(subItem.href);
                                return (
                                  <DropdownMenuItem key={subItem.href} asChild>
                                    <InstantLink
                                      href={subItem.href}
                                      onMouseEnter={() =>
                                        handlePrefetch(subItem.href)
                                      }
                                      className={cn(
                                        "cursor-pointer flex items-center w-full px-2 py-1.5 text-sm rounded-md outline-none transition-colors",
                                        isSubActive
                                          ? "bg-primary/10 text-primary font-medium"
                                          : "hover:bg-sidebar-accent focus:bg-sidebar-accent",
                                      )}
                                    >
                                      <span>{subItem.name}</span>
                                      {subItem.badge && (
                                        <Badge
                                          variant="secondary"
                                          className="ml-auto rounded-sm px-1.5 py-0 text-[10px]"
                                        >
                                          {subItem.badge}
                                        </Badge>
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

                    // --- JIKA TIDAK COLLAPSED: Render standard Collapsible ---
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
                                      className={cn(
                                        "h-9",
                                        isSubActive
                                          ? "bg-primary/10 text-primary hover:bg-primary/10"
                                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                      )}
                                    >
                                      <InstantLink
                                        href={subItem.href}
                                        onMouseEnter={() =>
                                          handlePrefetch(subItem.href)
                                        }
                                      >
                                        <span>{subItem.name}</span>
                                        {subItem.badge && (
                                          <Badge
                                            variant="secondary"
                                            className="ml-auto text-xs"
                                          >
                                            {subItem.badge}
                                          </Badge>
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

                  // Regular menu item (no subitems)
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
                                  ? "bg-primary/10 text-primary shadow-sm hover:bg-primary/10"
                                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              )}
                            >
                              <InstantLink
                                href={item.href!}
                                onMouseEnter={() => handlePrefetch(item.href!)}
                              >
                                {isActive && (
                                  <span className="absolute left-0 top-2 h-7 w-1 rounded-r-full bg-primary" />
                                )}
                                <Icon className="h-5 w-5" />
                                <span className="flex-1">{item.name}</span>
                                {item.badge && !isCollapsed && (
                                  <Badge
                                    variant="secondary"
                                    className="rounded-sm text-xs"
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                                {isActive && !isCollapsed && (
                                  <ChevronRight className="h-4 w-4 opacity-70" />
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

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border bg-sidebar p-3">
        <div>
          {isCollapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InstantLink
                    href="/owner/settings"
                    className="flex h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <Settings className="h-4 w-4" />
                  </InstantLink>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Pengaturan</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <InstantLink
              href="/owner/settings"
              className="flex h-11 items-center gap-3 rounded-lg bg-sidebar-accent px-3 text-sm font-medium text-sidebar-accent-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Settings className="h-4 w-4" />
              <span className="flex-1">Pengaturan</span>
              <span className="text-xs text-muted-foreground">v1.0</span>
            </InstantLink>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
