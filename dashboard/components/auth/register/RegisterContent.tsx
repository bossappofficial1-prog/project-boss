'use client'

import React, { useState, useEffect, useCallback } from 'react';
import {
    CheckCircle2,
    Store,
    ArrowLeft,
    Check,
    X,
    ShieldCheck,
} from "lucide-react";
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/apis/base';
import { OtpInputVerification } from '@/components/auth/register/OtpInputVerification';
import { RegisterStep1 } from '@/components/auth/register/RegisterStep1';
import { RegisterStep2 } from '@/components/auth/register/RegisterStep2';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlan';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';

import Image from 'next/image';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const getPlanColor = (code: string, isSelected: boolean) => {
    if (isSelected) return "border-red-600 bg-white ring-1 ring-red-600 shadow-md";

    switch (code) {
        case 'PRO': return "border-red-200 bg-red-50/30 hover:border-red-300";
        case 'BASIC': return "border-slate-200 bg-slate-50/30 hover:border-slate-300";
        default: return "border-slate-200 hover:border-slate-300";
    }
};

type PlanFeatures = {
    maxOutlets: number;
    maxProducts: number;
    maxStaff: number;
    canExportReport: boolean;
    supportLevel: 'EMAIL' | 'WHATSAPP' | 'PRIORITY';
};


const transformFeaturesToDisplay = (features: PlanFeatures) => {
    return [
        {
            label: features.maxOutlets === -1 ? 'Outlet Tanpa Batas' : `Maks ${features.maxOutlets} Outlet`,
            allowed: true
        },
        {
            label: features.maxProducts === -1 ? 'Produk Tanpa Batas' : `Maks ${features.maxProducts} Produk`,
            allowed: true
        },
        {
            label: features.maxStaff === -1 ? 'Staff Tanpa Batas' : `Maks ${features.maxStaff} Staff`,
            allowed: true
        },
        {
            label: 'Ekspor Laporan',
            allowed: features.canExportReport
        },
        {
            label: features.supportLevel === 'PRIORITY' ? 'Dukungan Prioritas' : features.supportLevel === 'WHATSAPP' ? 'Dukungan WhatsApp' : 'Dukungan Email',
            allowed: true
        },
    ];
};

export default function RegistrationContent() {
    const searchParams = useSearchParams();
    const router = useRouter()
    const queryClient = useQueryClient()
    const { data: subscriptionPlans, isLoading } = useSubscriptionPlans()

    // Derive all params from URL on every render — no local state needed
    const stepParam = Number(searchParams.get('step'));
    const providerParam = searchParams.get('provider') as 'email' | 'google' | null;
    const nameParam = searchParams.get('name') ?? '';
    const isVerifiedParam = searchParams.get('isVerified');
    const emailParam = searchParams.get('email') ?? '';

    // Bug 1 & 2 fix: derive step reactively from URL params
    const step = !isNaN(stepParam) && stepParam > 0 ? stepParam : providerParam ? 2 : 1;

    const [formData, setFormData] = useState({
        businessName: '',
        description: '',
        selectedPlan: 'TRIAL',
        provider: 'email'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);

    // Bug 3 fix: Google users are pre-verified — never show OTP modal for them
    const [showOtpInput, setShowOtpInput] = useState(() => {
        if (providerParam === 'google') return false;
        if (isVerifiedParam) return isVerifiedParam === 'false';
        return false;
    });

    // Bug 4 fix: surface business name error back to Step 2 form
    const [businessNameError, setBusinessNameError] = useState<string | null>(null);

    const [timer, setTimer] = useState(0);

    const handleOAuthResult = useCallback((payload: { redirect?: unknown; error?: unknown }) => {
        setIsSubmitting(false);

        if (typeof payload.error === 'string' && payload.error) {
            toast.error(payload.error);
            return;
        }

        queryClient.removeQueries({ queryKey: ['auth-me'] });
        try { sessionStorage.removeItem('auth-me-cache-v2'); } catch { }

        const nextPath = typeof payload.redirect === 'string' ? payload.redirect : '/auth/register?step=2&provider=google';
        router.push(nextPath);
    }, [queryClient, router]);

    useEffect(() => {
        const handleOAuthMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type !== 'google-oauth-callback') return;

            handleOAuthResult(event.data);
        };

        const handleOAuthStorage = (event: StorageEvent) => {
            if (event.key !== 'google-oauth-callback' || !event.newValue) return;

            try {
                handleOAuthResult(JSON.parse(event.newValue));
                localStorage.removeItem('google-oauth-callback');
            } catch { }
        };

        window.addEventListener('message', handleOAuthMessage);
        window.addEventListener('storage', handleOAuthStorage);

        const channel = 'BroadcastChannel' in window ? new BroadcastChannel('google-oauth') : null;
        channel?.addEventListener('message', (event) => {
            if (event.data?.type !== 'google-oauth-callback') return;
            handleOAuthResult(event.data);
        });

        return () => {
            window.removeEventListener('message', handleOAuthMessage);
            window.removeEventListener('storage', handleOAuthStorage);
            channel?.close();
        };
    }, [handleOAuthResult]);

    const handleGoogleLogin = () => {
        setIsSubmitting(true);
        const googleLoginUrl = '/auth/google-popup-start';
        const popupWidth = 480;
        const popupHeight = 640;
        const left = window.screenX + (window.outerWidth - popupWidth) / 2;
        const top = window.screenY + (window.outerHeight - popupHeight) / 2;

        const popup = window.open(
            googleLoginUrl,
            'google-oauth-login',
            `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
        );

        if (!popup) {
            window.location.href = googleLoginUrl;
            return;
        }

        popup.focus();

        const popupClosedCheck = window.setInterval(() => {
            if (popup.closed) {
                window.clearInterval(popupClosedCheck);
                setIsSubmitting(false);
                return;
            }

            try {
                const popupUrl = new URL(popup.location.href);
                if (popupUrl.origin !== window.location.origin) return;

                if (popupUrl.pathname === '/auth/oauth-popup' || popupUrl.pathname === '/auth/google-popup-start') return;

                const fallbackRedirect = `${popupUrl.pathname}${popupUrl.search}${popupUrl.hash}`;
                popup.close();
                window.clearInterval(popupClosedCheck);
                handleOAuthResult({ redirect: fallbackRedirect });
            } catch { }
        }, 500);
    };

    const handleRegister = async (formData: any) => {
        try {
            setIsSubmitting(true)
            await apiClient.post('/auth/register', {
                name: formData.name,
                email: (formData.email as string).toLocaleLowerCase(),
                phone: formData.phone,
                password: formData.password,
            });

            setShowOtpInput(true)
            router.push(`/auth/register?step=1&isVerified=false&email=${formData.email}`)
        } catch (err: any) {
            throw err
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const businessName = searchParams.get("businessName");
        if (businessName) {
            setFormData(prev => ({ ...prev, businessName }));
        }
    }, [searchParams]);

    const handleLogout = async () => {
        try {
            setLogoutLoading(true)
            await apiClient.post('/auth/logout');
            setShowOtpInput(false)
            setFormData({ description: '', businessName: '', provider: '', selectedPlan: '' })
            router.replace('/auth/register?step=1')
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setLogoutLoading(false)
        }
    };

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const navigateToStep = (targetStep: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("step", String(targetStep));
        router.push(`/auth/register?${params.toString()}`);
    };

    const handleNext = () => navigateToStep(step + 1);
    const handleBack = () => navigateToStep(step - 1);

    // 4. Final Submit (Create Business & Plan)
    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setBusinessNameError(null);

            const { data } = await apiClient.post('/auth/onboarding/complete', {
                businessName: formData.businessName,
                description: formData.description,
                selectedPlan: formData.selectedPlan
            });

            if (!data.success) {
                throw new Error(data.message || 'Gagal menyelesaikan registrasi');
            }

            const invoiceId = data.data?.invoice?.id;

            if (formData.selectedPlan === 'TRIAL') {
                router.push('/owner');
            } else if (invoiceId) {
                router.push(`/subscription/payment/${invoiceId}`);
            } else {
                toast.error('Invoice tidak ditemukan. Silakan hubungi support.');
            }
        } catch (error: any) {
            const msg: string = error?.response?.data?.message || error?.message || '';

            // Bug 6 fix: jika bisnis sudah ada (misal double submit), langsung redirect ke dashboard
            if (msg.includes('Bisnis sudah terdaftar')) {
                router.push('/owner');
                return;
            }

            // Bug 4 fix: nama bisnis sudah dipakai → kembali ke step 2 dengan error inline
            if (msg.includes('sudah tersedia') || msg.toLowerCase().includes('businessname')) {
                setBusinessNameError(msg);
                navigateToStep(2);
                return;
            }

            toast.error(msg || 'Gagal menyelesaikan registrasi. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthSplitLayout>
            <div className="w-full max-w-[440px] space-y-6">

                {/* Logo View */}
                <div className="flex justify-center mb-6">
                    <Image
                        src="/Logo Boss.png"
                        alt="Logo BOSS"
                        width={140}
                        height={50}
                        className="h-16 w-auto object-contain"
                        priority
                    />
                </div>

                    {!showOtpInput && (
                        <div className="flex items-center justify-between mb-8 px-2">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center">
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                                        step === s ? "border-red-600 bg-red-600 text-white" :
                                            step > s ? "border-red-600 bg-white text-red-600" :
                                                "border-slate-200 bg-white text-slate-400"
                                    )}>
                                        {step > s ? <Check className="h-4 w-4" /> : s}
                                    </div>
                                    {s < 3 && (
                                        <div className={cn(
                                            "w-12 h-0.5 mx-2 transition-colors",
                                            step > s ? "bg-red-600" : "bg-slate-200"
                                        )}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* FORM CONTENT */}
                    <div className="space-y-6">

                        {step === 1 && showOtpInput && (
                            <OtpInputVerification
                                setStep={(s) => { setShowOtpInput(false); navigateToStep(s); }}
                                email={emailParam}
                            />
                        )}

                        {step === 1 && !showOtpInput && (
                            <RegisterStep1
                                handleGoogleLogin={handleGoogleLogin}
                                handleNext={handleRegister}
                                isLoading={isSubmitting}
                            />
                        )}

                        {step === 2 && (
                            <RegisterStep2
                                defaultValues={{ ...formData }}
                                handleLogout={handleLogout}
                                handleNext={(values) => {
                                    setBusinessNameError(null);
                                    setFormData(prev => ({
                                        ...prev,
                                        description: values.description!,
                                        businessName: values.businessName
                                    }))
                                    handleNext()
                                }}
                                logoutLoading={logoutLoading}
                                isSubmitting={isSubmitting}
                                name={nameParam}
                                businessNameError={businessNameError}
                            />
                        )}

                        {/* --- STEP 3: PILIH PLAN --- */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl font-bold text-slate-900">Pilih Paket Langganan</h2>
                                    <p className="text-slate-500 text-sm">Sesuaikan dengan skala bisnis Anda saat ini.</p>
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300/60 scrollbar-track-transparent">
                                    {isLoading ? (
                                        <p className="text-sm text-muted-foreground">Memuat data...</p>
                                    ) : (
                                        subscriptionPlans?.map((plan) => {
                                            const visualFeatures = transformFeaturesToDisplay(plan.features as any)
                                            const isSelected = formData.selectedPlan === plan.code

                                            const hasPromo = plan.promo && plan.promo > 0
                                            const finalPrice = hasPromo ? plan.promo : plan.price
                                            const discount = hasPromo
                                                ? Math.round(((plan.price - plan.promo) / plan.price) * 100)
                                                : 0

                                            return (
                                                <div
                                                    key={plan.code}
                                                    onClick={() =>
                                                        setFormData({ ...formData, selectedPlan: plan.code })
                                                    }
                                                    className={cn(
                                                        "relative rounded-xl border p-4 cursor-pointer transition-all duration-200",
                                                        "hover:shadow-md hover:-translate-y-[1px]",
                                                        isSelected
                                                            ? "border-red-500 bg-red-50/40 shadow-sm"
                                                            : "border-slate-200 bg-white hover:border-slate-300"
                                                    )}
                                                >
                                                    {/* Badge Popular */}
                                                    {plan.isPopular && (
                                                        <span
                                                            className={cn(
                                                                "absolute -top-2 right-3 px-3 py-1 text-[10px] font-bold rounded-full shadow-sm",
                                                                isSelected
                                                                    ? "bg-red-600 text-white"
                                                                    : "bg-amber-500 text-white"
                                                            )}
                                                        >
                                                            POPULER
                                                        </span>
                                                    )}

                                                    {/* Header */}
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-semibold text-slate-900 text-sm">
                                                                {plan.name}
                                                            </h3>

                                                            {/* PRICE */}
                                                            <div className="mt-1 flex items-end gap-2 flex-wrap">
                                                                {hasPromo && (
                                                                    <span className="text-xs line-through text-slate-400">
                                                                        {formatCurrency(plan.price)}
                                                                    </span>
                                                                )}

                                                                <span className="text-xl font-bold text-slate-900">
                                                                    {formatCurrency(finalPrice)}
                                                                </span>

                                                                <span className="text-xs text-slate-500">
                                                                    / {plan.durationDays} hari
                                                                </span>

                                                                {hasPromo && (
                                                                    <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                                        -{discount}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Radio Indicator */}
                                                        <div
                                                            className={cn(
                                                                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                                                isSelected
                                                                    ? "border-red-600"
                                                                    : "border-slate-300"
                                                            )}
                                                        >
                                                            {isSelected && (
                                                                <div className="h-2.5 w-2.5 rounded-full bg-red-600" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Features */}
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-3 border-t border-slate-100">
                                                        {visualFeatures.slice(0, 4).map((feat, idx) => (
                                                            <div key={idx} className="flex items-center text-xs">
                                                                {feat.allowed ? (
                                                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-500 flex-shrink-0" />
                                                                ) : (
                                                                    <X className="h-3.5 w-3.5 mr-1.5 text-slate-300 flex-shrink-0" />
                                                                )}

                                                                <span
                                                                    className={cn(
                                                                        "truncate",
                                                                        feat.allowed
                                                                            ? "text-slate-700"
                                                                            : "text-slate-400 line-through"
                                                                    )}
                                                                >
                                                                    {feat.label}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>

                                <div className="bg-slate-50 p-3 rounded-lg flex items-start gap-3 border border-slate-100">
                                    <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-600">
                                        <span className="font-bold">Jaminan Keamanan Data.</span> Data Anda terenkripsi dan dapat diexport kapan saja.
                                    </p>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        disabled={isSubmitting}
                                        className="px-6 h-12 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
                                    >
                                        Kembali
                                    </button>
                                    <button
                                        type="button"
                                        className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 hover:shadow-red-600/30 hover:-translate-y-[1px] transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting && (
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        )}
                                        {isSubmitting ? 'Memproses...' : formData.selectedPlan === 'TRIAL' ? 'Mulai Gratis Sekarang' : 'Lanjut ke Pembayaran'}
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
        </AuthSplitLayout>
    );
}
