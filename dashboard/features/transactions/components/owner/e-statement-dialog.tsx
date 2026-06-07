"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { subMonths } from "date-fns";
import { CalendarIcon, FileText, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface EStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  onExport: (startDate: string, endDate: string) => void;
  isPending: boolean;
}

export function EStatementDialog({
  open,
  onOpenChange,
  userEmail,
  onExport,
  isPending,
}: EStatementDialogProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });

  const handleExport = () => {
    if (!dateRange?.from || !dateRange?.to) return;
    onExport(dateRange.from.toISOString(), dateRange.to.toISOString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 border-border/80 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 border-b border-border/40 bg-muted/30">
          <DialogTitle className="text-sm font-bold uppercase tracking-widest text-foreground">
            Permintaan E-Statement Resmi
          </DialogTitle>
          <DialogDescription className="text-[10px] font-medium uppercase tracking-tighter opacity-70">
            Kirim rekening koran (e-statement) transaksi bisnis langsung ke email terdaftar.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dokumen e-statement resmi (rekening koran) akan dikirimkan ke alamat email terdaftar
            Anda:{" "}
            <span className="font-bold text-foreground font-mono">
              {userEmail || "email Anda"}
            </span>
            .
          </p>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
              Rentang Tanggal E-Statement
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-bold text-xs h-12 bg-muted/20 border-border/40 hover:bg-muted/30 transition-all rounded-md pl-4",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-40" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd MMM yyyy", { locale: localeId })} —{" "}
                        {format(dateRange.to, "dd MMM yyyy", { locale: localeId })}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: localeId })
                    )
                  ) : (
                    <span>Pilih rentang tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {dateRange?.from && dateRange?.to && (
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-emerald-600 opacity-80" />
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600/70">
                    Periode Rekening Koran
                  </p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                    {format(dateRange.from, "dd MMMM yyyy", { locale: localeId })} —{" "}
                    {format(dateRange.to, "dd MMMM yyyy", { locale: localeId })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border/40 bg-muted/5 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 font-bold text-xs uppercase tracking-wider border-border/60 shadow-none"
          >
            Batal
          </Button>
          <Button
            onClick={handleExport}
            disabled={!dateRange?.from || !dateRange?.to || isPending}
            className="h-9 font-bold text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-none min-w-[150px]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Mail className="w-3.5 h-3.5 mr-2" />
                Kirim E-Statement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
