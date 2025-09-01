"use client"

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { useTranslations } from '@/hooks/useI18n';
import { User, Phone, Sun, Moon, Monitor, Globe, Save, LogIn, Building, Heart, Receipt } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { STORAGE_PROFILE_KEY } from "@/constants";
import { ResetModal } from "./ResetModal";


export default function ProfileSettings() {
    const { setTheme: setAppTheme } = useTheme();
    const router = useRouter();
    const toast = useToast();
    const t = useTranslations('profilePage');
    const [isResetModalShowed, setIsResetModalShowed] = useState<boolean>(false)
    const { favoriteCount } = useFavorites();

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
            !isResetModalShowed && toast.push({ title: t("messageSuccess") });
        } catch (e) {
            console.error(e);
        }
    };

    const becomeBusiness = () => {
        router.push('/register');
    };

    const goLogin = () => {
        router.push('/login');
    };

    const goToFavorites = () => {
        router.push('/favorites');
    };

    const goToOrders = () => {
        router.push('/orders');
    };

    const handleThemeChange = (val: string) => {
        setValue('theme', val as FormValues['theme'], { shouldDirty: true });
    };

    const currentTheme = watch('theme');

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold text-foreground">
                    {t(`title`)}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {t(`subtitle`)}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Contact Information */}
                <div className="bg-card rounded-lg border p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                        <User className="w-5 h-5 text-primary" />
                        <h2 className="font-medium text-card-foreground">
                            {t(`contactInformation`)}
                        </h2>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-2">
                                {t(`fullName`)}
                            </label>
                            <Input
                                {...register('fullName')}
                                placeholder={t("placeholders.fullName")}
                                className="h-11"
                            />
                            {errors.fullName && (
                                <p className="text-destructive text-sm mt-1">
                                    {errors.fullName.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-2">
                                {t(`whatsappNumber`)}
                            </label>
                            <Input
                                {...register('whatsapp')}
                                placeholder={t("placeholders.whatsapp")}
                                className="h-11"
                            />
                            {errors.whatsapp && (
                                <p className="text-destructive text-sm mt-1">
                                    {errors.whatsapp.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Theme Settings */}
                <div className="bg-card rounded-lg border p-4">
                    <div className="flex flex-col mb-4 space-y-2">
                        <div className="flex items-center gap-2">
                            <Sun className="w-5 h-5 text-primary" />
                            <h2 className="font-medium text-card-foreground">
                                {t(`appearance`)}
                            </h2>
                        </div>
                        <p>{t("appearanceDescription")}</p>
                    </div>

                    <RadioGroup
                        value={currentTheme}
                        onValueChange={(v) => handleThemeChange(v)}
                        className="space-y-0"
                    >
                        <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <Sun className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{t(`lightTheme`)}</span>
                            </div>
                            <RadioGroupItem value="light" />
                        </label>

                        <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <Moon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{t(`darkTheme`)}</span>
                            </div>
                            <RadioGroupItem value="dark" />
                        </label>

                        <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{t("systemTheme")}</span>
                            </div>
                            <RadioGroupItem value="system" />
                        </label>
                    </RadioGroup>
                </div>

                {/* Language Settings */}
                <div className="bg-card rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-5 h-5 text-primary" />
                        <h2 className="font-medium text-card-foreground">
                            {t('language')}
                        </h2>
                    </div>
                    <LanguageSwitcher />
                </div>

                {/* Favorites Section */}
                <div className="bg-card rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Heart className="w-5 h-5 text-primary" />
                        <h2 className="font-medium text-card-foreground">
                            {t("favorites.title")}
                        </h2>
                    </div>
                    <div
                        onClick={goToFavorites}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("favorites.savedOutlets")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                                {t("favorites.count", { count: favoriteCount ? favoriteCount : 0 })}
                            </span>
                            <span className="text-muted-foreground">→</span>
                        </div>
                    </div>
                </div>

                {/* Orders Section */}
                <div className="bg-card rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Receipt className="w-5 h-5 text-primary" />
                        <h2 className="font-medium text-card-foreground">
                            {t("orders.title")}
                        </h2>
                    </div>
                    <div
                        onClick={goToOrders}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{t("orders.orderHistory")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* <span className="text-xs text-muted-foreground">
                                {t("orders.viewAll")}
                            </span> */}
                            <span className="text-muted-foreground">→</span>
                        </div>
                    </div>
                </div>                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                    <Button type="submit" className="w-full h-11">
                        <Save className="w-4 h-4 mr-2" />
                        {t("saveChanges")}
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            onClick={goLogin}
                            className="h-11"
                        >
                            <LogIn className="w-4 h-4 mr-2" />
                            {t("login")}
                        </Button>

                        <Button
                            onClick={becomeBusiness}
                            variant="secondary"
                            className="h-11"
                            title={t("becomeBusiness")}
                        >
                            <Building className="w-4 h-4 mr-2" />
                            <span className="line-clamp-1 truncate"> {t("becomeBusiness")}</span>
                        </Button>
                    </div>

                    {/* Reset Dialog */}
                    <Button
                        variant="ghost"
                        className="w-full h-11 text-muted-foreground"
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