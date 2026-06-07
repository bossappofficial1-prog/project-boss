const TEAM_MEMBERS = [
  {
    alias: "Bi",
    name: "Bima Lovrino Prakasa",
    role: "FOUNDER — BOSS",
    description:
      "Menginisiasi dan memimpin BOSS sebagai platform terpadu untuk digitalisasi UMKM Indonesia. Menetapkan visi jangka panjang dan arah strategis perusahaan.",
    webPortolio: null,
  },
  {
    alias: "Ku",
    name: "Kurnia Fajar Viliano",
    role: "CO-FOUNDER — BOSS",
    description:
      "Bersama membangun fondasi bisnis BOSS, mengelola operasional, dan memperluas ekosistem kemitraan UMKM yang terhubung dengan platform.",
    webPortolio: null,
  },
  {
    alias: "Pi",
    name: "Pito Desri Pauzi",
    role: "CTO — BOSS",
    description:
      "Memastikan BOSS selalu cepat, aman, dan dapat diandalkan 24/7 sebagai tulang punggung teknologi UMKM Indonesia.",
    webPortolio: "https://pitok.my.id",
  },
  {
    alias: "Af",
    name: "Afca Arel Pratama",
    role: "CPO — BOSS",
    description:
      "Mengelola roadmap produk, mendefinisikan fitur berdasarkan kebutuhan pasar, dan memastikan BOSS terus relevan sebagai solusi bisnis bagi UMKM.",
    webPortolio: null,
  },
  {
    alias: "Bg",
    name: "Baghaztra Van Ril",
    role: "CMO — BOSS",
    description:
      "Memimpin strategi pemasaran dan branding BOSS — membangun awareness dan menghubungkan UMKM Indonesia dengan solusi digital yang tepat.",
    webPortolio: "https://bgztra.my.id",
  },
];

const FAQ_ITEMS = [
  {
    question: "Apakah BOSS benar-benar gratis?",
    answer:
      "Ya, paket Trial sepenuhnya gratis selama 35 hari. Anda bisa mencoba fitur-fitur dasar tanpa perlu kartu kredit. Setelah masa trial habis, Anda dapat memilih paket Basic atau Pro untuk melanjutkan.",
  },
  {
    question: "Apakah bisa dipakai di HP / smartphone?",
    answer:
      "Ya, BOSS berbasis web dan responsif — bisa diakses dari browser HP, tablet, maupun komputer tanpa perlu instalasi apapun.",
  },
  {
    question: "Apakah mendukung pembayaran digital?",
    answer:
      "Ya, BOSS mendukung QRIS, Virtual Account, dan pembayaran manual. Pelanggan bisa bayar dari aplikasi, kasir memproses, dan semua transaksi tercatat otomatis.",
  },
  {
    question: "Bisa untuk jenis bisnis apa saja?",
    answer:
      "BOSS cocok untuk warung makan, kafe, toko retail, barbershop, salon, laundry, apotek, service bisnis, dan hampir semua jenis UMKM di Indonesia.",
  },
  {
    question: "Apakah bisa untuk banyak cabang?",
    answer:
      "Ya, paket Basic sudah mendukung 2 outlet, dan Pro mendukung outlet dan staff tanpa batas. Pantau semua cabang dari satu dashboard, transfer stok antar outlet, dan kelola akses terpusat.",
  },
  {
    question: "Apa itu Kitchen Display System?",
    answer:
      "KDS adalah layar digital untuk dapur yang menampilkan order real-time dalam 3 lane: Antrian, Dimasak, dan Siap Saji. Notifikasi suara otomatis saat order baru masuk — tidak perlu teriak ke dapur lagi.",
  },
  {
    question: "Bagaimana cara upgrade paket?",
    answer:
      "Anda bisa upgrade kapan saja dari dashboard owner. Pilih paket Basic atau Pro, lakukan pembayaran, dan fitur akan aktif langsung. Tidak ada biaya sisa — kami pro-rate otomatis.",
  },
  {
    question: "Apakah data bisnis saya aman?",
    answer:
      "Keamanan adalah prioritas kami. Data Anda dienkripsi, disimpan di server cloud aman, dan ada backup otomatis. Setiap akses staff tercatat untuk audit trail lengkap.",
  },
];

const USE_CASE_ITEMS = [
  {
    icon: `<svg class="w-5 h-5 md:w-6 md:h-6 text-accent" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/>
              </svg>`,
    title: "Warung Makan",
  },
  {
    icon: `<svg class="w-5 h-5 md:w-6 md:h-6 text-accent" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="14" rx="2"/><rect x="2" y="7" width="20" height="3" rx="1"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>`,
    title: "Toko Retail",
  },
  {
    icon: `<svg class="w-5 h-5 md:w-6 md:h-6 text-accent" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>`,
    title: "Salon & Barbershop",
  },
  {
    icon: `<svg class="w-5 h-5 md:w-6 md:h-6 text-accent" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
              </svg>`,
    title: "Restoran & Kafe",
  },
  {
    icon: `<svg class="w-5 h-5 md:w-6 md:h-6 text-accent" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M2 22V2h5v4h10V2h5v20"/><path d="M7 12h10"/><path d="M7 16h10"/>
              </svg>`,
    title: "Event & Tiket",
  },
  {
    icon: `<svg class="w-5 h-5 md:w-6 md:h-6 text-accent" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>`,
    title: "Service Bisnis",
  },
];

const FEATURES_ITEMS = [
  {
    icon: `<svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>`,
    title: "Untuk Owner",
    features: [
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="6" y1="20" x2="6" y2="16" />
        </svg>`,
        title: "Dashboard & Analitik",
        description: `Lihat pendapatan, jumlah order, dan pelanggan dari semua cabang dalam satu layar. Filter per outlet dan periode untuk analisa cepat.`,
        subFeatures: ["Grafik Pendapatan", "Jumlah Order", "Filter Cabang"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>`,
        title: "Manajemen Produk",
        description: `Buat dan kelola produk barang, jasa, atau tiket. Bisa impor data dari Excel supaya lebih cepat.`,
        subFeatures: ["Kategori", "Impor/Ekspor", "Stok Menipis"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        </svg>`,
        title: "Stok & Bahan Baku",
        description: `Pantau stok masuk keluar real-time, kelola bahan baku untuk resep, data supplier, buat PO, dan transfer stok antar cabang.`,
        subFeatures: ["Stok Real-time", "Bahan Baku", "Resep", "PO Supplier", "Transfer Stok"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
        </svg>`,
        title: "Manajemen Order",
        description: `Lihat semua order dari seluruh cabang di satu tempat. Filter berdasarkan status, tanggal, dan lokasi outlet.`,
        subFeatures: ["Multi Status", "Filter Cabang", "Riwayat"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>`,
        title: "Pelanggan & Loyalitas",
        description: `Simpan data pelanggan, jalankan program poin loyalitas, atur level member (Bronze/Silver/Gold), dan kelola reward yang bisa ditukar.`,
        subFeatures: ["Data Pelanggan", "Poin & Level", "Reward"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>`,
        title: "Laporan Keuangan",
        description: `Laporan laba rugi, profit tiap produk, kondisi bisnis, dan jam ramai. Semua bisa diekspor ke Excel.`,
        subFeatures: ["Laba Rugi", "Profit Produk", "Jam Ramai"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 14a4 4 0 1 1 4-4 4 4 0 0 1-4 4Z" />
        </svg>`,
        title: "Tools & AI",
        description: `Kalkulator HPP dan BEP, target penjualan, asisten AI untuk analisa bisnis, kirim broadcast marketing, dan notifikasi push.`,
        subFeatures: ["Kalkulator HPP/BEP", "Target Sales", "AI Assistant", "Broadcast"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
          <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
        </svg>`,
        title: "Multi Outlet",
        description: `Kelola banyak cabang dari satu akun. Transfer stok antar outlet, pantau semua performa, dan atur akses staff terpusat.`,
        subFeatures: ["Transfer Stok", "Dashboard Gabungan", "Akses Staff"],
      },
    ],
  },

  {
    icon: `<svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>`,
    title: "Untuk Kasir",
    features: [
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
        </svg>`,
        title: "Kasir & Transaksi",
        description: `Proses jualan cepat untuk barang, jasa, atau tiket. Bisa bagi bill, manajemen meja, dan cetak struk langsung.`,
        subFeatures: ["Scan Barcode", "Bagi Bill", "Cetak Struk"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>`,
        title: "Staf & Absensi",
        description: `Kelola hak akses staf per peran (Kasir, Waiter, Dapur, Manager). Absensi pakai wajah dan validasi lokasi GPS.`,
        subFeatures: ["Hak Akses", "Face Recognition", "Absensi GPS"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>`,
        title: "Pesanan Pelanggan",
        description: `Lihat antrian pesanan dari pelanggan. Lacak status dari baru sampai selesai dengan tampilan yang mudah dipahami.`,
        subFeatures: ["Kanban", "Multi Status"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>`,
        title: "Meja & Tagihan",
        description: `Lihat peta meja dengan status kosong atau terisi. Buat tagihan dari order, cetak, dan terima pembayaran dalam satu alur.`,
        subFeatures: ["Peta Meja", "Buat Tagihan", "Bayar"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>`,
        title: "PO Bahan Baku",
        description: `Buat pesanan bahan baku ke supplier, lacak status pengiriman, dan lihat riwayat pembelian untuk stok dapur.`,
        subFeatures: ["Buat PO", "Lacak Status"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>`,
        title: "Shift & Keuangan",
        description: `Buka tutup shift kasir, catat pengeluaran harian, lihat riwayat transaksi, dan proses pembatalan transaksi.`,
        subFeatures: ["Buka/Tutup Shift", "Pengeluaran", "Riwayat", "Void"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>`,
        title: "Booking & Reservasi",
        description: `Kelola reservasi meja dan booking jadwal. Lihat kalender, konfirmasi, dan otomatis sinkron ke Google Calendar.`,
        subFeatures: ["Kalender", "Konfirmasi", "Google Calendar"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M2 22V2h5v4h10V2h5v20" />
          <path d="M7 12h10" />
          <path d="M7 16h10" />
        </svg>`,
        title: "Scan Tiket",
        description: `Validasi tiket masuk pakai QR code. Cocok untuk event, tempat wisata, atau venue yang jual tiket online.`,
        subFeatures: ["QR Code", "Validasi", "Event"],
      },
    ],
  },

  {
    icon: `<svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
    </svg>`,
    title: "Untuk Kitchen",
    features: [
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>`,
        title: "Layar Dapur (KDS)",
        description: `Layar digital untuk dapur yang tampilkan order real-time dalam 3 kolom: Antrian, Sedang Dimasak, dan Siap Disajikan. Ada notifikasi suara saat order baru masuk.`,
        subFeatures: ["3 Kolom", "Real-time", "Notifikasi Suara"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>`,
        title: "Self-Order QR",
        description: `Pelanggan pesan langsung dari HP tanpa install aplikasi. Scan QR di meja, pilih menu, pesanan langsung masuk ke dapur.`,
        subFeatures: ["QR Menu", "Langsung ke Dapur"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>`,
        title: "Notifikasi Otomatis",
        description: `Sistem antrian dengan notifikasi otomatis ke pelanggan via WhatsApp atau SMS. Pantau status dari dashboard real-time.`,
        subFeatures: ["Notif WA/SMS", "Real-time", "Push Notif"],
      },
    ],
  },

  {
    icon: `<svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>`,
    title: "Untuk Pelanggan",
    features: [
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>`,
        title: "Cari Outlet Terdekat",
        description: `Temukan outlet BOSS terdekat pakai GPS. Cek jarak, jam buka, dan rating langsung dari peta.`,
        subFeatures: ["GPS", "Peta", "Rating"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>`,
        title: "Pesan & Bayar Online",
        description: `Pilih produk, masuk keranjang, bayar pakai QRIS, Virtual Account, atau bayar langsung. Ada timer countdown.`,
        subFeatures: ["QRIS", "Keranjang Multi Outlet"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>`,
        title: "Lacak Pesanan",
        description: `Pantau pesanan secara real-time dari persiapan sampai siap diambil. Dapat notifikasi di setiap tahap.`,
        subFeatures: ["Timeline", "Real-time", "Re-order"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>`,
        title: "Poin & Loyalitas",
        description: `Kumpulkan poin setiap belanja, naik level member, dan tukarkan poin dengan reward menarik.`,
        subFeatures: ["Poin Reward", "Level Member", "Tukar Reward"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>`,
        title: "Booking Jadwal",
        description: `Pesan jadwal layanan langsung dari HP. Pilih waktu yang tersedia, dapat konfirmasi via WhatsApp.`,
        subFeatures: ["Pilih Waktu", "Konfirmasi WA"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>`,
        title: "Peta & Navigasi",
        description: `Lihat semua outlet BOSS di sekitar Anda dalam peta interaktif. Cek jarak dan navigasi langsung ke lokasi.`,
        subFeatures: ["Peta", "Navigasi", "Jarak"],
      },
      {
        icon: `<svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="18" x2="12" y2="18" />
        </svg>`,
        title: "Bisa di Install",
        description: `Aplikasi web yang bisa diinstal ke layar HP. Bisa dipakai tanpa internet, ada notifikasi push, dan performa seperti aplikasi native.`,
        subFeatures: ["Offline", "Push Notif", "Home Screen"],
      },
    ],
  },
];
