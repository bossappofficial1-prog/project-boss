'use client'

import { useState, useEffect, useCallback } from 'react';
import {
    Check,
    ShieldCheck,
} from "lucide-react";
import { cn } from '@/lib/utils';
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
import { PlanCard } from './plan-card';

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
                    <div className="flex items-center mb-8 px-2">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={cn(
                                    "flex items-center",
                                    s < 3 && "flex-1"
                                )}
                            >
                                {/* Circle */}
                                <div
                                    className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2 shrink-0",
                                        step === s
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : step > s
                                                ? "border-primary bg-background text-primary"
                                                : "border-border bg-background text-muted-foreground"
                                    )}
                                >
                                    {step > s ? <Check className="h-4 w-4" /> : s}
                                </div>

                                {/* Line */}
                                {s < 3 && (
                                    <div
                                        className={cn(
                                            "flex-1 h-0.5",
                                            step > s ? "bg-primary" : "bg-border"
                                        )}
                                    />
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
                                    subscriptionPlans?.map((plan) => <PlanCard key={plan.code} plan={plan} isSelected={formData.selectedPlan == plan.code} onSelectedChange={(plan) => setFormData(prev => ({ ...prev, selectedPlan: plan }))} />)
                                )}
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
