'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';
import { useOutletContext } from '@/components/providers/OutletProvider';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { cn } from '@/lib/utils';
import { MENU_GROUPS } from './sidebar/sidebar';
import { OutletSelector } from './sidebar/OutletSelector';
import { ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { InstantLink } from '../ui/instant-link';

export default function AppSidebar() {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const {
    selectedOutlet = null,
    outlets = [],
    isLoading: outletLoading = true,
    setSelectedOutlet = () => console.warn('setSelectedOutlet not available'),
  } = (() => {
    try {
      return useOutletContext();
    } catch {
      if (typeof window !== 'undefined') {
        const oldSavedOutlet = localStorage.getItem('selectedOutletId');

        if (oldSavedOutlet) {
          try {
            const parsed = JSON.parse(oldSavedOutlet);
            if (parsed?.id) {
              localStorage.setItem('selectedOutlet', parsed.id);
              localStorage.removeItem('selectedOutletId');
              return {
                selectedOutlet: parsed,
                outlets: [parsed],
                isLoading: false,
                setSelectedOutlet: () => { },
              };
            }
          } catch {
            if (oldSavedOutlet) {
              localStorage.setItem('selectedOutlet', oldSavedOutlet);
              localStorage.removeItem('selectedOutletId');
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

  // Auto-expand menu if a sub-item is active
  useEffect(() => {
    if (isCollapsed) return;

    const newExpandedMenus: Record<string, boolean> = {};

    MENU_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        if (item.subItems) {
          const hasActiveSubItem = item.subItems.some(
            (subItem) => pathname === subItem.href
          );
          if (hasActiveSubItem) {
            newExpandedMenus[item.id] = true;
          }
        }
      });
    });

    setExpandedMenus((prev) => ({ ...prev, ...newExpandedMenus }));
  }, [pathname, isCollapsed]);

  // Prefetch on hover for better performance (lazy prefetch)
  const handlePrefetch = useCallback((href: string) => {
    if (typeof window === 'undefined') return;
    try {
      // Next.js router.prefetch is available through Link component
      // but we don't need aggressive prefetch anymore since we have instant nav
      // This is just a fallback for slower connections
    } catch {
      // Prefetch failures are non-blocking (e.g., offline); safe to ignore
    }
  }, []);

  const handleOutletChange = useCallback((outletId: string) => {
    const outlet = outlets.find((o) => o.id === outletId);
    if (outlet && setSelectedOutlet) {
      setSelectedOutlet(outlet);
    }
  }, [outlets, setSelectedOutlet]);

  const toggleMenu = useCallback((menuId: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  }, []);

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-red-500/20 bg-gradient-to-b from-red-700 to-red-800 dark:from-red-800 dark:to-red-900">
        <div className="flex items-center justify-center py-4 px-2">
          {isCollapsed ? (
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-red-700 font-bold text-lg">B</span>
            </div>
          ) : (
            <Image
              src="/Logo Boss Putih.png"
              alt="BOSS Logo"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          )}
        </div>

        {/* Outlet Selector */}
        <div className="px-2 pb-4">
          {!isCollapsed && (
            <label className="flex items-center justify-between text-xs font-semibold text-red-100 mb-2 uppercase tracking-wide px-1">
              <span>Outlet</span>
              {outlets.length > 0 && (
                <Badge variant="secondary" className="bg-white/20 text-white text-xs px-2 py-0.5">
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
      <SidebarContent className="bg-gradient-to-b from-red-800 to-red-900 dark:from-red-900 dark:to-red-950">
        {MENU_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-red-200 dark:text-red-200 uppercase text-xs font-semibold tracking-wider">
              {!isCollapsed && group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  const hasActiveSubItem = item.subItems?.some(
                    (subItem) => pathname === subItem.href
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
                                        'group h-11',
                                        hasActiveSubItem
                                          ? 'bg-white/15 text-white hover:bg-white/20'
                                          : 'text-red-100 hover:bg-white/10 hover:text-white'
                                      )}
                                    >
                                      <Icon className="w-5 h-5" />
                                      <span className="flex-1">{item.name}</span>
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
                              className="w-48 bg-gradient-to-b from-red-800 to-red-900 border-red-700/50 text-red-100 shadow-xl rounded-xl p-1 z-[100]"
                            >
                              <DropdownMenuLabel className="text-white px-2 py-1.5 text-sm font-semibold">
                                {item.name}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-red-700/50 mx-1 mb-1" />
                              {item.subItems.map((subItem) => {
                                const isSubActive = pathname === subItem.href;
                                return (
                                  <DropdownMenuItem key={subItem.href} asChild>
                                    <InstantLink
                                      href={subItem.href}
                                      onMouseEnter={() => handlePrefetch(subItem.href)}
                                      className={cn(
                                        "cursor-pointer flex items-center w-full px-2 py-1.5 text-sm rounded-md outline-none transition-colors",
                                        isSubActive
                                          ? "bg-white text-red-700 font-medium"
                                          : "hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white"
                                      )}
                                    >
                                      <span>{subItem.name}</span>
                                      {subItem.badge && (
                                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 bg-red-950/40 text-white border-none">
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
                                'group h-11',
                                (hasActiveSubItem || isExpanded)
                                  ? 'bg-white/15 text-white hover:bg-white/20'
                                  : 'text-red-100 hover:bg-white/10 hover:text-white'
                              )}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="flex-1">{item.name}</span>
                              <ChevronDown
                                className={cn(
                                  'w-4 h-4 transition-transform',
                                  isExpanded && 'rotate-180'
                                )}
                              />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <SidebarMenuSub className="ml-4 border-l-2 border-white/20">
                              {item.subItems.map((subItem) => {
                                const isSubActive = pathname === subItem.href;
                                return (
                                  <SidebarMenuSubItem key={subItem.href}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isSubActive}
                                      className={cn(
                                        'h-9',
                                        isSubActive
                                          ? 'bg-white dark:bg-red-700/60 text-red-600 dark:text-white hover:bg-white dark:hover:bg-red-700/70'
                                          : 'text-red-100 hover:bg-white/10 hover:text-white'
                                      )}
                                    >
                                      <InstantLink
                                        href={subItem.href}
                                        onMouseEnter={() => handlePrefetch(subItem.href)}
                                      >
                                        <span>{subItem.name}</span>
                                        {subItem.badge && (
                                          <Badge variant="secondary" className="ml-auto text-xs">
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
                                'group h-11',
                                isActive
                                  ? 'bg-white dark:bg-red-700/60 text-red-600 dark:text-white hover:bg-white dark:hover:bg-red-700/70'
                                  : 'text-red-100 hover:bg-white/10 hover:text-white'
                              )}
                            >
                              <InstantLink href={item.href!} onMouseEnter={() => handlePrefetch(item.href!)}
                              >
                                <Icon className="w-5 h-5" />
                                <span className="flex-1">{item.name}</span>
                                {item.badge && !isCollapsed && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.badge}
                                  </Badge>
                                )}
                                {isActive && !isCollapsed && (
                                  <ChevronRight className="w-4 h-4 opacity-60" />
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
      <SidebarFooter className="border-t border-red-500/20 bg-gradient-to-b from-red-900 to-red-950">
        <div className="p-2">
          {isCollapsed ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center w-full h-10 text-red-100 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                    <Zap className="w-4 h-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>BOSS Dashboard v1.0</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex items-center justify-center gap-2 text-red-100 bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-medium">BOSS Dashboard v1.0</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}