"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OAuthPopupContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams?.get("redirect") || "/owner";
    const error = searchParams?.get("error");
    const message = {
      type: "google-oauth-callback",
      redirect,
      error,
    };

    if (window.opener) {
      window.opener.postMessage(message, window.location.origin);
    }

    try {
      const channel =
        "BroadcastChannel" in window
          ? new BroadcastChannel("google-oauth")
          : null;
      channel?.postMessage(message);
      channel?.close();
      localStorage.setItem("google-oauth-callback", JSON.stringify(message));
    } catch {}

    window.setTimeout(() => window.close(), 100);
  }, [searchParams]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">
          Menyelesaikan login Google...
        </p>
      </div>
    </main>
  );
}
