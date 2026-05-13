import OAuthPopupContent from '@/components/auth/OAuthPopupContent';
import { Suspense } from 'react';

export default function OAuthPopupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center">Memuat...</div>}>
      <OAuthPopupContent />
    </Suspense>
  );
}
