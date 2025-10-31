'use client'

import React from "react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    useSidebar
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import {
    BarChart3,
    Calendar,
    ChevronDown,
    ChevronRight,
    FileText,
    Folder,
    HelpCircle,
    Home,
    LayoutDashboard,
    LogOut,
    Mail,
    Settings,
    User,
    Users
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export function AdminSidebar() {
    type SidebarItem = {
        id: string
        label: string
        icon?: LucideIcon
        badge?: string
        children?: SidebarItem[]
    }

    type SidebarSection = {
        label: string
        items: SidebarItem[]
    }

    const sidebarSections: SidebarSection[] = [
        {
            label: "Main Menu",
            items: [
                { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                { id: "home", label: "Home", icon: Home },
                { id: "analytics", label: "Analytics", icon: BarChart3, badge: "New" },
                { id: "messages", label: "Messages", icon: Mail, badge: "12" },
            ],
        },
        {
            label: "Workspace",
            items: [
                {
                    id: "projects",
                    label: "Projects",
                    icon: Folder,
                    children: [
                        { id: "p1", label: "Website Redesign" },
                        { id: "p2", label: "Mobile App" },
                        { id: "p3", label: "Marketing Campaign" },
                    ],
                },
                { id: "docs", label: "Documents", icon: FileText },
                { id: "calendar", label: "Calendar", icon: Calendar },
                { id: "team", label: "Team", icon: Users },
            ],
        },
        {
            label: "Settings",
            items: [
                { id: "settings", label: "Settings", icon: Settings },
                { id: "help", label: "Help & Support", icon: HelpCircle },
            ],
        },
    ]

    const [activeItem, setActiveItem] = React.useState("dashboard")
    const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>(() =>
        Object.fromEntries(
            sidebarSections
                .flatMap((section) => section.items)
                .filter((item) => item.children?.length)
                .map((item) => [item.id, true])
        )
    )
    const { state } = useSidebar()
    const isCollapsed = state === "collapsed"

    const handleSelect = (id: string) => {
        setActiveItem(id)
    }

    const toggleItem = (id: string) => {
        setExpandedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }))
    }

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
            <SidebarHeader className="px-3 py-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            disabled
                            className="h-auto cursor-default select-none gap-3 px-2 py-1.5 text-base font-semibold text-sidebar-foreground"
                        >
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <span>A</span>
                            </div>
                            <div className="min-w-0 space-y-0.5 text-left group-data-[collapsible=icon]:hidden">
                                <span className="block truncate text-sm font-semibold">Acme Corp</span>
                                <span className="block truncate text-xs text-muted-foreground">Enterprise Plan</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {sidebarSections.map((section) => (
                    <SidebarGroup key={section.label}>
                        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                            {section.label}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {section.items.map((item) => {
                                    const Icon = item.icon
                                    const hasChildren = Boolean(item.children?.length)
                                    const isExpanded = expandedItems[item.id]
                                    const isParentActive = activeItem === item.id
                                    const isAnyChildActive = item.children?.some((child) => child.id === activeItem)

                                    return (
                                        <SidebarMenuItem key={item.id}>
                                            <SidebarMenuButton
                                                tooltip={item.label}
                                                isActive={isParentActive || isAnyChildActive}
                                                onClick={() => {
                                                    if (hasChildren) {
                                                        toggleItem(item.id)
                                                    } else {
                                                        handleSelect(item.id)
                                                    }
                                                }}
                                                className="gap-3"
                                                data-state={hasChildren ? (isExpanded ? "open" : "closed") : undefined}
                                                aria-expanded={hasChildren ? isExpanded : undefined}
                                            >
                                                {Icon ? <Icon className="size-5" /> : null}
                                                <span className="flex-1 truncate text-sm font-medium group-data-[collapsible=icon]:hidden">
                                                    {item.label}
                                                </span>
                                                {item.badge && (
                                                    <SidebarMenuBadge className="bg-sidebar-accent text-sidebar-accent-foreground">
                                                        {item.badge}
                                                    </SidebarMenuBadge>
                                                )}
                                                {hasChildren && !isCollapsed && (
                                                    isExpanded ? (
                                                        <ChevronDown className="size-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronRight className="size-4 text-muted-foreground" />
                                                    )
                                                )}
                                            </SidebarMenuButton>
                                            {hasChildren && !isCollapsed && isExpanded && (
                                                <SidebarMenuSub>
                                                    {item.children?.map((child) => {
                                                        const ChildIcon = child.icon
                                                        return (
                                                            <SidebarMenuItem key={child.id}>
                                                                <SidebarMenuButton
                                                                    tooltip={child.label}
                                                                    isActive={activeItem === child.id}
                                                                    onClick={() => handleSelect(child.id)}
                                                                    className={cn("pl-6", ChildIcon ? "gap-2" : undefined)}
                                                                    size="sm"
                                                                >
                                                                    {ChildIcon ? <ChildIcon className="size-4" /> : null}
                                                                    <span className="truncate text-sm">{child.label}</span>
                                                                </SidebarMenuButton>
                                                            </SidebarMenuItem>
                                                        )
                                                    })}
                                                </SidebarMenuSub>
                                            )}
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border px-3 py-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="gap-3" tooltip="Account">
                            <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                                <User className="size-4" />
                            </div>
                            <div className="min-w-0 text-left group-data-[collapsible=icon]:hidden">
                                <p className="truncate text-sm font-medium">John Doe</p>
                                <p className="truncate text-xs text-muted-foreground">john@example.com</p>
                            </div>
                            <LogOut className="size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}