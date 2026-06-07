"use client";

import { useState, useEffect } from "react";
import {
  useGetBusinessAnalysis,
  useRegenerateBusinessAnalysis,
} from "@/hooks/api/use-ai";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Brain,
  AlertCircle,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AiAnalystPage() {
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_APP_ENV === "production";

  // Execute cached query on page load
  const { data, isLoading, error } = useGetBusinessAnalysis(!isProd);
  const regenerateMutation = useRegenerateBusinessAnalysis();

  const isFetching = regenerateMutation.isPending;
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    "Mengumpulkan metrik penjualan outlet...",
    "Menganalisis pendapatan & pengeluaran...",
    "Menilai performa margin laba kotor...",
    "Mengidentifikasi tren metode pembayaran...",
    "Menyusun rekomendasi pertumbuhan bisnis...",
  ];

  useEffect(() => {
    if (isLoading || isFetching) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [isLoading, isFetching]);

  const handleRefresh = () => {
    toast.promise(regenerateMutation.mutateAsync(), {
      loading: "Menghasilkan analisis bisnis baru...",
      success: "Analisis bisnis berhasil diperbarui!",
      error: (err: any) =>
        err?.response?.data?.message || "Gagal memperbarui analisis bisnis.",
    });
  };

  // 1. Render Production Coming Soon panel
  if (isProd) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Asisten AI (AI Analyst)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Penasihat bisnis pintar untuk pertumbuhan UMKM Anda.
          </p>
        </div>

        <Card className="border py-0 border-border bg-gradient-to-br from-card to-card/95 shadow-xl relative overflow-hidden rounded-lg">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles className="h-48 w-48 text-primary" />
          </div>
          <CardContent className="flex flex-col items-center justify-center text-center p-6 md:p-8 space-y-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>

            <div className="space-y-2 max-w-lg">
              <Badge
                variant="outline"
                className="border-primary/20 text-primary bg-primary/5 uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full font-medium"
              >
                Segera Hadir
              </Badge>
              <h2 className="text-2xl font-bold text-foreground">
                Asisten AI Bisnis Anda
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                Fitur analisis keuangan, prediksi tren penjualan, dan
                rekomendasi pemasaran otomatis dengan Gemini AI segera hadir di
                lingkungan produksi BOSS.
              </p>
            </div>

            <div className="border-t border-border/40 w-full pt-6 max-w-md text-xs text-muted-foreground/85 text-center">
              <p className="px-6">
                Fitur ini memerlukan konfigurasi API Key dan lisensi tambahan.
                Hubungi administrator sistem untuk mengaktifkan asisten AI pada
                bisnis Anda.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Render Loading State
  if (isLoading || isFetching) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary animate-pulse" />
            Asisten AI (AI Analyst)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Penasihat bisnis pintar untuk pertumbuhan UMKM Anda.
          </p>
        </div>

        <Card className="border py-0 border-border bg-card/60 backdrop-blur-md shadow-md rounded-lg p-6 flex flex-col items-center justify-center space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative flex items-center justify-center">
              <RefreshCw className="h-12 w-12 text-primary animate-spin" />
              <Brain className="h-5 w-5 text-primary absolute" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-medium text-foreground">
                Asisten AI sedang berpikir
              </h3>
              <p className="text-xs text-muted-foreground animate-pulse">
                {loadingSteps[loadingStep]}
              </p>
            </div>
          </div>
          <div className="w-full max-w-md bg-muted h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{
                width: `${((loadingStep + 1) / loadingSteps.length) * 100}%`,
              }}
            ></div>
          </div>
        </Card>
      </div>
    );
  }

  // 3. Render Error State
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Asisten AI (AI Analyst)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Penasihat bisnis pintar untuk pertumbuhan UMKM Anda.
          </p>
        </div>

        <Card className="border py-0 border-destructive/20 bg-destructive/5 shadow-sm rounded-lg p-6 flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-destructive">
              Gagal memuat analisis
            </h3>
            <p className="text-sm text-muted-foreground">
              {(error as any)?.response?.data?.message ||
                "Terjadi kesalahan koneksi atau konfigurasi API Key tidak valid."}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              className="mt-2 rounded-md"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Coba Lagi
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 4. Render Main Content (Success State)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Asisten AI (AI Analyst)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Penasihat bisnis pintar untuk pertumbuhan UMKM Anda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isFetching}
            className="h-9 px-3 rounded-md"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Perbarui
          </Button>
        </div>
      </div>

      <Card className="border py-0 gap-0 border-border bg-card shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="border-b bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
            Laporan Analisis Bisnis & Rekomendasi
          </CardTitle>
          <CardDescription className="text-xs">
            Dibuat secara otomatis berdasarkan data operasional dan keuangan
            bisnis Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="text-sm leading-relaxed text-foreground/80 space-y-4">
            {data?.analysis ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-xl font-bold text-foreground mt-6 mb-3 border-b pb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-bold text-foreground mt-5 mb-2.5 border-b pb-1.5">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold text-primary mt-4 mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 shrink-0 text-primary" />
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm text-foreground/85 leading-relaxed my-2">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 my-2 space-y-1.5">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 my-2 space-y-1.5">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm text-foreground/85 leading-relaxed">
                      {children}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">
                      {children}
                    </strong>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4 rounded-md border border-border">
                      <table className="min-w-full divide-y divide-border text-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-muted/40">{children}</thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-border">{children}</tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-muted/10 transition-colors">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2.5 text-foreground/80 leading-normal">
                      {children}
                    </td>
                  ),
                }}
              >
                {data.analysis}
              </ReactMarkdown>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                Tidak ada analisis tersedia. Klik perbarui untuk menghasilkan
                analisis.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
