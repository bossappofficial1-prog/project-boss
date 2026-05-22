import { FormFieldConfig, ReusableForm } from "@/components/ui/reuseable-form";
import { useMemo } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  Store,
  ShoppingBag,
  Package,
  Calendar,
  Truck,
  Users as UsersIcon,
  Wallet,
  FileText,
  Trash2,
  TrendingUp,
  Calculator,
  Shield,
  Check,
  Info,
  AlertTriangle,
  Sparkles,
  Zap,
} from "lucide-react";

export const StaffStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);

// Schema dasar untuk validasi form staff (Kasir / Manager)
const getStaffSchema = (isEditMode: boolean) =>
  z
    .object({
      name: z
        .string()
        .min(2, "Nama minimal 2 karakter")
        .max(50, "Nama maksimal 50 karakter"),
      phone: z
        .string()
        .optional()
        .nullable()
        .or(z.literal(""))
        .refine(
          (val) => !val || /^(\+62|62|0)8\d{8,12}$/.test(val),
          "Nomor telepon tidak valid (contoh: 081234567890)",
        ),
      role: z.enum(["CASHIER", "MANAGER"]).default("CASHIER"),
      status: StaffStatusEnum.default("ACTIVE"),
      address: z.string().optional().nullable().or(z.literal("")),
      notes: z.string().optional().nullable().or(z.literal("")),

      // Cashier specific
      username: z.string().optional().nullable().or(z.literal("")),
      password: z.string().optional().nullable().or(z.literal("")),

      // Manager specific
      email: z.string().optional().nullable().or(z.literal("")),
      pin: z.string().optional().nullable().or(z.literal("")),
      privileges: z.array(z.string()).optional().default([]),
    })
    .superRefine((data, ctx) => {
      if (data.role === "CASHIER") {
        // Username is required for Cashier
        if (!data.username || data.username.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Username wajib diisi untuk Kasir",
            path: ["username"],
          });
        } else if (/@/.test(data.username)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Username tidak boleh mengandung @",
            path: ["username"],
          });
        }

        // Password is required for creating a Cashier
        if (!isEditMode && (!data.password || data.password.trim() === "")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Password wajib diisi untuk Kasir baru",
            path: ["password"],
          });
        } else if (
          data.password &&
          data.password.length > 0 &&
          data.password.length < 6
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Password minimal 6 karakter",
            path: ["password"],
          });
        }
      } else if (data.role === "MANAGER") {
        // Email is optional but if provided must be valid
        if (data.email && data.email.trim() !== "") {
          const emailSchema = z.string().email();
          if (!emailSchema.safeParse(data.email).success) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Format email tidak valid",
              path: ["email"],
            });
          }
        }

        // PIN is required for creating a Manager
        if (!isEditMode && (!data.pin || data.pin.trim() === "")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "PIN wajib diisi untuk Manager baru",
            path: ["pin"],
          });
        } else if (data.pin && data.pin.trim() !== "") {
          if (!/^\d{6}$/.test(data.pin)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "PIN harus 6 digit angka",
              path: ["pin"],
            });
          }
        }
      }
    });

// Type inference
export type StaffFormValues = z.infer<ReturnType<typeof getStaffSchema>>;

interface StaffDialogProps {
  modalMode: "create" | "edit";
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  onSubmit: (values: any) => void;
  isLoading?: boolean;
}

export function StaffDialog({
  modalMode,
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
  isLoading,
}: StaffDialogProps) {
  const isEditMode = modalMode === "edit";

  const schema = useMemo(() => getStaffSchema(isEditMode), [isEditMode]);

  const defaultValues = useMemo(() => {
    if (isEditMode && initialData) {
      // Map privileges object array to string array
      const mappedPrivileges = Array.isArray(initialData.privileges)
        ? initialData.privileges.map((p: any) => p.privilege || p)
        : [];

      return {
        name: initialData.name || "",
        phone: initialData.phone || "",
        role: initialData.role || "CASHIER",
        status: initialData.status || "ACTIVE",
        address: initialData.address || "",
        notes: initialData.notes || "",
        username: initialData.username?.split("@")[0] || "",
        password: "",
        email: initialData.email || "",
        pin: "",
        privileges: mappedPrivileges,
      } as any;
    }
    return {
      name: "",
      phone: "",
      role: "CASHIER" as const,
      status: "ACTIVE" as const,
      address: "",
      notes: "",
      username: "",
      password: "",
      email: "",
      pin: "",
      privileges: [],
    } as any;
  }, [initialData, isEditMode]);

  const fields: FormFieldConfig<any>[] = [
    {
      name: "role",
      label: "Peran Staff",
      type: "select",
      placeholder: "Pilih Peran Staff",
      colSpan: "full",
      options: [
        { label: "Kasir (Login via Username + Password)", value: "CASHIER" },
        { label: "Manager (Login via Nama + PIN)", value: "MANAGER" },
      ],
    },
    {
      name: "name",
      label: "Nama Lengkap",
      placeholder: "Contoh: Budi Santoso",
      colSpan: "full",
    },
    {
      name: "username",
      label: "Username Kasir",
      type: "text",
      placeholder: "Contoh: budi_kasir",
      colSpan: 3,
      condition: (values) => !values.role || values.role === "CASHIER",
    },
    {
      name: "phone",
      label: "Nomor Telepon",
      type: `tel`,
      placeholder: "08xx-xxxx-xxxx",
      colSpan: 3,
    },
    {
      name: "status",
      label: "Status Akses",
      placeholder: "Pilih Status Keaktifan",
      type: "select",
      colSpan: 3,
      options: [
        { label: "Aktif (Dapat Login)", value: "ACTIVE" },
        { label: "Nonaktif (Akses Dicabut)", value: "INACTIVE" },
      ],
    },
    // Cashier specific fields

    {
      name: "password",
      label: "Kata Sandi Kasir/PIN",
      type: "password",
      colSpan: 3,
      placeholder: isEditMode
        ? "Biarkan kosong jika tidak ingin mengubah"
        : "Minimal 6 karakter",
      description:
        "Kredensial ini digunakan kasir untuk masuk ke aplikasi POS.",
      condition: (values) => !values.role || values.role === "CASHIER",
    },
    // Manager specific fields
    {
      name: "email",
      label: "Email Manager (Opsional)",
      type: "email",
      placeholder: "Contoh: manager@outlet.com",
      colSpan: 3,
      condition: (values) => values.role === "MANAGER",
    },
    {
      name: "pin",
      label: "PIN Manager (6 Digit Angka)",
      type: "password",
      colSpan: 3,
      placeholder: isEditMode
        ? "Biarkan kosong jika tidak ingin mengubah"
        : "Masukkan 6 digit angka PIN",
      description:
        "Kredensial PIN angka 6 digit yang digunakan manager untuk login.",
      condition: (values) => values.role === "MANAGER",
    },
    {
      name: "privileges",
      label: "Hak Akses (Privileges)",
      type: "custom",
      colSpan: "full",
      condition: (values) => values.role === "MANAGER",
      renderCustom: ({ field, form }) => {
        const currentPrivileges: string[] = field.value || [];

        interface PrivilegeItem {
          value: string;
          label: string;
          description: string;
          icon: any;
          isSensitive?: boolean;
        }

        interface PrivilegeGroup {
          title: string;
          icon: any;
          items: PrivilegeItem[];
        }

        const privilegeGroups: PrivilegeGroup[] = [
          {
            title: "Operasional & Outlet",
            icon: Store,
            items: [
              {
                value: "OUTLET_MANAGEMENT",
                label: "Manajemen Outlet",
                description:
                  "Mengelola detail info outlet, kapasitas meja, dan reservasi meja aktif.",
                icon: Store,
              },
              {
                value: "ORDER_MANAGEMENT",
                label: "Manajemen Pesanan",
                description:
                  "Melihat dan mengelola daftar pesanan operasional kasir secara real-time.",
                icon: ShoppingBag,
              },
            ],
          },
          {
            title: "Katalog & Layanan",
            icon: Package,
            items: [
              {
                value: "PRODUCT_MANAGEMENT",
                label: "Manajemen Produk",
                description:
                  "Menambah, mengubah, dan menghapus produk, kategori, serta layanan katalog.",
                icon: Package,
              },
              {
                value: "SERVICE_MANAGEMENT",
                label: "Manajemen Layanan",
                description:
                  "Mengakses kalender booking, jadwal operasional, dan slot reservasi layanan.",
                icon: Calendar,
              },
            ],
          },
          {
            title: "Logistik & Pelanggan",
            icon: UsersIcon,
            items: [
              {
                value: "STOCK_MANAGEMENT",
                label: "Stok & Supplier",
                description:
                  "Mengelola penyesuaian stok, logistik pengadaan, dan kontak supplier/distributor.",
                icon: Truck,
              },
              {
                value: "CUSTOMER_MANAGEMENT",
                label: "Pelanggan & Loyalty",
                description:
                  "Mengelola database pelanggan, program loyalty point, dan tingkat membership.",
                icon: UsersIcon,
              },
            ],
          },
          {
            title: "Keuangan & Transaksi",
            icon: Wallet,
            items: [
              {
                value: "FINANCE_REPORTS",
                label: "Keuangan & Pengeluaran",
                description:
                  "Melihat laporan keuangan, mencatat pengeluaran operasional, dan menutup shift kasir.",
                icon: Wallet,
              },
              {
                value: "TRANSACTION_VIEW",
                label: "Riwayat Transaksi",
                description:
                  "Melihat keseluruhan daftar struk, pembayaran, dan status transaksi di outlet.",
                icon: FileText,
              },
            ],
          },
          {
            title: "Keamanan & Pengawasan",
            icon: Shield,
            items: [
              {
                value: "TRANSACTION_DELETE",
                label: "Hapus Transaksi",
                description:
                  "Otoritas tinggi untuk menyetujui request hapus transaksi kasir atau hapus langsung.",
                icon: Trash2,
                isSensitive: true,
              },
            ],
          },
          {
            title: "Analitik & Alat Bantu",
            icon: TrendingUp,
            items: [
              {
                value: "ANALYTICS",
                label: "Analitik & Performa",
                description:
                  "Akses grafik performa, jam ramai pelanggan, margin profit, dan laporan laba rugi.",
                icon: TrendingUp,
              },
              {
                value: "TOOLS_CALCULATOR",
                label: "Alat Operasional",
                description:
                  "Menggunakan kalkulator BEP, Kalkulator HPP produk, serta target breakdown.",
                icon: Calculator,
              },
            ],
          },
        ];

        // Dapatkan semua nilai privilege yang valid dalam list
        const allPrivilegeValues = privilegeGroups.flatMap((g) =>
          g.items.map((i) => i.value),
        );
        const isAllSelected = allPrivilegeValues.every((val) =>
          currentPrivileges.includes(val),
        );

        const handleSelectAll = () => {
          if (isAllSelected) {
            form.setValue("privileges", [], { shouldValidate: true });
          } else {
            form.setValue("privileges", allPrivilegeValues, {
              shouldValidate: true,
            });
          }
        };

        const handleCheckboxChange = (val: string, checked: boolean) => {
          let updatedPrivileges = [...currentPrivileges];
          if (checked) {
            updatedPrivileges.push(val);
          } else {
            updatedPrivileges = updatedPrivileges.filter((p) => p !== val);
          }
          form.setValue("privileges", updatedPrivileges, {
            shouldValidate: true,
          });
        };

        // Statistics helper
        const selectedCount = currentPrivileges.length;
        const totalCount = allPrivilegeValues.length;
        const percent =
          totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0;

        let authorityLevel = "Akses Terbatas";
        let authorityDescription =
          "Hanya dapat membuka modul-modul dasar yang dicentang.";
        let authorityColorClass =
          "text-amber-500 bg-amber-500/10 border-amber-500/20";
        let progressColorClass = "bg-amber-500";

        if (percent === 100) {
          authorityLevel = "Super Manager (Setara Owner)";
          authorityDescription =
            "Wewenang penuh operasional, keuangan, dan data produk outlet.";
          authorityColorClass = "text-primary bg-primary/10 border-primary/20";
          progressColorClass = "bg-primary";
        } else if (percent >= 60) {
          authorityLevel = "Manager Operasional Utama";
          authorityDescription =
            "Wewenang luas mencakup mayoritas fungsi supervisi.";
          authorityColorClass =
            "text-blue-500 bg-blue-500/10 border-blue-500/20";
          progressColorClass = "bg-blue-500";
        } else if (percent === 0) {
          authorityLevel = "Tanpa Akses Modul";
          authorityDescription =
            "Akun terdaftar tanpa wewenang operasional apapun.";
          authorityColorClass = "text-muted-foreground bg-muted border-border";
          progressColorClass = "bg-muted-foreground";
        }

        const quickTemplates = [
          {
            name: "Super Manager",
            description: "Semua Hak Akses (Setara Owner)",
            icon: Shield,
            values: allPrivilegeValues,
          },
          {
            name: "Fokus Operasional POS",
            description: "Outlet, Kasir & Layanan",
            icon: ShoppingBag,
            values: [
              "OUTLET_MANAGEMENT",
              "ORDER_MANAGEMENT",
              "SERVICE_MANAGEMENT",
              "CUSTOMER_MANAGEMENT",
            ],
          },
          {
            name: "Fokus Keuangan & Stok",
            description: "Stok, Katalog & Laporan",
            icon: Wallet,
            values: [
              "PRODUCT_MANAGEMENT",
              "STOCK_MANAGEMENT",
              "FINANCE_REPORTS",
              "TRANSACTION_VIEW",
              "ANALYTICS",
              "TOOLS_CALCULATOR",
            ],
          },
        ];

        return (
          <div className="space-y-6 mt-3 animate-fadeInUp">
            {/* Header section dengan judul & select all */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
              <div className="space-y-1">
                <span className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Konfigurasi Hak Akses Manager
                </span>
                <p className="text-xs text-muted-foreground">
                  Pilih hak akses operasional yang ingin Anda delegasikan ke
                  Manager ini.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold select-none cursor-pointer transition-all duration-200 border shadow-xs active:scale-95",
                  isAllSelected
                    ? "bg-muted border-border text-foreground hover:bg-muted/80"
                    : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20",
                )}
              >
                <Check
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    isAllSelected ? "scale-100" : "scale-75",
                  )}
                />
                {isAllSelected ? "Deselect Semua" : "Pilih Semua Hak Akses"}
              </button>
            </div>

            {/* Dynamic Dashboard metrics for Privileges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stats card */}
              <div
                className={cn(
                  "p-4 rounded-xl border flex flex-col justify-between gap-2.5 transition-all duration-300",
                  authorityColorClass,
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Level Otoritas
                  </span>
                  <Sparkles className="h-4 w-4 shrink-0" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold tracking-tight">
                    {authorityLevel}
                  </div>
                  <div className="text-[10px] opacity-80 leading-normal">
                    {authorityDescription}
                  </div>
                </div>
              </div>

              {/* Progress Bar Card */}
              <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col justify-between gap-3 md:col-span-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Kekuatan Akses Modul
                  </span>
                  <span className="font-bold text-muted-foreground">
                    {selectedCount} dari {totalCount} Modul Terpilih ({percent}
                    %)
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        progressColorClass,
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-normal flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      Manager hanya bisa melihat menu & melakukan aksi pada
                      dashboard sesuai dengan hak akses yang Anda centang di
                      bawah ini.
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Templates Selector */}
            <div className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Template Akses Cepat (Quick Templates)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {quickTemplates.map((tpl) => {
                  const isTemplateMatch =
                    tpl.values.length === currentPrivileges.length &&
                    tpl.values.every((v) => currentPrivileges.includes(v));

                  const TplIcon = tpl.icon;

                  return (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() =>
                        form.setValue("privileges", tpl.values, {
                          shouldValidate: true,
                        })
                      }
                      className={cn(
                        "flex flex-col items-start gap-1 p-3 rounded-lg border text-left cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-98 select-none",
                        isTemplateMatch
                          ? "bg-primary/10 border-primary text-primary shadow-xs"
                          : "bg-background border-border hover:border-muted-foreground/30 text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <TplIcon className="h-3.5 w-3.5" />
                        <span>{tpl.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                        {tpl.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid of Privilege Groups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {privilegeGroups.map((group) => {
                const GroupIcon = group.icon;
                const groupValues = group.items.map((i) => i.value);
                const isGroupAllSelected = groupValues.every((val) =>
                  currentPrivileges.includes(val),
                );
                const selectedInGroupCount = groupValues.filter((val) =>
                  currentPrivileges.includes(val),
                ).length;

                const handleToggleGroup = (e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  let updated = [...currentPrivileges];
                  if (isGroupAllSelected) {
                    // remove all group values
                    updated = updated.filter(
                      (val) => !groupValues.includes(val),
                    );
                  } else {
                    // add all group values (avoid duplicates)
                    groupValues.forEach((val) => {
                      if (!updated.includes(val)) updated.push(val);
                    });
                  }
                  form.setValue("privileges", updated, {
                    shouldValidate: true,
                  });
                };

                return (
                  <div
                    key={group.title}
                    className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card/75 transition-all duration-200 flex flex-col gap-3.5 shadow-xs"
                  >
                    {/* Group Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-border/40 text-foreground font-bold text-xs tracking-wider uppercase">
                      <div className="flex items-center gap-2">
                        <GroupIcon className="h-4 w-4 text-primary/80" />
                        <span>{group.title}</span>
                        <span className="text-[10px] normal-case bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                          {selectedInGroupCount}/{group.items.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleGroup}
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-sm hover:underline cursor-pointer transition-colors duration-200 select-none normal-case tracking-normal",
                          isGroupAllSelected
                            ? "bg-destructive/10 text-destructive border border-destructive/15"
                            : "bg-primary/10 text-primary border border-primary/15",
                        )}
                      >
                        {isGroupAllSelected ? "Deselect Grup" : "Pilih Semua"}
                      </button>
                    </div>

                    {/* Group Items */}
                    <div className="flex flex-col gap-2.5">
                      {group.items.map((item) => {
                        const isChecked = currentPrivileges.includes(
                          item.value,
                        );
                        const ItemIcon = item.icon;
                        return (
                          <label
                            key={item.value}
                            className={cn(
                              "relative flex items-start gap-3.5 p-3 rounded-lg border text-sm font-medium cursor-pointer transition-all duration-200 select-none hover:scale-[1.01]",
                              isChecked
                                ? item.isSensitive
                                  ? "bg-destructive/5 border-destructive/60 text-destructive shadow-xs shadow-destructive/5"
                                  : "bg-primary/5 border-primary text-primary shadow-xs shadow-primary/5"
                                : "bg-card border-border hover:bg-muted/40 hover:border-muted-foreground/20",
                              item.isSensitive &&
                                !isChecked &&
                                "hover:border-destructive/30",
                            )}
                          >
                            {/* Checkbox Icon */}
                            <div
                              className={cn(
                                "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-all duration-200 mt-0.5",
                                isChecked
                                  ? item.isSensitive
                                    ? "bg-destructive border-destructive text-destructive-foreground"
                                    : "bg-primary border-primary text-primary-foreground"
                                  : "border-input bg-background",
                              )}
                            >
                              {isChecked && (
                                <Check className="h-3 w-3 stroke-3" />
                              )}
                            </div>

                            {/* Label & Description */}
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <ItemIcon
                                  className={cn(
                                    "h-4 w-4 shrink-0",
                                    isChecked ? "" : "text-muted-foreground/80",
                                  )}
                                />
                                <span className="text-xs sm:text-sm font-bold select-none leading-none">
                                  {item.label}
                                </span>
                                {item.isSensitive && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-destructive/10 text-destructive border border-destructive/20 select-none animate-pulse">
                                    Sensitif
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] sm:text-xs text-muted-foreground font-normal leading-normal select-none">
                                {item.description}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) =>
                                handleCheckboxChange(
                                  item.value,
                                  e.target.checked,
                                )
                              }
                              className="sr-only" // Hidden standard checkbox
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warning Alert if Sensitive Privilege Checked */}
            {currentPrivileges.includes("TRANSACTION_DELETE") && (
              <div className="flex gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-xs text-destructive/90 leading-relaxed shadow-xs animate-fadeIn">
                <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5 animate-bounce" />
                <div className="space-y-0.5">
                  <span className="font-bold text-destructive">
                    PERINGATAN HAK AKSES SENSITIF
                  </span>
                  <p>
                    Anda memberikan wewenang <strong>Hapus Transaksi</strong>{" "}
                    kepada Manager ini. Hak ini bersifat destruktif dan dapat
                    menghapus atau merubah riwayat transaksi finansial outlet,
                    yang dapat mempengaruhi laporan laba rugi serta audit
                    keuangan.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <ReusableForm
      schema={schema}
      fields={fields}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      isLoading={isLoading}
      gridCols={6}
      withDialog
      isDialogOpen={isOpen}
      onDialogOpenChange={onOpenChange}
      dialogTitle={isEditMode ? "Perbarui Akun Staff" : "Daftarkan Staff Baru"}
      submitText={isEditMode ? "Simpan Perubahan" : "Daftarkan Staff"}
      dialogDescription="Lengkapi detail akun staff di bawah ini. Tentukan peran sebagai Kasir atau Manager dengan hak akses khusus."
      className="md:max-w-4xl"
    />
  );
}
