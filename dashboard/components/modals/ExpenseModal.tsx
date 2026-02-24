"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { type Expense } from "@/lib/apis/expense";

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: string;
  initial?: Expense | null;
  onSubmit: (
    payload: { description: string; amount: number; date: string; outletId: string },
    id?: string,
  ) => Promise<void>;
}

export function ExpenseModal({
  open,
  onOpenChange,
  outletId,
  initial,
  onSubmit,
}: ExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", date: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (initial) {
        const d = new Date(initial.date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

        const amtStr = String(initial.amount).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        setForm({ description: initial.description, amount: amtStr, date: localDateTime });
      } else {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

        setForm({ description: "", amount: "", date: localDateTime });
      }
      setErrors({});
    }
  }, [open, initial]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.description.trim()) e.description = "Deskripsi wajib diisi";

    const cleanAmount = form.amount.replace(/\./g, "");
    const amt = Number(cleanAmount);
    if (!form.amount || isNaN(amt) || amt <= 0) e.amount = "Jumlah tidak valid";

    if (!form.date) e.date = "Tanggal dan waktu wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    const formatted = val.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setForm((f) => ({ ...f, amount: formatted }));
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const isoDate = new Date(form.date).toISOString();
      const cleanAmount = Number(form.amount.replace(/\./g, ""));
      await onSubmit(
        { description: form.description.trim(), amount: cleanAmount, date: isoDate, outletId },
        initial?.id,
      );
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Pengeluaran" : "Tambah Pengeluaran"}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deskripsi *
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled={loading}
              placeholder="Contoh: Beli pulsa listrik"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Jumlah (Rp) *
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.amount}
              onChange={handleAmountChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled={loading}
              placeholder="Contoh: 50.000"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tanggal & Waktu *
            </label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              disabled={loading}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
              {loading ? "Menyimpan..." : initial ? "Simpan Perubahan" : "Tambah"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ExpenseModal;
