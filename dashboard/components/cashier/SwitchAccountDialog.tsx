"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { User, Lock, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { cn } from "@/lib/utils";

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

function removeFromHistory(username: string) {
  const list = getHistory().filter((u) => u !== username);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

function saveToHistory(username: string) {
  const list = getHistory().filter((u) => u !== username);
  list.unshift(username);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 5)));
}

interface SwitchAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsername: string;
}

export function SwitchAccountDialog({
  open,
  onOpenChange,
  currentUsername,
}: SwitchAccountDialogProps) {
  const [history, setHistory] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setHistory(getHistory());
      setSelectedUser("");
      setPin("");
    }
  }, [open]);

  const refreshHistory = () => setHistory(getHistory());

  const handleSelect = (username: string) => {
    setSelectedUser(username);
    setPin("");
  };

  const handleRemove = (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    removeFromHistory(username);
    refreshHistory();
  };

  const handleSwitch = async () => {
    if (!selectedUser || !pin) return;
    setIsLoading(true);
    try {
      const response = await authApi.cashierLogin(selectedUser, pin);
      saveToHistory(selectedUser);
      sessionStorage.removeItem("cashier-auth-cache-v1");
      queryClient.removeQueries({ queryKey: ["cashier-auth"] });
      toast.success(`Berhasil login sebagai ${response.staff.name}`);
      onOpenChange(false);
      window.location.href = "/cashier/pos";
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Gagal login";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedUser("");
    setPin("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle>Ganti Akun Kasir</DialogTitle>
          <DialogDescription>
            {selectedUser
              ? `Masukkan PIN untuk ${selectedUser}`
              : "Pilih akun yang tersedia untuk login"}
          </DialogDescription>
        </DialogHeader>

        {!selectedUser ? (
          <div className="space-y-3 py-2">
            {history.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Belum ada riwayat login
              </p>
            )}
            {history.map((u) => {
              const isCurrent = u === currentUsername;
              return (
                <button
                  key={u}
                  type="button"
                  disabled={isCurrent}
                  onClick={() => !isCurrent && handleSelect(u)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium border transition-all duration-150 group",
                    isCurrent
                      ? "bg-primary/10 border-primary/30 cursor-default"
                      : "bg-muted/30 border-border/40 hover:bg-primary/10 hover:border-primary/30 cursor-pointer"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    isCurrent ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                  )}>
                    <User className="h-4 w-4" />
                  </div>
                  <span className={cn(
                    "flex-1 truncate",
                    isCurrent ? "text-primary font-semibold" : "text-foreground/80 group-hover:text-foreground"
                  )}>
                    {u}
                  </span>
                  {isCurrent ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Aktif</span>
                  ) : (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleRemove(e, u)}
                      onKeyDown={(e) => e.key === "Enter" && handleRemove(e as unknown as React.MouseEvent, u)}
                      className="p-1 rounded-full text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/30 border border-border/40">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-foreground/80">
                {selectedUser}
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="switch-pin">PIN</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="switch-pin"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="••••••"
                  maxLength={6}
                  className="pl-9 tracking-widest text-center"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSwitch()}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Kembali
              </Button>
              <Button
                onClick={handleSwitch}
                disabled={!pin || isLoading}
                className="flex-1"
              >
                {isLoading ? "Memproses..." : "Masuk"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
