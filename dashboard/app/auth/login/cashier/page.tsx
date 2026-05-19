"use client";

import { useState, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Loader2, Lock, Mail, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReusableForm } from "@/components/ui/reuseable-form";
import { z } from "zod";

const loginSchema = z.object({
	email: z.string().email("Email tidak valid").min(1, "Email wajib diisi"),
	password: z.string().min(1, "Password wajib diisi"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function CashierLoginForm() {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (values: LoginFormValues) => {
		setIsLoading(true);
		try {
			const response = await authApi.cashierLogin(values.email, values.password);
			toast.success(response.message || "Login berhasil");
			await new Promise((resolve) => setTimeout(resolve, 300));
			router.push("/cashier/pos");
		} catch (err: any) {
			const msg = err.response?.data?.message || err.message || "Gagal login, periksa email dan password Anda";
			toast.error(msg);
			throw err; // Propagate to ReusableForm for root error handling
		} finally {
			setIsLoading(false);
		}
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
						<span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">BOSS POS SYSTEM v2.0</span>
					</div>

					<div className="space-y-4">
						<h1 className="text-5xl lg:text-7xl font-bold tracking-tighter text-foreground leading-[0.9]">
							Kasir Pintar,<br />
							<span className="text-primary">Bisnis Lancar.</span>
						</h1>
						<p className="text-lg text-muted-foreground/80 font-medium max-w-md">
							Sistem Point of Sales yang didesain untuk kecepatan, ketepatan, dan kemudahan operasional outlet Anda.
						</p>
					</div>

					<div className="grid grid-cols-2 gap-4 pt-8">
						<div className="p-4 rounded-lg bg-muted/30 border border-border/40 backdrop-blur-sm transition-all hover:bg-muted/50">
							<p className="text-2xl font-bold text-foreground">Fast</p>
							<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Checkout Process</p>
						</div>
						<div className="p-4 rounded-lg bg-muted/30 border border-border/40 backdrop-blur-sm transition-all hover:bg-muted/50">
							<p className="text-2xl font-bold text-foreground">Secure</p>
							<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Cloud Transactions</p>
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

				<Card className="w-full max-w-[440px] border-border/80 shadow-2xl rounded-xl overflow-hidden bg-background/80 backdrop-blur-xl">
					<div className="p-8 sm:p-10">
						<div className="space-y-2 mb-10 text-center sm:text-left">
							<h2 className="text-3xl font-bold tracking-tight text-foreground">Selamat Datang</h2>
							<p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-60">Silakan login untuk memulai shift.</p>
						</div>

						<ReusableForm<LoginFormValues>
							schema={loginSchema}
							onSubmit={handleSubmit}
							isLoading={isLoading}
							submitText="Masuk Shift"
							loadingText="MEMPROSES..."
							fields={[
								{
									name: "email",
									label: "Email Pegawai",
									type: "email",
									placeholder: "nama@outlet.com",
									icon: Mail,
								},
								{
									name: "password",
									label: "Password",
									type: "password",
									placeholder: "••••••••",
									icon: Lock,
								},
							]}
						>
							{/* ReusableForm handles the children if we don't provide them, 
							    but we can also use children for custom layout. 
							    However, passing fields is cleaner for simple forms. */}
						</ReusableForm>

						<div className="mt-10 pt-10 border-t border-border/40 text-center">
							<p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-40 leading-relaxed">
								Butuh bantuan? Hubungi Manager atau Owner outlet Anda.
							</p>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}

function CashierLoginPageSkeleton() {
	return (
		<div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
			<Card className="w-full max-w-[440px] h-[580px] rounded-xl animate-pulse bg-background/50 border-border/40" />
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
