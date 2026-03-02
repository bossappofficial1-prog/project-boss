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

    const pathSegments = pathname.split('/').filter(Boolean);
    const pathWithoutLocale = ["id", "en"].includes(pathSegments[0] || "")
        ? `/${pathSegments.slice(1).join('/')}` || "/"
        : pathname;

    const isMainRoute = MAIN_ROUTES.includes(pathWithoutLocale as (typeof MAIN_ROUTES)[number]);
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
            const h = Math.ceil(containerRef.current!.getBoundingClientRect().height);
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
            className="fixed bottom-0 left-0 right-0 z-[99] px-4 py-2 bg-background/80 backdrop-blur-lg border-t"
            data-guide-target="bottom-nav-container"
            ref={containerRef}
        >
            <nav
                role="navigation"
                aria-label="Bottom Navigation"
                className="mx-auto flex max-w-lg items-center justify-between"
            >
                {menus.map((menu) => {
                    const isActive =
                        pathWithoutLocale === menu.href ||
                        (menu.href !== "/" && pathWithoutLocale.startsWith(menu.href));

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