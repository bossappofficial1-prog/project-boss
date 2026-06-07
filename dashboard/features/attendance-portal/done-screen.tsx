"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { DoneScreenProps } from "./types";

export function DoneScreen({ result, onBack }: DoneScreenProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const t = setInterval(
      () =>
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(t);
            onBack();
            return 0;
          }
          return c - 1;
        }),
      1000,
    );
    return () => clearInterval(t);
  }, [onBack]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-5">
        <div
          className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${result.success ? "bg-primary/10" : "bg-destructive/10"}`}
        >
          {result.success ? (
            <CheckCircle2 className="w-10 h-10 text-primary" />
          ) : (
            <XCircle className="w-10 h-10 text-destructive" />
          )}
        </div>
        <div className="space-y-1">
          <h2
            className={`text-2xl font-semibold ${result.success ? "text-foreground" : "text-destructive"}`}
          >
            {result.success ? "Absensi Tercatat!" : "Gagal"}
          </h2>
          <p className="text-lg font-medium text-foreground">
            {result.staffName}
          </p>
          <p className="text-sm text-muted-foreground">{result.message}</p>
        </div>
        {result.success && (
          <div className="inline-flex items-center gap-2 bg-muted rounded-lg px-4 py-2.5 border border-border">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-xl font-semibold text-foreground">
              {result.time}
            </span>
            <Badge variant="outline" className="text-xs">
              {result.type === "in" ? "Masuk" : "Pulang"}
            </Badge>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Kembali otomatis dalam{" "}
          <span className="font-mono font-semibold">{countdown}</span> detik
        </p>
        <Button variant="outline" onClick={onBack} className="w-full">
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  );
}
