'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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

import { cn } from '@/lib/utils';
import { MENU_GROUPS } from './sidebar/sidebar';
import { OutletSelector } from './sidebar/OutletSelector';
import { ChevronDown, ChevronRight, Zap } from 'lucide-react';

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
        const savedOutletId = localStorage.getItem('selectedOutlet');
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

  const handleOutletChange = (outletId: string) => {
    const outlet = outlets.find((o) => o.id === outletId);
    if (outlet && setSelectedOutlet) {
      setSelectedOutlet(outlet);
    }
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

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
        {MENU_GROUPS.map((group, groupIndex) => (
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

                  // Dropdown menu item
                  if (item.subItems) {
                    const isExpanded = expandedMenus[item.id];

                    return (
                      <Collapsible
                        key={item.id}
                        open={isExpanded && !isCollapsed}
                        onOpenChange={() => !isCollapsed && toggleMenu(item.id)}
                      >
                        <SidebarMenuItem>
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <CollapsibleTrigger asChild>
                                  <SidebarMenuButton
                                    className={cn(
                                      'group h-11',
                                      (hasActiveSubItem || isExpanded) && !isCollapsed
                                        ? 'bg-white/15 text-white hover:bg-white/20'
                                        : 'text-red-100 hover:bg-white/10 hover:text-white'
                                    )}
                                  >
                                    <Icon className="w-5 h-5" />
                                    <span className="flex-1">{item.name}</span>
                                    {!isCollapsed && (
                                      <ChevronDown
                                        className={cn(
                                          'w-4 h-4 transition-transform',
                                          isExpanded && 'rotate-180'
                                        )}
                                      />
                                    )}
                                  </SidebarMenuButton>
                                </CollapsibleTrigger>
                              </TooltipTrigger>
                              {isCollapsed && (
                                <TooltipContent side="right">
                                  <p>{item.name}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>

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
                                      <Link href={subItem.href}>
                                        <span>{subItem.name}</span>
                                        {subItem.badge && (
                                          <Badge variant="secondary" className="ml-auto text-xs">
                                            {subItem.badge}
                                          </Badge>
                                        )}
                                      </Link>
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

                  // Regular menu item
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
                              <Link href={item.href!}>
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
                              </Link>
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
                  <div className="flex items-center justify-center w-full h-10 text-red-100 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <Zap className="w-4 h-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>BOSS Dashboard v1.0</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex items-center justify-center gap-2 text-red-100 bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-medium">BOSS Dashboard v1.0</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}