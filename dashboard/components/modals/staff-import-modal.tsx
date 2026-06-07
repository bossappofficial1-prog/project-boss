"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { staffApi } from "@/lib/api";
import type { StaffImportRow, StaffImportResult } from "@/lib/apis/staff";
import {
  Upload,
  Download,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId?: string | null;
  onImported?: () => void;
};

type SheetPreview = {
  name: string;
  headers: string[];
  rows: Array<Record<string, any>>;
};

export default function StaffImportModal({
  open,
  onOpenChange,
  outletId,
  onImported,
}: Props) {
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [importErrors, setImportErrors] = React.useState<
    Array<{ row: number; message: string }>
  >([]);
  const [info, setInfo] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isParsing, setIsParsing] = React.useState(false);
  const [sheets, setSheets] = React.useState<SheetPreview[]>([]);
  const [activePreviewTab, setActivePreviewTab] = React.useState("");

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setFile(null);
    setInfo(null);
    setError(null);
    setImportErrors([]);
    setIsUploading(false);
    setIsParsing(false);
    setSheets([]);
    setActivePreviewTab("");
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const parseFilePreview = async (f: File) => {
    setIsParsing(true);
    try {
      const XLSX = await import("xlsx");
      const data = await f.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });

      const parsed: SheetPreview[] = [];
      for (const sheetName of wb.SheetNames) {
        if (sheetName.startsWith("_") || sheetName === "Panduan") continue;
        const ws = wb.Sheets[sheetName];
        const json: Array<Record<string, any>> = XLSX.utils.sheet_to_json(ws, {
          defval: "",
        });
        const rows = json.slice(0, 10);
        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        if (headers.length > 0) {
          parsed.push({ name: sheetName, headers, rows });
        }
      }

      setSheets(parsed);
      if (parsed.length > 0) setActivePreviewTab(parsed[0].name);
      if (parsed.length === 0)
        setError(
          "Tidak dapat membaca data dari file. Pastikan formatnya benar.",
        );
    } catch (e: any) {
      setError(e?.message || "Gagal membaca file untuk pratinjau");
      setSheets([]);
    } finally {
      setIsParsing(false);
    }
  };

  const isCsv = (name: string) => name.endsWith(".csv");
  const isXlsx = (name: string) =>
    name.endsWith(".xlsx") || name.endsWith(".xls");
  const isSupported = (name: string) => isCsv(name) || isXlsx(name);

  const onFileSelected = async (f: File | null) => {
    setError(null);
    setInfo(null);
    setImportErrors([]);
    setSheets([]);
    setFile(f);
    if (!f) return;
    const name = f.name.toLowerCase();
    if (!isSupported(name)) {
      setError("Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv");
      return;
    }
    await parseFilePreview(f);
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) await onFileSelected(f);
  };

  // Harus match persis dengan header di template XLSX (label display, bukan internal key)
  const PRIVILEGE_KEYS: Array<{ label: string; code: string }> = [
    { label: "OUTLET", code: "OUTLET_MANAGEMENT" },
    { label: "PRODUK", code: "PRODUCT_MANAGEMENT" },
    { label: "STOK", code: "STOCK_MANAGEMENT" },
    { label: "PELANGGAN", code: "CUSTOMER_MANAGEMENT" },
    { label: "PESANAN", code: "ORDER_MANAGEMENT" },
    { label: "LAYANAN", code: "SERVICE_MANAGEMENT" },
    { label: "KEUANGAN", code: "FINANCE_REPORTS" },
    { label: "TRANS_VIEW", code: "TRANSACTION_VIEW" },
    { label: "TRANS_DEL", code: "TRANSACTION_DELETE" },
    { label: "ANALISIS", code: "ANALYTICS" },
    { label: "KALKULATOR", code: "TOOLS_CALCULATOR" },
    { label: "BAHAN", code: "INGREDIENT_MANAGEMENT" },
    { label: "RESEP", code: "RECIPE_MANAGEMENT" },
    { label: "ABSENSI", code: "ATTENDANCE_MANAGEMENT" },
  ];

  const isYa = (v: any) => {
    if (!v || String(v).trim() === "") return false;
    const s = String(v).trim().toLowerCase();
    return (
      s === "ya" ||
      s === "y" ||
      s === "yes" ||
      s === "1" ||
      s === "✓" ||
      s === "v"
    );
  };

  const collectPrivileges = (row: Record<string, any>): string[] => {
    const result: string[] = [];
    // Check individual privilege columns by display label
    PRIVILEGE_KEYS.forEach((p) => {
      if (isYa(row[p.label])) result.push(p.code);
    });
    // Also check legacy single-column format (privileges / Hak Akses)
    const legacy = row.privileges ?? row["Hak Akses"] ?? row.Privileges ?? "";
    if (legacy) {
      String(legacy)
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
        .forEach((s: string) => {
          if (!result.includes(s)) result.push(s);
        });
    }
    return result;
  };

  const rowToStaffImport = (row: Record<string, any>): StaffImportRow => ({
    name: String(row.name ?? row.Nama ?? row["Nama Lengkap"] ?? ""),
    phone:
      row.phone ??
      row.Telepon ??
      row.Phone ??
      row["Nomor Telepon"] ??
      undefined,
    username: row.username ?? row.Username ?? undefined,
    email: row.email ?? row.Email ?? undefined,
    pin: String(row.pin ?? row.PIN ?? row.Pin ?? row["PIN (6 digit)"] ?? ""),
    role: (row.role ?? row.Role ?? "CASHIER") as StaffImportRow["role"],
    status: (row.status ?? row.Status ?? "ACTIVE") as StaffImportRow["status"],
    privileges: collectPrivileges(row),
  });

  const parseAllRows = async (f: File): Promise<StaffImportRow[]> => {
    const XLSX = await import("xlsx");
    const data = await f.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json: Array<Record<string, any>> = XLSX.utils.sheet_to_json(ws, {
      defval: "",
    });
    return json.map(rowToStaffImport);
  };

  const handleUpload = async () => {
    if (!outletId) {
      setError("Pilih outlet terlebih dahulu.");
      return;
    }
    if (!file) {
      setError("Pilih file .xlsx, .xls, atau .csv untuk diupload.");
      return;
    }
    try {
      setIsUploading(true);
      setError(null);
      setImportErrors([]);

      const rows = await parseAllRows(file);
      const result: StaffImportResult = await staffApi.importStaff(
        outletId,
        rows,
      );

      setInfo(
        `Import selesai — ${result.success} berhasil, ${result.failed} gagal.`,
      );
      if (result.errors?.length > 0) {
        setImportErrors(result.errors);
      }
      onImported?.();
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message || err?.message;
      const apiErrors = err?.response?.data?.errors || err?.errors;
      if (apiErrors && Array.isArray(apiErrors)) {
        setImportErrors(apiErrors);
        setError(apiMessage || "Validasi gagal pada beberapa baris.");
      } else {
        setError(apiMessage || "Gagal mengunggah data import");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await staffApi.downloadImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_import_staff.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || "Gagal mengunduh template");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="
        w-full
        max-w-[95vw]
        md:max-w-[600px]
        lg:max-w-[700px]
        max-h-[90vh]
        overflow-y-auto
      "
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Staff
          </DialogTitle>
          <DialogDescription>
            Upload file Excel atau CSV untuk menambah staff secara massal.
          </DialogDescription>
        </DialogHeader>

        {!outletId && (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Pilih outlet terlebih dahulu agar dapat mengimport data.
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="flex-1 font-medium">{error}</span>
            <button
              onClick={() => {
                setError(null);
                setImportErrors([]);
              }}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {importErrors.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-3 max-h-48 overflow-y-auto">
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Detail Error Import:
            </div>
            <ul className="space-y-2">
              {importErrors.map((errItem, idx) => (
                <li
                  key={idx}
                  className="text-xs text-destructive/90 bg-white dark:bg-black/20 p-2 rounded border border-destructive/10"
                >
                  <span className="font-semibold block mb-1">
                    Baris ke-{errItem.row}:
                  </span>
                  <span>{errItem.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {info && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {info}
          </div>
        )}

        <div className="space-y-4 max-w-162">
          {/* Template Info */}
          <div className="rounded-md border bg-muted/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4 text-muted-foreground" />
              Panduan Format Template
            </div>
            <div className="text-xs text-muted-foreground space-y-1.5">
              <p>
                Template memiliki <b>2 sheet</b>:
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>
                  <b>Data Staff</b> — Isi data staff di sheet ini (baris 1 =
                  header, baris 2 = deskripsi, mulai isi dari baris 3)
                </li>
                <li>
                  <b>Panduan</b> — Penjelasan detail setiap kolom, termasuk
                  contoh dan daftar kode privilege
                </li>
              </ul>
              <p className="mt-2">
                Kolom wajib: <b>Nama Lengkap</b> dan <b>PIN (6 digit)</b>.
              </p>
              <p>
                Hak akses (kolom H ke kanan) pakai{" "}
                <b>dropdown "Ya" / "Tidak"</b> — pilih "Ya" untuk setiap
                privilege yang ingin diberikan ke staff.
              </p>
              <p>
                Unduh template, isi data di sheet "Data Staff", lalu upload
                kembali.
              </p>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="group rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 p-8 text-center cursor-pointer transition-colors"
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
                <div className="text-left">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileSelected(null);
                  }}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-8 w-8 text-muted-foreground/50 group-hover:text-primary/60 transition-colors" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Seret file ke sini atau{" "}
                  <span className="text-primary font-medium">pilih file</span>
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  .xlsx, .xls, atau .csv
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => onFileSelected(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          {/* Preview */}
          {isParsing && (
            <p className="text-xs text-muted-foreground animate-pulse">
              Membaca file Excel...
            </p>
          )}

          {sheets.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Pratinjau (maks 10 baris)</p>
              <div className="overflow-auto rounded-md border max-h-60">
                <table className="min-w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      {sheets[0].headers.map((h) => (
                        <th
                          key={h}
                          className="px-2 py-1.5 text-left whitespace-nowrap font-medium"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheets[0].rows.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        {sheets[0].headers.map((h) => (
                          <td key={h} className="px-2 py-1 whitespace-nowrap">
                            {String(row[h] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              disabled={isUploading}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="ghost" size="sm" disabled={isUploading}>
                  Batal
                </Button>
              </DialogClose>
              <Button
                size="sm"
                disabled={!file || !outletId || isUploading || isParsing}
                onClick={handleUpload}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Mengunggah..." : "Upload & Import"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
