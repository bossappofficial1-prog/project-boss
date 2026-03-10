"use client"

import React, { useEffect, useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { useTranslations } from '@/hooks/useI18n';
import { User, Phone, Sun, Moon, Monitor, Globe, Save, Heart, Receipt, Bookmark, ChevronRight, RotateCcw, LayoutDashboard, ExternalLink } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useSavedProducts } from "@/hooks/useSavedProducts";
import { STORAGE_PROFILE_KEY } from "@/constants";
import { ResetModal } from "./ResetModal";
import { useSnackbar } from "@/hooks/useSnackbar";
import { cn } from "@/lib/utils";


export default function ProfileSettings() {
    const { setTheme: setAppTheme } = useTheme();
    const router = useRouter();
    const snackbar = useSnackbar()
    const t = useTranslations('profilePage');
    const [isResetModalShowed, setIsResetModalShowed] = useState<boolean>(false)
    const [isMounted, setIsMounted] = useState(false);
    const { favoriteCount } = useFavorites();
    const { savedProductsCount } = useSavedProducts();

    // Prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const schema = z.object({
        fullName: z.string().min(2, t("validation.fullNameMin")),
        whatsapp: z.string().min(6, t("validation.invalidWhatsapp")),
        theme: z.enum(["light", "dark", "system"]),
    });

    type FormValues = z.infer<typeof schema>;

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { fullName: "", whatsapp: "", theme: "system" },
    });

    // Load stored preferences on client-side only
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
            if (raw) {
                const prefs = JSON.parse(raw);
                const updates: Partial<FormValues> = {};
                if (prefs.fullName) updates.fullName = prefs.fullName;
                if (prefs.phone) updates.whatsapp = prefs.phone;
                if (prefs.theme) updates.theme = prefs.theme;
                // Batch update all form values at once
                Object.entries(updates).forEach(([key, value]) => {
                    setValue(key as keyof FormValues, value);
                });
                // Also set the theme immediately if it exists
                if (prefs.theme) setAppTheme(prefs.theme);
            }
        } catch (e) {
            // ignore
        }
    }, []);

    useEffect(() => {
        const syncTheme = (event: Event) => {
            const detail = (event as CustomEvent<string>).detail;
            if (!detail) return;
            setValue('theme', detail as FormValues['theme'], { shouldDirty: false });
        };

        window.addEventListener('prefs:theme-changed', syncTheme);

        return () => {
            window.removeEventListener('prefs:theme-changed', syncTheme);
        };
    }, [setValue]);

    const watchedTheme = watch('theme');
    useEffect(() => {
        if (watchedTheme) setAppTheme(watchedTheme);
        try {
            const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
            const prefs = raw ? JSON.parse(raw) : {};
            prefs.theme = watchedTheme;
            localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(prefs));
        } catch (e) {
            // ignore
        }
    }, [watchedTheme, setAppTheme]);

    const onSubmit = (data: FormValues) => {
        try {
            const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
            const prefs = raw ? JSON.parse(raw) : {};
            prefs.fullName = data.fullName;
            prefs.phone = data.whatsapp;
            prefs.theme = data.theme;
            localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(prefs));
            // indicate save
            const ev = new CustomEvent('prefs:saved');
            window.dispatchEvent(ev);
            !isResetModalShowed && snackbar.success(t("messageSuccess"));
        } catch (e) {
            console.error(e);
        }
    };

    const goToFavorites = () => {
        router.push("/favorites")
    };

    const goToSavedProducts = () => {
        router.push("/saved-products")
    };

    const handleThemeChange = (val: string) => {
        setValue('theme', val as FormValues['theme'], { shouldDirty: true });
    };

    const currentTheme = watch('theme');
    const fullName = watch('fullName');
    const whatsapp = watch('whatsapp');

    // Calculate profile completeness
    const profileCompleteness = useMemo(() => {
        let completed = 0;
        let total = 3; // fullName, whatsapp, theme
        if (fullName && fullName.length >= 2) completed++;
        if (whatsapp && whatsapp.length >= 6) completed++;
        if (currentTheme) completed++;
        return Math.round((completed / total) * 100);
    }, [fullName, whatsapp, currentTheme]);

    const getInitials = (name: string) => {
        if (!name) return "?";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
        <div className="space-y-5 pb-8">
            {/* Profile Header Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 text-primary-foreground">
                {/* Decorative circles */}
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/5" />
                <div className="absolute top-1/2 right-12 w-8 h-8 rounded-full bg-white/5" />

                <div className="relative flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-2 ring-white/30 shadow-lg">
                        <span className="text-2xl font-bold">
                            {getInitials(fullName || "User")}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold truncate">
                            {fullName || t("placeholders.fullName")}
                        </h2>
                        <p className="text-sm text-white/70">
                            {whatsapp || t("placeholders.whatsapp")}
                        </p>
                        {/* Completeness bar */}
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-500"
                                    style={{ width: `${profileCompleteness}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-semibold text-white/70 tabular-nums">
                                {profileCompleteness}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40">
                <QuickLink
                    icon={<Receipt className="w-4 h-4" />}
                    iconBg="bg-primary/10 text-primary"
                    label={t("orders.title")}
                    subtitle={t("orders.viewAll")}
                    onClick={() => router.push("/orders")}
                />
                <QuickLink
                    icon={<Heart className="w-4 h-4" />}
                    iconBg="bg-red-50 text-red-500 dark:bg-red-500/10"
                    label={t("favorites.title")}
                    subtitle={isMounted && favoriteCount > 0 ? t("favorites.count", { count: favoriteCount }) : undefined}
                    onClick={goToFavorites}
                    badge={isMounted && favoriteCount > 0 ? favoriteCount : undefined}
                />
                <QuickLink
                    icon={<Bookmark className="w-4 h-4" />}
                    iconBg="bg-blue-50 text-blue-500 dark:bg-blue-500/10"
                    label={t("savedProducts.title")}
                    subtitle={isMounted && savedProductsCount > 0 ? t("savedProducts.count", { count: savedProductsCount }) : undefined}
                    onClick={goToSavedProducts}
                    badge={isMounted && savedProductsCount > 0 ? savedProductsCount : undefined}
                />
                <QuickLink
                    icon={<Globe className="w-4 h-4" />}
                    iconBg="bg-green-50 text-green-600 dark:bg-green-500/10"
                    label={t("bossapp.title")}
                    subtitle={t("bossapp.subtitle")}
                    onClick={() => window.open("https://bossapp.id", "_blank")}
                    external
                />
                <QuickLink
                    icon={<LayoutDashboard className="w-4 h-4" />}
                    iconBg="bg-purple-50 text-purple-600 dark:bg-purple-500/10"
                    label={t("dashboardBossapp.title")}
                    subtitle={t("dashboardBossapp.subtitle")}
                    onClick={() => window.open("https://dashboard.bossapp.id", "_blank")}
                    external
                />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Contact Info */}
                <section className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                        {t("contactInformation")}
                    </h3>
                    <div className="rounded-xl border border-border/60 p-4 space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                {t("fullName")}
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                <Input
                                    {...register('fullName')}
                                    placeholder={t("placeholders.fullName")}
                                    className="h-10 pl-10 rounded-lg"
                                />
                            </div>
                            {errors.fullName && (
                                <p className="text-destructive text-[11px] mt-1 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-destructive rounded-full" />
                                    {errors.fullName.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                {t("whatsappNumber")}
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                <Input
                                    {...register('whatsapp')}
                                    placeholder={t("placeholders.whatsapp")}
                                    className="h-10 pl-10 rounded-lg"
                                />
                            </div>
                            {errors.whatsapp && (
                                <p className="text-destructive text-[11px] mt-1 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-destructive rounded-full" />
                                    {errors.whatsapp.message}
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Appearance */}
                <section className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                        {t("appearance")}
                    </h3>
                    <div className="rounded-xl border border-border/60 p-4">
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: "light", icon: Sun, label: t("lightTheme") },
                                { value: "dark", icon: Moon, label: t("darkTheme") },
                                { value: "system", icon: Monitor, label: t("systemTheme") },
                            ].map(({ value, icon: Icon, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => handleThemeChange(value)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-lg text-xs font-medium transition-all duration-200",
                                        currentTheme === value
                                            ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                                            : "text-muted-foreground hover:bg-muted/60"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="leading-none">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Language */}
                <section className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                        {t("language")}
                    </h3>
                    <div className="rounded-xl border border-border/60 p-4">
                        <LanguageSwitcher />
                    </div>
                </section>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                    <Button
                        type="submit"
                        className="w-full h-11 rounded-xl font-semibold text-sm shadow-sm gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {t("saveChanges")}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-9 rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 gap-1.5"
                        onClick={() => setIsResetModalShowed(!isResetModalShowed)}
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {t("reset")}
                    </Button>
                    {isResetModalShowed && (
                        <ResetModal
                            isOpen={isResetModalShowed}
                            onOpenChange={setIsResetModalShowed}
                        />
                    )}
                </div>
            </form>
        </div>
    );
}

// QuickLink sub-component
function QuickLink({
    icon,
    iconBg,
    label,
    subtitle,
    onClick,
    badge,
    external,
}: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    subtitle?: string;
    onClick: () => void;
    badge?: number;
    external?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/40 transition-colors active:bg-muted/60"
        >
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0", iconBg)}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{label}</p>
                {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {badge !== undefined && (
                    <span className="min-w-[20px] h-5 px-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                        {badge > 99 ? "99+" : badge}
                    </span>
                )}
                {external
                    ? <ExternalLink className="w-4 h-4 text-muted-foreground/40" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                }
            </div>
        </button>
    );
}