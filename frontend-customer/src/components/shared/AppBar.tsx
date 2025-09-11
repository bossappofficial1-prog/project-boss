"use client";

import { ReactNode } from "react";
import { ArrowLeft, Menu, Search, MoreVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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

    const baseClasses = `
    flex items-center justify-between
    px-4 py-3 min-h-[64px]
    ${sticky ? "fixed top-0 left-0 right-0 z-50" : ""}
    ${variant === "transparent"
            ? "bg-background/60 backdrop-blur-lg border-b border-border/40"
            : "bg-background/95 backdrop-blur-lg border-b border-border/40"}
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
                        className="hover:bg-accent rounded-xl"
                    >
                        {leftIcon ?? <ArrowLeft className="h-5 w-5" />}
                    </Button>
                )}
            </div>

            {/* Center Section - Title */}
            <div className={`flex-1 ${centerTitle ? "text-center mx-4 max-w-[60%]" : "text-left"}`}>
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
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {showSearch && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onSearchClick}
                        className="hover:bg-accent rounded-xl"
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
                        className="hover:bg-accent rounded-xl"
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