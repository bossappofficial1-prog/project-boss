"use client";

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Menu, Search, MoreVertical, X, Sun, Moon, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Search as SearchComponent, SearchInput, SearchDropdown } from "./search";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STORAGE_PROFILE_KEY } from "@/constants";

type AppBarVariant = "default" | "transparent";

export type AppBarProps = {
    // Content props
    title?: string;
    subtitle?: string;

    // Left side props
    showBackButton?: boolean;
    leftIcon?: ReactNode;
    onLeftClick?: () => void;

    // Right side props
    rightContent?: ReactNode;
    showSearch?: boolean;
    showMenu?: boolean;
    onSearchClick?: () => void;
    onSearch?: (query: string) => void;
    onMenuClick?: () => void;
    searchValue?: string;
    showThemeToggle?: boolean;

    // Styling props
    variant?: AppBarVariant;
    className?: string;
    centerTitle?: boolean;

    // Behavior props
    sticky?: boolean;
    elevation?: boolean;
};

export default function AppBar({
    title,
    subtitle,
    showBackButton = true,
    leftIcon,
    onLeftClick,
    rightContent,
    showSearch = false,
    showMenu = false,
    showThemeToggle = true,
    onSearchClick,
    onSearch,
    onMenuClick,
    variant = "default",
    className = "",
    centerTitle = false,
    sticky = true,
    searchValue = "",
    elevation = true,
}: AppBarProps) {
    const ref = useRef<HTMLElement | null>(null);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const searchParams = useSearchParams()
    const query = searchParams.get("q")
    const [searchValues, setSearchValue] = useState(query || "")
    const router = useRouter()
    const pathname = usePathname()

    // keep internal value in sync when URL param changes
    useEffect(() => {
        setSearchValue(query || "")
    }, [query])

    const handleSearchValueChange = useCallback((value: string) => {
        setSearchValue(value)
    }, [])

    const submitSearch = useCallback((value: string) => {
        const trimmed = value.trim()
        const params = new URLSearchParams(searchParams?.toString() || '')
        if (trimmed) params.set('q', trimmed)
        else params.delete('q')

        const dest = params.toString() ? `${pathname}?${params.toString()}` : pathname || '/'
        router.replace(dest)
    }, [router, pathname])

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const setVar = () => {
            const h = el.getBoundingClientRect().height;
            document.documentElement.style.setProperty('--appbar-height', `${Math.ceil(h)}px`);
        };
        setVar();
        const ro = new ResizeObserver(setVar);
        ro.observe(el);
        return () => {
            ro.disconnect();
            document.documentElement.style.setProperty('--appbar-height', '0px');
        };
    }, []);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isSearchActive) {
                setIsSearchActive(false)
                setSearchValue(query || "")
            }
        }

        document.addEventListener('keydown', handleEscape)

        return () => document.removeEventListener('keydown', handleEscape)
    }, [isSearchActive, query])

    const handleBackClick = () => {
        if (onLeftClick) {
            onLeftClick();
        } else {
            if (typeof window !== "undefined") {
                window.history.back();
            }
        }
    };

    const handleSearchClick = () => onSearchClick ? onSearchClick() : setIsSearchActive((s) => !s);

    const handleSearch = (query: string) => {
        if (onSearch) onSearch(query);
        setIsSearchActive(false);
    };

    const baseClasses = `
    flex items-center justify-center
    px-4 py-3 min-h-[54px]
    ${sticky ? "fixed top-0 left-0 right-0 z-50" : ""}
    ${variant === "transparent"
            ? "bg-background/60 backdrop-blur-lg border-b border-border/40"
            : "bg-background/95 backdrop-blur-lg border-b border-border/40"}
    ${className}
  `.replace(/\s+/g, " ").trim();
    // Build header classes, override when search active for the teal look
    const headerClasses = `${baseClasses} ${isSearchActive ? 'border-none' : ''}`;

    return (
        <header ref={ref} className={`${headerClasses}`}>
            <div className={`flex items-center w-full justify-between max-w-3xl`}>
                {/* Left Section */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {(leftIcon || showBackButton) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => (isSearchActive && showSearch) ? setIsSearchActive(false) : handleBackClick()}
                            className={`hover:bg-accent rounded-xl transition-all duration-200 `}
                        >
                            {leftIcon ?? <ArrowLeft className="h-5 w-5" />}
                        </Button>
                    )}
                </div>

                {/* Center Section - Title or In-App Search */}
                <div className={`flex-1 ${centerTitle ? 'text-center mx-4 max-w-[60%]' : 'text-left'} transition-all duration-300`}>
                    {isSearchActive && showSearch ? (
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <SearchComponent
                                    onSearch={(q) => {
                                        submitSearch(q)
                                        if (onSearch) onSearch(q)
                                    }}
                                    value={searchValues}
                                    onChange={handleSearchValueChange}
                                    size="sm"
                                    className="w-full"
                                >
                                    <SearchInput
                                        placeholder="Cari outlet, produk, atau layanan..."
                                        autoFocus={isSearchActive}
                                        className="bg-transparent placeholder-white/80"
                                    />
                                    <SearchDropdown />
                                </SearchComponent>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {title && (
                                <h1 className="text-base font-medium truncate leading-tight text-foreground">
                                    {title}
                                </h1>
                            )}
                            {subtitle && (
                                <p className="text-xs text-muted-foreground truncate leading-tight">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {showSearch && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSearchClick}
                            className={`hover:bg-accent rounded-xl transition-all duration-200`}
                        >
                            {isSearchActive ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Search className="h-5 w-5" />
                            )}
                        </Button>
                    )}

                    {showThemeToggle && <ThemeModeToggle />}

                    {rightContent}

                    {showMenu && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onMenuClick}
                            className={`hover:bg-accent rounded-xl transition-all duration-200`}
                        >
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}

// Export additional icons for easy use
export { Menu, Search, MoreVertical, X, ArrowLeft } from "lucide-react";

const persistThemePreference = (next: "light" | "dark" | "system") => {
    if (typeof window === "undefined") return;
    try {
        const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
        const prefs = raw ? JSON.parse(raw) : {};
        prefs.theme = next;
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(prefs));
        window.dispatchEvent(new CustomEvent("prefs:theme-changed", { detail: next }));
    } catch (error) {
        console.warn("Gagal menyimpan preferensi tema", error);
    }
};

function ThemeModeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const currentTheme = (mounted ? theme : "system") ?? "system";

    const displayIcon = useMemo(() => {
        if (!mounted) return <Sun className="h-5 w-5" />;

        switch (currentTheme) {
            case "dark":
                return <Moon className="h-5 w-5" />;
            case "system":
                return resolvedTheme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />;
            default:
                return <Sun className="h-5 w-5" />;
        }
    }, [currentTheme, mounted, resolvedTheme]);

    const handleSelectTheme = (value: string) => {
        const allowed: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
        const next = allowed.includes(value as any) ? (value as typeof allowed[number]) : "system";
        setTheme(next);
        persistThemePreference(next);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-accent rounded-xl transition-all duration-200"
                    aria-label="Ubah mode tema"
                    title="Ubah mode tema"
                >
                    {displayIcon}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-44">
                <DropdownMenuLabel>Pilih mode</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                    value={currentTheme}
                    onValueChange={handleSelectTheme}
                >
                    <DropdownMenuRadioItem value="light" className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Terang
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark" className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Gelap
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system" className="flex items-center gap-2">
                        <Laptop className="h-4 w-4" />
                        Ikuti sistem
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}