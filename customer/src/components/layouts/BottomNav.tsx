"use client"

import React from "react";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, MapPin, ShoppingCart, User } from "lucide-react";
import { NavItem } from "../shared/NavItem";
import { useFeatureGuide } from "@/hooks/useFeatureGuide";
import { GuideStep } from "@/providers/FeatureGuideProvider";
import { useLocalizedPath } from "@/hooks/useI18n";

type Menu = {
    id: string;
    href: string;
    label: string;
    icon: React.ReactNode;
    guide?: {
        title: string;
        description: string;
    };
};

const menus: Menu[] = [
    {
        id: "home",
        href: "/",
        label: "Home",
        icon: <Home className="w-5 h-5" />,
        guide: {
            title: "Mulai dari beranda",
            description:
                "Temukan promosi terbaru, rekomendasi layanan, dan akses cepat ke fitur utama langsung dari halaman ini.",
        },
    },
    {
        id: "nearby",
        href: "/nearby",
        label: "Nearby",
        icon: <MapPin className="w-5 h-5" />,
        guide: {
            title: "Cari layanan terdekat",
            description:
                "Jelajahi outlet terdekat dari lokasimu untuk memesan layanan dengan waktu tempuh yang lebih singkat.",
        },
    },
    {
        id: "cart",
        href: "/cart",
        label: "Cart",
        icon: <ShoppingCart className="w-5 h-5" />,
        guide: {
            title: "Kelola pesanan sebelum checkout",
            description:
                "Semua produk yang kamu pilih akan muncul di sini. Pastikan detailnya benar sebelum melakukan pembayaran.",
        },
    },
    {
        id: "receipt",
        href: "/orders",
        label: "Orders",
        icon: <ClipboardList className="w-5 h-5" />,
        guide: {
            title: "Pantau status transaksi",
            description:
                "Bagian ini menampilkan riwayat dan status pesanan kamu sehingga mudah mengecek progres terbaru.",
        },
    },
    {
        id: "profile",
        href: "/profile",
        label: "Profile",
        icon: <User className="w-5 h-5" />,
        guide: {
            title: "Atur preferensi akun",
            description:
                "Kelola informasi pribadi, metode pembayaran, dan pengaturan lainnya melalui menu ini.",
        },
    },
];

const bottomNavGuideSteps: GuideStep[] = [
    {
        id: "bottom-nav-overview",
        title: "Navigasi utama aplikasi",
        description:
            "Gunakan bilah ini untuk berpindah cepat antar fitur penting seperti Home, Nearby, Cart, Orders, dan Profile.",
        target: '[data-guide-target="bottom-nav-container"]',
        placement: "top",
        focusPadding: 24,
    },
    ...menus
        .filter((menu) => menu.guide)
        .map((menu) => ({
            id: `bottom-nav-${menu.id}`,
            title: menu.guide!.title,
            description: menu.guide!.description,
            target: `[data-guide-target="bottom-nav-${menu.id}"]`,
            placement: "top" as const,
            focusPadding: 20,
        })),
];

const MAIN_ROUTES = ["/", "/search", "/cart", "/nearby", "/profile", "/orders"] as const;

export default function BottomNav() {
    const pathname = usePathname() ?? "/";
    const withLocalizedPath = useLocalizedPath();

    const isMainRoute = MAIN_ROUTES.includes(pathname as (typeof MAIN_ROUTES)[number]);
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    useFeatureGuide({
        id: "bottom-nav-guide",
        steps: bottomNavGuideSteps,
        autoStart: true,
        runOnceKey: "guide:bottom-nav",
        delay: 1200,
        enabled: isMainRoute,
    });


    React.useEffect(() => {
        if (!isMainRoute) {
            document.documentElement.style.setProperty("--bottomnav-height", "0px");
        }
    }, [isMainRoute]);

    React.useLayoutEffect(() => {
        if (!isMainRoute || !containerRef.current) return;

        const updateHeight = () => {
            // Add 16px to account for the bottom-4 (16px) floating offset
            const h = Math.ceil(containerRef.current!.getBoundingClientRect().height) + 16;
            document.documentElement.style.setProperty("--bottomnav-height", `${h}px`);
        };

        const raf = requestAnimationFrame(updateHeight);
        const ro = new ResizeObserver(updateHeight);
        ro.observe(containerRef.current);

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, [isMainRoute]);

    if (!isMainRoute) return null;

    return (
        <div
            className="fixed bottom-4 left-4 right-4 z-[50] max-w-md mx-auto bg-background/90 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl px-2 py-1 flex items-center justify-center animate-in slide-in-from-bottom-5 duration-300"
            data-guide-target="bottom-nav-container"
            ref={containerRef}
        >
            <nav
                role="navigation"
                aria-label="Bottom Navigation"
                className="w-full flex items-center justify-around"
            >
                {menus.map((menu) => {
                    const isActive =
                        pathname === menu.href ||
                        (menu.href !== "/" && pathname.startsWith(menu.href));

                    return (
                        <NavItem
                            key={menu.id}
                            href={withLocalizedPath(menu.href)}
                            label={menu.label}
                            ariaLabel={menu.label}
                            highlight={isActive}
                            guideTarget={`bottom-nav-${menu.id}`}
                        >
                            {menu.icon}
                        </NavItem>
                    );
                })}
            </nav>
        </div>
    );
}