import { Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan - BOSS",
};

const TERMS_CONTENT = `
# Syarat dan Ketentuan
**Terakhir diperbarui:** 6 Juni 2026

---

### 1. Penerimaan Ketentuan
Dengan mengakses atau menggunakan platform BOSS ("Platform") yang dimiliki dan dikelola oleh **PT BOSS APP INDONESIA**, yang tersedia melalui situs utama [bossapp.id](https://bossapp.id) beserta sub-domain miliknya (seperti [dashboard.bossapp.id](https://dashboard.bossapp.id) dan [customer.bossapp.id](https://customer.bossapp.id)), Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui ketentuan ini, Anda tidak diperkenankan menggunakan Platform.

---

### 2. Deskripsi Layanan
BOSS (Business One Stop System) adalah platform manajemen bisnis multi-outlet dan Point of Sale (POS) yang dirancang untuk membantu pengelolaan operasional bisnis ritel (Retail), layanan (Service), makanan & minuman (FnB), acara (Event), maupun tipe bisnis custom lainnya. Platform menyediakan fitur-fitur utama berupa:

* Point of Sale (POS) Kasir & Pencatatan Transaksi
* Manajemen Produk Fisik (Goods) & Layanan (Service)
* Manajemen Multi-Business & Multi-Outlet
* Sistem Booking & Penjadwalan Layanan (dengan slot management)
* Antrian / Queue & Manajemen Meja (untuk FnB)
* Pencetakan Bill / Receipt (baik cetak langsung maupun PDF)
* Self-Order QR & Kitchen Display System (KDS)
* Manajemen Penjualan Tiket & Scan Tiket (untuk Event)
* Program Loyalitas (Loyalty & Poin) dan CRM (Data Pelanggan)
* Integrasi Layanan Pihak Ketiga (Midtrans/Xendit, Google Calendar, WhatsApp API)
* Laporan Analitik Bisnis Komprehensif

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
Platform terintegrasi dengan beberapa layanan pihak ketiga untuk mengoptimalkan operasional bisnis Anda, seperti Google API (termasuk Google Calendar untuk pencatatan jadwal booking), WhatsApp API/Gateway (untuk pengiriman notifikasi otomatis), serta *Payment Gateway* (seperti Midtrans/Xendit untuk proses transaksi online). Kami tidak bertanggung jawab atas kinerja, stabilitas, keamanan, atau perubahan kebijakan dari penyedia layanan pihak ketiga tersebut. Anda disarankan untuk membaca syarat dan ketentuan dari masing-masing penyedia layanan pihak ketiga tersebut.

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

* Email: [support@bossapp.id](mailto:support@bossapp.id)
* Situs Web Utama: [bossapp.id](https://bossapp.id)
`;

export default function TermsPage() {
  return (
    <div className="flex justify-center py-8">
      <div className="text-sm max-w-3xl leading-relaxed text-foreground/80 space-y-4">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-foreground mt-6 mb-3 border-b pb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-bold text-foreground mt-5 mb-2.5 border-b pb-1.5">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold text-primary mt-4 mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 shrink-0 text-primary" />
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-sm text-foreground/85 leading-relaxed my-2">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-5 my-2 space-y-1.5">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 my-2 space-y-1.5">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-sm text-foreground/85 leading-relaxed">
                {children}
              </li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">
                {children}
              </strong>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4 rounded-md border border-border">
                <table className="min-w-full divide-y divide-border text-sm">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-muted/40">{children}</thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-border">{children}</tbody>
            ),
            tr: ({ children }) => (
              <tr className="hover:bg-muted/10 transition-colors">
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2.5 text-foreground/80 leading-normal">
                {children}
              </td>
            ),
          }}
        >
          {TERMS_CONTENT}
        </ReactMarkdown>
      </div>
    </div>
  );
}
