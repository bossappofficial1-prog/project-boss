import { BookingSlotStatus, StaffStatus } from "@prisma/client";
import * as ExcelJS from "exceljs";
import { db } from "../config/prisma";
import { StaffRepository } from "../repositories/staff.repository";
import { BcryptUtil } from "../utils";

export interface StaffAvailabilityInput {
  outletId: string;
  startTime: Date;
  endTime: Date;
  excludeSlotId?: string;
}

export interface StaffAvailabilityResult {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  status: StaffStatus;
  isAvailable: boolean;
  conflicts: Array<{
    slotId: string;
    startTime: string;
    endTime: string;
    status: BookingSlotStatus;
  }>;
}

export async function getStaffAvailabilityForWindow({
  outletId,
  startTime,
  endTime,
  excludeSlotId,
}: StaffAvailabilityInput): Promise<StaffAvailabilityResult[]> {
  const staffMembers = (await db.staff.findMany({
    where: {
      outletId,
      status: StaffStatus.ACTIVE,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      username: true,
      status: true,
    },
    orderBy: { name: "asc" },
  })) as Array<Record<string, any>>;

  // Query booking conflicts for this time window
  const conflictingBookings = await db.order.findMany({
    where: {
      handledByStaffId: { in: staffMembers.map((s) => s.id) },
      bookingDate: {
        gte: startTime,
        lt: endTime,
      },
      orderStatus: {
        in: ["AWAITING_PAYMENT", "PROCESSING", "CONFIRMED", "READY", "ON_GOING"],
      },
    },
    select: {
      handledByStaffId: true,
    },
  });

  const busyStaffIds = new Set(conflictingBookings.map((b) => b.handledByStaffId).filter(Boolean));

  return staffMembers.map((staff) => ({
    id: staff.id,
    name: staff.name,
    phone: staff.phone,
    username: staff.username,
    status: staff.status,
    conflicts: [], // No longer tracking individual conflicts, just availability
    isAvailable: !busyStaffIds.has(staff.id),
  }));
}

export interface StaffImportRow {
  name: string;
  phone?: string;
  username?: string;
  email?: string;
  pin: string;
  role?: "CASHIER" | "MANAGER" | "WAITER" | "KITCHEN" | "OTHER";
  status?: "ACTIVE" | "INACTIVE";
  privileges?: string[];
}

export interface StaffImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string; data: StaffImportRow }>;
  createdStaff: Array<{ id: string; name: string; username: string }>;
}

export async function importStaffFromCSV(
  businessId: string,
  outletId: string,
  rows: StaffImportRow[]
): Promise<StaffImportResult> {
  const result: StaffImportResult = {
    success: 0,
    failed: 0,
    errors: [],
    createdStaff: [],
  };

  // Verify outlet belongs to business
  const outlet = await db.outlet.findUnique({
    where: { id: outletId },
    select: { id: true, businessId: true },
  });

  if (!outlet || outlet.businessId !== businessId) {
    throw new Error("Outlet tidak ditemukan atau tidak sesuai.");
  }

  console.log("[importStaffFromCSV] outletId:", outletId, "rows:", rows.length);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 because header is row 1, data starts at row 2

    try {
      // Validate required fields
      if (!row.name || row.name.trim() === "") {
        throw new Error("Nama wajib diisi");
      }

      if (!row.pin || row.pin.trim() === "") {
        throw new Error("PIN wajib diisi");
      }

      if (!/^\d{6}$/.test(row.pin)) {
        throw new Error("PIN harus 6 digit angka");
      }

      const role = row.role || "CASHIER";
      const status = row.status || "ACTIVE";

      // Validate username for CASHIER
      if (role === "CASHIER" && (!row.username || row.username.trim() === "")) {
        throw new Error("Username wajib diisi untuk kasir");
      }

      // Check username uniqueness if provided
      if (row.username && row.username.trim() !== "") {
        const existingStaff = await db.staff.findUnique({
          where: { username: row.username.trim() },
        });
        if (existingStaff) {
          throw new Error(`Username "${row.username}" sudah terdaftar`);
        }
      }

      // Validate email format if provided
      if (row.email && row.email.trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          throw new Error("Format email tidak valid");
        }
      }

      // Validate phone format if provided
      if (row.phone && row.phone.trim() !== "") {
        const phoneRegex = /^(\+62|62|0)8\d{8,12}$/;
        if (!phoneRegex.test(row.phone)) {
          throw new Error("Nomor telepon tidak valid (contoh: 081234567890)");
        }
      }

      // Validate privileges if provided
      const validPrivileges = [
        "OUTLET_MANAGEMENT", "PRODUCT_MANAGEMENT", "STOCK_MANAGEMENT",
        "CUSTOMER_MANAGEMENT", "ORDER_MANAGEMENT", "SERVICE_MANAGEMENT",
        "FINANCE_REPORTS", "TRANSACTION_VIEW", "TRANSACTION_DELETE",
        "ANALYTICS", "TOOLS_CALCULATOR", "INGREDIENT_MANAGEMENT",
        "RECIPE_MANAGEMENT", "ATTENDANCE_MANAGEMENT"
      ];
      
      const privileges = row.privileges?.filter(p => validPrivileges.includes(p)) || [];

      const createPayload = {
        name: row.name.trim(),
        phone: row.phone?.trim() || null,
        username: row.username?.trim() || null,
        email: row.email?.trim() || null,
        pin: row.pin.trim(),
        role,
        status,
        privileges,
        outletId: outletId,
      };
      console.log(`[importStaffFromCSV] row ${rowNum} payload:`, JSON.stringify(createPayload, null, 2));

      // Create staff using repository (handles PIN hashing)
      const staff = await StaffRepository.create(createPayload);

      result.success++;
      result.createdStaff.push({
        id: staff.id,
        name: staff.name,
        username: staff.username || "",
      });
    } catch (err: any) {
      console.error(`[importStaffFromCSV] row ${rowNum} error:`, err.message);
      result.failed++;
      result.errors.push({
        row: rowNum,
        message: err.message,
        data: row,
      });
    }
  }

  return result;
}

/**
 * Generates an Excel template (XLSX) with:
 * - Sheet "Data Staff" — headers + example rows
 * - Sheet "Panduan" — detailed column descriptions
 */
export async function generateStaffImportTemplate(): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BOSS App";
  workbook.created = new Date();

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } },
    alignment: { vertical: "middle", horizontal: "center", wrapText: true },
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    },
  };

  const cellBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  const applyHeaderStyle = (sheet: ExcelJS.Worksheet) => {
    sheet.getRow(1).eachCell((cell) => {
      Object.assign(cell, { style: headerStyle });
    });
    sheet.getRow(1).height = 24;
  };

  // ─── Privilege definitions ───
  const PRIVILEGE_COLS: Array<{ key: string; label: string; code: string }> = [
    { key: "p_outlet", label: "OUTLET", code: "OUTLET_MANAGEMENT" },
    { key: "p_produk", label: "PRODUK", code: "PRODUCT_MANAGEMENT" },
    { key: "p_stok", label: "STOK", code: "STOCK_MANAGEMENT" },
    { key: "p_cust", label: "PELANGGAN", code: "CUSTOMER_MANAGEMENT" },
    { key: "p_order", label: "PESANAN", code: "ORDER_MANAGEMENT" },
    { key: "p_service", label: "LAYANAN", code: "SERVICE_MANAGEMENT" },
    { key: "p_keu", label: "KEUANGAN", code: "FINANCE_REPORTS" },
    { key: "p_tview", label: "TRANS_VIEW", code: "TRANSACTION_VIEW" },
    { key: "p_tdel", label: "TRANS_DEL", code: "TRANSACTION_DELETE" },
    { key: "p_analisa", label: "ANALISIS", code: "ANALYTICS" },
    { key: "p_kalk", label: "KALKULATOR", code: "TOOLS_CALCULATOR" },
    { key: "p_bahan", label: "BAHAN", code: "INGREDIENT_MANAGEMENT" },
    { key: "p_resep", label: "RESEP", code: "RECIPE_MANAGEMENT" },
    { key: "p_absen", label: "ABSENSI", code: "ATTENDANCE_MANAGEMENT" },
  ];

  // ─── Sheet: Data Staff ───
  const ds = workbook.addWorksheet("Data Staff");
  ds.columns = [
    { header: "Nama Lengkap", key: "name", width: 28 },
    { header: "Nomor Telepon", key: "phone", width: 20 },
    { header: "Username", key: "username", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "PIN (6 digit)", key: "pin", width: 16 },
    { header: "Role", key: "role", width: 14 },
    { header: "Status", key: "status", width: 12 },
    ...PRIVILEGE_COLS.map((p) => ({ header: p.label, key: p.key, width: 12 })),
  ];
  applyHeaderStyle(ds);

  // Hanya header (row 1) + data. TIDAK ada row deskripsi agar import tidak salah baca.
  // Semua instruksi di sheet "Panduan".

  function makePrivRow(base: Record<string, any>, yaPrivs: string[]): Record<string, any> {
    const r = { ...base };
    PRIVILEGE_COLS.forEach((p) => {
      r[p.key] = yaPrivs.includes(p.code) ? "Ya" : "";
    });
    return r;
  }

  // Example rows
  const exampleRows = [
    makePrivRow(
      { name: "Budi Santoso", phone: "081234567890", username: "budi_kasir", email: "budi@example.com", pin: "123456", role: "CASHIER", status: "ACTIVE" },
      [],
    ),
    makePrivRow(
      { name: "Siti Rahayu", phone: "081234567891", username: "siti_manager", email: "siti@example.com", pin: "654321", role: "MANAGER", status: "ACTIVE" },
      ["OUTLET_MANAGEMENT", "PRODUCT_MANAGEMENT", "ORDER_MANAGEMENT"],
    ),
    makePrivRow(
      { name: "Andi Pratama", phone: "", username: "andi_waiter", email: "", pin: "111222", role: "WAITER", status: "ACTIVE" },
      [],
    ),
  ];

  exampleRows.forEach((rowData) => {
    const r = ds.addRow(rowData);
    r.eachCell((cell) => {
      cell.border = cellBorder;
      cell.font = { italic: true, color: { argb: "FF6B7280" } };
    });
  });

  // ─── Data Validation (dropdown) ───
  const dv = (ds as any).dataValidations;
  const dataStartRow = 3;
  const dataEndRow = 1000;

  // Role: dropdown pilihan
  dv.add(`F${dataStartRow}:F${dataEndRow}`, {
    type: "list",
    formulae: ['"CASHIER,MANAGER,WAITER,KITCHEN,OTHER"'],
    allowBlank: true,
    showErrorMessage: true,
    errorTitle: "Role tidak valid",
    error: "Pilih salah satu: CASHIER, MANAGER, WAITER, KITCHEN, atau OTHER",
    showInputMessage: true,
    promptTitle: "Pilih Role",
    prompt: "Klik untuk memilih jabatan staff",
  });

  // Status: dropdown pilihan
  dv.add(`G${dataStartRow}:G${dataEndRow}`, {
    type: "list",
    formulae: ['"ACTIVE,INACTIVE"'],
    allowBlank: true,
    showErrorMessage: true,
    errorTitle: "Status tidak valid",
    error: "Pilih ACTIVE atau INACTIVE",
    showInputMessage: true,
    promptTitle: "Pilih Status",
    prompt: "Klik untuk memilih status akun",
  });

  // PIN: harus 6 digit angka
  dv.add(`E${dataStartRow}:E${dataEndRow}`, {
    type: "textLength",
    operator: "equal",
    formulae: [6],
    allowBlank: false,
    showErrorMessage: true,
    errorTitle: "PIN tidak valid",
    error: "PIN harus 6 digit angka (contoh: 123456)",
    showInputMessage: true,
    promptTitle: "PIN (6 digit)",
    prompt: "Masukkan 6 digit angka. Wajib diisi.",
  });

  // Privilege columns: dropdown "Ya" atau kosong
  const privStartCol = 8; // column H = 8
  PRIVILEGE_COLS.forEach((p, i) => {
    const colLetter = String.fromCharCode(65 + privStartCol + i);
    dv.add(`${colLetter}${dataStartRow}:${colLetter}${dataEndRow}`, {
      type: "list",
      formulae: ['"Ya,Tidak"'],
      allowBlank: true,
      showErrorMessage: true,
      errorTitle: `Hak akses ${p.label}`,
      error: `Pilih "Ya" untuk mengaktifkan ${p.code}, atau biarkan kosong.`,
      showInputMessage: true,
      promptTitle: p.code,
      prompt: `Pilih "Ya" jika staff punya akses ini.`,
    });
  });

  // ─── Sheet: Panduan ───
  const guide = workbook.addWorksheet("Panduan");
  guide.getColumn(1).width = 28;
  guide.getColumn(2).width = 65;
  guide.getColumn(3).width = 30;

  const guideHeaderStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } },
    alignment: { vertical: "middle", horizontal: "center", wrapText: true },
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    },
  };

  const guidePrivRows = PRIVILEGE_COLS.map(
    (p) => [p.label, `Hak akses ${p.code}. Pilih "Ya" untuk memberikan akses ini ke staff, kosongkan jika tidak.`, `Kolom H${String.fromCharCode(65 + PRIVILEGE_COLS.indexOf(p))}: dropdown Ya/Tidak`] as [string, string, string]
  );

  const guideData: Array<[string, string, string]> = [
    ["Kolom", "Keterangan", "Contoh / Catatan"],
    ["", "", ""],
    ["=== PETUNJUK PENGISIAN ===", "", ""],
    ["", "1. Isi data staff pada sheet 'Data Staff' mulai baris ke-2 (baris 1 = header).", ""],
    ["", "2. Hanya kolom Nama Lengkap dan PIN yang WAJIB diisi. Sisanya opsional.", ""],
    ["", "3. Baris contoh (warna abu-abu) bisa Anda hapus atau timpa dengan data asli.", ""],
    ["", "4. Jangan menghapus atau mengubah header (baris 1).", ""],
    ["", "5. Simpan file dan upload kembali ke sistem.", ""],
    ["", "", ""],
    ["=== DESKRIPSI KOLOM ===", "", ""],
    ["Nama Lengkap", "WAJIB. Nama lengkap staff.", "Contoh: Budi Santoso"],
    ["Nomor Telepon", "Opsional. Nomor HP aktif dengan prefix 08/62.", "Contoh: 081234567890"],
    ["Username", "WAJIB untuk role CASHIER. Digunakan untuk login ke POS. Harus unik (tidak boleh sama dengan staff lain).", "Contoh: budi_kasir"],
    ["Email", "Opsional. Format email valid.", "Contoh: budi@example.com"],
    ["PIN (6 digit)", "WAJIB. PIN 6 digit angka. Digunakan untuk login ke POS bersama username.", "Contoh: 123456"],
    ["Role", "Jabatan staff. Pilihan: CASHIER, MANAGER, WAITER, KITCHEN, OTHER. Default: CASHIER.", "CASHIER = kasir\nMANAGER = manajer outlet\nWAITER = pelayan\nKITCHEN = dapur\nOTHER = lainnya"],
    ["Status", "Status akun staff. Pilihan: ACTIVE, INACTIVE. Default: ACTIVE.", "ACTIVE = bisa login\nINACTIVE = tidak bisa login"],
    ["Hak Akses", `Setiap privilege punya kolom sendiri dengan dropdown "Ya" / "Tidak".\nPilih "Ya" untuk memberikan akses, kosongkan jika tidak.\n\nDaftar privilege:`, "Lihat baris berikutnya ↓"],
    ...guidePrivRows,
  ];

  guideData.forEach((row, i) => {
    const r = guide.addRow(row);
    if (i === 0) {
      r.eachCell((cell) => {
        Object.assign(cell, { style: guideHeaderStyle });
      });
      r.height = 24;
    } else if (String(row[0]).startsWith("===")) {
      r.getCell(1).font = { bold: true, size: 11, color: { argb: "FF2563EB" } };
      r.getCell(1).alignment = { vertical: "middle" };
      r.height = 22;
    } else if (row[0] === "") {
      // Spacer rows — thin height
      r.height = 8;
    } else {
      r.getCell(1).font = { bold: true, size: 10 };
      r.getCell(1).alignment = { vertical: "top", wrapText: true };
      r.getCell(2).alignment = { wrapText: true, vertical: "top" };
      r.getCell(2).font = { size: 10 };
      r.getCell(3).alignment = { wrapText: true, vertical: "top" };
      r.getCell(3).font = { size: 9, color: { argb: "FF6B7280" } };
      r.height = Math.max(
        (String(row[1]).split("\n").length * 15) + 4,
        (String(row[2]).split("\n").length * 13) + 4,
        20
      );
    }
  });

  return workbook;
}
