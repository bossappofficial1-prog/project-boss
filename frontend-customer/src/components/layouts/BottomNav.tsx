'use client'

import { Home, MapPin, Search, ShoppingCart, User } from "lucide-react";
import { NavItem } from "../shared/NavItem";
import React from "react";
import { usePathname } from "next/navigation";

type Menu = {
    id: string,
    href: string
    label: string
    icon: React.ReactNode
}

const menus: Menu[] = [
    { id: "home", href: "/", label: "Home", icon: <Home /> },
    { id: "search", href: "/search", label: "Search", icon: <Search /> },
    { id: "nearby", href: "/nearby", label: "Nearby", icon: <MapPin /> },
    { id: "cart", href: "/cart", label: "Cart", icon: <ShoppingCart /> },
    { id: "profile", href: "/profile", label: "Profile", icon: <User /> },
];

export default function BottomNav() {
    const pathname = usePathname() ?? "/";
    const mainRoutes = ['/', '/search', '/cart', '/nearby', '/profile'];

    if (!mainRoutes.includes(pathname)) return null
    return (
        <nav
            role="navigation"
            aria-label="Bottom Navigation"
            className="sticky bottom-0 z-[99] md:left-1/2 w-full max-w-lg md:bottom-4 md:rounded-full md:bg-white/80 md:dark:bg-black/60 md:backdrop-blur-md md:-translate-x-1/2 bg-white dark:bg-black shadow-lg px-4 py-2 flex items-center justify-between gap-2">
            {
                menus.map((menu) => {
                    const isActive = pathname === menu.href || (menu.href !== "/" && pathname.startsWith(menu.href))

                    return (
                        <NavItem
                            key={menu.id}
                            href={menu.href}
                            label={menu.label}
                            ariaLabel={menu.label}
                            highlight={isActive}
                        >
                            {menu.icon}
                        </NavItem>
                    )
                })
            }
        </nav>
    )
}