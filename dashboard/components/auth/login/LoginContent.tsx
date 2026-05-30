"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/apis/base";
import { Loader2, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import AuthSplitLayout from "@/components/auth/AuthSplitLayout";

export default function LoginContent() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get("redirect");
  const reason = searchParams?.get("reason");
  const oauthError = searchParams?.get("error");
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  const isDashboardDomain = hostname.startsWith("dashboard");

  useEffect(() => {
    if (oauthError) {
      const decoded = decodeURIComponent(oauthError);
      const messages: Record<string, string> = {
        google_failed:
          "Login Google gagal. Silakan coba lagi atau gunakan email dan password.",
      };
      setError(
        messages[oauthError] || decoded || "Login gagal. Silakan coba lagi.",
      );
    } else if (reason) {
      const errorMessages: Record<string, string> = {
        token_expired: "Sesi Anda telah berakhir. Silakan masuk kembali.",
        invalid_token: "Token autentikasi tidak valid. Silakan masuk kembali.",
        invalid_role:
          "Peran pengguna tidak valid. Silakan hubungi tim dukungan.",
        insufficient_permissions:
          "Anda tidak memiliki izin untuk mengakses halaman tersebut.",
        validation_error: "Validasi autentikasi gagal. Silakan coba lagi.",
        session_timeout: "Sesi Anda berakhir karena tidak ada aktivitas.",
      };

      setError(errorMessages[reason] || "Silakan masuk untuk melanjutkan.");
    }
  }, [reason, oauthError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const loginResponse = await apiClient.post("/auth/login", formData);

      queryClient.removeQueries({ queryKey: ["auth-me"] });
      try {
        sessionStorage.removeItem("auth-me-cache-v2");
      } catch {}

      let userRole =
        loginResponse.data?.data?.user?.role || loginResponse.data?.user?.role;

      if (userRole) {
        try {
          sessionStorage.setItem("auth-role", userRole);
        } catch {}
      } else {
        const meResponse = await apiClient.get("/auth/me");
        userRole = meResponse.data.data.user.role;
        try {
          sessionStorage.setItem("auth-role", userRole);
        } catch {}
      }

      if (
        redirectUrl &&
        redirectUrl.startsWith("/") &&
        !redirectUrl.startsWith("/auth/")
      ) {
        const isTryingToAccessOwner = redirectUrl.startsWith("/owner/");
        const isTryingToAccessAdmin = redirectUrl.startsWith("/admin/");

        const isRoleMismatch =
          (isTryingToAccessOwner && userRole !== "OWNER") ||
          (isTryingToAccessAdmin && userRole !== "ADMIN");

        if (!isRoleMismatch) {
          router.push(redirectUrl);
          return;
        }
      }

      if (userRole === "OWNER") {
        router.push("/owner");
      } else if (userRole === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/owner");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan saat masuk.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError("");
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google?redirect=${encodeURIComponent(redirectUrl || "/owner")}`;
  };

  return (
    <AuthSplitLayout>
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Image
            src="/Logo Boss.png"
            alt="Logo BOSS"
            width={140}
            height={50}
            className="h-12 w-auto object-contain"
            priority
          />
        </div>

        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Selamat Datang
          </h2>
          <p className="text-sm text-muted-foreground">
            Masuk untuk mengelola bisnis Anda.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              name="email"
              type="email"
              placeholder="nama@perusahaan.com"
              value={formData.email}
              onChange={handleInputChange}
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Kata Sandi</label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Lupa sandi?
              </Link>
            </div>
            <PasswordInput
              name="password"
              placeholder="Masukkan kata sandi"
              value={formData.password}
              onChange={handleInputChange}
              className="h-11"
              required
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full h-11">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Sedang Masuk..." : "Masuk"}
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-medium">
                Atau
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full h-11 gap-3"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Masuk dengan Google
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-primary hover:underline"
          >
            Daftar Sekarang
          </Link>
        </p>
      </div>

      <div className="absolute top-4 right-4 lg:top-6 lg:right-6">
        <Link
          {...(isDashboardDomain && {
            target: "_blank",
            rel: "noopener noreferrer",
          })}
          href={
            isDashboardDomain
              ? "https://cashier.bossapp.id/auth/login/cashier"
              : "/auth/login/cashier"
          }
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Masuk sebagai Kasir
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
