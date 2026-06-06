import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi - BOSS",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 animate-in fade-in slide-in-from-bottom duration-300">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Kebijakan Privasi</h1>
        <p className="mt-2 text-sm text-muted-foreground">Terakhir diperbarui: 6 Juni 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">1. Pendahuluan</h2>
            <p className="mt-2 text-muted-foreground">
              <span className="font-semibold text-foreground">PT BOSS APP INDONESIA</span> (&quot;kami&quot;, &quot;BOSS&quot;, atau &quot;Platform&quot;) berkomitmen untuk melindungi dan menghormati privasi pengguna platform kami. Kebijakan Privasi ini menjelaskan dasar pengumpulan, penyimpanan, penggunaan, pemrosesan, dan perlindungan informasi/data pribadi Anda saat mengakses dan menggunakan platform BOSS, termasuk namun tidak terbatas pada situs utama <a href="https://bossapp.id" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">bossapp.id</a>, sub-domain <a href="https://dashboard.bossapp.id" className="text-primary hover:underline font-medium">dashboard.bossapp.id</a> (dashboard manajemen), <a href="https://customer.bossapp.id" className="text-primary hover:underline font-medium">customer.bossapp.id</a> (aplikasi pelanggan), serta seluruh layanan terkait yang kami sediakan.
            </p>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">2. Data yang Kami Kumpulkan</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>Kami mengumpulkan data berikut untuk menyediakan layanan terbaik bagi Anda:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Data Akun Pengguna:</strong> Nama lengkap, alamat email, nomor telepon, kata sandi terenkripsi, serta kredensial autentikasi lainnya.</li>
                <li><strong>Data Operasional Bisnis:</strong> Nama usaha, informasi outlet/cabang, detail produk fisik (Goods) atau layanan (Service), data stok, manajemen meja, dan laporan analitik bisnis Anda.</li>
                <li><strong>Data Pelanggan Bisnis:</strong> Nama pelanggan, nomor telepon, poin loyalitas, serta riwayat transaksi pembelian mereka di outlet Anda.</li>
                <li><strong>Data Transaksi &amp; Keuangan:</strong> Detail pemesanan, nilai transaksi, invoice berlangganan, status pembayaran, serta data pelacakan transaksi melalui Payment Gateway terintegrasi.</li>
                <li><strong>Data Integrasi Pihak Ketiga:</strong>
                  <ul className="list-circle pl-5 mt-1 space-y-1">
                    <li><strong>Google OAuth &amp; Calendar API:</strong> Jika Anda mengaktifkan integrasi Google Calendar untuk fitur booking/penjadwalan, kami mengumpulkan token akses (access token &amp; refresh token) serta ID kalender Anda untuk mensinkronisasikan jadwal janji temu pelanggan ke kalender Google Anda secara real-time.</li>
                    <li><strong>WhatsApp Gateway API:</strong> Token akses dan nomor WhatsApp untuk mengirimkan notifikasi otomatis status pemesanan, invoice, atau e-receipt kepada pelanggan.</li>
                  </ul>
                </li>
                <li><strong>Data Teknis &amp; Penggunaan:</strong> Alamat IP, tipe perangkat, sistem operasi, browser web yang digunakan, log aktivitas, serta metrik performa aplikasi.</li>
              </ul>
            </div>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">3. Cara Kami Menggunakan Data</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>Kami memproses data pribadi Anda untuk tujuan-tujuan berikut:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Menyediakan, memelihara, mengoptimalkan, dan mengembangkan fitur-fitur Platform BOSS.</li>
                <li>Memproses transaksi penjualan, mengelola invoice berlangganan, serta memverifikasi status pembayaran.</li>
                <li>Mengirimkan notifikasi WhatsApp, SMS, push notification, atau email terkait status pesanan, pembayaran, dan informasi akun.</li>
                <li>Menyelaraskan data jadwal pemesanan layanan dengan Google Calendar Anda secara otomatis berdasarkan integrasi yang Anda aktifkan.</li>
                <li>Melakukan analisis statistik dan performa bisnis untuk menyajikan laporan operasional yang akurat bagi pemilik bisnis.</li>
                <li>Mencegah aktivitas ilegal, kecurangan (fraud), penyalahgunaan sistem, serta menjaga keamanan seluruh pengguna Platform.</li>
                <li>Memenuhi kewajiban hukum berdasarkan peraturan perundang-undangan yang berlaku di Indonesia.</li>
              </ul>
              <div className="mt-4 p-4 rounded-lg bg-muted text-xs border border-border">
                <span className="font-semibold text-foreground block mb-1">Pernyataan Penting Penggunaan Data Google API:</span>
                Penggunaan informasi yang diterima dari Google API (seperti Google Calendar) oleh BOSS akan sepenuhnya mematuhi{" "}
                <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                  Google API Services User Data Policy
                </a>, termasuk ketentuan Penggunaan Terbatas (Limited Use). Kami tidak akan membagikan, menjual, atau menggunakan data kalender Google Anda untuk tujuan selain menyelaraskan jadwal booking pada Platform.
              </div>
            </div>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">4. Penyimpanan dan Keamanan Data</h2>
            <p className="mt-2 text-muted-foreground">
              Data Anda disimpan dengan aman menggunakan enkripsi standar industri dan kontrol hak akses yang ketat. Kami mengambil langkah-langkah keamanan teknis, fisik, dan manajerial (seperti enkripsi kata sandi menggunakan bcrypt dan pembatasan akses database) untuk melindungi informasi Anda dari kehilangan, pencurian, penyalahgunaan, serta akses, pengungkapan, perubahan, atau pemusnahan yang tidak sah.
            </p>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">5. Pengelolaan Integrasi Pihak Ketiga</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                Platform kami memungkinkan integrasi dengan berbagai layanan eksternal untuk memperlancar bisnis Anda:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Google Calendar:</strong> Sinkronisasi dua arah otomatis antara sistem booking BOSS dengan Google Calendar milik Owner atau staf. Anda dapat memutus (disconnect) integrasi ini kapan saja melalui menu pengaturan integrasi di dashboard.</li>
                <li><strong>WhatsApp:</strong> Pengiriman pesan otomatis kepada pelanggan. Konten pesan sepenuhnya merupakan tanggung jawab pengguna, dan data nomor telepon penerima diproses hanya demi penyampaian pesan tersebut.</li>
                <li><strong>Payment Gateway:</strong> Proses verifikasi pembayaran otomatis oleh Midtrans/Xendit. Data kartu kredit, e-wallet, atau virtual account diproses secara aman oleh penyedia sistem pembayaran berlisensi Bank Indonesia dan tidak disimpan di server BOSS.</li>
              </ul>
            </div>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">6. Pembagian Data Kepada Pihak Ketiga</h2>
            <p className="mt-2 text-muted-foreground">
              Kami berkomitmen untuk tidak menjual atau menyewakan informasi pribadi Anda kepada pihak mana pun. Data Anda hanya akan dibagikan kepada pihak lain dalam batas-batas yang diizinkan sebagai berikut:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Penyedia Layanan Sub-kontraktor:</strong> Seperti penyedia layanan hosting server cloud (Infrastruktur), layanan pengiriman email (SMTP), dan penyedia payment gateway yang diperlukan untuk operasional Platform.</li>
              <li><strong>Kepatuhan Hukum:</strong> Kami dapat mengungkapkan data Anda jika diwajibkan oleh undang-undang, putusan pengadilan, atau atas permintaan resmi dari aparat penegak hukum yang berwenang di Indonesia.</li>
              <li><strong>Penyelamatan &amp; Perlindungan Hak:</strong> Untuk melindungi integritas Platform, hak kepemilikan PT BOSS APP INDONESIA, serta keselamatan fisik pengguna BOSS dan masyarakat umum.</li>
            </ul>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">7. Retensi Data</h2>
            <p className="mt-2 text-muted-foreground">
              Kami akan menyimpan data pribadi Anda selama akun Anda tetap aktif dan paket berlangganan berjalan, atau selama diperlukan untuk mematuhi kewajiban hukum, perpajakan, dan audit kami. Jika Anda memutuskan untuk menghapus akun Anda, kami akan menghapus atau menganonimkan data Anda sesuai kebijakan retensi data kami, kecuali jika undang-undang mewajibkan kami menyimpannya untuk jangka waktu yang lebih lama.
            </p>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">8. Hak-Hak Anda Sebagai Pemilik Data</h2>
            <p className="mt-2 text-muted-foreground">
              Sesuai dengan ketentuan Undang-Undang Perlindungan Data Pribadi (UU PDP) yang berlaku di Indonesia, Anda memiliki hak untuk:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Mengakses, memeriksa, dan meminta salinan informasi pribadi Anda yang kami simpan.</li>
              <li>Memperbarui atau mengoreksi data yang tidak akurat, tidak lengkap, atau tidak mutakhir melalui menu profil bisnis Anda.</li>
              <li>Meminta penghapusan atau pemusnahan data pribadi Anda (dengan konsekuensi penghentian layanan Platform Anda).</li>
              <li>Menarik persetujuan Anda atas pemrosesan data pribadi tertentu, termasuk mencabut akses OAuth Google Calendar atau WhatsApp.</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              Untuk mengajukan permintaan penghapusan data atau pelaksanaan hak perlindungan data lainnya, silakan hubungi kami melalui email resmi di <span className="font-semibold text-primary">support@bossapp.id</span>.
            </p>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">9. Perubahan Kebijakan Privasi</h2>
            <p className="mt-2 text-muted-foreground">
              Kebijakan Privasi ini dapat diperbarui dari waktu ke waktu untuk menyesuaikan dengan perubahan operasional Platform atau perubahan regulasi hukum yang berlaku. Kami akan memberi tahu Anda mengenai perubahan materiil melalui notifikasi di Platform atau melalui email Anda yang terdaftar. Kami menyarankan Anda untuk meninjau halaman ini secara berkala.
            </p>
          </section>

          <section className="p-5 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground">10. Hubungi Kami</h2>
            <p className="mt-2 text-muted-foreground">
              Jika Anda memiliki kekhawatiran, pertanyaan, atau keluhan terkait dengan cara kami mengelola Kebijakan Privasi ini atau data pribadi Anda, silakan hubungi Data Protection / Support Officer kami melalui:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Email: <a href="mailto:support@bossapp.id" className="text-primary hover:underline font-medium">support@bossapp.id</a></li>
              <li>Alamat Surat: PT BOSS APP INDONESIA, Jakarta, Indonesia</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
