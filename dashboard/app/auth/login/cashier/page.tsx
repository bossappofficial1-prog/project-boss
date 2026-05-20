"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Lock, User, Store, X, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReusableForm } from "@/components/ui/reuseable-form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const HISTORY_KEY = "cashier_login_history";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

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

function CashierLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const refreshHistory = () => setHistory(getHistory());

  const handleSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await authApi.cashierLogin(
        values.username,
        values.password,
      );
      saveToHistory(values.username);
      refreshHistory();
      toast.success(response.message || "Login berhasil");
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push("/cashier/pos");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Gagal login, periksa username dan password Anda";
      toast.error(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (username: string) => {
    form.setValue("username", username);
    setTimeout(() => form.setFocus("password"), 50);
  };

  const handleRemoveUser = (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    removeFromHistory(username);
    refreshHistory();
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col md:flex-row relative overflow-hidden">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Left Side: Branding & Info (Hidden on small screens) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-background border-r border-border/40 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.03),transparent_100%)]" />

        {/* Decorative circles */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg text-center md:text-left space-y-8">
          <div className="inline-flex items-center gap-3 bg-primary/5 border border-primary/10 px-4 py-2 rounded-full mb-4">
            <Store className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              BOSS POS SYSTEM v2.0
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-foreground leading-[0.9]">
              Kasir Pintar,
              <br />
              <span className="text-primary">Bisnis Lancar.</span>
            </h1>
            <p className="text-lg text-muted-foreground/80 font-medium max-w-md">
              Sistem Point of Sales yang didesain untuk kecepatan, ketepatan,
              dan kemudahan operasional outlet Anda.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="p-4 rounded-lg bg-muted/30 border border-border/40 backdrop-blur-sm transition-all hover:bg-muted/50">
              <p className="text-2xl font-bold text-foreground">Fast</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Checkout Process
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/40 backdrop-blur-sm transition-all hover:bg-muted/50">
              <p className="text-2xl font-bold text-foreground">Secure</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Cloud Transactions
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-12">
          <Image
            src="/Logo Boss.png"
            alt="BOSS Logo"
            width={120}
            height={120}
          />
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Mobile Logo */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 md:hidden">
          <Image
            src="/Logo Boss.png"
            alt="BOSS Logo"
            width={120}
            height={120}
            className="object-contain"
          />
        </div>

        <Card className="w-full max-w-110 border-border/80 shadow-2xl rounded-xl overflow-hidden bg-background/80 backdrop-blur-xl">
          <div className="p-8 sm:p-10">
            <div className="space-y-2 mb-8 text-center sm:text-left">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Selamat Datang
              </h2>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-60">
                Silakan login untuk memulai shift.
              </p>
            </div>

            {history.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-1.5 mb-3">
                  <History className="h-3 w-3 text-muted-foreground/60" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
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
                        "bg-muted/50 border border-border/40 hover:bg-primary/10 hover:border-primary/30",
                        "transition-all duration-150",
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
                        className="ml-0.5 p-0.5 rounded-full text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ReusableForm<LoginFormValues>
              form={form}
              schema={loginSchema}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              submitText="Masuk Shift"
              loadingText="MEMPROSES..."
              fields={[
                {
                  name: "username",
                  label: "Username",
                  type: "text",
                  placeholder: "Masukkan username",
                  icon: User,
                },
                {
                  name: "password",
                  label: "Password",
                  type: "password",
                  placeholder: "••••••••",
                  icon: Lock,
                },
              ]}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function CashierLoginPageSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <Card className="w-full max-w-110 h-145 rounded-xl animate-pulse bg-background/50 border-border/40" />
    </div>
  );
}

export default function CashierLoginPage() {
  return (
    <Suspense fallback={<CashierLoginPageSkeleton />}>
      <CashierLoginForm />
    </Suspense>
  );
}
