"use client"

import React, { useEffect } from "react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { useTranslations } from '@/hooks/useI18n';
import { useAppBarConfig } from "@/hooks/useAppBarConfig";
import { User, Phone, Sun, Moon, Monitor, Globe, Save, ChevronRight, LogIn, Building } from "lucide-react";

const STORAGE_KEY = "user_preferences";

const schema = z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    whatsapp: z.string().min(6, "Invalid WhatsApp number"),
    theme: z.enum(["light", "dark"]),
});

type FormValues = z.infer<typeof schema>;

export default function ProfileSettings() {
    const { setTheme: setAppTheme } = useTheme();
    const router = useRouter();
    const toast = useToast();
    const t = useTranslations('profilePage');

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { fullName: "", whatsapp: "", theme: "light" },
    });

    // Load stored preferences on client-side only
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
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
            const raw = localStorage.getItem(STORAGE_KEY);
            const prefs = raw ? JSON.parse(raw) : {};
            prefs.theme = watchedTheme;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        } catch (e) {
            // ignore
        }
    }, [watchedTheme, setAppTheme]);

    const onSubmit = (data: FormValues) => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const prefs = raw ? JSON.parse(raw) : {};
            prefs.fullName = data.fullName;
            prefs.phone = data.whatsapp;
            prefs.theme = data.theme;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
            // indicate save
            const ev = new CustomEvent('prefs:saved');
            window.dispatchEvent(ev);
            toast.push({ title: 'Preferences saved.' });
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
                    {t(`profilePage`).title}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {t(`profilePage`).subtitle}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Contact Information */}
                <div className="bg-card rounded-lg border p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                        <User className="w-5 h-5 text-primary" />
                        <h2 className="font-medium text-card-foreground">
                            {t(`profilePage`).contactInformation}
                        </h2>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-2">
                                {t(`profilePage`).fullName}
                            </label>
                            <Input
                                {...register('fullName')}
                                placeholder="Masukkan nama lengkap"
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
                                {t(`profilePage`).whatsappNumber}
                            </label>
                            <Input
                                {...register('whatsapp')}
                                placeholder="+62 812 3456 7890"
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
                    <div className="flex items-center gap-2 mb-4">
                        <Sun className="w-5 h-5 text-primary" />
                        <h2 className="font-medium text-card-foreground">
                            {t(`profilePage`).appearance}
                        </h2>
                    </div>

                    <RadioGroup
                        value={currentTheme}
                        onValueChange={(v) => handleThemeChange(v)}
                        className="space-y-0"
                    >
                        <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <Sun className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{t(`profilePage`).lightTheme}</span>
                            </div>
                            <RadioGroupItem value="light" />
                        </label>

                        <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <Moon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{t(`profilePage`).darkTheme}</span>
                            </div>
                            <RadioGroupItem value="dark" />
                        </label>

                        <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">System</span>
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
                            {t('profilePage').language}
                        </h2>
                    </div>
                    <LanguageSwitcher />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                    <Button type="submit" className="w-full h-11">
                        <Save className="w-4 h-4 mr-2" />
                        {t("profilePage").saveChanges}
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            onClick={goLogin}
                            className="h-11"
                        >
                            <LogIn className="w-4 h-4 mr-2" />
                            {t("profilePage").login}
                        </Button>

                        <Button
                            onClick={becomeBusiness}
                            variant="secondary"
                            className="h-11"
                        >
                            <Building className="w-4 h-4 mr-2" />
                            {t("profilePage").becomeBusiness}
                        </Button>
                    </div>

                    {/* Reset Dialog */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="w-full h-11 text-muted-foreground">
                                {t("profilePage").reset}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reset pengaturan?</DialogTitle>
                                <DialogDescription>
                                    Apakah Anda yakin ingin menghapus semua pengaturan yang tersimpan? Tindakan ini tidak dapat dibatalkan.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Batal</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            localStorage.removeItem(STORAGE_KEY);
                                            toast.push({ title: 'Pengaturan dihapus' });
                                        }}
                                    >
                                        Konfirmasi
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </form>
        </div>
    );
}