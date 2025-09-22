'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apis/base';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            await apiClient.post('/auth/forgot-password', { email });
            setSuccess('Reset password link telah dikirim ke email Anda. Silakan periksa inbox Anda.');
            // setTimeout(() => {
            //     router.push('/auth/login');
            // }, 3000);
        } catch (err: any) {
            // Handle structured API errors
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
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
            {/* Theme Toggle */}
            <div className="absolute top-4 right-4 z-10">
                <ThemeToggle />
            </div>

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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-poppins">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-poppins">
                        Masukkan email Anda untuk menerima link reset password
                    </p>
                </div>

                {/* Forgot Password Form */}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 border border-red-100 dark:border-gray-700">
                        {success && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm font-poppins">
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {success}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-poppins">
                                <div className="flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 font-poppins bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="Enter your email address"
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-poppins"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending Reset Link...
                                    </div>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Send Reset Link
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-poppins">
                                Remember your password?{' '}
                                <Link href="/auth/login" className="font-semibold text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 transition-colors duration-200">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}