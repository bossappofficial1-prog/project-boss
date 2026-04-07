'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PasswordInput } from '@/components/ui/password-input';
import { apiClient } from '@/lib/apis/base';

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

    // Password strength validation
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

    // Countdown timer for redirect
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
            // Countdown will handle the redirect
        } catch (err: any) {
            // Handle structured API errors
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
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memverifikasi token...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-md w-full space-y-8">
                {/* Logo and Header */}
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
                    <h2 className="text-2xl font-bold text-gray-900 font-poppins">
                        Atur Kata Sandi Baru
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 font-poppins">
                        Masukkan kata sandi baru untuk akun Anda
                    </p>
                </div>

                {/* Reset Password Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-red-100">
                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-poppins">
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {success} <span className="font-semibold">({countdown})</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-poppins">
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            </div>
                        )}

                        {!success && (
                            <>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                                        Kata Sandi Baru <span className="text-red-500">*</span>
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

                                {/* Password Strength Indicator */}
                                {formData.password && (
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                        <p className="text-xs font-medium text-gray-600 mb-2 font-poppins">Persyaratan Kata Sandi:</p>
                                        <div className="space-y-1">
                                            {passwordStrength.map((req, index) => (
                                                <div key={index} className="flex items-center text-xs font-poppins">
                                                    <div className={`w-3 h-3 rounded-full mr-2 flex-shrink-0 ${req.met ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                        {req.met && (
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className={req.met ? 'text-green-700' : 'text-gray-500'}>
                                                        {req.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                                        Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
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
                                    <button
                                        type="submit"
                                        disabled={isLoading || !token || isSubmitted}
                                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-poppins"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Mengatur Ulang Kata Sandi...
                                            </div>
                                        ) : isSubmitted ? (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Kata Sandi Berhasil Diatur
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                </svg>
                                                Atur Ulang Kata Sandi
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}

                        <div className="text-center">
                                <p className="text-sm text-gray-600 font-poppins">
                                    Ingat kata sandi Anda?{' '}
                                    <Link href="/auth/login" className="font-semibold text-red-600 hover:text-red-500 transition-colors duration-200">
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