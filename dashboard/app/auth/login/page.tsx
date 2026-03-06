'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PasswordInput } from '@/components/ui/password-input';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apis/base';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect');
  const reason = searchParams?.get('reason');
  const oauthError = searchParams?.get('error');

  useEffect(() => {
    document.documentElement.classList.remove("dark")
    return () => {
      const currentTheme = localStorage.getItem('theme') ?? 'system'
      document.documentElement.classList.add(currentTheme)
    }
  }, [])

  useEffect(() => {
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
    } else if (reason) {
      const errorMessages: Record<string, string> = {
        token_expired: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
        invalid_token: 'Token autentikasi tidak valid. Silakan masuk kembali.',
        invalid_role: 'Peran pengguna tidak valid. Silakan hubungi tim dukungan.',
        insufficient_permissions: 'Anda tidak memiliki izin untuk mengakses halaman tersebut.',
        validation_error: 'Validasi autentikasi gagal. Silakan coba lagi.',
        session_timeout: 'Sesi Anda berakhir karena tidak ada aktivitas.',
      };

      setError(errorMessages[reason] || 'Silakan masuk untuk melanjutkan.');
    }
  }, [reason, oauthError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await apiClient.post('/auth/login', formData);

      // Clear stale auth data from previous session
      queryClient.removeQueries({ queryKey: ['auth-me'] });
      try { sessionStorage.removeItem('auth-me-cache-v2'); } catch {}

      const meResponse = await apiClient.get('/auth/me');
      const userRole = meResponse.data.data.user.role;

      if (redirectUrl && redirectUrl !== '/' && !redirectUrl.startsWith('/auth/')) {
        const isValidRedirect =
          (userRole === 'ADMIN' && redirectUrl.startsWith('/admin/')) ||
          (userRole === 'OWNER' && redirectUrl.startsWith('/owner/'));

        if (isValidRedirect) {
          router.push(redirectUrl);
          return;
        }
      }

      if (userRole === 'OWNER') {
        router.push('/owner/dashboard');
      } else if (userRole === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/owner/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat masuk.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      
      {/* Left Side: Professional/Brand Area */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0B1120] overflow-hidden flex-col justify-between p-16 text-white text-sans">
        {/* Abstract 3D Geometric Shapes Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-600/30 to-purple-600/10 blur-[80px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-600/20 to-blue-500/10 blur-[60px]" />
            <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[100px]" />
            
            {/* Geometric Accents */}
            <div className="absolute top-20 right-20 w-24 h-24 border border-white/10 rounded-2xl transform rotate-12 backdrop-blur-sm opacity-50" />
            <div className="absolute bottom-32 left-10 w-32 h-32 border border-white/5 rounded-full backdrop-blur-md opacity-40" />
        </div>

        {/* Spacer to maintain vertical balance with justify-between */}
        <div className="relative z-10"></div>

        {/* Main Text Content */}
        <div className="relative z-10 max-w-lg mb-12">
            <h1 className="text-5xl font-bold leading-[1.15] mb-6 tracking-tight">
                Kelola Bisnis Anda <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-white">
                    Lebih Profesional
                </span>
            </h1>
            <p className="text-lg text-slate-400 font-light leading-relaxed">
                Platform terintegrasi untuk memaksimalkan efisiensi operasional dan pertumbuhan bisnis Anda dalam satu dashboard yang elegan.
            </p>
        </div>

        {/* Footer/Copyright */}
        <div className="relative z-10 text-sm text-slate-500">
            &copy; {new Date().getFullYear()} BOSS Business Management. All rights reserved.
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative bg-white">
         <div className="w-full max-w-[420px] space-y-8">
            
            {/* Logo View */}
            <div className="flex justify-center mb-8">
                <Image
                  src="/Logo Boss.png"
                  alt="Logo BOSS"
                  width={140}
                  height={50}
                  className="h-18 w-auto object-contain"
                  priority
                />
            </div>
            
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Selamat Datang</h2>
                <p className="text-slate-500">Masuk untuk mengelola bisnis Anda.</p>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                        <Input 
                            name="email"
                            type="email"
                            placeholder="nama@perusahaan.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="rounded-xl border-slate-200 h-12 px-4 focus-visible:ring-2 focus-visible:ring-red-500/20 focus-visible:border-red-500 transition-all font-medium placeholder:text-slate-400 bg-white" 
                            required
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                             <label className="text-sm font-semibold text-slate-700">Kata Sandi</label>
                             <Link href="/auth/forgot-password" className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline transition-colors">
                                Lupa sandi?
                             </Link>
                        </div>
                        <PasswordInput 
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="rounded-xl border-slate-200 h-12 px-4 focus-visible:ring-2 focus-visible:ring-red-500/20 focus-visible:border-red-500 transition-all bg-white"
                            required
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 hover:shadow-red-600/30 hover:-translate-y-[1px] transition-all duration-200 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                         {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                         {isLoading ? 'Sedang Masuk...' : 'Masuk'}
                    </button>
                </div>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-100" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">Atau</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        const redirectParam = redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : '';
                        window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google${redirectParam}`;
                    }}
                    className="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                </button>
            </form>
            
            <p className="text-center text-sm text-slate-500">
                Belum punya akun?{' '}
                <Link href="/auth/register" className="font-bold text-red-600 hover:text-red-700 hover:underline">
                    Daftar Sekarang
                </Link>
            </p>
         </div>
         
         <div className="absolute top-6 right-6 lg:top-10 lg:right-10">
            <Link href="/auth/login/cashier" className="text-sm font-medium text-slate-400 hover:text-slate-800 transition-colors">
                Masuk sebagai Kasir
            </Link>
         </div>
      </div>
    </div>
  );
}
