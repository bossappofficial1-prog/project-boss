'use client';

import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from '@/hooks/useI18n';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { useSnackbar } from '@/hooks/useSnackbar';

const SW_SCOPE = '/serwist/';
const SW_SCRIPT_URL = `/serwist/sw.js?v=${process.env.NEXT_PUBLIC_SW_VERSION ?? '20260412'}`;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
}

async function getPushRegistration() {
    if (!("serviceWorker" in navigator)) {
        throw new Error("Service Worker tidak didukung browser ini");
    }

    let registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);

    if (!registration) {
        registration = await navigator.serviceWorker.register(SW_SCRIPT_URL, { scope: SW_SCOPE });
    }

    if (registration.active) {
        return registration;
    }

    const readyWithTimeout = Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Service Worker belum aktif. Coba refresh halaman.")), 10000);
        }),
    ]);

    return await readyWithTimeout;
}

export default function NotificationButton({ guestPhone, guestName }: { guestPhone?: string, guestName?: string }) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    const snackbar = useSnackbar();
    const t = useTranslations('profilePage');

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
            getPushRegistration().then((reg) => {
                reg.pushManager.getSubscription().then((sub) => {
                    if (sub) setIsSubscribed(true);
                });
            }).catch(() => {
                setIsSupported(false);
            });
        }
    }, []);

    const subscribeMutation = useMutation({
        mutationFn: async () => {
            const registration = await getPushRegistration();
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;

            if (!vapidKey) throw new Error(t('notification.vapidMissing') || 'VAPID key tidak ditemukan');

            // Buat subscription di browser
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            });

            // Simpan data subscription ke backend
            const payload = { subscription: sub.toJSON(), guestPhone, guestName };
            await api.post('/push-notification/subscribe', payload);

            return true;
        },
        onSuccess: () => {
            snackbar.success(t('notification.subscribeSuccess') || 'Notifikasi berhasil diaktifkan');
        },
        onError: async (err: any) => {
            // ROLLBACK: Jika API gagal, kembalikan UI ke state mati
            setIsSubscribed(false);

            // Bersihkan sisa subscription di browser jika backend gagal simpan
            try {
                const registration = await getPushRegistration();
                const sub = await registration.pushManager.getSubscription();
                if (sub) await sub.unsubscribe();
            } catch (e) { /* Abaikan */ }

            snackbar.error(err?.message || t('notification.error') || 'Terjadi kesalahan saat mengaktifkan');
        }
    });

    const unsubscribeMutation = useMutation({
        mutationFn: async () => {
            const registration = await getPushRegistration();
            const sub = await registration.pushManager.getSubscription();

            if (sub) {
                // 1. Hapus dari backend
                await api.post('/push-notification/unsubscribe', { endpoint: sub.endpoint });
                // 2. Hapus dari browser
                await sub.unsubscribe();
            }
            return false;
        },
        onSuccess: () => {
            snackbar.success(t('notification.unsubscribeSuccess') || 'Notifikasi berhasil dinonaktifkan');
        },
        onError: (err: any) => {
            // ROLLBACK: Jika API gagal, kembalikan UI ke state hidup
            setIsSubscribed(true);
            snackbar.error(err?.message || t('notification.error') || 'Terjadi kesalahan saat menonaktifkan');
        }
    });

    const isProcessing = subscribeMutation.isPending || unsubscribeMutation.isPending;

    const handleToggle = async () => {
        if (isProcessing) return;

        if (isSubscribed) {
            // OPTIMISTIC UPDATE: Matikan UI seketika
            setIsSubscribed(false);
            unsubscribeMutation.mutate();
        } else {
            let currentPermission = Notification.permission;

            if (currentPermission === 'default') {
                currentPermission = await Notification.requestPermission();
                setPermission(currentPermission);
            }

            if (currentPermission === 'granted') {
                setIsSubscribed(true);
                subscribeMutation.mutate();
            } else {
                snackbar.error(t('notification.permissionDenied') || 'Izin notifikasi ditolak. Aktifkan di pengaturan browser.');
            }
        }
    };

    if (!isSupported) {
        return (
            <p className="text-sm text-muted-foreground">
                {t('notification.unsupported') || 'Browser tidak mendukung push notification'}
            </p>
        );
    }

    return (
        <div className="rounded-xl border border-border/60 p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 transition-colors duration-200">
                    {isSubscribed ? <Bell className="w-5 h-5 text-primary animate-in zoom-in" /> : <BellOff className="w-5 h-5 text-muted-foreground/80" />}
                </div>
                <div>
                    <p className="text-sm font-medium">{t('notification.title') || 'Notifikasi'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {permission === 'denied'
                            ? (t('notification.blocked') || 'Notifikasi diblokir oleh browser')
                            : (isSubscribed
                                ? (t('notification.active') || 'Notifikasi aktif')
                                : (t('notification.inactive') || 'Notifikasi tidak aktif'))}
                    </p>
                </div>
            </div>

            <div className="flex-shrink-0">
                <Button
                    size="sm"
                    onClick={handleToggle}
                    disabled={permission === 'denied' || !guestPhone}
                    aria-pressed={isSubscribed}
                    variant={isSubscribed ? "outline" : "default"}
                    className="transition-all duration-200"
                >
                    {isSubscribed
                        ? (t('notification.disable') || 'Nonaktifkan')
                        : (t('notification.enable') || 'Aktifkan')}
                </Button>
            </div>
        </div>
    );
}