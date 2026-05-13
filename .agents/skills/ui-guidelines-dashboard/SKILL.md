---
name: ui-guidelines-dashboard
description:
  "Use this skill before writing ANY UI component, page, form, or table in this project.
  Triggers: creating components, building pages, adding forms, displaying data tables, styling elements,
  or any frontend task. Contains mandatory rules for design tokens, spacing, naming conventions,
  DataTable, ReusableForm, and all custom shared components specific to this codebase."
---

# UI Guidelines — B2B SaaS Enterprise

Read this entire document before writing any UI code. All rules here are mandatory.
Do not use generic shadcn patterns for tables and forms — this project has custom components that must be used instead.

---

## 1. Project Structure

```
dashboard/
├── components/
│   ├── ui/
│   │   ├── data-table.tsx          ← DataTable — wajib untuk semua tabel
│   │   ├── reuseable-form.tsx      ← ReusableForm — wajib untuk semua form
│   │   ├── confirm-dialog.tsx      ← konfirmasi destruktif
│   │   ├── date-picker.tsx         ← single date picker
│   │   ├── DatePickerWithRange.tsx ← date range picker
│   │   ├── datetime-picker.tsx     ← date + time picker
│   │   └── ImageUploader.tsx       ← upload file/gambar
│   └── shared/
│       └── SelectOption.tsx        ← dropdown select reusable
```

**Naming convention:**

- File: `kebab-case` (`user-list.tsx`, `create-user-form.tsx`)
- Komponen: `PascalCase` (`UserList`, `CreateUserForm`)
- Variabel & fungsi: `camelCase` (`userData`, `fetchUsers`)
- Type & Interface: `PascalCase` (`UserData`, `ApiResponse<T>`)
- Event handler: selalu prefix `handle` (`handleSubmit`, `handleDelete`, `handlePageChange`)
- Props callback: selalu prefix `on` (`onSuccess`, `onOpenChange`, `onRowClick`)

---

## 2. Design Tokens

Stack: **Tailwind CSS v4 + shadcn/ui**. Semua nilai warna, radius, dan font wajib dari CSS variable — tidak boleh hardcode hex, oklch, atau nilai arbitrary.

### Warna semantik

| Token                   | Kegunaan                                 |
| ----------------------- | ---------------------------------------- |
| `bg-background`         | Background halaman utama                 |
| `bg-card`               | Surface card, panel, modal               |
| `bg-muted`              | Input disabled, skeleton, section subtle |
| `bg-sidebar`            | Sidebar navigation                       |
| `text-foreground`       | Body text utama                          |
| `text-muted-foreground` | Placeholder, label sekunder, hint        |
| `bg-primary`            | Tombol CTA, badge aktif, indikator brand |
| `bg-destructive`        | Error state, delete action               |
| `border-border`         | Border default                           |
| `border-input`          | Border input field                       |
| `ring-ring`             | Focus ring                               |

**Primary brand** = warm coral-red. Gunakan hanya untuk elemen interaktif (tombol, link aktif, indikator). Jangan gunakan untuk dekorasi.

### Chart colors — gunakan urutan ini, jangan warna custom

```
chart-1 → metric utama      chart-4 → warning/neutral
chart-2 → metric sekunder   chart-5 → kategori lain
chart-3 → positive/growth
```

---

## 3. Tipografi

Font: **Poppins** (`--font-sans`) — jangan override.
Font mono: **Fira Code** (`--font-mono`) — hanya untuk kode, ID, nilai teknis.

```
Page title       : text-2xl font-semibold tracking-tight
Section title    : text-xl font-semibold
Card/modal title : text-lg font-medium
Label form       : text-sm font-medium
Body             : text-sm (line-height 1.5)
Muted/helper     : text-sm text-muted-foreground
Caption          : text-xs text-muted-foreground
Code/ID          : font-mono text-sm
```

---

## 4. Spacing

Layout density: **Comfortable**.

| Konteks              | Class                |
| -------------------- | -------------------- |
| Padding card/panel   | `p-4` atau `p-6`     |
| Gap antar section    | `space-y-6`          |
| Gap antar field form | `space-y-4`          |
| Gap antar tombol     | `gap-2` atau `gap-3` |
| Padding row tabel    | `py-3 px-4`          |
| Padding dialog/sheet | `p-6`                |

Jangan gunakan spacing arbitrary (`p-[13px]`).

---

## 5. Border Radius

`--radius: 0.65rem`

| Class          | Digunakan untuk                               |
| -------------- | --------------------------------------------- |
| `rounded-sm`   | Badge, chip, tag                              |
| `rounded-md`   | Input, select, button                         |
| `rounded-lg`   | Card, panel, dialog                           |
| `rounded-xl`   | Modal besar, drawer                           |
| `rounded-full` | Avatar, icon button bulat, badge counter saja |

---

## 6. Animasi

Global `transition-colors duration-200` sudah aktif — jangan tambahkan `transition` redundan.

Keyframe yang tersedia di `global.css`:

| Keyframe          | Digunakan untuk           |
| ----------------- | ------------------------- |
| `slideInFromLeft` | Sidebar, drawer kiri      |
| `slideInFromTop`  | Dropdown, popover         |
| `fadeInUp`        | Card load, konten halaman |
| `fadeIn`          | Modal overlay, toast      |
| `scaleIn`         | Dialog, alert             |
| `pulse`           | Skeleton loading          |
| `spin`            | Spinner/loader            |

Durasi masuk: 200–300ms. Keluar: 150–200ms (selalu lebih cepat dari masuk).

---

## 7. DataTable

**Wajib gunakan `<DataTable>` dari `dashboard/components/ui/data-table.tsx` untuk semua tampilan data tabular.** Jangan buat tabel manual dengan `<Table>` shadcn.

### Penggunaan dasar

```tsx
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Nama",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
  },
]

<DataTable
  columns={columns}
  data={data}
  title="Daftar Pengguna"
  emptyMessage="Belum ada pengguna."
  tableId="user-list"
  isLoading={isLoading}
/>
```

### Props penting

| Prop                 | Type                                     | Keterangan                                               |
| -------------------- | ---------------------------------------- | -------------------------------------------------------- |
| `columns`            | `ColumnDef<T>[]`                         | **Wajib.** Jangan sertakan kolom aksi & checkbox di sini |
| `data`               | `T[]`                                    | **Wajib**                                                |
| `isLoading`          | `boolean`                                | Tampilkan skeleton                                       |
| `emptyMessage`       | `string`                                 | **Wajib.** Pesan kontekstual, bukan string generik       |
| `tableId`            | `string`                                 | **Wajib** untuk halaman yang bisa dikunjungi berulang    |
| `density`            | `"compact" \| "normal" \| "comfortable"` | Default `"compact"`                                      |
| `rowActions`         | `(row: T) => RowAction<T>[]`             | Aksi per baris                                           |
| `actionViewType`     | `"dropdown" \| "flex"`                   | `"dropdown"` jika aksi > 2                               |
| `enableRowSelection` | `boolean`                                | Aktifkan jika ada `bulkActions`                          |
| `bulkActions`        | `BulkAction[]`                           | Aksi untuk baris yang diselect                           |

### Pagination

```tsx
// Client-side
<DataTable columns={columns} data={data} pagination pageSize={10} />

// Server-side
<DataTable
  columns={columns}
  data={data}
  serverSidePagination
  totalItems={meta.total}
  serverPage={page}
  serverLimit={limit}
  onPaginationChange={({ page, limit }) => {
    setPage(page)
    setLimit(limit)
  }}
/>
```

### Search

```tsx
// Server-side (standar di project ini)
<DataTable
  columns={columns}
  data={data}
  serverSideSearch
  searchValue={search}
  onSearchChange={setSearch}
  searchDebounceMs={300}
/>
```

### Row Actions

```tsx
// Dropdown jika aksi > 2
rowActions={(row) => [
  { label: "Edit", icon: Pencil, onClick: (row) => handleEdit(row) },
  { label: "Detail", icon: Eye, onClick: (row) => handleDetail(row) },
  { label: "Hapus", icon: Trash2, variant: "destructive", onClick: (row) => handleDelete(row) },
]}
actionViewType="dropdown"

// Flex jika aksi ≤ 2
rowActions={(row) => [
  { label: "Edit", icon: Pencil, onClick: (row) => handleEdit(row) },
]}
actionViewType="flex"
```

### Export

```tsx
enableExport
exportConfig={[
  {
    id: "xlsx",
    label: "Export Excel",
    icon: "spreadsheet",
    enabled: true,
    type: "server",
    exportUrl: "/api/resource/export",
  },
]}
```

---

## 8. ReusableForm

**Wajib gunakan `<ReusableForm>` dari `dashboard/components/ui/reuseable-form.tsx` untuk semua form.** Jangan buat form manual dengan `useForm` + JSX.

### Penggunaan dasar

```tsx
import { ReusableForm, FormFieldConfig } from "@/components/ui/reuseable-form"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  role: z.string().min(1, "Role wajib dipilih"),
})

type FormValues = z.infer<typeof schema>

const fields: FormFieldConfig<FormValues>[] = [
  { name: "name", label: "Nama Lengkap", type: "text", placeholder: "Masukkan nama" },
  { name: "email", label: "Email", type: "email" },
  {
    name: "role",
    label: "Role",
    type: "select",
    options: [
      { label: "Admin", value: "admin" },
      { label: "Staff", value: "staff" },
    ],
  },
]

<ReusableForm
  schema={schema}
  defaultValues={{ name: "", email: "", role: "" }}
  fields={fields}
  onSubmit={handleSubmit}
  submitText="Simpan"
  loadingText="Menyimpan..."
/>
```

### Semua `type` field yang tersedia

| type                   | Digunakan untuk                                  |
| ---------------------- | ------------------------------------------------ |
| `"text"`               | Input teks biasa                                 |
| `"email"`              | Input email                                      |
| `"password"`           | Input password dengan toggle show/hide           |
| `"number"`             | Input angka                                      |
| `"tel"`                | Nomor telepon                                    |
| `"textarea"`           | Teks panjang / deskripsi                         |
| `"select"`             | Dropdown — wajib isi `options`                   |
| `"toggle"`             | Segmented control — wajib isi `options`          |
| `"dual-option-switch"` | Switch dua pilihan — wajib isi `switchOptions`   |
| `"currency"`           | Input mata uang (format otomatis)                |
| `"percentage"`         | Input 0–100%                                     |
| `"date"`               | Single date — gunakan komponen `date-picker.tsx` |
| `"datetime-local"`     | Date + time — gunakan `datetime-picker.tsx`      |
| `"file"`               | Upload file/gambar — wajib isi `accept`          |
| `"custom"`             | Render bebas via `renderCustom`                  |
| `"array"`              | Dynamic list (tambah/hapus item)                 |

### Form dalam Dialog

```tsx
<ReusableForm
  schema={schema}
  fields={fields}
  defaultValues={defaultValues}
  onSubmit={handleSubmit}
  withDialog
  isDialogOpen={isOpen}
  onDialogOpenChange={setIsOpen}
  dialogTitle="Tambah Pengguna"
  dialogDescription="Isi data pengguna baru."
  submitText="Simpan"
  cancelText="Batal"
/>
```

### Multi-kolom

```tsx
const fields: FormFieldConfig<FormValues>[] = [
  { name: "firstName", label: "Nama Depan", type: "text", colSpan: 1 },
  { name: "lastName", label: "Nama Belakang", type: "text", colSpan: 1 },
  { name: "address", label: "Alamat", type: "textarea", colSpan: 2 },
]

<ReusableForm schema={schema} fields={fields} gridCols={2} onSubmit={handleSubmit} />
```

### Field kondisional

```tsx
// Tampil hanya jika kondisi terpenuhi
{ name: "taxId", label: "NPWP", type: "text", condition: (values) => values.isCompany === true }

// Berubah props berdasarkan field lain
{
  name: "amount",
  label: "Jumlah",
  type: "currency",
  dependsOn: {
    field: "discountType",
    condition: (value) => value === "percent",
    then: () => ({ type: "percentage", label: "Persentase" }),
  },
}
```

### Aturan ReusableForm

- `defaultValues` wajib diisi lengkap sesuai shape schema (termasuk `""` untuk string kosong)
- `schema` wajib Zod — validasi tidak boleh di luar schema
- Form edit: isi `defaultValues` dengan data dari API
- Gunakan `withDialog` untuk form dalam modal — jangan wrap manual dengan `<Dialog>`
- Gunakan `gridCols={2}` + `colSpan` untuk form dengan banyak field

---

## 9. Komponen Shared Lainnya

### ConfirmDialog — `dashboard/components/ui/confirm-dialog.tsx`

Gunakan untuk semua konfirmasi aksi destruktif. Jangan gunakan `window.confirm()` atau `AlertDialog` shadcn langsung.

### DatePicker — `dashboard/components/ui/date-picker.tsx`

Single date. Sudah terintegrasi di `ReusableForm` via `type: "date"`.

### DatePickerWithRange — `dashboard/components/ui/DatePickerWithRange.tsx`

Date range (dari–sampai). Gunakan di luar `ReusableForm` untuk filter tabel.

### DateTimePicker — `dashboard/components/ui/datetime-picker.tsx`

Date + time. Sudah terintegrasi di `ReusableForm` via `type: "datetime-local"`.

### ImageUploader — `dashboard/components/ui/ImageUploader.tsx`

Upload file/gambar. Sudah terintegrasi di `ReusableForm` via `type: "file"`.

### SelectOption — `dashboard/components/shared/SelectOption.tsx`

Dropdown select reusable. Sudah terintegrasi di `ReusableForm` via `type: "select"`. Gunakan langsung hanya di luar form (misal: filter tabel standalone).

---

## 10. Data Fetching — TanStack Query

Semua fetching data wajib menggunakan **TanStack Query**. Jangan `fetch`/`axios` langsung di komponen.

### Naming convention hooks

```
useGet[Resource]       → list / single fetch   (useGetUsers, useGetUserById)
useCreate[Resource]    → POST                  (useCreateUser)
useUpdate[Resource]    → PUT/PATCH             (useUpdateUser)
useDelete[Resource]    → DELETE                (useDeleteUser)
```

### Format response API

```ts
interface ApiResponse<T> {
  message: string;
  success: boolean;
  statusCode: number;
  data: T;
  errors?: { path: string; message: string }[]; // untuk validasi error
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
```

### Pattern standar

```tsx
// Query
const { data, isLoading } = useGetUsers({ page, limit, search });

// Mutation + toast + invalidate
const { mutate: createUser } = useCreateUser({
  onSuccess: (res) => {
    toast.success(res.message);
    queryClient.invalidateQueries({ queryKey: ["users"] });
  },
  onError: (err) => {
    toast.error(err.response?.data?.message ?? "Terjadi kesalahan");
  },
});
```

---

## 11. Error Handling — Sonner Toast

```tsx
import { toast } from "sonner";

toast.success(res.message);
toast.error(err.response?.data?.message ?? "Terjadi kesalahan");
toast.loading("Memproses...");
toast.promise(promise, {
  loading: "Menyimpan...",
  success: "Berhasil disimpan",
  error: "Gagal menyimpan",
});
```

- Jangan tampilkan kode error teknis atau stack trace ke user
- Error validasi dari API (`errors[]`) otomatis ditangani `ReusableForm` — tidak perlu toast manual untuk error form
- Jangan double-notify (toast + inline error bersamaan untuk kasus yang sama)

---

## 12. State Management — Context

Global state menggunakan React Context. Jangan install Zustand/Jotai/Redux.

- State yang bersifat lokal komponen → `useState`
- State yang perlu dishare antar komponen dalam satu fitur → prop drilling atau Context lokal
- State global app (user session, theme, permission) → Context di level app

---

## 13. Layout Pattern

### Struktur halaman

```tsx
// Page standar list/CRUD
<div className="space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Judul Halaman</h1>
      <p className="text-sm text-muted-foreground mt-1">Deskripsi singkat</p>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="outline">Export</Button>
      <Button onClick={handleCreate}>Tambah Baru</Button>
    </div>
  </div>

  {/* DataTable */}
  <DataTable ... />
</div>
```

### Grid layout

```
List / CRUD page         : full-width DataTable
Dashboard metrics        : grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
Detail + info sidebar    : grid-cols-1 lg:grid-cols-3
Form multi-kolom         : grid-cols-1 md:grid-cols-2
```

---

## 14. Dark Mode

- Semua token otomatis berubah via `.dark` class
- Jangan gunakan `bg-white`, `bg-black`, `text-gray-*` — selalu gunakan token
- Border dark mode sudah alpha `oklch(1 0 0 / 10%)` — jangan tambah opacity manual

---

## 15. Do & Don't

### ✅ Do

- Gunakan `DataTable` untuk semua tabel
- Gunakan `ReusableForm` untuk semua form
- Gunakan `ConfirmDialog` untuk aksi destruktif
- Gunakan token semantik untuk semua warna
- `handleXxx` untuk event handler, `onXxx` untuk props callback
- `PascalCase` untuk Type/Interface, `camelCase` untuk variabel/fungsi

### ❌ Don't

- Jangan buat tabel manual dengan `<Table>` shadcn
- Jangan buat form manual dengan `useForm` + JSX
- Jangan hardcode warna (`text-[#333]`, `bg-red-500`)
- Jangan gunakan `window.confirm()` — pakai `ConfirmDialog`
- Jangan fetch data langsung di komponen — pakai TanStack Query hooks
- Jangan tampilkan error teknis ke user — pakai `toast.error` dengan pesan yang readable
- Jangan install state management library baru — gunakan Context

---

## 16. Checklist Sebelum Selesai

- [ ] Tabel menggunakan `DataTable` dengan `tableId` dan `emptyMessage`
- [ ] Form menggunakan `ReusableForm` dengan `defaultValues` lengkap
- [ ] Aksi destruktif menggunakan `ConfirmDialog`
- [ ] Semua warna dari token, tidak ada hardcode
- [ ] Light + dark mode tidak ada yang pecah
- [ ] Loading state ada untuk setiap aksi async
- [ ] Error ditangani dengan `toast.error` dan pesan yang readable
- [ ] Tidak ada `console.log` tertinggal
- [ ] Nama file `kebab-case`, komponen `PascalCase`, handler `handleXxx`
