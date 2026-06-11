import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan - BOSS",
};

const TERMS_CONTENT = `
# Syarat dan Ketentuan
**Terakhir diperbarui:** 11 Juni 2026

---

### 1. Penerimaan Ketentuan
Dengan mengakses atau menggunakan platform BOSS ("Platform") yang dimiliki dan dikelola oleh **PT BOSS APP INDONESIA**, yang tersedia melalui situs utama [bossapp.id](https://bossapp.id) beserta sub-domain miliknya (seperti [dashboard.bossapp.id](https://dashboard.bossapp.id) dan [customer.bossapp.id](https://customer.bossapp.id)), Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui ketentuan ini, Anda tidak diperkenankan menggunakan Platform.

---

### 2. Deskripsi Layanan
BOSS (Business One Stop System) adalah platform manajemen bisnis multi-outlet dan Point of Sale (POS) yang dirancang untuk membantu pengelolaan operasional bisnis ritel (Retail), layanan (Service), makanan & minuman (FnB), acara (Event), maupun tipe bisnis custom lainnya. Platform menyediakan fitur-fitur utama berupa:

* Point of Sale (POS) Kasir & Pencatatan Transaksi
* Manajemen Multi-Business & Multi-Outlet (arsitektur multi-tenant)
* Manajemen Produk Fisik (Goods) & Layanan (Service) dengan kategori dan media gambar
* Manajemen Stok Produk dengan metode FIFO (First In, First Out) serta transfer stok antar outlet
* Manajemen Bahan Baku (Ingredient) dengan metode FIFO untuk bisnis F&B
* Resep Menu (Recipe/Bill of Materials) untuk bisnis F&B
* Supplier & Pemesanan Pembelian (Purchase Order) untuk rantai pasok
* Sistem Booking & Penjadwalan Layanan (dengan slot management dan provider commission)
* Antrian / Queue & Manajemen Meja (untuk FnB)
* Self-Order QR & Kitchen Display System (KDS)
* Manajemen Penjualan Tiket & Scan Tiket QR/Barcode (untuk Event)
* Pencetakan Bill / Receipt (ESC/POS thermal langsung maupun PDF)
* Split Bill / Pembagian Tagihan untuk meja grup
* Program Loyalitas (Poin, Tiers Bronze/Silver/Gold, Rewards, Redemption) & CRM (Data Pelanggan)
* Manajemen Staf dengan peran (Cashier, Waiter, Kitchen, Manager, Staff) & hak akses granular
* Absensi Staf dengan verifikasi Face Recognition & validasi lokasi geografis
* Manajemen Shift Kasir (buka/tutup shift, pergerakan kas masuk/keluar)
* Akuntansi (Chart of Accounts, Jurnal Double-Entry)
* Manajemen Pengeluaran Operasional
* Permintaan Penghapusan/Void Transaksi
* Laporan Keuangan: Laba Rugi, Profit per Produk, Kesehatan Bisnis
* Analitik Khusus: Jam Ramai (Peak Hours), Sales Target Breakdown
* Kalkulator HPP (Harga Pokok Penjualan) & BEP (Break Even Point)
* Asisten Analitik berbasis AI
* Integrasi Pihak Ketiga (Midtrans/Xendit, Google Calendar, WhatsApp/Twilio API, Web Push Notification)
* Notifikasi In-App & Push Notification Browser
* Pemasaran (Marketing Broadcast & Campaign)
* Laporan Analitik Bisnis Komprehensif & Dashboard Outlet Real-time

---

### 3. Pendaftaran Akun
Anda bertanggung jawab untuk:
* Memberikan informasi yang akurat, benar, dan terkini saat melakukan pendaftaran.
* Menjaga kerahasiaan kredensial login (username, email, kata sandi, token) akun Anda.
* Seluruh aktivitas yang terjadi di bawah akun Anda.
* Segera memberi tahu kami jika terjadi akses tidak sah atau pelanggaran keamanan pada akun Anda.

---

### 4. Penggunaan yang Diizinkan
Anda setuju untuk menggunakan Platform hanya untuk tujuan yang sah dan sesuai dengan:
* Semua hukum dan peraturan perundang-undangan yang berlaku di Republik Indonesia.
* Syarat dan Ketentuan ini beserta seluruh panduan operasional di Platform.
* Hak kekayaan intelektual kami dan pihak ketiga.

---

### 5. Paket Berlangganan, Biaya, dan Pembayaran
Platform menawarkan beberapa pilihan Paket Berlangganan (*Subscription Plans*) bagi Pemilik Bisnis (*Owner*):

* **Trial (14 Hari):** Akses uji coba gratis selama 14 hari dengan fitur Pro (maksimal 2 outlet, 100 produk, 5 staf).
* **Basic:** Paket gratis selama 30 hari dengan fitur dasar (maksimal 1 outlet, 50 produk, 2 staf, tanpa analitik/loyalty/multi-outlet).
* **Pro:** Paket berlangganan berbayar Rp 149.000 per 30 hari (maksimal 3 outlet, 500 produk, 10 staf, dilengkapi analitik, program loyalitas, multi-outlet, dan ekspor laporan).
* **Enterprise:** Paket berlangganan berbayar Rp 349.000 per 30 hari (tanpa batasan outlet/produk/staf, dilengkapi seluruh fitur Pro, *dedicated support*, serta integrasi kustom).

**Pembayaran Langganan Platform:** Pembayaran langganan diproses melalui transfer bank manual ke rekening resmi atas nama **PT BOSS APP INDONESIA** (BCA, Mandiri, BNI) atau metode pembayaran online resmi lainnya yang tertera pada halaman tagihan. Aktivasi paket dilakukan setelah verifikasi bukti pembayaran berhasil.

**Biaya Transaksi (Sistem Pembayaran Outlet):** Platform terintegrasi dengan *Payment Gateway* (seperti Midtrans) untuk memproses pembayaran non-tunai (QRIS & Online Payment) oleh pelanggan outlet Anda. Terdapat struktur biaya transaksi (*Smart Fee Structure*) yang terdiri atas:

* Biaya Layanan *Payment Gateway* (Midtrans) sebesar 0,7% (atau sesuai ketentuan metode pembayaran yang digunakan).
* Biaya Administrasi Aplikasi BOSS sebesar 2%.

Berdasarkan pengaturan pada Platform, Pemilik Bisnis dapat memilih siapa yang menanggung biaya transaksi ini: ditanggung sepenuhnya oleh Pemilik Bisnis (*Owner*) atau dibebankan kepada Pelanggan (*Customer*).

---

### 6. Data dan Privasi
Pengumpulan, penyimpanan, dan pemrosesan data Anda diatur sepenuhnya oleh Kebijakan Privasi kami yang tersedia di [dashboard.bossapp.id/privacy](https://dashboard.bossapp.id/privacy). Dengan menggunakan Platform, Anda memberikan persetujuan kepada PT BOSS APP INDONESIA untuk mengelola data Anda sesuai dengan ketentuan dalam Kebijakan Privasi tersebut.

---

### 7. Hak Kekayaan Intelektual
Seluruh konten, logo, merek dagang, fitur, kode sumber, desain antarmuka, dan teknologi Platform dilindungi oleh hak kekayaan intelektual dan merupakan milik eksklusif kami atau pemberi lisensi kami. Anda tidak diperbolehkan menyalin, memodifikasi, membongkar (*reverse engineer*), mendistribusikan, atau membuat karya turunan dari Platform tanpa izin tertulis dari kami.

---

### 8. Batasan Tanggung Jawab
Platform BOSS disediakan "sebagaimana adanya" dan "sebagaimana tersedia" tanpa jaminan apa pun, baik tersurat maupun tersirat. PT BOSS APP INDONESIA tidak bertanggung jawab atas segala kerugian finansial, kehilangan data, atau gangguan operasional bisnis yang timbul akibat penggunaan atau ketidakmampuan menggunakan Platform. Tanggung jawab total kami atas klaim apa pun yang timbul dari Syarat ini dibatasi hingga jumlah yang Anda bayarkan kepada kami untuk paket berlangganan dalam 12 (dua belas) bulan terakhir.

---

### 9. Layanan dan Integrasi Pihak Ketiga
Platform terintegrasi dengan beberapa layanan pihak ketiga untuk mengoptimalkan operasional bisnis Anda, seperti Google API (termasuk Google Calendar untuk pencatatan jadwal booking), WhatsApp API/Twilio (untuk pengiriman notifikasi otomatis via WhatsApp dan SMS), Web Push Notification (untuk notifikasi browser real-time), serta *Payment Gateway* (seperti Midtrans/Xendit untuk proses transaksi online). Kami tidak bertanggung jawab atas kinerja, stabilitas, keamanan, atau perubahan kebijakan dari penyedia layanan pihak ketiga tersebut. Anda disarankan untuk membaca syarat dan ketentuan dari masing-masing penyedia layanan pihak ketiga tersebut.

---

### 10. Penghentian Layanan
Kami berhak menangguhkan atau menghentikan akses Anda ke Platform secara sepihak jika Anda melanggar ketentuan dalam Syarat dan Ketentuan ini atau terindikasi melakukan penyalahgunaan sistem/tindakan ilegal. Anda dapat menghentikan penggunaan Platform kapan saja dengan memutus paket berlangganan dan mengajukan permohonan penghapusan akun Anda.

---

### 11. Perubahan Syarat dan Ketentuan
Kami berhak mengubah Syarat dan Ketentuan ini sewaktu-waktu. Perubahan tersebut akan kami informasikan melalui Platform atau melalui email terdaftar. Penggunaan Platform yang berkelanjutan setelah perubahan tersebut berlaku akan dianggap sebagai persetujuan Anda terhadap Syarat dan Ketentuan yang diperbarui.

---

### 12. Hukum yang Mengatur dan Penyelesaian Sengketa
Syarat dan Ketentuan ini tunduk pada dan ditafsirkan sesuai dengan hukum Negara Republik Indonesia. Setiap perselisihan, sengketa, atau perbedaan pendapat yang timbul dari atau terkait dengan penggunaan Platform yang tidak dapat diselesaikan secara kekeluargaan akan diajukan dan diselesaikan melalui pengadilan negeri yang berwenang di Indonesia yang ditunjuk oleh PT BOSS APP INDONESIA.

---

### 13. Hubungi Kami
Jika Anda memiliki pertanyaan, keluhan, atau memerlukan bantuan terkait Syarat dan Ketentuan ini atau layanan Platform, silakan hubungi tim support kami melalui:

* Email: [bossappofficial1@gmail.com](mailto:bossappofficial1@gmail.com)
* Situs Web Utama: [bossapp.id](https://bossapp.id)
`;

export default function TermsPage() {
  return (
    <div className="flex px-4 md:justify-center md:py-8">
      <div className="text-sm max-w-3xl leading-relaxed text-foreground/80 space-y-4">
        <MarkdownRenderer markdown={TERMS_CONTENT} />
      </div>
    </div>
  );
}
