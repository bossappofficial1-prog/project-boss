import GooglePopupStartContent from '@/components/auth/GooglePopupStartContent';
import { Suspense } from 'react';

export default function GooglePopupStartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center">Memuat...</div>}>
      <GooglePopupStartContent />
    </Suspense>
  );
}
