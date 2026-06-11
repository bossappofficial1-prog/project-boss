"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Loader2,
  AlertCircle,
  User,
  ShieldCheck,
  X,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AuthSplitLayout from "@/features/auth/components/auth-split-layout";

const HISTORY_KEY = "cashier_login_history";

function getHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToHistory(username: string) {
  const list = getHistory().filter((u) => u !== username);
  list.unshift(username);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 5)));
}

function removeFromHistory(username: string) {
  const list = getHistory().filter((u) => u !== username);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

function CashierLoginFormInner() {
  const [activeTab, setActiveTab] = useState<"cashier" | "manager">("cashier");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const router = useRouter();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const isCashierDomain = hostname.startsWith("cashier");

  const [cashierValues, setCashierValues] = useState({
    username: "",
    pin: "",
  });
  const [managerValues, setManagerValues] = useState({
    name: "",
    pin: "",
  });

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const refreshHistory = () => setHistory(getHistory());

  const handleCashierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCashierValues((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleManagerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManagerValues((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleCashierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashierValues.username || !cashierValues.pin) {
      setError("Harap isi username dan PIN");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await authApi.cashierLogin(
        cashierValues.username,
        cashierValues.pin,
      );
      try {
        sessionStorage.setItem("auth-role", "CASHIER");
      } catch {}
      saveToHistory(cashierValues.username);
      refreshHistory();
      toast.success(response.message || "Login berhasil");
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push("/cashier/pos");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Gagal login, periksa username dan PIN Anda";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManagerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerValues.name || !managerValues.pin) {
      setError("Harap isi nama dan PIN");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await authApi.managerLogin(
        managerValues.name,
        managerValues.pin,
      );
      try {
        sessionStorage.setItem("auth-role", "MANAGER");
      } catch {}
      toast.success(response.message || "Login manager berhasil");
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push("/manager/outlets");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Gagal login, periksa nama dan PIN Anda";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (username: string) => {
    setCashierValues((prev) => ({ ...prev, username }));
    setActiveTab("cashier");
  };

  const handleRemoveUser = (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    removeFromHistory(username);
    refreshHistory();
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
            Masuk untuk memulai shift.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("cashier");
              setError("");
            }}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
              activeTab === "cashier"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Kasir
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("manager");
              setError("");
            }}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
              activeTab === "manager"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Manager
          </button>
        </div>

        {activeTab === "cashier" && (
          <form onSubmit={handleCashierSubmit} className="space-y-4">
            {history.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <History className="h-3 w-3 text-muted-foreground/60" />
                  <span className="text-xs text-muted-foreground/60">
                    Login terakhir
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className={cn(
                        "group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                        "bg-muted/50 border border-border hover:bg-primary/10 hover:border-primary/30",
                        "transition-all",
                      )}
                    >
                      <User className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                      <span className="text-foreground/80 group-hover:text-foreground">
                        {u}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleRemoveUser(e, u)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          handleRemoveUser(e as unknown as React.MouseEvent, u)
                        }
                        className="p-0.5 rounded-full text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                name="username"
                placeholder="Masukkan username"
                value={cashierValues.username}
                onChange={handleCashierChange}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">PIN</label>
              <Input
                name="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Masukkan 6 digit PIN"
                maxLength={6}
                value={cashierValues.pin}
                onChange={handleCashierChange}
                className="h-11 tracking-widest text-center"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-11">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Memproses..." : "Masuk Shift"}
            </Button>
          </form>
        )}

        {activeTab === "manager" && (
          <form onSubmit={handleManagerSubmit} className="space-y-4">
            <div className="rounded-md bg-primary/5 border border-primary/10 p-3">
              <p className="text-xs text-primary/80 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                Akses Manager menggunakan nama lengkap dan PIN yang ditetapkan
                oleh Owner.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Manager</label>
              <Input
                name="name"
                placeholder="Masukkan nama lengkap"
                value={managerValues.name}
                onChange={handleManagerChange}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">PIN</label>
              <PasswordInput
                name="pin"
                placeholder="Masukkan PIN"
                value={managerValues.pin}
                onChange={handleManagerChange}
                className="h-11"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-11">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Memproses..." : "Masuk sebagai Manager"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Login sebagai Pemilik?{" "}
          <a
            {...(isCashierDomain && { target: "_blank" })}
            href={
              isCashierDomain ? "https://dashboard.bossapp.id" : "/auth/login"
            }
            className="font-medium text-primary hover:underline"
          >
            Masuk di sini
          </a>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

function CashierLoginPageSkeleton() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="space-y-4 w-full max-w-md px-6">
        <div className="flex justify-center">
          <div className="h-12 w-36 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-6 w-48 animate-pulse rounded bg-muted mx-auto" />
        <div className="h-11 animate-pulse rounded bg-muted" />
        <div className="h-11 animate-pulse rounded bg-muted" />
        <div className="h-11 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export default function CashierLoginForm() {
  return (
    <Suspense fallback={<CashierLoginPageSkeleton />}>
      <CashierLoginFormInner />
    </Suspense>
  );
}
