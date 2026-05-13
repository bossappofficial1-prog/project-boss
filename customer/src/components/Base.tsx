import {
    AlertTriangle,
    Search,
    Package,
    Wifi,
    RefreshCw,
    ShoppingCart,
    Users,
    FileText,
    Heart,
    Star,
    Settings,
    Lock,
    Clock,
    CheckCircle,
    XCircle,
    Info,
    AlertCircle,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React, { HtmlHTMLAttributes } from "react";

// Base Empty State Component
interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className
}: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-8 px-4", className)}>
            <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
                {icon || <Package className="w-6 h-6 text-muted-foreground" />}
            </div>
            <h3 className="text-base font-medium text-foreground mb-1 text-center">{title}</h3>
            {description && (
                <p className="text-muted-foreground text-sm text-center max-w-sm mb-4">{description}</p>
            )}
            {action && (
                <Button onClick={action.onClick} variant="default" size="sm">
                    {action.label}
                </Button>
            )}
        </div>
    );
}

// Error State Component
interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    className?: string;
    icon?: React.ReactNode;
    iconClassName?: string
}

export function ErrorState({
    title = "Terjadi Kesalahan",
    message = "Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.",
    onRetry,
    className,
    icon,
    iconClassName
}: ErrorStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-8 px-4", className)}>
            <div className={`w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center ${iconClassName}`}>
                {icon ? icon : <AlertTriangle className="w-6 h-6 text-red-500" />}
            </div>
            <h3 className="text-base font-medium text-foreground mb-1 text-center">{title}</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm mb-4">{message}</p>
            {onRetry && (
                <Button onClick={onRetry} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Coba Lagi
                </Button>
            )}
        </div>
    );
}

// Loading State Component
interface LoadingStateProps {
    message?: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function LoadingState({
    message = "Memuat...",
    size = "md",
    className
}: LoadingStateProps) {
    const sizeClasses = {
        sm: "py-6",
        md: "py-8",
        lg: "py-12"
    };

    const spinnerSizes = {
        sm: "w-5 h-5",
        md: "w-6 h-6",
        lg: "w-8 h-8"
    };

    return (
        <div className={cn("flex flex-col items-center justify-center px-4", sizeClasses[size], className)}>
            <Loader2 className={cn("animate-spin text-primary mb-3", spinnerSizes[size])} />
            <p className="text-muted-foreground text-sm text-center">{message}</p>
        </div>
    );
}

// No Connection State
interface NoConnectionProps {
    onRetry?: () => void;
    className?: string;
}

export function NoConnectionState({ onRetry, className }: NoConnectionProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <Wifi className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                Tidak Ada Koneksi
            </h3>
            <p className="text-gray-500 text-sm text-center max-w-sm mb-6">
                Periksa koneksi internet Anda dan coba lagi.
            </p>
            {onRetry && (
                <Button onClick={onRetry} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Coba Lagi
                </Button>
            )}
        </div>
    );
}

// Search Empty State
interface SearchEmptyProps {
    query?: string;
    onClear?: () => void;
    className?: string;
}

export function SearchEmptyState({ query, onClear, className }: SearchEmptyProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                Tidak Ditemukan
            </h3>
            <p className="text-gray-500 text-sm text-center max-w-sm mb-6">
                {query
                    ? `Tidak ada hasil untuk "${query}". Coba kata kunci lain.`
                    : "Tidak ada hasil yang ditemukan. Coba kata kunci lain."
                }
            </p>
            {onClear && (
                <Button onClick={onClear} variant="outline">
                    Hapus Pencarian
                </Button>
            )}
        </div>
    );
}

// Success State
interface SuccessStateProps {
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function SuccessState({ title, description, action, className }: SuccessStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">{title}</h3>
            {description && (
                <p className="text-gray-500 text-sm text-center max-w-sm mb-6">{description}</p>
            )}
            {action && (
                <Button onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
}

// Predefined Empty States for common scenarios
export const EmptyStates = {
    // Product related
    NoProducts: (props?: Partial<EmptyStateProps>) => (
        <EmptyState
            icon={<Package className="w-8 h-8 text-gray-400" />}
            title="Belum Ada Produk"
            description="Produk akan segera tersedia. Silakan cek kembali nanti."
            {...props}
        />
    ),

    NoServices: (props?: Partial<EmptyStateProps>) => (
        <EmptyState
            icon={<Settings className="w-8 h-8 text-gray-400" />}
            title="Belum Ada Layanan"
            description="Layanan akan segera tersedia. Silakan cek kembali nanti."
            {...props}
        />
    ),

    // Cart related
    EmptyCart: (props?: Partial<EmptyStateProps>) => (
        <EmptyState
            icon={<ShoppingCart className="w-8 h-8 text-gray-400" />}
            title="Keranjang Kosong"
            description="Belum ada item di keranjang Anda. Mari mulai berbelanja!"
            {...props}
        />
    ),

    // User related
    NoUsers: (props?: Partial<EmptyStateProps>) => (
        <EmptyState
            icon={<Users className="w-8 h-8 text-gray-400" />}
            title="Belum Ada Pengguna"
            description="Belum ada pengguna yang terdaftar."
            {...props}
        />
    ),

    // Orders related
    NoOrders: (props?: Partial<EmptyStateProps>) => (
        <EmptyState
            icon={<FileText className="w-8 h-8 text-gray-400" />}
            title="Belum Ada Pesanan"
            description="Anda belum memiliki riwayat pesanan."
            {...props}
        />
    ),

    // Favorites related
    NoFavorites: (props?: Partial<EmptyStateProps>) => (
        <EmptyState
            icon={<Heart className="w-8 h-8 text-gray-400" />}
            title="Belum Ada Favorit"
            description="Belum ada item yang ditandai sebagai favorit."
            {...props}
        />
    ),

    // Reviews related
    NoReviews: (props?: Partial<EmptyStateProps>) => (
        <EmptyState
            icon={<Star className="w-8 h-8 text-gray-400" />}
            title="Belum Ada Ulasan"
            description="Jadilah yang pertama memberikan ulasan."
            {...props}
        />
    ),

    // Access related
    NoAccess: (props?: Partial<EmptyStateProps>) => (
        <EmptyState
            icon={<Lock className="w-8 h-8 text-gray-400" />}
            title="Akses Terbatas"
            description="Anda tidak memiliki izin untuk mengakses halaman ini."
            {...props}
        />
    ),

    // Coming Soon
    ComingSoon: (props?: Partial<EmptyStateProps>) => (
        <EmptyState
            icon={<Clock className="w-8 h-8 text-gray-400" />}
            title="Segera Hadir"
            description="Fitur ini akan segera tersedia. Nantikan update selanjutnya!"
            {...props}
        />
    )
};

// Alert Component for inline messages
interface AlertProps {
    type: "info" | "success" | "warning" | "error";
    title?: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    onClose?: () => void;
    className?: string;
}

const alertStyles = {
    info: {
        container: "border-blue-200/70 bg-blue-50/90 text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/70 dark:text-blue-100",
        title: "text-blue-900 dark:text-blue-50",
        message: "text-blue-700 dark:text-blue-100/80",
        iconClass: "text-blue-500 dark:text-blue-300",
        actionClass: "hover:bg-blue-100/60 dark:hover:bg-blue-900/40",
        closeClass: "hover:bg-blue-100/60 dark:hover:bg-blue-900/40"
    },
    success: {
        container: "border-green-200/70 bg-green-50/90 text-green-700 dark:border-green-900/70 dark:bg-green-950/70 dark:text-green-100",
        title: "text-green-900 dark:text-green-50",
        message: "text-green-700 dark:text-green-100/80",
        iconClass: "text-green-500 dark:text-green-300",
        actionClass: "hover:bg-green-100/60 dark:hover:bg-green-900/40",
        closeClass: "hover:bg-green-100/60 dark:hover:bg-green-900/40"
    },
    warning: {
        container: "border-yellow-200/70 bg-yellow-50/90 text-yellow-700 dark:border-yellow-900/70 dark:bg-yellow-950/70 dark:text-yellow-100",
        title: "text-yellow-900 dark:text-yellow-50",
        message: "text-yellow-700 dark:text-yellow-100/80",
        iconClass: "text-yellow-500 dark:text-yellow-300",
        actionClass: "hover:bg-yellow-100/60 dark:hover:bg-yellow-900/40",
        closeClass: "hover:bg-yellow-100/60 dark:hover:bg-yellow-900/40"
    },
    error: {
        container: "border-red-200/70 bg-red-50/90 text-red-700 dark:border-red-900/70 dark:bg-red-950/70 dark:text-red-100",
        title: "text-red-900 dark:text-red-50",
        message: "text-red-700 dark:text-red-100/80",
        iconClass: "text-red-500 dark:text-red-300",
        actionClass: "hover:bg-red-100/60 dark:hover:bg-red-900/40",
        closeClass: "hover:bg-red-100/60 dark:hover:bg-red-900/40"
    }
};

const alertIcons = {
    info: Info,
    success: CheckCircle,
    warning: AlertCircle,
    error: XCircle
};

export function Alert({ type, title, message, action, onClose, className }: AlertProps) {
    const IconComponent = alertIcons[type];
    const style = alertStyles[type];

    return (
        <Card
            role="alert"
            className={cn(
                "border shadow-sm backdrop-blur-sm transition-all duration-200",
                "rounded-xl sm:rounded-2xl",
                style.container,
                className
            )}
        >
            <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="flex-shrink-0">
                        <IconComponent className={cn("h-5 w-5 sm:h-6 sm:w-6", style.iconClass)} />
                    </div>
                    <div className="flex-1 space-y-1">
                        {title && (
                            <h4 className={cn("font-semibold leading-tight", style.title)}>{title}</h4>
                        )}
                        <p className={cn("text-sm leading-relaxed", style.message)}>{message}</p>
                        {action && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={action.onClick}
                                className={cn(
                                    "mt-1 w-fit p-0 text-sm font-medium text-current",
                                    "focus-visible:ring-1 focus-visible:ring-offset-2",
                                    style.actionClass
                                )}
                            >
                                {action.label}
                            </Button>
                        )}
                    </div>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className={cn(
                                "h-8 w-8 self-start rounded-full p-0",
                                "focus-visible:ring-1 focus-visible:ring-offset-2",
                                style.closeClass
                            )}
                            aria-label="Tutup pesan"
                        >
                            <XCircle className={cn("h-4 w-4", style.iconClass)} />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// Export ConfirmationModal from Base folder
export { ConfirmationModal } from './base/ConfirmationModal';