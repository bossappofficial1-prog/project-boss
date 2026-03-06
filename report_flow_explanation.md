# Alur Laporan (Report Flow) di Project BOSS

Laporan untuk **Owner** dibagi menjadi dua bagian utama di frontend, yaitu **Laporan Outlet** dan **Laporan Staff**. Berikut adalah penjelasan bagaimana data mentah diproses hingga ditampilkan ke layar Owner.

## 1. Pengumpulan Data Mentah (Backend)

Semua data mentah yang berkaitan dengan laporan diambil dari database menggunakan Prisma ORM. Data utamanya bersumber dari tiga entri:
- **`Order` (Pesanan):** Menyimpan nilai transaksi (pendapatan) dan daftar item yang dipesan. Hanya order dengan status `COMPLETED` yang dihitung sebagai pendapatan.
- **`Expense` (Pengeluaran):** Mencatat operasional pengeluaran harian outlet.
- **`StockLog` (Log Stok Masuk):** Digunakan untuk menghitung *Pembelian Stok* (Harga Pokok Penjualan - HPP), dihitung khusus dari log dengan stok masuk (`quantity` x `hppPerUnit`).

## 2. Pemrosesan Data di [ReportService](file:///c:/Data/Projects/Project_BOSS/project-boss/backend/src/service/report.service.ts#26-788)

Pada file [backend/src/service/report.service.ts](file:///c:/Data/Projects/Project_BOSS/project-boss/backend/src/service/report.service.ts), data mentah ini diolah sebelum dikirim ke Frontend. Ada tiga fungsi utama di Service ini:

### A. Laporan Outlet ([getOutletReport](file:///c:/Data/Projects/Project_BOSS/project-boss/backend/src/service/report.service.ts#144-324) & [getCompareOutletsReport](file:///c:/Data/Projects/Project_BOSS/project-boss/backend/src/service/report.service.ts#325-413))
- **Penentuan Periode (Harian/Mingguan/Bulanan/Tahunan):** 
  - Jika **Harian**, sistem memecah hari dalam rentang waktu yang dipilih (misal 10 hari terakhir).
  - Jika **Mingguan**, sistem memecah dalam tiap minggu di bulan tersebut.
  - Jika **Bulanan / Tahunan**, sistem memecah data berdasarkan bulan dari Januari s.d. Desember.
- **Kalkulasi (Method [calculateStats](file:///c:/Data/Projects/Project_BOSS/project-boss/backend/src/service/report.service.ts#414-450)):** 
  - `Pendapatan` = Total seluruh amout order yang completed.
  - `Pembelian` = Total nominal log stok masuk hpp.
  - `Pengeluaran` = Total amount di tabel expense.
  - `Gaji/Komisi` = Dihitung per-item order yang bertipe *Service* (Layanan). Tergantung pengaturan komisinya di *ProductService*, apakah menggunakan presentase (`PERCENTAGE`) dari harga jual atau nominal tetap (flat rate).
  - `Laba Bersih` = Pendapatan - (Pembelian + Pengeluaran + Gaji/Komisi).

### B. Laporan Staff ([getStaffReport](file:///c:/Data/Projects/Project_BOSS/project-boss/backend/src/service/report.service.ts#451-572))
- Memecah data order yang selesai (`COMPLETED`) untuk mendapatkan atribusi staff:
  - **Kasir (`handledByStaff`):** Dihitung jumlah transaksi yang ditangani dan total nilai penjualan yang diproses kasir tersebut. (Kasir tidak mendapat komisi di perhitungan ini).
  - **Staff Layanan (`ProductService.providerName`):** Jika item order merupakan sebuah "Service" yang memiliki `providerName`, maka komisi akan dihitung untuk entitas staff layanan tersebut dengan mengalikan rate komisi atau nominal dengan `quantity` dari item order tersebut.

### C. Fitur Export Excel
Terdapat fitur untuk melakukan export ke `.xlsx` menggunakan `exceljs`. File excel tersebut digenerate langsung di sisi server (Backend) lalu di-download oleh browser melalui endpoint `GET /export/outlet/:outletId` dan `GET /export/staff/:outletId`.
Ada juga export khusus `export-transaction` yang menggunakan *Worker Queue* (BullMQ), ini untuk query besar yang hasilnya bisa dikirimkan ke email Owner tanpa menyumbat response API.

## 3. Menampilkan ke Dashboard (Frontend)

Setelah JSON / Response data tiba di browser, halaman berikut akan memprosesnya menggunakan React Hook:

### A. Halaman Laporan Outlet ([ReportOutletContent.tsx](file:///c:/Data/Projects/Project_BOSS/project-boss/dashboard/components/features/owner/report/outlet/ReportOutletContent.tsx))
- Digunakan *React Query hooks* (`useReportOutlet`, `useCompareOutletsReport`) untuk memanggil API tergantung tab filter (Mode Waktu: `time` atau Mode Bandingkan: `compare`).
- **Summary Cards (Card Ringkasan Atas):** 
  Nilai pada tabel summary cards (Pendapatan, Pembelian, Pengeluaran, Gaji/Komisi, Laba Bersih) dihitung otomatis oleh state management `useMemo` di React dengan menjumlahkan baris-baris data dari array object.
- **Tabel Data:** 
  Untuk mode Waktu, tabel akan melist tiap tanggal/minggu/bulan ke bawah. Untuk mode Banding, list akan berisi tiap nama outlet yang dimiliki Owner untuk menyandingkan Laba per Outlet.

### B. Halaman Laporan Staff ([ReportStaffContent.tsx](file:///c:/Data/Projects/Project_BOSS/project-boss/dashboard/components/features/owner/report/staff/ReportStaffContent.tsx))
- Menggunakan `useReportStaff`. 
- Menampilkan Ringkasan: **Total Transaksi**, **Total Penjualan (Kasir)**, dan **Total Komisi (Layanan)**.
- Menampilkan Tabel Staff yang bisa difilter tanggalnya secara spesifik.

---

### **Kesimpulan Alur**
**Data Mentah Transaksi & Expense -> Ditarik ke Service (Dikalkulasi Komisi, HPP, & Laba) -> Endpoint Controller -> UI Dashboard (Diringkas menggunakan useMemo, chart, & cards).**
