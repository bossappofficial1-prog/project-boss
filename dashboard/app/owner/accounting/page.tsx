"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Calculator,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  BookOpen,
  DollarSign,
  Briefcase,
  HelpCircle,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ReusableForm, FormFieldConfig } from "@/components/ui/reuseable-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGetAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useGetJournalEntries,
  useCreateJournalEntry,
  useGetBalanceSheet,
  useGetProfitLoss,
  useDeleteJournalEntry,
} from "@/hooks/api/use-accounting";
import { AccountType } from "@/lib/apis/accounting";
import { SelectOption } from "@/components/shared/select-option";

// Zod schemas for ReusableForm
const createAccountSchema = z.object({
  code: z
    .string()
    .regex(/^\d{4}$/, { message: "Kode akun harus 4 digit angka" }),
  name: z.string().min(1, "Nama akun wajib diisi"),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
});

const updateAccountSchema = z.object({
  name: z.string().min(1, "Nama akun wajib diisi"),
});

const createJournalSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  reference: z.string().optional().nullable(),
  description: z.string().min(3, "Deskripsi minimal 3 karakter"),
  items: z
    .array(
      z.object({
        accountId: z.string().min(1, "Akun wajib dipilih"),
        debit: z.number().min(0),
        credit: z.number().min(0),
      }),
    )
    .min(2, "Minimal 2 baris"),
});

type ActiveTab = "coa" | "journal" | "reports";
type ReportType = "balance-sheet" | "profit-loss";

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("coa");
  const [reportType, setReportType] = useState<ReportType>("balance-sheet");

  // Filter States
  const [balanceSheetDate, setBalanceSheetDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [plStartDate, setPlStartDate] = useState<string>(
    format(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      "yyyy-MM-dd",
    ),
  );
  const [plEndDate, setPlEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [journalSearch, setJournalSearch] = useState<string>("");
  const [journalPage, setJournalPage] = useState<number>(1);

  // Modal Dialog States
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [deleteJournalId, setDeleteJournalId] = useState<string | null>(null);

  // API Hooks
  const { data: accounts = [], isLoading: accountsLoading } = useGetAccounts();
  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();
  const deleteAccountMutation = useDeleteAccount();
  const deleteJournalMutation = useDeleteJournalEntry();

  const { data: journalData, isLoading: journalLoading } = useGetJournalEntries(
    {
      search: journalSearch || undefined,
      page: journalPage,
      limit: 10,
    },
  );

  const createJournalMutation = useCreateJournalEntry();

  const { data: balanceSheet, isLoading: balanceSheetLoading } =
    useGetBalanceSheet(balanceSheetDate);
  const { data: profitLoss, isLoading: plLoading } = useGetProfitLoss(
    plStartDate,
    plEndDate,
  );

  // Formatting Helpers
  const fmtCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getAccountTypeBadge = (type: AccountType) => {
    switch (type) {
      case "ASSET":
        return (
          <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
            Aset
          </Badge>
        );
      case "LIABILITY":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            Kewajiban / Utang
          </Badge>
        );
      case "EQUITY":
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
            Ekuitas / Modal
          </Badge>
        );
      case "REVENUE":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            Pendapatan
          </Badge>
        );
      case "EXPENSE":
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
            Beban
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // COA Handlers
  const handleCreateAccount = async (
    values: z.infer<typeof createAccountSchema>,
  ) => {
    try {
      await createAccountMutation.mutateAsync(values);
      toast.success("Akun berhasil didaftarkan");
      setAccountDialogOpen(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Gagal membuat akun",
      );

      throw err;
    }
  };

  const handleUpdateAccount = async (
    values: z.infer<typeof updateAccountSchema>,
  ) => {
    if (!editingAccount) return;
    try {
      await updateAccountMutation.mutateAsync({
        id: editingAccount.id,
        name: values.name,
      });
      toast.success("Nama akun berhasil diperbarui");
      setEditingAccount(null);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Gagal mengedit akun",
      );
      throw err;
    }
  };

  const handleDeleteAccountConfirm = async () => {
    if (!deleteAccountId) return;
    try {
      await deleteAccountMutation.mutateAsync(deleteAccountId);
      toast.success("Akun berhasil dihapus");
      setDeleteAccountId(null);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Gagal menghapus akun",
      );
      throw err;
    }
  };

  const handleDeleteJournalConfirm = async () => {
    if (!deleteJournalId) return;
    try {
      await deleteJournalMutation.mutateAsync(deleteJournalId);
      toast.success("Entri jurnal berhasil dihapus");
      setDeleteJournalId(null);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Gagal menghapus entri jurnal",
      );
      throw err;
    }
  };

  // Journal Handlers
  const handleCreateJournal = async (
    values: z.infer<typeof createJournalSchema>,
  ) => {
    try {
      const payload = {
        ...values,
        reference: values.reference || null,
        items: values.items.map((item) => {
          const debitVal = Number(item.debit);
          const creditVal = Number(item.credit);
          return {
            accountId: item.accountId,
            debit: isNaN(debitVal) || !isFinite(debitVal) ? 0 : debitVal,
            credit: isNaN(creditVal) || !isFinite(creditVal) ? 0 : creditVal,
          };
        }),
      };

      await createJournalMutation.mutateAsync(payload);
      toast.success("Jurnal umum berhasil disimpan");
      setJournalDialogOpen(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Gagal menyimpan jurnal",
      );
      throw err;
    }
  };

  // Field configurations for ReusableForm
  const accountFields: FormFieldConfig<z.infer<typeof createAccountSchema>>[] =
    [
      {
        name: "code",
        label: "Kode Akun (4 Digit)",
        type: "text",
        placeholder: "Contoh: 1003",
        colSpan: 1,
      },
      {
        name: "type",
        label: "Tipe Akun",
        type: "select",
        options: [
          { label: "Aset (ASSET)", value: "ASSET" },
          { label: "Kewajiban / Utang (LIABILITY)", value: "LIABILITY" },
          { label: "Ekuitas / Modal (EQUITY)", value: "EQUITY" },
          { label: "Pendapatan (REVENUE)", value: "REVENUE" },
          { label: "Beban Operasional (EXPENSE)", value: "EXPENSE" },
        ],
        colSpan: 1,
      },
      {
        name: "name",
        label: "Nama Akun Keuangan",
        type: "text",
        placeholder: "Contoh: Kas Utama Bank Mandiri",
        colSpan: 2,
      },
    ];

  const editAccountFields: FormFieldConfig<
    z.infer<typeof updateAccountSchema>
  >[] = [
    {
      name: "name",
      label: "Nama Akun Keuangan",
      type: "text",
      placeholder: "Contoh: Kas Utama Bank Mandiri",
      colSpan: 2,
    },
  ];

  // Manual Journal Items Input Renderer (Double Entry Builder Widget)
  const renderJournalItemsCustom = ({ field, form }: any) => {
    const items: Array<{ accountId: string; debit: number; credit: number }> =
      field.value || [
        { accountId: "", debit: 0, credit: 0 },
        { accountId: "", debit: 0, credit: 0 },
      ];

    const handleRowChange = (
      index: number,
      key: "accountId" | "debit" | "credit",
      val: any,
    ) => {
      const next = [...items];
      if (key === "accountId") {
        next[index].accountId = val;
      } else {
        next[index][key] = Math.max(0, Number(val));
      }
      form.setValue("items", next, { shouldValidate: true });
    };

    const handleAddRow = () => {
      const next = [...items, { accountId: "", debit: 0, credit: 0 }];
      form.setValue("items", next, { shouldValidate: true });
    };

    const handleRemoveRow = (index: number) => {
      if (items.length <= 2) {
        toast.error(
          "Jurnal berpasangan minimal harus memiliki 2 baris (Debit & Kredit)",
        );
        return;
      }
      const next = items.filter((_, idx) => idx !== index);
      form.setValue("items", next, { shouldValidate: true });
    };

    const totalDebit = items.reduce((sum, item) => sum + (item.debit || 0), 0);
    const totalCredit = items.reduce(
      (sum, item) => sum + (item.credit || 0),
      0,
    );
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return (
      <div className="space-y-4 border rounded-lg p-4 bg-muted/10">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-semibold">
            Daftar Akun & Nominal (Double Entry)
          </Label>
          <Button
            type="button"
            onClick={handleAddRow}
            size="sm"
            variant="outline"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Baris
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2.5 items-center bg-card p-2.5 border rounded-md"
            >
              {/* Account Dropdown */}
              <div className="col-span-5">
                <SelectOption
                  id={"item.0"}
                  value={item.accountId}
                  onValueChange={(e) => handleRowChange(index, "accountId", e)}
                  options={accounts.map((acc) => ({
                    label: `${acc.code} - ${acc.name}`,
                    value: acc.id,
                  }))}
                />
              </div>

              {/* Debit Input */}
              <div className="col-span-3">
                <Input
                  type="number"
                  placeholder="Debit"
                  value={item.debit || ""}
                  onChange={(e) =>
                    handleRowChange(index, "debit", e.target.value)
                  }
                  className="h-9 font-mono text-right"
                  min={0}
                />
              </div>

              {/* Credit Input */}
              <div className="col-span-3">
                <Input
                  type="number"
                  placeholder="Kredit"
                  value={item.credit || ""}
                  onChange={(e) =>
                    handleRowChange(index, "credit", e.target.value)
                  }
                  className="h-9 font-mono text-right"
                  min={0}
                />
              </div>

              {/* Remove button */}
              <div className="col-span-1 flex justify-center">
                <Button
                  type="button"
                  onClick={() => handleRemoveRow(index)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Ledger Balance Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t pt-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="text-xs">
              <p className="text-muted-foreground">Total Debit</p>
              <p className="font-semibold text-sm tabular-nums text-foreground">
                {fmtCurrency(totalDebit)}
              </p>
            </div>
            <div className="text-xs border-l pl-3">
              <p className="text-muted-foreground">Total Kredit</p>
              <p className="font-semibold text-sm tabular-nums text-foreground">
                {fmtCurrency(totalCredit)}
              </p>
            </div>
          </div>

          <div>
            {isBalanced ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-bold uppercase py-1">
                ✓ Seimbang (Balanced)
              </Badge>
            ) : (
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-bold uppercase py-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Tidak Seimbang Selisih{" "}
                {fmtCurrency(Math.abs(totalDebit - totalCredit))}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  const journalFields: FormFieldConfig<z.infer<typeof createJournalSchema>>[] =
    [
      {
        name: "date",
        label: "Tanggal Transaksi Jurnal",
        type: "date",
        colSpan: 1,
      },
      {
        name: "reference",
        label: "Nomor Referensi / Bukti (Opsional)",
        type: "text",
        placeholder: "Contoh: BKK-001, MEMO-01",
        colSpan: 1,
      },
      {
        name: "description",
        label: "Keterangan Jurnal (Deskripsi Transaksi)",
        type: "text",
        placeholder: "Contoh: Setoran Modal Awal Owner ke Kas Bank",
        colSpan: 2,
      },
      {
        name: "items",
        label: "Baris Jurnal",
        type: "custom",
        colSpan: 2,
        renderCustom: renderJournalItemsCustom,
      },
    ];

  // DataTable column definitions for Bagan Akun (COA)
  const coaColumns = [
    {
      accessorKey: "code",
      header: "Kode Akun",
      cell: ({ row }: any) => (
        <span className="font-mono font-bold text-sm text-foreground">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nama Akun",
      cell: ({ row }: any) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipe Akun",
      cell: ({ row }: any) => getAccountTypeBadge(row.original.type),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }: any) => {
        const acc = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setEditingAccount({ id: acc.id, name: acc.name })}
              size="icon-sm"
              variant="ghost"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            {!acc.isSystem && (
              <Button
                onClick={() => setDeleteAccountId(acc.id)}
                size="icon-sm"
                variant="ghost"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // DataTable column definitions for Jurnal Umum List
  const journalColumns = [
    {
      accessorKey: "date",
      header: "Tanggal",
      cell: ({ row }: any) => (
        <span className="font-medium text-xs">
          {format(new Date(row.original.date), "dd MMMM yyyy", {
            locale: localeId,
          })}
        </span>
      ),
    },
    {
      accessorKey: "reference",
      header: "Ref / Bukti",
      cell: ({ row }: any) => (
        <span className="font-mono text-xs font-bold text-muted-foreground">
          {row.original.reference || "-"}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Keterangan Jurnal & Double Entry",
      cell: ({ row }: any) => {
        const entry = row.original;
        return (
          <div className="space-y-2 py-1 max-w-125">
            <p className="font-semibold text-sm leading-snug">
              {entry.description}
            </p>
            {/* Double Entry Lines Visualization */}
            <div className="border rounded bg-muted/5 p-2 space-y-1.5 text-xs font-mono">
              {entry.items?.map((item: any) => (
                <div key={item.id} className="grid grid-cols-12 gap-2">
                  <span
                    className={`col-span-6 truncate ${item.credit > 0 ? "pl-4 text-muted-foreground" : "font-semibold text-foreground/80"}`}
                  >
                    {item.account?.code} - {item.account?.name}
                  </span>
                  <span className="col-span-3 text-right text-emerald-600 font-bold tabular-nums">
                    {item.debit > 0 ? fmtCurrency(item.debit) : ""}
                  </span>
                  <span className="col-span-3 text-right text-rose-600 font-bold tabular-nums">
                    {item.credit > 0 ? fmtCurrency(item.credit) : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }: any) => {
        const entry = row.original;
        return (
          <Button
            onClick={() => setDeleteJournalId(entry.id)}
            size="icon-sm"
            variant="ghost"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ══════════ Section Header ══════════ */}
      <SectionHeader
        title="Akuntansi Tingkat Lanjut"
        description="Pantau laporan neraca keuangan, bagan akun, buku besar, dan laba rugi bisnis Anda secara akurat & komprehensif."
        actions={
          <div className="flex gap-2">
            {activeTab === "coa" && (
              <Button
                onClick={() => setAccountDialogOpen(true)}
                size="lg"
              >
                <Plus className="w-4 h-4" />
                Tambah Akun Baru
              </Button>
            )}
            {activeTab === "journal" && (
              <Button
                onClick={() => setJournalDialogOpen(true)}
                size="lg"
              >
                <Plus className="w-4 h-4" />
                Catat Jurnal Manual
              </Button>
            )}
          </div>
        }
      />

      {/* ══════════ Main Tabs Bar ══════════ */}
      <div className="flex border-b border-border/60 bg-card rounded-md shadow-sm p-1 gap-1 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab("coa")}
          className={`flex items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === "coa"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
          }`}
        >
          <Layers className="w-4 h-4" /> Bagan Akun (COA)
        </button>
        <button
          onClick={() => setActiveTab("journal")}
          className={`flex items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === "journal"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
          }`}
        >
          <BookOpen className="w-4 h-4" /> Jurnal Umum
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === "reports"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
          }`}
        >
          <Calculator className="w-4 h-4" /> Laporan Keuangan
        </button>
      </div>

      {/* ══════════ COA TAB ══════════ */}
      {activeTab === "coa" && (
        <DataTable
          columns={coaColumns as any}
          data={accounts}
          isLoading={accountsLoading}
          emptyMessage="Belum ada perkiraan akun keuangan."
          tableId="coa-table"
          title="Bagan Akun Keuangan (Chart of Accounts)"
          description="Daftar perkiraan akun yang digunakan untuk mencatat dan menggolongkan seluruh arus kas masuk, aset tetap, modal, dan biaya operasional bisnis."
        />
      )}

      {/* ══════════ JOURNAL TAB ══════════ */}
      {activeTab === "journal" && (
        <DataTable
          columns={journalColumns as any}
          data={journalData?.data || []}
          isLoading={journalLoading}
          emptyMessage="Belum ada riwayat transaksi jurnal umum manual."
          tableId="journal-table"
          title="Jurnal Umum Manual"
          description="Buku catatan transaksi double-entry yang dimasukkan oleh owner secara langsung untuk modal, aset tetap, pinjaman, maupun pencatatan jurnal penyesuaian."
          serverSideSearch
          searchValue={journalSearch}
          onSearchChange={(value) => {
            setJournalSearch(value);
            setJournalPage(1);
          }}
          searchPlaceholder="Cari keterangan jurnal..."
          serverSidePagination
          totalItems={journalData?.total || 0}
          serverPage={journalPage}
          serverLimit={10}
          onPaginationChange={({ page }) => setJournalPage(page)}
        />
      )}

      {/* ══════════ REPORTS TAB ══════════ */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          {/* Inner Report Switching Tabs */}
          <div className="flex rounded-md border p-1 bg-muted/20 w-full sm:w-fit gap-1 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setReportType("balance-sheet")}
              className={`flex-1 sm:flex-initial rounded-sm px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                reportType === "balance-sheet"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <Activity className="w-3.5 h-3.5 mr-1 inline-block" /> Neraca
              Keuangan
            </button>
            <button
              onClick={() => setReportType("profit-loss")}
              className={`flex-1 sm:flex-initial rounded-sm px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                reportType === "profit-loss"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1 inline-block" /> Laba Rugi
            </button>
          </div>

          {/* BALANCE SHEET REPORT */}
          {reportType === "balance-sheet" && (
            <div className="space-y-6">
              {/* Date Filter Card */}
              <Card className="gap-0 rounded-md p-4 flex flex-col sm:flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full bg-primary" />
                  <div>
                    <h4 className="text-sm font-semibold">
                      Periode Pelaporan Neraca
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Posisi nilai aset, utang supplier, dan modal owner pada
                      tanggal pelaporan.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DatePicker
                    value={balanceSheetDate}
                    onValueChange={(date) => date && setBalanceSheetDate(date)}
                    className="h-9 w-44 text-sm font-semibold"
                  />
                </div>
              </Card>

              {balanceSheetLoading ? (
                <div className="flex h-64 items-center justify-center rounded-lg border bg-background/50">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : balanceSheet ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* LEFT COLUMN: Assets */}
                  <Card className="gap-0 rounded-md shadow-sm border-border/80 bg-background">
                    <CardHeader className="border-b pb-4">
                      <CardTitle className="text-base font-bold text-sky-600 dark:text-sky-400 flex justify-between items-center">
                        <span>1. ASET (ASSETS)</span>
                        <span className="font-mono text-sm tabular-nums text-foreground">
                          {fmtCurrency(balanceSheet.totalAssets)}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="space-y-2">
                        {balanceSheet.assets?.map((acc: any) => (
                          <div
                            key={acc.id}
                            className="flex justify-between items-center py-2 border-b border-border/30 text-sm font-mono"
                          >
                            <span>
                              {acc.code} - {acc.name}
                            </span>
                            <span className="font-bold tabular-nums">
                              {fmtCurrency(acc.balance)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center font-bold text-base bg-sky-50 dark:bg-sky-950/20 p-3 rounded-lg border border-sky-100 dark:border-sky-900/40 text-sky-700 dark:text-sky-400">
                        <span>TOTAL ASET</span>
                        <span className="tabular-nums">
                          {fmtCurrency(balanceSheet.totalAssets)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* RIGHT COLUMN: Liabilities & Equity */}
                  <div className="space-y-6">
                    {/* Liabilities Section */}
                    <Card className="gap-0 rounded-md shadow-sm border-border/80 bg-background">
                      <CardHeader className="border-b pb-4">
                        <CardTitle className="text-base font-bold text-amber-600 dark:text-amber-400 flex justify-between items-center">
                          <span>2. KEWAJIBAN / UTANG (LIABILITIES)</span>
                          <span className="font-mono text-sm tabular-nums text-foreground">
                            {fmtCurrency(balanceSheet.totalLiabilities)}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="space-y-2">
                          {balanceSheet.liabilities?.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-4 text-center">
                              Tidak ada saldo kewajiban / utang.
                            </p>
                          ) : (
                            balanceSheet.liabilities?.map((acc: any) => (
                              <div
                                key={acc.id}
                                className="flex justify-between items-center py-2 border-b border-border/30 text-sm font-mono"
                              >
                                <span>
                                  {acc.code} - {acc.name}
                                </span>
                                <span className="font-bold tabular-nums">
                                  {fmtCurrency(acc.balance)}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex justify-between items-center font-bold text-sm bg-amber-50 dark:bg-amber-950/10 p-2.5 rounded border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400">
                          <span>TOTAL KEWAJIBAN</span>
                          <span className="tabular-nums">
                            {fmtCurrency(balanceSheet.totalLiabilities)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Equity Section */}
                    <Card className="gap-0 rounded-md shadow-sm border-border/80 bg-background">
                      <CardHeader className="border-b pb-4">
                        <CardTitle className="text-base font-bold text-purple-600 dark:text-purple-400 flex justify-between items-center">
                          <span>3. EKUITAS / MODAL (EQUITY)</span>
                          <span className="font-mono text-sm tabular-nums text-foreground">
                            {fmtCurrency(balanceSheet.totalEquity)}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="space-y-2">
                          {balanceSheet.equity?.map((acc: any) => (
                            <div
                              key={acc.id}
                              className="flex justify-between items-center py-2 border-b border-border/30 text-sm font-mono"
                            >
                              <span className="truncate max-w-70">
                                {acc.code} - {acc.name}
                              </span>
                              <span className="font-bold tabular-nums">
                                {fmtCurrency(acc.balance)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center font-bold text-sm bg-purple-50 dark:bg-purple-950/10 p-2.5 rounded border border-purple-100 dark:border-purple-900/30 text-purple-700 dark:text-purple-400">
                          <span>TOTAL EKUITAS</span>
                          <span className="tabular-nums">
                            {fmtCurrency(balanceSheet.totalEquity)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Balanced Assertion & Summary */}
                    <Card className="gap-0 rounded-md border p-4 bg-muted/10 space-y-3">
                      <div className="flex justify-between items-center font-bold text-sm">
                        <span>Total Aset (A)</span>
                        <span className="font-mono tabular-nums text-sky-600 dark:text-sky-400">
                          {fmtCurrency(balanceSheet.totalAssets)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-sm border-b pb-2">
                        <span>Total Kewajiban + Ekuitas (K + E)</span>
                        <span className="font-mono tabular-nums text-purple-600 dark:text-purple-400">
                          {fmtCurrency(balanceSheet.totalLiabilitiesAndEquity)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Status Persamaan Neraca:
                        </span>
                        {balanceSheet.isBalanced ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> SEIMBANG
                            (BALANCED)
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                            <AlertTriangle className="w-3.5 h-3.5" /> SELISIH{" "}
                            {fmtCurrency(
                              Math.abs(
                                balanceSheet.totalAssets -
                                  balanceSheet.totalLiabilitiesAndEquity,
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* PROFIT & LOSS REPORT */}
          {reportType === "profit-loss" && (
            <div className="space-y-6">
              {/* Date Filters Card */}
              <Card className="gap-0 rounded-md p-4 flex flex-col sm:flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full bg-emerald-500" />
                  <div>
                    <h4 className="text-sm font-semibold">
                      Rentang Periode Laba Rugi
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Kalkulasi total pendapatan penjualan dan akumulasi beban
                      biaya dalam kurun waktu yang dipilih.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Dari:</span>
                    <DatePicker
                      value={plStartDate}
                      onValueChange={(date) => date && setPlStartDate(date)}
                      className="h-9 w-44 text-xs font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Sampai:
                    </span>
                    <DatePicker
                      value={plEndDate}
                      onValueChange={(date) => date && setPlEndDate(date)}
                      className="h-9 w-44 text-xs font-bold"
                    />
                  </div>
                </div>
              </Card>

              {plLoading ? (
                <div className="flex h-64 items-center justify-center rounded-lg border bg-background/50">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : profitLoss ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* LEFT: Revenue accounts */}
                  <Card className="gap-0 rounded-md shadow-sm border-border/80 bg-background lg:col-span-2 space-y-6 p-6">
                    {/* Revenue Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex justify-between border-b pb-2">
                        <span>1. Pendapatan (Revenues)</span>
                        <span className="font-mono tabular-nums">
                          {fmtCurrency(profitLoss.totalRevenue)}
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {profitLoss.revenues?.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-4 text-center">
                            Tidak ada saldo pendapatan.
                          </p>
                        ) : (
                          profitLoss.revenues?.map((acc: any) => (
                            <div
                              key={acc.id}
                              className="flex justify-between items-center py-2 border-b border-border/30 text-sm font-mono"
                            >
                              <span>
                                {acc.code} - {acc.name}
                              </span>
                              <span className="font-bold tabular-nums text-emerald-600">
                                {fmtCurrency(acc.balance)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Expense Section */}
                    <div className="space-y-4 pt-4">
                      <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide flex justify-between border-b pb-2">
                        <span>2. Beban Biaya (Expenses)</span>
                        <span className="font-mono tabular-nums">
                          {fmtCurrency(profitLoss.totalExpense)}
                        </span>
                      </h4>
                      <div className="space-y-2">
                        {profitLoss.expenses?.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-4 text-center">
                            Tidak ada saldo beban operasional.
                          </p>
                        ) : (
                          profitLoss.expenses?.map((acc: any) => (
                            <div
                              key={acc.id}
                              className="flex justify-between items-center py-2 border-b border-border/30 text-sm font-mono"
                            >
                              <span>
                                {acc.code} - {acc.name}
                              </span>
                              <span className="font-bold tabular-nums text-rose-600">
                                {fmtCurrency(acc.balance)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* RIGHT: Profit breakdown */}
                  <div className="space-y-6">
                    <Card className="gap-0 rounded-md border p-6 bg-muted/10 space-y-4">
                      <h3 className="text-base font-bold">
                        Ringkasan Laba Rugi
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            Total Pendapatan (Revenues)
                          </span>
                          <span className="font-mono tabular-nums text-emerald-600 font-bold">
                            {fmtCurrency(profitLoss.totalRevenue)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-3">
                          <span className="text-muted-foreground">
                            Total Beban (Expenses)
                          </span>
                          <span className="font-mono tabular-nums text-rose-600 font-bold">
                            {fmtCurrency(profitLoss.totalExpense)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div
                          className={`p-4 rounded-xl border flex flex-col justify-center items-center text-center ${
                            profitLoss.netProfit >= 0
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                              : "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400"
                          }`}
                        >
                          <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
                            Laba / Rugi Bersih
                          </p>
                          <h2 className="text-2xl font-black font-mono leading-none tracking-tight tabular-nums">
                            {fmtCurrency(profitLoss.netProfit)}
                          </h2>
                          <Badge
                            className={`mt-3 border ${
                              profitLoss.netProfit >= 0
                                ? "bg-emerald-500 text-white"
                                : "bg-rose-500 text-white"
                            }`}
                          >
                            {profitLoss.netProfit >= 0
                              ? "Untung / Bersih (Profit)"
                              : "Rugi Bersih (Loss)"}
                          </Badge>
                        </div>
                      </div>
                    </Card>

                    <Card className="gap-0 rounded-md border p-4 bg-background">
                      <div className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                        <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground mb-1">
                            Informasi Laba Rugi
                          </p>
                          Formula Laba Rugi dihitung dengan menyelisihkan Akun
                          Pendapatan dikurangi Akun Beban (termasuk HPP). Angka
                          Laba Bersih di atas akan terintegrasi langsung ke
                          Jurnal Neraca pada bagian **Laba Ditahan** secara
                          dinamis.
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* ══════════ DIALOGS ══════════ */}

      {/* Create Account Dialog */}
      <ReusableForm
        schema={createAccountSchema as any}
        fields={accountFields as any}
        defaultValues={{ code: "", name: "", type: "ASSET" } as any}
        onSubmit={handleCreateAccount as any}
        withDialog
        isDialogOpen={accountDialogOpen}
        onDialogOpenChange={setAccountDialogOpen}
        dialogTitle="Tambah Akun Keuangan Baru"
        dialogDescription="Tambahkan perkiraan akun kustom ke bagan akun (COA) bisnis Anda."
        submitText="Daftarkan Akun"
        cancelText="Batal"
        gridCols={2}
      />

      {/* Edit Account Dialog */}
      {editingAccount && (
        <ReusableForm
          schema={updateAccountSchema as any}
          fields={editAccountFields as any}
          defaultValues={{ name: editingAccount.name } as any}
          onSubmit={handleUpdateAccount as any}
          withDialog
          isDialogOpen={!!editingAccount}
          onDialogOpenChange={(v) => !v && setEditingAccount(null)}
          dialogTitle="Perbarui Nama Akun Keuangan"
          dialogDescription={`Ubah nama deskripsi akun untuk perkiraan akun kode "${accounts.find((a) => a.id === editingAccount.id)?.code}".`}
          submitText="Simpan Perubahan"
          cancelText="Batal"
        />
      )}

      {/* Create Journal Entry Dialog */}
      <ReusableForm
        schema={createJournalSchema as any}
        fields={journalFields as any}
        defaultValues={
          {
            date: format(new Date(), "yyyy-MM-dd"),
            reference: "",
            description: "",
            items: [
              { accountId: "", debit: 0, credit: 0 },
              { accountId: "", debit: 0, credit: 0 },
            ],
          } as any
        }
        onSubmit={handleCreateJournal as any}
        withDialog
        isDialogOpen={journalDialogOpen}
        onDialogOpenChange={setJournalDialogOpen}
        dialogTitle="Catat Entri Jurnal Umum Manual"
        dialogDescription="Masukkan transaksi double-entry berpasangan secara manual ke Buku Besar. Pastikan total saldo debit dan kredit Anda seimbang."
        submitText="Posting Jurnal"
        cancelText="Batal"
        gridCols={2}
      />

      {/* Delete Account Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteAccountId}
        onOpenChange={(v) => !v && setDeleteAccountId(null)}
        title="Apakah Anda yakin ingin menghapus akun ini?"
        description="Akun kustom ini akan dihapus secara permanen dari COA Anda. Tindakan ini hanya dapat dilakukan jika akun belum pernah digunakan dalam transaksi apa pun."
        confirmLabel="Ya, Hapus Akun"
        cancelLabel="Batal"
        onConfirm={handleDeleteAccountConfirm}
      />

      {/* Delete Journal Entry Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteJournalId}
        onOpenChange={(v) => !v && setDeleteJournalId(null)}
        title="Apakah Anda yakin ingin menghapus entri jurnal ini?"
        description="Entri jurnal umum ini akan dihapus secara permanen dari Buku Besar. Seluruh saldo laporan keuangan (Neraca dan Laba Rugi) akan otomatis dihitung ulang."
        confirmLabel="Ya, Hapus Jurnal"
        cancelLabel="Batal"
        onConfirm={handleDeleteJournalConfirm}
      />
    </div>
  );
}
