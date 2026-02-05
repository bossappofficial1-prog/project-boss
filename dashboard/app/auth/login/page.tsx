'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import { PasswordInput } from '@/components/ui/password-input';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apis/base';
import { Store } from 'lucide-react';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
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
      await new Promise(resolve => setTimeout(resolve, 200));

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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">

      {/* KIRI: BANNER */}
      <div className="hidden md:flex md:w-5/12 lg:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">BossApp</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Kelola Bisnis Anda <br />
            <span className="text-indigo-400">Lebih Profesional</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Satu platform untuk seluruh kebutuhan operasional bisnis Anda —
            mulai dari kasir, inventori, hingga laporan keuangan.
          </p>
        </div>
      </div>

      {/* KANAN: FORM */}
      <div className="flex-1 flex flex-col items-center p-6 md:p-12 overflow-y-auto">
        <div className="text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <Image
              src="/Logo Boss.png"
              alt="Logo BOSS"
              width={200}
              height={200}
              priority
            />
          </div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Selamat Datang Kembali</h2>
            <p className="text-slate-500 text-sm">Masuk ke Dashboard BOSS Anda</p>
          </div>
        </div>

        <div className="w-full max-w-lg">
          <form className="mt-8" onSubmit={handleSubmit}>
            <div className="space-y-6 md:p-8 md:border md:rounded-2xl">

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Alamat Email
                </label>
                <Input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Masukkan email Anda"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Kata Sandi
                </label>
                <PasswordInput
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Masukkan kata sandi"
                />
                <div className="mt-2 text-right">
                  <Link href="/auth/forgot-password" className="text-sm text-red-600 hover:underline">
                    Lupa Kata Sandi?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Sedang Masuk...' : 'Masuk'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">
                    Atau masuk dengan
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const redirectParam = redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : '';
                  window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google${redirectParam}`;
                }}
                className="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Masuk dengan Google
              </button>

              <div className="text-center space-y-2 text-sm">
                <p>
                  Belum punya akun?{' '}
                  <Link href="/auth/register" className="text-red-600 font-semibold">
                    Daftar Sekarang
                  </Link>
                </p>
                <p>
                  Masuk sebagai Kasir?{' '}
                  <Link href="/auth/login/cashier" className="text-blue-600 font-semibold">
                    Masuk
                  </Link>
                </p>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
