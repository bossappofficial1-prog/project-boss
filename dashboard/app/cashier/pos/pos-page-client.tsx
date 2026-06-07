"use client";

import { PosV2Content } from "@/features/pos";
import { PageGuide } from "@/features/guides/components/page-guide";

export default function PosPageClient() {
  return (
    <>
      <PageGuide
        id="cashier-pos"
        runOnceKey="cashier-pos-guide"
        steps={[
          {
            id: "welcome",
            title: "Sistem Kasir",
            description:
              "Layani transaksi pelanggan dengan cepat. Cari produk, atur pesanan, dan selesaikan pembayaran.",
            target: "body",
            placement: "bottom",
          },
          {
            id: "left-tabs",
            title: "Panel Kiri — Tabs",
            description:
              "Katalog: cari & pilih produk. Tersimpan: lanjutkan pesanan yang disimpan. Riwayat: lihat pesanan terakhir.",
            target: "[data-guide='pos-left-tabs']",
            placement: "bottom",
            offset: 8,
          },
          {
            id: "catalog",
            title: "Cari & Pilih Produk",
            description:
              "Gunakan kolom pencarian, filter tipe barang/jasa, atau scan barcode untuk menambah produk ke keranjang.",
            target: "[data-guide='product-catalog']",
            placement: "top",
            offset: 8,
          },
          {
            id: "cart",
            title: "Keranjang Belanja",
            description:
              "Produk yang dipilih muncul di sini. Atur jumlah, hapus item, atau kosongkan keranjang.",
            target: "[data-guide='pos-cart']",
            placement: "left",
            offset: 8,
          },
          {
            id: "customer",
            title: "Data Pelanggan",
            description:
              "Isi nama & telepon pelanggan, atau aktifkan Walk-in. Cari member untuk aplikasi poin loyalitas.",
            target: "[data-guide='pos-customer']",
            placement: "left",
            offset: 8,
          },
          {
            id: "payment",
            title: "Metode Pembayaran",
            description:
              "Pilih Tunai atau QRIS. Untuk tunai, masukkan nominal uang yang diterima.",
            target: "[data-guide='pos-payment']",
            placement: "left",
            offset: 8,
          },
          {
            id: "submit",
            title: "Selesaikan Transaksi",
            description:
              "Tekan tombol Bayar untuk memproses pembayaran. Untuk FnB, bisa Simpan Pesanan terlebih dahulu.",
            target: "[data-guide='pos-submit']",
            placement: "top",
            offset: 8,
          },
        ]}
      />
      <PosV2Content />
    </>
  );
}
