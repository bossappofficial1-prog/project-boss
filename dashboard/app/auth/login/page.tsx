import LoginContent from '@/components/auth/login/LoginContent';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Masuk ke BOSS | Solusi Manajemen Bisnis Terpadu',
  description: 'Masuk ke dashboard BOSS untuk mengelola operasional, staff, dan laporan bisnis Anda dengan lebih profesional dan efisien.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Masuk ke BOSS | Solusi Manajemen Bisnis Terpadu',
    description: 'Kelola bisnis Anda lebih profesional dengan BOSS Dashboard. Masuk sekarang untuk akses penuh ke fitur manajemen kami.',
    url: '/auth/login',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BOSS Login',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Masuk ke BOSS | Solusi Manajemen Bisnis Terpadu',
    description: 'Kelola bisnis Anda lebih profesional dengan BOSS Dashboard.',
    images: ['/og-image.jpg'],
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center">Memuat...</div>}>
      <LoginContent />
    </Suspense>
  );
}
