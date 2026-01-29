"use client";

import React, { ReactNode, useMemo } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";

const SHEET_SIZES = {
    sm: "sm:max-w-[384px]",
    md: "sm:max-w-[540px]",
    lg: "sm:max-w-[720px]",
    xl: "sm:max-w-[900px]",
    full: "sm:max-w-full w-screen",
    content: "w-fit",
};

interface ReusableSheetProps {
    // State Control
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;

    // Content Props
    title?: ReactNode;
    description?: ReactNode;
    children: ReactNode;
    trigger?: ReactNode;

    // Layout Props
    side?: "top" | "bottom" | "left" | "right";
    size?: keyof typeof SHEET_SIZES;
    className?: string;
    hideCloseButton?: boolean;

    // Interaction & Status
    isLoading?: boolean;
    isSubmitting?: boolean;
    isDirty?: boolean; // Digunakan untuk konfirmasi sebelum tutup
    preventCloseOnOverlayClick?: boolean;

    // Footer Config
    footer?: ReactNode;
    showFooter?: boolean;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

    // Security
    confirmCloseMessage?: string;
}

export function ReusableSheet({
    isOpen,
    onOpenChange,
    title,
    description,
    children,
    trigger,
    side = "right",
    size = "md",
    className,
    hideCloseButton = false,
    isLoading = false,
    isSubmitting = false,
    isDirty = false,
    preventCloseOnOverlayClick = false,
    footer,
    showFooter = true,
    confirmText = "Simpan",
    cancelText = "Batal",
    onConfirm,
    confirmVariant = "default",
    confirmCloseMessage = "Anda memiliki perubahan yang belum disimpan. Yakin ingin menutup?",
}: ReusableSheetProps) {

    // Handler untuk penutupan dengan konfirmasi
    const handleOpenChange = (open: boolean) => {
        if (!open && isDirty) {
            if (typeof window !== "undefined" && !window.confirm(confirmCloseMessage)) return;
        }
        onOpenChange(open);
    };

    const sheetSizeClass = useMemo(() => SHEET_SIZES[size], [size]);

    return (
        <>
            {/* Tombol pemicu jika ada */}
            {trigger && (
                <div onClick={() => onOpenChange(true)} className="inline-block cursor-pointer">
                    {trigger}
                </div>
            )}

            <Sheet open={isOpen} onOpenChange={handleOpenChange}>
                <SheetContent
                    side={side}
                    onPointerDownOutside={(e) => {
                        if (preventCloseOnOverlayClick || isSubmitting) e.preventDefault();
                    }}
                    className={cn(
                        "flex flex-col h-full p-0 gap-0 focus:outline-none",
                        sheetSizeClass,
                        className
                    )}
                >
                    {/* Header Section */}
                    {(title || description) && (
                        <SheetHeader className="p-6 border-b shrink-0 relative">
                            <div className="flex flex-col gap-1.5">
                                {title && <SheetTitle className="text-xl leading-none">{title}</SheetTitle>}
                                {description && (
                                    <SheetDescription className="text-sm">
                                        {description}
                                    </SheetDescription>
                                )}
                            </div>

                            {!hideCloseButton && (
                                <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Close</span>
                                </SheetClose>
                            )}
                        </SheetHeader>
                    )}

                    {/* Body Section (Scrollable) */}
                    <div className="flex-1 overflow-y-auto relative">
                        {/* Loading Overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[1px]">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                <p className="text-sm font-medium text-muted-foreground">Memuat data...</p>
                            </div>
                        )}

                        <div className={cn("p-6", isLoading && "opacity-20 pointer-events-none")}>
                            {children}
                        </div>
                    </div>

                    {/* Footer Section (Sticky at bottom) */}
                    {showFooter && (
                        <SheetFooter className="p-6 border-t shrink-0 sm:flex-row flex-col gap-2">
                            {footer ? (
                                footer
                            ) : (
                                <>
                                    <SheetClose asChild>
                                        <Button variant="outline" disabled={isSubmitting}>
                                            {cancelText}
                                        </Button>
                                    </SheetClose>
                                    {onConfirm && (
                                        <Button
                                            onClick={onConfirm}
                                            disabled={isSubmitting || isLoading}
                                            variant={confirmVariant}
                                            className="min-w-[100px]"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Memproses...
                                                </>
                                            ) : (
                                                confirmText
                                            )}
                                        </Button>
                                    )}
                                </>
                            )}
                        </SheetFooter>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}

export function ReusableSheetSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-24 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    );
}

export default ReusableSheet;