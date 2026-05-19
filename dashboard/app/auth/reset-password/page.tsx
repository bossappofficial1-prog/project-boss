'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apis/base';
import { AlertCircle, CheckCircle2, Lock, Loader2 } from 'lucide-react';

function ResetPasswordForm() {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [token, setToken] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const router = useRouter();
    const searchParams = useSearchParams();

    const getPasswordStrength = (password: string) => {
        const requirements = [
            { test: /.{8,}/, label: 'Minimal 8 karakter' },
            { test: /[A-Z]/, label: 'Huruf besar (A-Z)' },
            { test: /[a-z]/, label: 'Huruf kecil (a-z)' },
            { test: /\d/, label: 'Angka (0-9)' },
        ];

        return requirements.map(req => ({
            ...req,
            met: req.test.test(password)
        }));
    };

    const passwordStrength = getPasswordStrength(formData.password);

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError('Token reset password tidak valid atau sudah kedaluwarsa');
        }
    }, [searchParams]);

    useEffect(() => {
        if (success && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (success && countdown === 0) {
            router.push('/auth/login');
        }
    }, [success, countdown, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!token) {
            setError('Token reset password tidak valid');
            setIsLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Password tidak cocok');
            setIsLoading(false);
            return;
        }

        try {
            await apiClient.post('/auth/reset-password', {
                token,
                password: formData.password,
            });
            setSuccess('Password berhasil direset! Anda akan diarahkan ke halaman login.');
            setIsSubmitted(true);
        } catch (err: any) {
            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                const errorMessages = err.response.data.errors.map((error: any) => error.message).join('. ');
                setError(errorMessages);
            } else {
                setError(err.response?.data?.message || err.message || 'Terjadi kesalahan saat mereset password');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!token && !error) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground">Memverifikasi token...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto mb-6 flex justify-center">
                        <Image
                            src="/Logo Boss.png"
                            alt="BOSS Logo"
                            width={200}
                            height={200}
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        Atur Kata Sandi Baru
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Masukkan kata sandi baru untuk akun Anda
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="bg-card rounded-lg shadow-xl p-8 space-y-6 border border-border">
                        {success && (
                            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {success} <span className="font-medium">({countdown})</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            </div>
                        )}

                        {!success && (
                            <>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                                        Kata Sandi Baru <span className="text-destructive">*</span>
                                    </label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        autoComplete="new-password"
                                        required
                                        disabled={isSubmitted}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Masukkan kata sandi baru"
                                    />
                                </div>

                                {formData.password && (
                                    <div className="bg-muted/50 rounded-lg p-3 border border-border">
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Persyaratan Kata Sandi:</p>
                                        <div className="space-y-1">
                                            {passwordStrength.map((req, index) => (
                                                <div key={index} className="flex items-center text-xs">
                                                    <div className={`w-3 h-3 rounded-full mr-2 flex-shrink-0 ${req.met ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                                                    <span className={req.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}>
                                                        {req.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                                        Konfirmasi Kata Sandi Baru <span className="text-destructive">*</span>
                                    </label>
                                    <PasswordInput
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        autoComplete="new-password"
                                        required
                                        disabled={isSubmitted}
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        placeholder="Konfirmasi kata sandi baru"
                                    />
                                </div>

                                <div>
                                    <Button
                                        type="submit"
                                        disabled={isLoading || !token || isSubmitted}
                                        className="w-full"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Mengatur Ulang Kata Sandi...
                                            </>
                                        ) : isSubmitted ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4" />
                                                Kata Sandi Berhasil Diatur
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="h-4 w-4" />
                                                Atur Ulang Kata Sandi
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}

                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                Ingat kata sandi Anda?{' '}
                                <Link href="/auth/login" className="font-medium text-primary hover:underline">
                                    Masuk
                                </Link>
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Memuat...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
