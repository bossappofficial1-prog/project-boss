import { BaseService } from "./base.service";
import { BusinessDashboardService } from "./business-dashboard.service";
import { AccountingService } from "./accounting.service";
import { AppError } from "../errors/app-error";
import { HttpStatus } from "../constants/http-status";
import { redis } from "../config/redis";
import axios from "axios";

export class AiService extends BaseService {
  static async analyzeBusiness(businessId: string, businessName: string, regenerate = false) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_APP_ENV === "production") {
      throw new AppError("Asisten AI segera hadir di lingkungan produksi.", HttpStatus.NOT_IMPLEMENTED);
    }

    const cacheKey = `ai-analysis:${businessId}`;

    // 1. Return cached version if exists and regeneration is not requested
    if (!regenerate) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log(`[Asisten AI] Returning cached analysis for business ${businessId}`);
          return JSON.parse(cached);
        }
      } catch (redisErr) {
        console.error("[Asisten AI] Redis error reading cache:", redisErr);
      }
    }

    try {
      // 2. Fetch dashboard overview (monthly)
      const overview = await BusinessDashboardService.getOverview(businessId, businessName, "month");

      // 3. Fetch profit & loss for past 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      
      const profitLoss = await AccountingService.getProfitLoss(
        businessId,
        startDate.toISOString(),
        endDate.toISOString()
      );

      // 4. Construct prompt for Gemini
      const prompt = `Anda adalah "Asisten AI", fitur penasihat keuangan dan bisnis cerdas bawaan yang terintegrasi di dalam aplikasi BOSS (Business Owner Super System).
Tugas Anda adalah menganalisis data operasional dan keuangan bisnis UMKM milik mitra BOSS, lalu memberikan laporan ringkas yang ramah, taktis, dan mendalam.

PENTING:
- Rekomendasi Anda HARUS mengarahkan pengguna untuk menggunakan fitur-fitur bawaan aplikasi BOSS (jangan pernah merekomendasikan aplikasi pihak ketiga/kompetitor seperti BukuWarung, BukuKas, Olsera, dll).
- Hubungkan masalah operasional mereka dengan solusi fitur BOSS berikut:
  1. Untuk pencatatan beban/pengeluaran otomatis: Arahkan untuk menggunakan fitur "AI Receipt Scanner" di BOSS (tinggal foto struk belanja pengeluaran, sistem BOSS akan mengonversi foto menjadi jurnal pengeluaran otomatis).
  2. Untuk transaksi penjualan POS & pencatatan otomatis: BOSS memiliki fitur "Otomatisasi Jurnal POS" (setiap order POS selesai akan menjurnal otomatis ke kas dan pendapatan). Jelaskan bahwa data historis sebelum fitur diaktifkan mungkin belum tercatat di Laba Rugi, dan transaksi baru akan otomatis menjurnal.
  3. Untuk pembayaran non-tunai: BOSS terintegrasi dengan metode pembayaran digital/QRIS (bisa diaktifkan di menu integrasi pembayaran BOSS).
  4. Untuk promosi & hubungan pelanggan: BOSS memiliki "WhatsApp Campaign & Marketing Engine" untuk mengirim broadcast promosi tersegmen, serta sistem "Loyalty Program & Membership Tiers" untuk poin member.
  5. Untuk pemantauan outlet: BOSS mendukung multi-outlet yang performanya bisa dipantau terpisah di sub-menu outlet.

Data Bisnis (${businessName}) dari seluruh outlet Anda:
- Total Pendapatan POS (Omzet): Rp ${overview.summary.totalRevenue.toLocaleString("id-ID")}
- Total Transaksi POS: ${overview.summary.totalOrders} Transaksi
- Nilai Rata-rata Pesanan (AOV): Rp ${overview.summary.avgOrderValue.toLocaleString("id-ID")}
- Jumlah Outlet Aktif: ${overview.summary.outletCount}
- Jumlah Produk/Menu: ${overview.summary.totalProducts}
- Jumlah Layanan/Jasa: ${overview.summary.totalServices}

Laporan Laba & Rugi 30 Hari Terakhir (Berdasarkan Buku Jurnal Akuntansi BOSS):
- Total Pendapatan Kotor di Jurnal: Rp ${profitLoss.totalRevenue.toLocaleString("id-ID")}
- Rincian Pendapatan per Akun: ${profitLoss.revenues.map(r => `${r.name}: Rp ${r.balance.toLocaleString("id-ID")}`).join(", ") || "Tidak ada data"}
- Total Beban/Pengeluaran di Jurnal: Rp ${profitLoss.totalExpense.toLocaleString("id-ID")}
- Rincian Beban per Akun: ${profitLoss.expenses.map(e => `${e.name}: Rp ${e.balance.toLocaleString("id-ID")}`).join(", ") || "Tidak ada data"}
- Laba Bersih di Jurnal: Rp ${profitLoss.netProfit.toLocaleString("id-ID")}

Metode Pembayaran Saat Ini:
- Online (E-payment/QRIS): ${overview.paymentBreakdown.online} transaksi
- Manual (Cash/Tunai): ${overview.paymentBreakdown.manual} transaksi

Buatlah laporan analisis yang rapi menggunakan format Markdown. Gunakan Bahasa Indonesia yang profesional, positif, dan memotivasi Bapak/Ibu pemilik bisnis.`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        }
      );

      const analysis = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!analysis) {
        throw new Error("Gagal menerima analisis dari AI.");
      }

      const result = {
        analysis,
        generatedAt: new Date().toISOString()
      };

      // 5. Cache result in Redis indefinitely
      redis.set(cacheKey, JSON.stringify(result)).catch((err) => {
        console.error("[Asisten AI] Redis error saving cache:", err);
      });

      return result;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      console.error("[Asisten AI] Error generating analysis:", err?.message || err);
      throw new AppError("Gagal menghasilkan analisis bisnis dengan AI. Silakan coba lagi.", HttpStatus.BAD_REQUEST);
    }
  }
}
