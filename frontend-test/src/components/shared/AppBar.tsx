"use client";

import { ReactNode } from "react";
import { ArrowLeft, Menu, Search, MoreVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type AppBarVariant = "default" | "primary" | "transparent" | "elevated";

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
    onMenuClick?: () => void;

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
    onMenuClick,
    variant = "default",
    className = "",
    centerTitle = false,
    sticky = true,
    elevation = true,
}: AppBarProps) {

    // Handle back navigation - you can customize this based on your routing solution
    const handleBackClick = () => {
        if (onLeftClick) {
            onLeftClick();
        } else {
            // Default back behavior
            if (typeof window !== "undefined") {
                window.history.back();
            }
        }
    };

    // Variant styles
    const getVariantStyles = (variant: AppBarVariant) => {
        switch (variant) {
            case "primary":
                return "bg-blue-600 text-white";
            case "transparent":
                return "bg-transparent backdrop-blur-md";
            case "elevated":
                return "bg-white shadow-lg border-b border-gray-100";
            default:
                return "bg-white text-gray-900";
        }
    };

    const baseClasses = `
    flex items-center justify-between
    px-4 py-3 min-h-[56px]
    ${sticky ? "sticky top-0 z-50" : ""}
    ${elevation ? "shadow-md" : ""}
    ${getVariantStyles(variant)}
    ${className}
  `.replace(/\s+/g, " ").trim();

    return (
        <header className={baseClasses}>
            {/* Left Section */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {(leftIcon || showBackButton) && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBackClick}
                        className={variant === "primary" ? "text-white hover:bg-white/20" : ""}
                    >
                        {leftIcon ?? <ArrowLeft className="h-5 w-5" />}
                    </Button>
                )}
            </div>

            {/* Center Section - Title */}
            <div className={`flex-1 ${centerTitle ? "text-center mx-4 max-w-[53vw]" : "text-left"}`}>
                {title && (
                    <h1 className="text-lg font-semibold truncate leading-tight">
                        {title}
                    </h1>
                )}
                {subtitle && (
                    <p className="text-sm opacity-70 truncate leading-tight">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {showSearch && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onSearchClick}
                        className={variant === "primary" ? "text-white hover:bg-white/20" : ""}
                    >
                        <Search className="h-5 w-5" />
                    </Button>
                )}

                {rightContent}

                {showMenu && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMenuClick}
                        className={variant === "primary" ? "text-white hover:bg-white/20" : ""}
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