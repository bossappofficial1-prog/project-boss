"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, LogOut, Sparkles } from "lucide-react"

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
    SidebarMenuSubButton,
    SidebarMenuSubItem
} from "@/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { sidebarData } from "@/config/sidebar"
import { useAuth } from "@/hooks/useAuth"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    // Hook untuk mendapatkan URL saat ini guna menentukan menu aktif
    const pathname = usePathname()
    const { user } = useAuth()

    // Helper function untuk cek apakah URL aktif
    const isActive = (url: string) => {
        return pathname === url || pathname.startsWith(`${url}/`)
    }

    return (
        <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar" {...props}>
            {/* --- HEADER / LOGO --- */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                            <Link href="/admin/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-secondary text-primary-foreground ring-2 ring-primary/20">
                                    <img src={'/icon-192x192.png'} className="size-5" />
                                </div>
                                <div className="grid flex-1 text-left leading-tight">
                                    <span className="truncate font-bold text-foreground">BOSS Platform</span>
                                    <span className="truncate text-xs text-muted-foreground">Enterprise</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* --- MAIN CONTENT --- */}
            <SidebarContent>
                {sidebarData.sections.map((section) => (
                    <SidebarGroup key={section.label}>
                        <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {section.items.map((item) => {
                                    // Cek apakah item memiliki submenu
                                    const hasChildren = item.items && item.items.length > 0
                                    // Cek apakah parent aktif (jika salah satu child aktif)
                                    const isChildActive = hasChildren && item.items?.some((child) => isActive(child.url))
                                    // State aktif untuk item biasa
                                    const isItemActive = !hasChildren && isActive(item.url)

                                    return hasChildren ? (
                                        <Collapsible
                                            key={item.title}
                                            asChild
                                            defaultOpen={isChildActive}
                                            className="group/collapsible"
                                        >
                                            <SidebarMenuItem>
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton
                                                        tooltip={item.title}
                                                        isActive={isChildActive}
                                                        className="data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium"
                                                    >
                                                        {item.icon && <item.icon />}
                                                        <span>{item.title}</span>
                                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {item.items?.map((subItem) => (
                                                            <SidebarMenuSubItem key={subItem.title}>
                                                                <SidebarMenuSubButton
                                                                    asChild
                                                                    isActive={isActive(subItem.url)}
                                                                    className="hover:bg-sidebar-accent/50 active:bg-sidebar-accent transition-colors"
                                                                >
                                                                    <Link href={subItem.url}>
                                                                        <span>{subItem.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </SidebarMenuItem>
                                        </Collapsible>
                                    ) : (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isItemActive}
                                                tooltip={item.title}
                                                className="transition-all duration-200 ease-in-out hover:translate-x-1"
                                            >
                                                <Link href={item.url}>
                                                    {item.icon && <item.icon />}
                                                    <span>{item.title}</span>
                                                    {item.badge && (
                                                        <SidebarMenuBadge className="bg-primary/10 text-primary font-medium border border-primary/20">
                                                            {item.badge}
                                                        </SidebarMenuBadge>
                                                    )}
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            {/* --- FOOTER / USER PROFILE --- */}
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg border border-border/50">
                                        <AvatarImage src={`/icon.ico`} alt={user?.name} />
                                        <AvatarFallback className="rounded-lg font-bold bg-primary/10 text-primary">
                                            {user?.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left leading-tight">
                                        <span className="truncate font-semibold">{user?.name || '...'}</span>
                                        <span className="truncate text-xs text-muted-foreground">{user?.email || '...'}</span>
                                    </div>
                                    <ChevronRight className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <LogOut className="mr-2 size-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}