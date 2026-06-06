import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan - BOSS",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 animate-in fade-in slide-in-from-bottom duration-300">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Syarat dan Ketentuan</h1>
        <p className="mt-2 text-sm text-muted-foreground">Terakhir diperbarui: 6 Juni 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">1. Penerimaan Ketentuan</h2>
            <p className="mt-2 text-muted-foreground">
              Dengan mengakses atau menggunakan platform BOSS (&quot;Platform&quot;) yang dimiliki dan dikelola oleh{" "}
              <span className="font-semibold text-foreground">PT BOSS APP INDONESIA</span>, yang tersedia melalui situs
              utama <a href="https://bossapp.id" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">bossapp.id</a>{" "}
              beserta sub-domain miliknya (seperti <a href="https://dashboard.bossapp.id" className="text-primary hover:underline font-medium">dashboard.bossapp.id</a>{" "}
              dan <a href="https://customer.bossapp.id" className="text-primary hover:underline font-medium">customer.bossapp.id</a>), Anda menyetujui untuk
              terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui ketentuan ini, Anda tidak diperkenankan menggunakan Platform.
            </p>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">2. Deskripsi Layanan</h2>
            <p className="mt-2 text-muted-foreground">
              BOSS (Business One Stop System) adalah platform manajemen bisnis multi-outlet dan Point of Sale (POS) yang dirancang untuk membantu pengelolaan operasional bisnis ritel (Retail), layanan (Service), makanan &amp; minuman (FnB), acara (Event), maupun tipe bisnis custom lainnya. Platform menyediakan fitur-fitur utama berupa:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Point of Sale (POS) Kasir &amp; Pencatatan Transaksi</li>
              <li>Manajemen Produk Fisik (Goods) &amp; Layanan (Service)</li>
              <li>Manajemen Multi-Business &amp; Multi-Outlet</li>
              <li>Sistem Booking &amp; Penjadwalan Layanan (dengan slot management)</li>
              <li>Antrian / Queue &amp; Manajemen Meja (untuk FnB)</li>
              <li>Pencetakan Bill / Receipt (baik cetak langsung maupun PDF)</li>
              <li>Self-Order QR &amp; Kitchen Display System (KDS)</li>
              <li>Manajemen Penjualan Tiket &amp; Scan Tiket (untuk Event)</li>
              <li>Program Loyalitas (Loyalty &amp; Poin) dan CRM (Data Pelanggan)</li>
              <li>Integrasi Layanan Pihak Ketiga (Midtrans/Xendit, Google Calendar, WhatsApp API)</li>
              <li>Laporan Analitik Bisnis Komprehensif</li>
            </ul>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">3. Pendaftaran Akun</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>Anda bertanggung jawab untuk:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Memberikan informasi yang akurat, benar, dan terkini saat melakukan pendaftaran.</li>
                <li>Menjaga kerahasiaan kredensial login (username, email, kata sandi, token) akun Anda.</li>
                <li>Seluruh aktivitas yang terjadi di bawah akun Anda.</li>
                <li>Segera memberi tahu kami jika terjadi akses tidak sah atau pelanggaran keamanan pada akun Anda.</li>
              </ul>
            </div>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">4. Penggunaan yang Diizinkan</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>Anda setuju untuk menggunakan Platform hanya untuk tujuan yang sah dan sesuai dengan:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Semua hukum dan peraturan perundang-undangan yang berlaku di Republik Indonesia.</li>
                <li>Syarat dan Ketentuan ini beserta seluruh panduan operasional di Platform.</li>
                <li>Hak kekayaan intelektual kami dan pihak ketiga.</li>
              </ul>
            </div>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">5. Paket Berlangganan, Biaya, dan Pembayaran</h2>
            <div className="mt-2 space-y-3 text-muted-foreground">
              <p>
                Platform menawarkan beberapa pilihan Paket Berlangganan (Subscription Plans) bagi Pemilik Bisnis (Owner):
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Trial (14 Hari):</strong> Akses uji coba gratis selama 14 hari dengan fitur Pro (maksimal 2 outlet, 100 produk, 5 staf).</li>
                <li><strong>Basic:</strong> Paket gratis selama 30 hari dengan fitur dasar (maksimal 1 outlet, 50 produk, 2 staf, tanpa analitik/loyalty/multi-outlet).</li>
                <li><strong>Pro:</strong> Paket berlangganan berbayar Rp 149.000 per 30 hari (maksimal 3 outlet, 500 produk, 10 staf, dilengkapi analitik, program loyalitas, multi-outlet, dan ekspor laporan).</li>
                <li><strong>Enterprise:</strong> Paket berlangganan berbayar Rp 349.000 per 30 hari (tanpa batasan outlet/produk/staf, dilengkapi seluruh fitur Pro, dedicated support, serta integrasi kustom).</li>
              </ul>
              <p>
                <strong>Pembayaran Langganan Platform:</strong> Pembayaran langganan diproses melalui transfer bank manual ke rekening resmi atas nama <strong>PT BOSS APP INDONESIA</strong> (BCA, Mandiri, BNI) atau metode pembayaran online resmi lainnya yang tertera pada halaman tagihan. Aktivasi paket dilakukan setelah verifikasi bukti pembayaran berhasil.
              </p>
              <p>
                <strong>Biaya Transaksi (Sistem Pembayaran Outlet):</strong> Platform terintegrasi dengan Payment Gateway (seperti Midtrans) untuk memproses pembayaran non-tunai (QRIS &amp; Online Payment) oleh pelanggan outlet Anda. Terdapat struktur biaya transaksi (Smart Fee Structure) yang terdiri atas:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Biaya Layanan Payment Gateway (Midtrans) sebesar 0,7% (atau sesuai ketentuan metode pembayaran yang digunakan).</li>
                <li>Biaya Administrasi Aplikasi BOSS sebesar 2%.</li>
              </ul>
              <p>
                Berdasarkan pengaturan pada Platform, Pemilik Bisnis dapat memilih siapa yang menanggung biaya transaksi ini: ditanggung sepenuhnya oleh Pemilik Bisnis (Owner) atau dibebankan kepada Pelanggan (Customer).
              </p>
            </div>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">6. Data dan Privasi</h2>
            <p className="mt-2 text-muted-foreground">
              Pengumpulan, penyimpanan, dan pemrosesan data Anda diatur sepenuhnya oleh Kebijakan Privasi kami yang tersedia di{" "}
              <a href="https://dashboard.bossapp.id/privacy" className="text-primary hover:underline font-medium">
                dashboard.bossapp.id/privacy
              </a>. Dengan menggunakan Platform, Anda memberikan persetujuan kepada PT BOSS APP INDONESIA untuk mengelola data Anda sesuai dengan ketentuan dalam Kebijakan Privasi tersebut.
            </p>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">7. Hak Kekayaan Intelektual</h2>
            <p className="mt-2 text-muted-foreground">
              Seluruh konten, logo, merek dagang, fitur, kode sumber, desain antarmuka, dan teknologi Platform dilindungi oleh hak kekayaan intelektual
              dan merupakan milik eksklusif kami atau pemberi lisensi kami. Anda tidak diperbolehkan menyalin,
              memodifikasi, membongkar (reverse engineer), mendistribusikan, atau membuat karya turunan dari Platform tanpa izin tertulis dari kami.
            </p>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">8. Batasan Tanggung Jawab</h2>
            <p className="mt-2 text-muted-foreground">
              Platform BOSS disediakan &quot;sebagaimana adanya&quot; dan &quot;sebagaimana tersedia&quot; tanpa jaminan apa pun, baik tersurat maupun tersirat. PT BOSS APP INDONESIA tidak bertanggung jawab atas segala kerugian finansial, kehilangan data, atau gangguan operasional bisnis yang timbul akibat penggunaan atau ketidakmampuan menggunakan Platform. Tanggung jawab total kami atas klaim apa pun yang timbul dari Syarat ini dibatasi hingga jumlah yang Anda bayarkan kepada kami untuk paket berlangganan dalam 12 (dua belas) bulan terakhir.
            </p>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">9. Layanan dan Integrasi Pihak Ketiga</h2>
            <p className="mt-2 text-muted-foreground">
              Platform terintegrasi dengan beberapa layanan pihak ketiga untuk mengoptimalkan operasional bisnis Anda, seperti Google API (termasuk Google Calendar untuk pencatatan jadwal booking), WhatsApp API/Gateway (untuk pengiriman notifikasi otomatis), serta Payment Gateway (seperti Midtrans/Xendit untuk proses transaksi online). Kami tidak bertanggung jawab atas kinerja, stabilitas, keamanan, atau perubahan kebijakan dari penyedia layanan pihak ketiga tersebut. Anda disarankan untuk membaca syarat dan ketentuan dari masing-masing penyedia layanan pihak ketiga tersebut.
            </p>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">10. Penghentian Layanan</h2>
            <p className="mt-2 text-muted-foreground">
              Kami berhak menangguhkan atau menghentikan akses Anda ke Platform secara sepihak jika Anda melanggar ketentuan dalam Syarat dan Ketentuan ini atau terindikasi melakukan penyalahgunaan sistem/tindakan ilegal. Anda dapat menghentikan penggunaan Platform kapan saja dengan memutus paket berlangganan dan mengajukan permohonan penghapusan akun Anda.
            </p>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">11. Perubahan Syarat dan Ketentuan</h2>
            <p className="mt-2 text-muted-foreground">
              Kami berhak mengubah Syarat dan Ketentuan ini sewaktu-waktu. Perubahan tersebut akan kami informasikan melalui Platform atau melalui email terdaftar. Penggunaan Platform yang berkelanjutan setelah perubahan tersebut berlaku akan dianggap sebagai persetujuan Anda terhadap Syarat dan Ketentuan yang diperbarui.
            </p>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">12. Hukum yang Mengatur dan Penyelesaian Sengketa</h2>
            <p className="mt-2 text-muted-foreground">
              Syarat dan Ketentuan ini tunduk pada dan ditafsirkan sesuai dengan hukum Negara Republik Indonesia. Setiap perselisihan, sengketa, atau perbedaan pendapat yang timbul dari atau terkait dengan penggunaan Platform yang tidak dapat diselesaikan secara kekeluargaan akan diajukan dan diselesaikan melalui pengadilan negeri yang berwenang di Indonesia yang ditunjuk oleh PT BOSS APP INDONESIA.
            </p>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">13. Hubungi Kami</h2>
            <p className="mt-2 text-muted-foreground">
              Jika Anda memiliki pertanyaan, keluhan, atau memerlukan bantuan terkait Syarat dan Ketentuan ini atau layanan Platform, silakan hubungi tim support kami melalui:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Email: <a href="mailto:support@bossapp.id" className="text-primary hover:underline font-medium">support@bossapp.id</a></li>
              <li>Situs Web Utama: <a href="https://bossapp.id" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">bossapp.id</a></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
