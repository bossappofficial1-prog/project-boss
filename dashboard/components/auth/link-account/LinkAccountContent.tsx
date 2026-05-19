'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apis/base';
import { Loader2, Link2, AlertCircle } from 'lucide-react';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';

export default function LinkAccountContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      return;
    }

    const fetchLinkInfo = async () => {
      try {
        const res = await apiClient.get(`/auth/link-account?token=${token}`);
        if (res.data.success) {
          setEmail(res.data.data.email);
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
        }
      } catch {
        setIsValidToken(false);
      }
    };

    fetchLinkInfo();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/link-account', {
        token,
        password,
      });

      if (res.data.success) {
        router.push(res.data.data.redirect);
      } else {
        setError(res.data.message || 'Gagal menghubungkan akun.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('salah') || msg.includes('tidak valid')) {
        setError('Password salah. Masukkan password akun Anda yang terdaftar.');
      } else if (msg.includes('kadaluarsa')) {
        setError('Token link sudah kadaluarsa. Silakan login dengan Google kembali.');
      } else {
        setError(msg || 'Gagal menghubungkan akun.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <AuthSplitLayout>
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AuthSplitLayout>
    );
  }

  if (!isValidToken || !token) {
    return (
      <AuthSplitLayout>
        <div className="w-full max-w-[420px] space-y-6 text-center">
          <div className="flex justify-center">
            <Image
              src="/Logo Boss.png"
              alt="Logo BOSS"
              width={140}
              height={50}
              className="h-18 w-auto object-contain"
              priority
            />
          </div>
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Token Tidak Valid</h2>
          <p className="text-sm text-muted-foreground">
            Token link akun sudah kadaluarsa atau tidak valid. Silakan login dengan Google kembali.
          </p>
          <Link href="/auth/login">
            <Button>Kembali ke Login</Button>
          </Link>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout>
      <div className="w-full max-w-[420px] space-y-8">
        <div className="flex justify-center mb-8 text-center">
          <div className="flex flex-col items-center">
            <Image
              src="/Logo Boss.png"
              alt="Logo BOSS"
              width={140}
              height={50}
              className="h-18 w-auto object-contain"
              priority
            />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Link2 className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Hubungkan Akun Google</h2>
          <p className="text-sm text-muted-foreground">
            Email <span className="font-medium text-foreground">{email}</span> sudah terdaftar dengan akun lokal.
            <br />
            Masukkan password akun Anda untuk menghubungkan login Google.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input
              type="email"
              value={email}
              disabled
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password Akun Anda</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password akun Anda"
              required
              autoFocus
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading || !password}
              className="w-full"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Menghubungkan...' : 'Hubungkan Akun'}
            </Button>
          </div>
        </form>

        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Lupa password?{' '}
            <Link href="/auth/forgot-password" className="font-medium text-primary hover:underline">
              Reset Password
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            Atau{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              login dengan akun lain
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}
