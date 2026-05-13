"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function GooglePopupStartContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams?.get("redirect");
    const redirectParam = redirect
      ? `&redirect=${encodeURIComponent(redirect)}`
      : "";

    window.name = "google-oauth-login";
    sessionStorage.setItem("google-oauth-popup", "1");
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google?popup=1${redirectParam}`;
  }, [searchParams]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">Redirect...</p>
      </div>
    </main>
  );
}
