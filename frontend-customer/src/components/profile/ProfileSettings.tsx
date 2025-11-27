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
import { User, Phone, Sun, Moon, Monitor, Globe, Save, LogIn, Building, Heart, Receipt, Bookmark, ChevronRight, Settings, Edit2, CheckCircle2 } from "lucide-react";
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

    const becomeBusiness = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_DASHBOARD_REGISTER_URL}`
    };

    const goLogin = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_DASHBOARD_LOGIN_URL}`
    };

    const goToFavorites = () => {
        window.location.href = "/favorites"
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
        <div className="space-y-4 pb-4">
            {/* Profile Summary Card */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-md p-6 space-y-4">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center ring-4 ring-primary/20">
                            <span className="text-2xl font-bold text-primary-foreground">
                                {getInitials(fullName || "User")}
                            </span>
                        </div>
                        {profileCompleteness === 100 && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-background">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-foreground truncate">
                            {fullName || t("placeholders.fullName")}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {whatsapp || t("placeholders.whatsapp")}
                        </p>

                        {/* Completeness Bar */}
                        <div className="mt-3 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Profile Completeness</span>
                                <span className={cn(
                                    "font-semibold",
                                    profileCompleteness === 100 ? "text-green-600 dark:text-green-400" : "text-primary"
                                )}>
                                    {profileCompleteness}%
                                </span>
                            </div>
                            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-500 rounded-full",
                                        profileCompleteness === 100
                                            ? "bg-green-500"
                                            : "bg-primary"
                                    )}
                                    style={{ width: `${profileCompleteness}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
                {/* Quick Actions */}
                <div className="bg-card rounded-md border p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-primary" />
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => router.push("/orders")}
                            className="flex flex-col items-center gap-2 p-3 rounded-md hover:bg-accent transition-colors"
                        >
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <Receipt className="w-6 h-6 text-primary" />
                            </div>
                            <span className="text-xs font-medium text-foreground">Orders</span>
                        </button>

                        <button
                            type="button"
                            onClick={goToFavorites}
                            className="flex flex-col items-center gap-2 p-3 rounded-md hover:bg-accent transition-colors"
                        >
                            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center relative">
                                <Heart className="w-6 h-6 text-red-500" />
                                {isMounted && favoriteCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {favoriteCount > 9 ? "9+" : favoriteCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-medium text-foreground">Favorites</span>
                        </button>

                        <button
                            type="button"
                            onClick={goToSavedProducts}
                            className="flex flex-col items-center gap-2 p-3 rounded-md hover:bg-accent transition-colors"
                        >
                            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center relative">
                                <Bookmark className="w-6 h-6 text-blue-500" />
                                {isMounted && savedProductsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {savedProductsCount > 9 ? "9+" : savedProductsCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-medium text-foreground">Saved</span>
                        </button>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-card rounded-md border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Edit2 className="w-4 h-4 text-primary" />
                            {t(`contactInformation`)}
                        </h3>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                {t(`fullName`)}
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    {...register('fullName')}
                                    placeholder={t("placeholders.fullName")}
                                    className="h-11 pl-10"
                                />
                            </div>
                            {errors.fullName && (
                                <p className="text-destructive text-xs mt-1.5 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-destructive rounded-full" />
                                    {errors.fullName.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                {t(`whatsappNumber`)}
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    {...register('whatsapp')}
                                    placeholder={t("placeholders.whatsapp")}
                                    className="h-11 pl-10"
                                />
                            </div>
                            {errors.whatsapp && (
                                <p className="text-destructive text-xs mt-1.5 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-destructive rounded-full" />
                                    {errors.whatsapp.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Theme Settings - Compact Segmented Control */}
                <div className="bg-card rounded-md border p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Sun className="w-4 h-4 text-primary" />
                        {t(`appearance`)}
                    </h3>

                    <div className="inline-flex w-full bg-muted/50 rounded-md p-1">
                        <button
                            type="button"
                            onClick={() => handleThemeChange('light')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all",
                                currentTheme === 'light'
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Sun className="w-4 h-4" />
                            <span className="hidden sm:inline">Light</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleThemeChange('dark')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all",
                                currentTheme === 'dark'
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Moon className="w-4 h-4" />
                            <span className="hidden sm:inline">Dark</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleThemeChange('system')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all",
                                currentTheme === 'system'
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Monitor className="w-4 h-4" />
                            <span className="hidden sm:inline">Auto</span>
                        </button>
                    </div>
                </div>

                {/* Language Settings */}
                <div className="bg-card rounded-md border p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        {t('language')}
                    </h3>
                    <LanguageSwitcher />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                    {/* Primary Save Button */}
                    <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
                    >
                        <Save className="w-5 h-5 mr-2" />
                        {t("saveChanges")}
                    </Button>

                    {/* Secondary Actions */}
                    <div className="bg-card rounded-md border p-3 space-y-2">
                        <button
                            type="button"
                            onClick={goLogin}
                            className="w-full flex items-center justify-between p-3 rounded-md hover:bg-accent transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <LogIn className="w-5 h-5 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-foreground">{t("login")}</p>
                                    <p className="text-xs text-muted-foreground">Access partner dashboard</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </button>

                        <button
                            type="button"
                            onClick={becomeBusiness}
                            className="w-full flex items-center justify-between p-3 rounded-md hover:bg-accent transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                                    <Building className="w-5 h-5 text-orange-500" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-foreground">{t("becomeBusiness")}</p>
                                    <p className="text-xs text-muted-foreground">Register as partner</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Reset Button */}
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-10 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setIsResetModalShowed(!isResetModalShowed)}
                    >
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