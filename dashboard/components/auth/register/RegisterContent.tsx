'use client'

import { useState, useEffect } from 'react';
import {
    Check,
    ShieldCheck,
    AlertCircle,
    Loader2,
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
import { Button } from '@/components/ui/button';

export default function RegistrationContent() {
    const searchParams = useSearchParams();
    const router = useRouter()
    const queryClient = useQueryClient()
    const { data: subscriptionPlans, isLoading } = useSubscriptionPlans()

    const stepParam = Number(searchParams.get('step'));
    const providerParam = searchParams.get('provider') as 'email' | 'google' | null;
    const nameParam = searchParams.get('name') ?? '';
    const isVerifiedParam = searchParams.get('isVerified');
    const emailParam = searchParams.get('email') ?? '';

    const step = !isNaN(stepParam) && stepParam > 0 ? stepParam : providerParam ? 2 : 1;

    const [formData, setFormData] = useState({
        businessName: '',
        description: '',
        selectedPlan: 'TRIAL',
        provider: 'email'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);

    const [showOtpInput, setShowOtpInput] = useState(() => {
        if (providerParam === 'google') return false;
        if (isVerifiedParam) return isVerifiedParam === 'false';
        return false;
    });

    const [businessNameError, setBusinessNameError] = useState<string | null>(null);
    const [oauthError, setOauthError] = useState<string | null>(null);

    const [timer, setTimer] = useState(0);

    useEffect(() => {
        const err = searchParams.get('error');
        if (err === 'google_failed') {
            setOauthError('Login Google gagal. Silakan coba lagi atau gunakan email dan password.');
        }
    }, [searchParams]);

    const handleGoogleLogin = () => {
        setIsSubmitting(true);
        window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google?redirect=${encodeURIComponent('/owner')}&from=register`;
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

            if (msg.includes('Bisnis sudah terdaftar')) {
                router.push('/owner');
                return;
            }

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

                {oauthError && (
                    <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{oauthError}</span>
                    </div>
                )}

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

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center md:text-left">
                                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Pilih Paket Langganan</h2>
                                <p className="text-sm text-muted-foreground mt-1">Sesuaikan dengan skala bisnis Anda saat ini.</p>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {isLoading ? (
                                    <p className="text-sm text-muted-foreground">Memuat data...</p>
                                ) : (
                                    subscriptionPlans?.map((plan) => <PlanCard key={plan.code} plan={plan} isSelected={formData.selectedPlan == plan.code} onSelectedChange={(plan) => setFormData(prev => ({ ...prev, selectedPlan: plan }))} />)
                                )}
                            </div>

                            <div className="pt-2 flex gap-3">
                                <Button
                                    type="button"
                                    onClick={handleBack}
                                    disabled={isSubmitting}
                                    variant="outline"
                                >
                                    Kembali
                                </Button>
                                <Button
                                    type="button"
                                    className="flex-1"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {isSubmitting ? 'Memproses...' : formData.selectedPlan === 'TRIAL' ? 'Mulai Gratis Sekarang' : 'Lanjut ke Pembayaran'}
                                </Button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AuthSplitLayout>
    );
}
