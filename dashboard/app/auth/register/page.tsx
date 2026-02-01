'use client'

import React, { useState, useEffect } from 'react';
import {
    CheckCircle2,
    Store,
    User,
    Mail,
    Lock,
    ArrowRight,
    ArrowLeft,
    Check,
    X,
    Loader2,
    ShieldCheck,
    Phone,
    FileText,
    Smartphone
} from "lucide-react";
import { cn, getCookie } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ReusableForm } from '@/components/ui/reuseable-form';
import { fieldRegisterStep1, fieldRegisterStep2, registerStep1Schema, registerStep2Schema } from '@/components/auth/register/schema';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/apis/base';
import { OtpInputVerification } from '@/components/auth/register/OtpInputVerification';
import { RegisterStep1 } from '@/components/auth/register/RegisterStep1';
import { RegisterStep2 } from '@/components/auth/register/RegisterStep2';

const PLANS = [
    {
        id: 'TRIAL',
        name: 'Free Trial',
        price: 'Rp 0',
        period: '/ 14 hari',
        description: 'Cocok untuk mencoba fitur dasar sebelum komitmen.',
        features: [
            { label: 'Max 1 Outlet', allowed: true },
            { label: 'Max 10 Produk', allowed: true },
            { label: 'Max 1 Staff (Owner Only)', allowed: true },
            { label: 'Export Laporan', allowed: false },
            { label: 'Support Email', allowed: true },
        ],
        color: 'border-slate-200 hover:border-slate-300',
        badge: 'GRATIS'
    },
    {
        id: 'BASIC',
        name: 'Basic Plan',
        price: 'Rp 99.000',
        period: '/ bulan',
        description: 'Untuk usaha kecil yang mulai berkembang.',
        features: [
            { label: 'Max 2 Outlet', allowed: true },
            { label: 'Max 100 Produk', allowed: true },
            { label: 'Max 3 Staff', allowed: true },
            { label: 'Export Laporan', allowed: true },
            { label: 'Support Email', allowed: true },
        ],
        color: 'border-blue-200 bg-blue-50/50 hover:border-blue-300',
        badge: 'POPULAR'
    },
    {
        id: 'PRO',
        name: 'Pro Plan',
        price: 'Rp 199.000',
        period: '/ bulan',
        description: 'Tanpa batasan untuk pertumbuhan maksimal.',
        features: [
            { label: 'Unlimited Outlet', allowed: true },
            { label: 'Unlimited Produk', allowed: true },
            { label: 'Unlimited Staff', allowed: true },
            { label: 'Export Laporan Lengkap', allowed: true },
            { label: 'Prioritas WhatsApp Support', allowed: true },
        ],
        color: 'border-indigo-200 bg-indigo-50/50 hover:border-indigo-300',
        badge: 'BEST VALUE'
    }
];

export default function RegistrationPage() {
    const searchParams = useSearchParams();
    const router = useRouter()

    const steps = searchParams.get('step');
    const providers = searchParams.get('provider');
    const names = searchParams.get('name');

    const [provider] = useState(() => {
        if (!providers) return null;
        return providers as 'email' | 'google'
    });

    const [logoutLoading, setLogoutLoading] = useState(false)

    const [step, setStep] = useState(() => {
        const step = Number(steps)
        if (!step || isNaN(step)) return 1;
        if (provider) return 2;
        return step
    });

    const [formData, setFormData] = useState({
        businessName: '',
        description: '',
        selectedPlan: 'TRIAL',
        provider: 'email'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [timer, setTimer] = useState(0);

    const handleLogout = async () => {
        try {
            setLogoutLoading(true)
            await apiClient.post('/auth/logout');
            setStep(1)
            router.replace('/auth/register')
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

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    // 4. Final Submit (Create Business & Plan)
    const handleSubmit = async () => {
        setIsSubmitting(true);

        // Payload Final
        const payload = {
            user: {
                provider: formData.provider,
                googleId: formData.provider === 'google' ? 'some-google-id' : undefined
            },
            business: {
                name: formData.businessName,
                description: formData.description,
                subscriptionPlan: formData.selectedPlan
            }
        };

        console.log("Submitting Final Payload:", payload);

        setTimeout(() => {
            setIsSubmitting(false);
            alert(`Registrasi Sukses!\nMetode: ${formData.provider.toUpperCase()}\nPlan: ${formData.selectedPlan}`);
            // Redirect logic here
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">

            {/* LEFT SIDE: BANNER */}
            <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute left-0 bottom-0 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                            <Store className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">BossApp</span>
                    </div>
                    <h1 className="text-4xl font-bold leading-tight mb-4">
                        Kelola Bisnis Anda <br /> <span className="text-indigo-400">Lebih Profesional.</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-md">
                        Satu platform untuk semua kebutuhan operasional bisnis. Mulai dari kasir, inventori, hingga laporan keuangan.
                    </p>
                </div>
            </div>

            <div className="flex-1 flex max-h-[100dvh] flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
                <div className="w-full max-w-lg">

                    {!showOtpInput && (
                        <div className="flex items-center justify-between mb-8 px-2">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center">
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                                        step === s ? "border-indigo-600 bg-indigo-600 text-white" :
                                            step > s ? "border-indigo-600 bg-white text-indigo-600" :
                                                "border-slate-200 bg-white text-slate-400"
                                    )}>
                                        {step > s ? <Check className="h-4 w-4" /> : s}
                                    </div>
                                    {s < 3 && (
                                        <div className={cn(
                                            "w-12 h-0.5 mx-2 transition-colors",
                                            step > s ? "bg-indigo-600" : "bg-slate-200"
                                        )}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* FORM CONTENT */}
                    <div className="bg-white p-0 md:p-8 rounded-2xl md:shadow-xl md:border border-slate-100">

                        {step === 1 && showOtpInput && (
                            <OtpInputVerification />
                        )}

                        {/* --- STEP 1: AKUN OWNER (FORM AWAL) --- */}
                        {step === 1 && !showOtpInput && (
                            <RegisterStep1 />
                        )}

                        {step === 2 && (
                            <RegisterStep2
                                handleLogout={handleLogout}
                                handleNext={handleNext}
                                logoutLoading={logoutLoading}
                                name={names ?? ''}
                            />
                        )}

                        {/* --- STEP 3: PILIH PLAN --- */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl font-bold text-slate-900">Pilih Paket Langganan</h2>
                                    <p className="text-slate-500 text-sm">Sesuaikan dengan skala bisnis Anda saat ini.</p>
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                    {PLANS.map((plan) => (
                                        <div
                                            key={plan.id}
                                            onClick={() => setFormData({ ...formData, selectedPlan: plan.id })}
                                            className={cn(
                                                "relative border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md",
                                                formData.selectedPlan === plan.id
                                                    ? "border-indigo-600 bg-white ring-1 ring-indigo-600 shadow-md"
                                                    : `${plan.color} bg-white border-transparent`
                                            )}
                                        >
                                            {plan.badge && (
                                                <span className={cn(
                                                    "absolute top-0 right-0 px-3 py-1 text-[10px] font-bold rounded-bl-xl rounded-tr-lg text-white",
                                                    formData.selectedPlan === plan.id ? "bg-indigo-600" : "bg-slate-400"
                                                )}>
                                                    {plan.badge}
                                                </span>
                                            )}

                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{plan.name}</h3>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-lg font-extrabold text-slate-900">{plan.price}</span>
                                                        <span className="text-xs text-slate-500 font-medium">{plan.period}</span>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                                    formData.selectedPlan === plan.id ? "border-indigo-600" : "border-slate-300"
                                                )}>
                                                    {formData.selectedPlan === plan.id && <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />}
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-500 mb-3">{plan.description}</p>

                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                {plan.features.slice(0, 4).map((feat, idx) => (
                                                    <div key={idx} className="flex items-center text-xs text-slate-600">
                                                        {feat.allowed ? (
                                                            <CheckCircle2 className="h-3 w-3 mr-1.5 text-green-500 flex-shrink-0" />
                                                        ) : (
                                                            <X className="h-3 w-3 mr-1.5 text-slate-300 flex-shrink-0" />
                                                        )}
                                                        <span className={!feat.allowed ? "text-slate-400 line-through" : ""}>{feat.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-slate-50 p-3 rounded-lg flex items-start gap-3 border border-slate-100">
                                    <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-600">
                                        <span className="font-bold">Jaminan Keamanan Data.</span> Data Anda terenkripsi dan dapat diexport kapan saja.
                                    </p>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <Button variant="secondary" onClick={handleBack} disabled={isSubmitting}>
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                                    </Button>
                                    <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                                        {formData.selectedPlan === 'TRIAL' ? 'Mulai Gratis Sekarang' : 'Lanjut ke Pembayaran'}
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>

                    <p className="text-center text-xs text-slate-400 mt-8">
                        &copy; 2024 BossApp SaaS. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}