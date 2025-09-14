"use client";

import { ChangeEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Menu, Search, MoreVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Search as SearchComponent, SearchInput, SearchDropdown } from "./search";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

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
    flex items-center justify-between
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
        <header ref={ref} className={headerClasses}>
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
        </header>
    );
}

// Export additional icons for easy use
export { Menu, Search, MoreVertical, X, ArrowLeft } from "lucide-react";