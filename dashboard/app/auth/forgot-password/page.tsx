'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apis/base';
import { AlertCircle, CheckCircle2, Mail, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            await apiClient.post('/auth/forgot-password', { email });
            setSuccess('Link atur ulang kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk Anda.');
        } catch (err: any) {
            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                const errorMessages = err.response.data.errors.map((error: any) => error.message).join('. ');
                setError(errorMessages);
            } else {
                setError(err.response?.data?.message || err.message || 'Terjadi kesalahan saat mengirim email reset password');
            }
        } finally {
            setIsLoading(false);
        }
    };

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
                        Lupa Kata Sandi
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Masukkan email Anda untuk menerima link atur ulang kata sandi
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="bg-card rounded-lg shadow-xl p-8 space-y-6 border border-border">
                        {success && (
                            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {success}
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

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                Alamat Email
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full"
                                placeholder="Masukkan alamat email Anda"
                            />
                        </div>

                        <div>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Mengirim Link Reset...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4" />
                                        Kirim Link Reset
                                    </>
                                )}
                            </Button>
                        </div>

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
