"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { Search, ShoppingCart } from "lucide-react";

const navItems = [
    { name: "Home", href: "/" },
    { name: "Profile", href: "/profile" },
    { name: "Settings", href: "/settings" },
];

export function AppBar() {
    const pathname = usePathname();
    const router = useRouter();
    const { getTotalItems } = useCart();
    const totalCartItems = getTotalItems();

    // Handle search navigation
    const handleSearch = (query: string) => {
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
            <div className="container flex h-16 items-center justify-between gap-4">

                {/* Brand / Logo */}
                <Link href="/" className="text-xl font-bold">
                    MyApp
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex gap-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`text-sm font-medium transition-colors hover:text-primary ${pathname === item.href ? "text-primary" : "text-muted-foreground"
                                }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Mobile Search Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden"
                        onClick={() => router.push('/search')}
                    >
                        <Search className="h-4 w-4" />
                    </Button>

                    {/* Cart Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="relative"
                        onClick={() => router.push('/cart')}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        {totalCartItems > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs">
                                {totalCartItems > 99 ? '99+' : totalCartItems}
                            </Badge>
                        )}
                    </Button>

                    <Button size="sm">Login</Button>
                </div>
            </div>
        </header>
    );
}
