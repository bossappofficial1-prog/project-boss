"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { securityApi } from "@/features/auth/services/security";
import { gooeyToast } from "goey-toast";

interface TwoFactorVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  title?: string;
  description?: string;
}

export function TwoFactorVerifyDialog({
  open,
  onOpenChange,
  onVerified,
  title = "Verifikasi Keamanan",
  description = "Masukkan kode 6 digit dari aplikasi authenticator Anda untuk melanjutkan.",
}: TwoFactorVerifyDialogProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setIsVerifying(true);
    setError("");

    try {
      await securityApi.verifyAction(code);
      gooeyToast.success("Verifikasi berhasil");
      setCode("");
      onOpenChange(false);
      onVerified();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Kode verifikasi tidak valid");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setCode("");
      setError("");
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tf-code">Kode Verifikasi</Label>
            <Input
              id="tf-code"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center tracking-[0.5em] font-mono text-lg"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.length === 6) {
                  handleVerify();
                }
              }}
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isVerifying}
          >
            Batal
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isVerifying || code.length !== 6}
          >
            {isVerifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isVerifying ? "Memverifikasi..." : "Verifikasi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
