export const Messages = {
    // Umum
    SUCCESS: 'Berhasil',
    CREATED: 'Data berhasil dibuat',
    UPDATED: 'Data berhasil diperbarui',
    DELETED: 'Data berhasil dihapus',
    BAD_REQUEST: 'Permintaan tidak valid',
    VALIDATION_FAILED: 'Validasi data gagal',
    INTERNAL_ERROR: 'Terjadi kesalahan pada server',
    REQUIRED_FIELD_MISSING: 'Data wajib belum diisi',
    INVALID_ID: 'ID tidak valid',
    CONFLICT: 'Terjadi konflik data',

    // Autentikasi & Akses
    NOT_LOGGED_IN: 'Anda belum login, silakan login terlebih dahulu',
    UNAUTHORIZED: 'Anda tidak memiliki akses',
    FORBIDDEN: 'Akses ditolak',
    INVALID_TOKEN: 'Token tidak valid atau sudah kedaluwarsa',
    INVALID_CREDENTIALS: 'Email atau kata sandi salah',
    USER_NOT_FOUND: 'Pengguna tidak ditemukan',
    USER_NOT_FOUND_TOKEN: 'Pengguna yang terkait dengan token ini tidak ditemukan',
    ACCOUNT_INACTIVE: 'Akun Anda belum aktif atau telah dinonaktifkan',
    SESSION_EXPIRED: 'Sesi Anda sudah berakhir, silakan login kembali',

    // Business & Outlet
    BUSINESS_NOT_FOUND: 'Bisnis tidak ditemukan',
    OUTLET_NOT_FOUND: 'Outlet tidak ditemukan',
    OUTLET_CLOSED: 'Outlet sedang tutup',
    OPERATING_HOURS_NOT_FOUND: 'Jam operasional outlet tidak ditemukan',

    // Produk & Layanan
    PRODUCT_NOT_FOUND: 'Produk tidak ditemukan',
    PRODUCT_OUT_OF_STOCK: 'Stok produk tidak mencukupi',
    SERVICE_NOT_AVAILABLE: 'Layanan tidak tersedia',
    CAPACITY_NOT_FOUND: 'Kapasitas layanan tidak ditemukan',

    // Booking
    BOOKING_SLOT_NOT_FOUND: 'Slot booking tidak ditemukan',
    BOOKING_SLOT_ALREADY_BOOKED: 'Slot booking sudah terisi',
    BOOKING_SLOT_UNAVAILABLE: 'Slot booking tidak tersedia',
    BOOKING_SLOT_REQUIRED: 'Slot booking diperlukan untuk layanan.',

    // Order & Pembayaran
    ORDER_NOT_FOUND: 'Pesanan tidak ditemukan',
    ORDER_ALREADY_COMPLETED: 'Pesanan sudah selesai',
    ORDER_ALREADY_CANCELLED: 'Pesanan sudah dibatalkan',
    PAYMENT_FAILED: 'Pembayaran gagal diproses',
    PAYMENT_PENDING: 'Menunggu pembayaran',
    PAYMENT_EXPIRED: 'Waktu pembayaran telah habis',
    REFUND_SUCCESS: 'Dana berhasil dikembalikan',
    REFUND_FAILED: 'Pengembalian dana gagal',

    // Promo
    PROMO_NOT_FOUND: 'Promo tidak ditemukan',
    PROMO_EXPIRED: 'Promo sudah kedaluwarsa',
    PROMO_INACTIVE: 'Promo sedang tidak aktif',
    PROMO_USAGE_LIMIT_REACHED: 'Promo telah mencapai batas penggunaan',
    PROMO_MIN_PURCHASE_NOT_MET: 'Pembelian tidak memenuhi syarat minimal penggunaan promo',

    // Membership
    MEMBERSHIP_NOT_FOUND: 'Membership tidak ditemukan',
    MEMBER_INACTIVE: 'Membership tidak aktif',
    MEMBER_ALREADY_EXISTS: 'Customer sudah menjadi member bisnis ini',

    // Withdrawal & Wallet
    WALLET_NOT_FOUND: 'Dompet bisnis tidak ditemukan',
    INSUFFICIENT_BALANCE: 'Saldo tidak mencukupi',
    WITHDRAWAL_NOT_FOUND: 'Permintaan penarikan tidak ditemukan',
    WITHDRAWAL_PENDING: 'Permintaan penarikan sedang diproses',
    WITHDRAWAL_COMPLETED: 'Penarikan dana berhasil',
    WITHDRAWAL_REJECTED: 'Penarikan dana ditolak',

    // Expense
    EXPENSE_NOT_FOUND: 'Pengeluaran tidak ditemukan'
} as const;
