"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Home, Search, Phone, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// Fallback translations for 404 page (tidak memerlukan context provider)
const translations = {
    id: {
        title: "Oops! Halaman Hilang",
        subtitle: "Sepertinya halaman yang Anda cari telah berpetualang ke dimensi lain.",
        description: "Jangan khawatir, mari kita bawa Anda kembali ke jalur yang benar! ✨",
        buttons: {
            back: "Kembali",
            home: "Beranda",
            search: "Cari Layanan",
            contact: "Butuh bantuan?"
        },
        footer: "Error 404 • Halaman tidak ditemukan",
        theme: {
            light: "Tema Terang",
            dark: "Tema Gelap"
        }
    },
    en: {
        title: "Oops! Page Not Found",
        subtitle: "It seems the page you're looking for has ventured into another dimension.",
        description: "Don't worry, let's get you back on the right track! ✨",
        buttons: {
            back: "Go Back",
            home: "Home",
            search: "Search Services",
            contact: "Need help?"
        },
        footer: "Error 404 • Page not found",
        theme: {
            light: "Light Theme",
            dark: "Dark Theme"
        }
    }
};

// Simple function to get current locale from cookies or browser
function getCurrentLocale(): 'id' | 'en' {
    if (typeof window !== 'undefined') {
        // Get locale from cookies
        const cookies = document.cookie.split(';');
        const localeCookie = cookies.find(cookie =>
            cookie.trim().startsWith('locale=') || cookie.trim().startsWith('NEXT_LOCALE=')
        );

        if (localeCookie) {
            const cookieValue = localeCookie.split('=')[1]?.trim();
            if (cookieValue === 'en' || cookieValue === 'id') {
                return cookieValue;
            }
        }

        // Fallback to browser language
        const browserLang = navigator.language.toLowerCase();
        return browserLang.startsWith('id') ? 'id' : 'en';
    }
    return 'id'; // Default fallback
}

export default function NotFound() {
    const router = useRouter();
    const { theme, setTheme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [locale, setLocale] = useState<'id' | 'en'>('id');
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });

    // Get current translations
    const t = translations[locale];

    // Avoid hydration mismatch by rendering theme-toggle only on client after mount
    useEffect(() => {
        setMounted(true);
        setLocale(getCurrentLocale());
    }, []);

    // Mouse tracking for interactive elements (desktop)
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches[0]) {
                setTouchPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, []);

    const currentTheme = theme === "system" ? systemTheme : theme;

    // Use touch position on mobile, mouse position on desktop
    const interactivePosition = touchPosition.x > 0 ? touchPosition : mousePosition;

    return (
        <main className="min-h-screen flex items-center justify-center relative overflow-hidden touch-manipulation bg-gradient-to-br from-gray-50 via-white to-red-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-red-950/20">
            {/* Dynamic gradient background with touch/mouse interaction */}
            <div
                className="absolute inset-0 transition-all duration-1000 ease-out opacity-50"
                style={{
                    background: `radial-gradient(circle at ${interactivePosition.x}px ${interactivePosition.y}px, 
            rgba(239, 68, 68, 0.08) 0%, 
            rgba(220, 38, 38, 0.05) 25%, 
            rgba(185, 28, 28, 0.02) 50%, 
            transparent 70%)`,
                }}
            />

            {/* Enhanced theme toggle - mobile optimized */}
            {mounted && (
                <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-10">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full w-10 sm:w-12 h-10 sm:h-12 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 border border-gray-200/50 dark:border-gray-600/50 shadow-lg transition-all duration-300 active:scale-95 sm:hover:scale-110 group touch-manipulation"
                        onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
                        title={currentTheme === "dark" ? t.theme.light : t.theme.dark}
                    >
                        {currentTheme === "dark" ?
                            <Sun className="w-5 h-5 text-yellow-500 group-hover:rotate-180 group-active:rotate-90 transition-transform duration-500" /> :
                            <Moon className="w-5 h-5 text-slate-600 group-hover:-rotate-12 group-active:-rotate-6 transition-transform duration-300" />
                        }
                    </Button>
                </div>
            )}

            <div className="w-full max-w-md sm:max-w-lg mx-auto relative z-10 px-6 text-center">
                {/* 404 Illustration Area */}
                <div className="mb-8 sm:mb-12 relative">
                    {/* Main 404 Circle with Icon */}
                    <div className="relative inline-flex items-center justify-center w-48 sm:w-64 h-48 sm:h-64 mx-auto group">
                        {/* Background Blur Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-100 via-rose-100 to-pink-100 dark:from-red-900/30 dark:via-rose-900/30 dark:to-pink-900/30 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                        {/* Main Circle */}
                        <div className="relative w-32 sm:w-40 h-32 sm:h-40 bg-gradient-to-br from-red-400 via-rose-400 to-pink-400 dark:from-red-500 dark:via-rose-500 dark:to-pink-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/50 dark:border-gray-800/50 group-hover:scale-105 transition-transform duration-300">
                            <div className="text-4xl sm:text-5xl font-black text-white drop-shadow-lg">
                                404
                            </div>
                        </div>

                        {/* Floating Decorative Elements */}
                        <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full animate-bounce shadow-lg"
                            style={{ animationDelay: '0s', animationDuration: '2s' }} />
                        <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-br from-rose-400 to-pink-400 rounded-full animate-bounce shadow-lg"
                            style={{ animationDelay: '0.7s', animationDuration: '2.5s' }} />
                        <div className="absolute top-1/2 -right-8 w-4 h-4 bg-gradient-to-br from-red-400 to-rose-400 rounded-full animate-pulse shadow-lg" />
                        <div className="absolute top-1/4 -left-8 w-3 h-3 bg-gradient-to-br from-pink-400 to-red-400 rounded-full animate-pulse shadow-lg"
                            style={{ animationDelay: '1s' }} />
                    </div>
                </div>

                {/* Typography Section */}
                <div className="mb-8 sm:mb-10 space-y-4 sm:space-y-6">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-gray-800 via-red-700 to-rose-700 dark:from-gray-200 dark:via-red-300 dark:to-rose-300 bg-clip-text text-transparent leading-tight">
                        {t.title}
                    </h1>
                    <div className="space-y-3 sm:space-y-4">
                        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium max-w-lg mx-auto">
                            {t.subtitle}
                        </p>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
                            {t.description}
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4 sm:space-y-5 mb-8">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Button
                            onClick={() => router.back()}
                            variant="outline"
                            className="flex-1 group relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 hover:border-red-400 dark:hover:border-red-500 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] sm:hover:-translate-y-1 text-base font-semibold touch-manipulation"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 group-active:-translate-x-0.5 transition-transform duration-300" />
                            {t.buttons.back}
                        </Button>

                        <Button
                            onClick={() => router.push('/')}
                            size="default"
                            className="flex-1 group relative overflow-hidden bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 hover:from-red-600 hover:via-rose-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl hover:shadow-red-500/25 transition-all duration-300 transform active:scale-[0.98] sm:hover:-translate-y-1 sm:hover:scale-[1.02] text-base font-bold touch-manipulation"
                        >
                            <Home className="w-5 h-5 mr-2 group-hover:scale-110 group-active:scale-105 transition-transform duration-300" />
                            {t.buttons.home}
                        </Button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 pt-2">
                        <Button asChild variant="ghost" className="group text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-950/30 active:bg-red-100 dark:active:bg-red-950/50 touch-manipulation">
                            <Link href="/search" className="flex items-center gap-2 py-2 px-4 rounded-lg">
                                <Search className="w-4 h-4 group-hover:scale-110 group-active:scale-105 transition-transform duration-300" />
                                <span className="text-sm font-medium">{t.buttons.search}</span>
                            </Link>
                        </Button>

                        <div className="hidden sm:block w-px h-5 bg-gray-300 dark:bg-gray-600" />

                        <Button
                            variant="ghost"
                            className="group text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 transition-all duration-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 active:bg-rose-100 dark:active:bg-rose-950/50 py-2 px-4 rounded-lg h-auto touch-manipulation"
                            onClick={() => router.push('/contact')}
                        >
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 group-hover:scale-110 group-active:scale-105 transition-transform duration-300" />
                                <span className="text-sm font-medium">{t.buttons.contact}</span>
                            </div>
                        </Button>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2 opacity-70 hover:opacity-100 transition-opacity duration-300">
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
                    <span>{t.footer}</span>
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
            </div>
        </main>
    );
}

