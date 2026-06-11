import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi - BOSS",
};

const PRIVACY_CONTENT = `
# Kebijakan Privasi

**Terakhir diperbarui: 11 Juni 2026**

### 1. Pendahuluan

**PT BOSS APP INDONESIA** ("kami", "BOSS", atau "Platform") berkomitmen untuk melindungi dan menghormati privasi pengguna platform kami. Kebijakan Privasi ini menjelaskan dasar pengumpulan, penyimpanan, penggunaan, pemrosesan, dan perlindungan informasi/data pribadi Anda saat mengakses dan menggunakan platform BOSS, termasuk namun tidak terbatas pada situs utama [bossapp.id](https://bossapp.id), sub-domain [dashboard.bossapp.id](https://dashboard.bossapp.id) (dashboard manajemen), [customer.bossapp.id](https://customer.bossapp.id) (aplikasi pelanggan), serta seluruh layanan terkait yang kami sediakan.

---

### 2. Data yang Kami Kumpulkan

Kami mengumpulkan data berikut untuk menyediakan layanan terbaik bagi Anda:

* **Data Akun Pengguna:** Nama lengkap, alamat email, nomor telepon, kata sandi terenkripsi, serta kredensial autentikasi lainnya.
* **Data Operasional Bisnis:** Nama usaha, informasi outlet/cabang, detail produk fisik (Goods) atau layanan (Service), data stok, manajemen meja, dan laporan analitik bisnis Anda.
* **Data Pelanggan Bisnis:** Nama pelanggan, nomor telepon, poin loyalitas, riwayat transaksi, serta data partisipasi program loyalitas (tingkatan member, riwayat penukaran reward).
* **Data Transaksi & Keuangan:** Detail pemesanan, nilai transaksi, invoice berlangganan, status pembayaran, data pelacakan transaksi melalui Payment Gateway terintegrasi, serta data shift kasir dan pergerakan kas.
* **Data Biometrik & Lokasi:** Data citra wajah (foto selfie) untuk verifikasi kehadiran staf (absensi check-in/check-out) melalui teknologi face recognition, serta data titik koordinat geografis (GPS) untuk validasi lokasi saat absensi.
* **Data Manufaktur & Rantai Pasok:** Data bahan baku (ingredient), resep menu (recipe/bill of materials), data supplier, serta pemesanan pembelian (purchase order) untuk bisnis F&B dan ritel.
* **Data Media & Unggahan:** File gambar/foto produk, logo bisnis, bukti pembayaran, serta dokumen lain yang Anda unggah ke Platform.
* **Data Integrasi Pihak Ketiga:**

  * **Google OAuth & Calendar API:** Jika Anda mengaktifkan integrasi Google Calendar untuk fitur booking/penjadwalan, kami mengumpulkan token akses (access token & refresh token) serta ID kalender Anda untuk mensinkronisasikan jadwal janji temu pelanggan ke kalender Google Anda secara real-time.
  * **WhatsApp Gateway API:** Token akses dan nomor WhatsApp untuk mengirimkan notifikasi otomatis status pemesanan, invoice, atau e-receipt kepada pelanggan.
* **Data Teknis & Penggunaan:** Alamat IP, tipe perangkat, sistem operasi, browser web yang digunakan, log aktivitas, serta metrik performa aplikasi.

---

### 3. Cara Kami Menggunakan Data

Kami memproses data pribadi Anda untuk tujuan-tujuan berikut:

* Menyediakan, memelihara, mengoptimalkan, dan mengembangkan fitur-fitur Platform BOSS.
* Memproses transaksi penjualan, mengelola invoice berlangganan, serta memverifikasi status pembayaran.
* Mengirimkan notifikasi WhatsApp, SMS, push notification, atau email terkait status pesanan, pembayaran, dan informasi akun.
* Menyelaraskan data jadwal pemesanan layanan dengan Google Calendar Anda secara otomatis berdasarkan integrasi yang Anda aktifkan.
* Melakukan analisis statistik dan performa bisnis untuk menyajikan laporan operasional yang akurat bagi pemilik bisnis.
* Mengelola program loyalitas pelanggan, perhitungan poin, penentuan tingkatan member (tiering), serta pemrosesan penukaran reward.
* Menjalankan algoritma kecerdasan buatan (AI) untuk analitik bisnis prediktif, rekomendasi produk, dan pendeteksian anomali transaksi.
* Memverifikasi kehadiran staf melalui teknologi face recognition beserta validasi lokasi geografis untuk laporan absensi yang akurat.
* Mengelola antrian (queue) pesanan, menampilkan status pesanan secara real-time ke Kitchen Display System (KDS), dan mengelola pemesanan meja (reservasi).
* Memproses pembuatan dan pemindaian kode QR/Barcode untuk tiket event yang telah dibeli pelanggan.
* Mengirimkan notifikasi push browser untuk pengingat transaksi, update status pesanan, dan informasi akun penting.
* Mengelola shift kasir, pergerakan kas (cash in/out), serta rekonsiliasi keuangan harian outlet.
* Memproses permintaan penghapusan/void transaksi serta pembatalan pesanan sesuai kebijakan yang berlaku.
* Mencegah aktivitas ilegal, kecurangan (fraud), penyalahgunaan sistem, serta menjaga keamanan seluruh pengguna Platform.
* Memenuhi kewajiban hukum berdasarkan peraturan perundang-undangan yang berlaku di Indonesia.

> **Pernyataan Penting Penggunaan Data Google API**
>
> Penggunaan informasi yang diterima dari Google API (seperti Google Calendar) oleh BOSS akan sepenuhnya mematuhi [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), termasuk ketentuan Penggunaan Terbatas (Limited Use). Kami tidak akan membagikan, menjual, atau menggunakan data kalender Google Anda untuk tujuan selain menyelaraskan jadwal booking pada Platform.

---

### 4. Penyimpanan dan Keamanan Data

Data Anda disimpan dengan aman menggunakan enkripsi standar industri dan kontrol hak akses yang ketat. Kami mengambil langkah-langkah keamanan teknis, fisik, dan manajerial (seperti enkripsi kata sandi menggunakan bcrypt dan pembatasan akses database) untuk melindungi informasi Anda dari kehilangan, pencurian, penyalahgunaan, serta akses, pengungkapan, perubahan, atau pemusnahan yang tidak sah.

---

### 5. Pengelolaan Integrasi Pihak Ketiga

Platform kami memungkinkan integrasi dengan berbagai layanan eksternal untuk memperlancar bisnis Anda:

* **Google Calendar:** Sinkronisasi dua arah otomatis antara sistem booking BOSS dengan Google Calendar milik Owner atau staf. Anda dapat memutus (disconnect) integrasi ini kapan saja melalui menu pengaturan integrasi di dashboard.
* **Payment Gateway:** Proses verifikasi pembayaran otomatis oleh Midtrans. Data kartu kredit, e-wallet, atau virtual account diproses secara aman oleh penyedia sistem pembayaran berlisensi Bank Indonesia dan tidak disimpan di server BOSS.
* **Web Push Notification:** Layanan push notification browser untuk mengirimkan pemberitahuan real-time kepada pengguna terkait pesanan baru, status pembayaran, pengingat, dan informasi akun penting.

---

### 6. Pembagian Data Kepada Pihak Ketiga

Kami berkomitmen untuk tidak menjual atau menyewakan informasi pribadi Anda kepada pihak mana pun. Data Anda hanya akan dibagikan kepada pihak lain dalam batas-batas yang diizinkan sebagai berikut:

* **Penyedia Layanan Sub-kontraktor:** Seperti penyedia layanan hosting server cloud (Infrastruktur), layanan pengiriman email (SMTP), dan penyedia payment gateway yang diperlukan untuk operasional Platform.
* **Kepatuhan Hukum:** Kami dapat mengungkapkan data Anda jika diwajibkan oleh undang-undang, putusan pengadilan, atau atas permintaan resmi dari aparat penegak hukum yang berwenang di Indonesia.
* **Penyelamatan & Perlindungan Hak:** Untuk melindungi integritas Platform, hak kepemilikan PT BOSS APP INDONESIA, serta keselamatan fisik pengguna BOSS dan masyarakat umum.

---

### 7. Retensi Data

Kami akan menyimpan data pribadi Anda selama akun Anda tetap aktif dan paket berlangganan berjalan, atau selama diperlukan untuk mematuhi kewajiban hukum, perpajakan, dan audit kami. Jika Anda memutuskan untuk menghapus akun Anda, kami akan menghapus atau menganonimkan data Anda sesuai kebijakan retensi data kami, kecuali jika undang-undang mewajibkan kami menyimpannya untuk jangka waktu yang lebih lama.

---

### 8. Hak-Hak Anda Sebagai Pemilik Data

Sesuai dengan ketentuan Undang-Undang Perlindungan Data Pribadi (UU PDP) yang berlaku di Indonesia, Anda memiliki hak untuk:

* Mengakses, memeriksa, dan meminta salinan informasi pribadi Anda yang kami simpan.
* Memperbarui atau mengoreksi data yang tidak akurat, tidak lengkap, atau tidak mutakhir melalui menu profil bisnis Anda.
* Meminta penghapusan atau pemusnahan data pribadi Anda (dengan konsekuensi penghentian layanan Platform Anda).
* Menarik persetujuan Anda atas pemrosesan data pribadi tertentu, termasuk mencabut akses OAuth Google Calendar atau WhatsApp.

Untuk mengajukan permintaan penghapusan data atau pelaksanaan hak perlindungan data lainnya, silakan hubungi kami melalui email resmi di **[bossappofficial1@gmail.com](mailto:bossappofficial1@gmail.com)**.

---

### 9. Perubahan Kebijakan Privasi

Kebijakan Privasi ini dapat diperbarui dari waktu ke waktu untuk menyesuaikan dengan perubahan operasional Platform atau perubahan regulasi hukum yang berlaku. Kami akan memberi tahu Anda mengenai perubahan materiil melalui notifikasi di Platform atau melalui email Anda yang terdaftar. Kami menyarankan Anda untuk meninjau halaman ini secara berkala.

---

### 10. Hubungi Kami

Jika Anda memiliki kekhawatiran, pertanyaan, atau keluhan terkait dengan cara kami mengelola Kebijakan Privasi ini atau data pribadi Anda, silakan hubungi Data Protection / Support Officer kami melalui:

* **Email:** [bossappofficial1@gmail.com](mailto:bossappofficial1@gmail.com)
* **Alamat Surat:** PT BOSS APP INDONESIA, Jakarta, Indonesia
`;
export default function PrivacyPage() {
  return (
    <div className="flex px-4 md:justify-center md:py-8">
      <div className="text-sm max-w-3xl leading-relaxed text-foreground/80 space-y-4">
        <MarkdownRenderer markdown={PRIVACY_CONTENT} />
      </div>
    </div>
  );
}
