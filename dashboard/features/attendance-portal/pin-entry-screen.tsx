"use client";

import { useState } from "react";
import { ArrowLeft, LogIn, LogOut, Delete } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { StaffAvatar } from "./staff-avatar";
import type { PinEntryScreenProps } from "./types";

export function PinEntryScreen({
  staff,
  clockType,
  onConfirm,
  onBack,
}: PinEntryScreenProps) {
  const [pin, setPin] = useState("");
  const [shaking, setShaking] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 6) setTimeout(() => onConfirm(next), 150);
  };

  const handleBackspace = () => setPin((p) => p.slice(0, -1));

  const numpad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Kembali ke daftar staf
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-0 py-6">
        <div className="w-full max-w-xs space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <StaffAvatar staff={staff} size="lg" />
            <div>
              <p className="font-semibold text-foreground">{staff.name}</p>
              <Badge
                variant={clockType === "in" ? "default" : "outline"}
                className="mt-1 text-xs"
              >
                {clockType === "in" ? (
                  <LogIn className="w-3 h-3 mr-1" />
                ) : (
                  <LogOut className="w-3 h-3 mr-1" />
                )}
                {clockType === "in" ? "Absen Masuk" : "Absen Pulang"}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-center text-sm text-muted-foreground mb-4">
              Masukkan PIN 6 digit Anda
            </p>
            <div
              className={`flex justify-center gap-3 ${shaking ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-100 ${
                    i < pin.length
                      ? "bg-primary border-primary scale-110"
                      : "bg-transparent border-border"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {numpad.map((d, idx) => {
              if (d === "") return <div key={idx} />;
              if (d === "⌫")
                return (
                  <button
                    key={idx}
                    onClick={handleBackspace}
                    className="h-14 rounded-lg border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors active:scale-95"
                  >
                    <Delete className="w-5 h-5 text-muted-foreground" />
                  </button>
                );
              return (
                <button
                  key={idx}
                  onClick={() => handleDigit(d)}
                  className="h-14 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-semibold text-lg transition-colors active:scale-95"
                >
                  {d}
                </button>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            PIN akan otomatis dikonfirmasi setelah 6 digit dimasukkan
          </p>
        </div>
      </div>

      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }`}</style>
    </div>
  );
}
