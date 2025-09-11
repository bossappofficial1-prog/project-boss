import {
    Package,
    Settings,
    ShoppingCart,
    Users,
    FileText,
    Heart,
    Star,
    Lock,
    Clock,
    Store
} from "lucide-react";
import { EmptyState, EmptyStateProps } from "./EmptyState";
import { useLocale, useTranslations } from "@/hooks/useI18n";



export const EmptyStates = {
    // Outlet related
    NoOutlets: (props?: Partial<EmptyStateProps>) => {
        const t = useTranslations("common");
        return (
            <EmptyState
                icon={<Store className="w-8 h-8 text-gray-400" />}
                title={t("emptyStates.noOutlets.title")}
                description={t("emptyStates.noOutlets.description")}
                {...props}
            />
        );
    },

    NoProducts: (props?: Partial<EmptyStateProps>) => {
        const t = useTranslations("outlet");
        return (
            <EmptyState
                icon={<Package className="w-8 h-8 text-gray-400" />}
                title={t("noProducts")}
                description={t("noProductsDesc")}
                {...props}
            />
        );
    },

    NoServices: (props?: Partial<EmptyStateProps>) => {
        const t = useTranslations("outlet");
        return (
            <EmptyState
                icon={<Settings className="w-8 h-8 text-gray-400" />}
                title={t("noServices")}
                description={t("noServicesDesc")}
                {...props}
            />
        );
    },

    // Cart related
    EmptyCart: (props?: Partial<EmptyStateProps>) => {
        const t = useTranslations("cart");
        return (
            <EmptyState
                icon={<ShoppingCart className="w-8 h-8 text-gray-400" />}
                title={t("title")}
                action={props?.action ? {
                    label: t("empty.action"),
                    onClick: props.action.onClick
                } : undefined}
                {...props}
            />
        );
    },

    // Orders related
    NoOrders: (props?: Partial<EmptyStateProps>) => {
        const t = useTranslations("common");
        return (
            <EmptyState
                icon={<FileText className="w-8 h-8 text-gray-400" />}
                title={t("emptyStates.noOrders.title")}
                description={t("emptyStates.noOrders.description")}
                {...props}
            />
        );
    },

    // Favorites related
    NoFavorites: (props?: Partial<EmptyStateProps>) => {
        const t = useTranslations("favorites");
        return (
            <EmptyState
                icon={<Heart className="w-8 h-8 text-gray-400" />}
                title={t("empty.title")}
                description={t("empty.description")}
                action={props?.action ? {
                    label: t("empty.browse"),
                    onClick: props.action.onClick
                } : undefined}
                {...props}
            />
        );
    },

    // Not Found state
    NotFound: (props?: Partial<EmptyStateProps>) => {
        const t = useTranslations("common");
        return (
            <EmptyState
                icon={<FileText className="w-8 h-8 text-gray-400" />}
                title={t("emptyStates.notFound.title")}
                description={t("emptyStates.notFound.description")}
                action={props?.action ? {
                    label: t("emptyStates.notFound.action"),
                    onClick: props.action.onClick
                } : undefined}
                {...props}
            />
        );
    },

    // Reviews related
    NoReviews: (props?: Partial<EmptyStateProps>) => {
        const t = useTranslations("common");
        return (
            <EmptyState
                icon={<Star className="w-8 h-8 text-gray-400" />}
                title={t("emptyStates.noReviews.title")}
                description={t("emptyStates.noReviews.description")}
                {...props}
            />
        );
    },

    // Access related
    NoAccess: (props?: Partial<EmptyStateProps>) => {
        const t = useTranslations("common");
        return (
            <EmptyState
                icon={<Lock className="w-8 h-8 text-gray-400" />}
                title={t("emptyStates.noAccess.title")}
                description={t("emptyStates.noAccess.description")}
                {...props}
            />
        );
    },

    // Coming Soon
    ComingSoon: (props?: Partial<EmptyStateProps>) => {
        const t = useTranslations("common");
        return (
            <EmptyState
                icon={<Clock className="w-8 h-8 text-gray-400" />}
                title={t("emptyStates.comingSoon.title")}
                description={t("emptyStates.comingSoon.description")}
                {...props}
            />
        );
    }
};
