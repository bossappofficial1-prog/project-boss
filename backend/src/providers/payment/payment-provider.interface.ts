// ============================================================
// IPaymentProvider — kontrak yang WAJIB diikuti setiap gateway
// Untuk menambah provider baru (Xendit, Stripe, dll):
//   1. Buat file baru implements IPaymentProvider
//   2. Register ke defaultProviders di payment.service.ts
//   3. Selesai — tidak perlu ubah createPayment() sama sekali
// ============================================================

export interface ChargeItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ChargeCustomer {
  name: string;
  phone: string;
}

/** Parameter yang dikirim ke provider untuk melakukan charge */
export interface ChargeParams {
  orderId: string;
  grossAmount: number;
  items: ChargeItem[];
  customer: ChargeCustomer;
  /** Channel spesifik, misal: "qris", "bca_va", "gopay" */
  channel: string;
}

/** Respons standar yang dikembalikan oleh setiap provider setelah charge */
export interface ChargeResult {
  /** ID transaksi dari pihak provider */
  transactionId: string;
  /** Status awal: "pending" / "success" / dll */
  status: string;
  expiresAt: Date;
  /** URL redirect atau QR code (opsional tergantung channel) */
  paymentUrl?: string;
  /** Raw response asli dari provider, untuk disimpan ke DB */
  raw: unknown;
}

/** Parameter untuk membuat Snap token (redirect payment) */
export interface SnapChargeParams {
  orderId: string;
  grossAmount: number;
  items: ChargeItem[];
  customer: ChargeCustomer;
  expiryMinutes?: number;
}

export interface SnapChargeResult {
  token: string;
  redirectUrl: string;
  expiresAt: Date;
}

/**
 * Interface yang harus diimplementasi oleh setiap payment provider.
 * Core charge: QRIS, VA, eWallet (via Core API).
 * Snap charge: Midtrans Snap redirect page.
 */
export interface IPaymentProvider {
  readonly name: string;

  /** Charge langsung melalui Core API (QRIS, VA, eWallet) */
  charge(params: ChargeParams): Promise<ChargeResult>;

  /** Buat Snap token untuk redirect payment */
  chargeSnap(params: SnapChargeParams): Promise<SnapChargeResult>;

  /** Batalkan transaksi aktif */
  cancelTransaction(orderId: string): Promise<void>;
}
