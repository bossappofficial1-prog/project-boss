'use client'

import { Home, MapPin, Receipt, ShoppingCart, User } from "lucide-react";
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
    { id: "home", href: "/", label: "Home", icon: <Home className="w-5 h-5" /> },
    { id: "nearby", href: "/nearby", label: "Nearby", icon: <MapPin className="w-5 h-5" /> },
    { id: "cart", href: "/cart", label: "Cart", icon: <ShoppingCart className="w-5 h-5" /> },
    { id: "receipt", href: "/orders", label: "Orders", icon: <Receipt className="w-5 h-5" /> },
    { id: "profile", href: "/profile", label: "Profile", icon: <User className="w-5 h-5" /> },
];

export default function BottomNav() {
    const pathname = usePathname() ?? "/";
    const mainRoutes = ['/', '/search', '/cart', '/nearby', '/profile', '/orders'];

    if (!mainRoutes.includes(pathname)) return null
    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[99] px-4 py-2 bg-background/80 backdrop-blur-lg border-t"
            ref={(el) => {
                if (!el) return;
                document.documentElement.style.setProperty('--bottomnav-height', `${Math.ceil(el.getBoundingClientRect().height)}px`);
            }}
        >
            <nav
                role="navigation"
                aria-label="Bottom Navigation"
                className="mx-auto max-w-lg flex items-center justify-between">
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
        </div>
    )
}