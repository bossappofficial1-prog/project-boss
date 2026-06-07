'use client'

import React from 'react'
import {
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub
} from '@/components/ui/sidebar'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type Item = {
    id: string
    label: string
    href?: string
    icon?: LucideIcon | React.ComponentType<any>
    badge?: string
    children?: Item[]
}

export function SidebarItem({
    item,
    children,
    isCollapsed,
    isExpanded,
    onToggle,
    onSelect,
    isActive
}: {
    item: Item
    children?: React.ReactNode
    isCollapsed: boolean
    isExpanded: boolean
    onToggle: () => void
    onSelect: () => void
    isActive: boolean
}) {
    const Icon = item.icon as any
    const hasChildren = !!item.children?.length

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors",
                    isActive
                        ? "bg-muted text-foreground"
                        : "hover:bg-muted/50 text-foreground/80"
                )}
                onClick={() => {
                    if (hasChildren) onToggle()
                    else onSelect()
                }}
            >
                <div className="flex items-center gap-3 flex-1">
                    {Icon && <Icon className="size-5 shrink-0" />}
                    <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {item.badge}
                    </span>
                )}

                {!isCollapsed && hasChildren && (
                    isExpanded
                        ? <ChevronDown className="size-4 opacity-70" />
                        : <ChevronRight className="size-4 opacity-70" />
                )}
            </SidebarMenuButton>


            {hasChildren && !isCollapsed && isExpanded && (
                <SidebarMenuSub className="pl-1 transition-all duration-150 ease-in">
                    {item.children!.map(child => (
                        <SidebarMenuItem key={child.id}>
                            <SidebarMenuButton
                                tooltip={child.label}
                                isActive={false}
                                onClick={() => {
                                    if (child.href) {
                                        // parent handles push via onSelect; this callback only triggers if the parent wired it
                                        // but keep for fallback
                                        window.location.href = child.href
                                    }
                                }}
                                className="pl-6 gap-2"
                                size="sm"
                            >
                                <span className="truncate text-sm">{child.label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenuSub>
            )}

            {children}
        </SidebarMenuItem>
    )
}
