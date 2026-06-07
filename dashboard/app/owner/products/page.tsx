"use client";

import ProductsContent from "@/features/owner/products/products-content";
import { PageGuide } from "@/features/guides/components/page-guide";

export default function ProductsPage() {
  return (
    <>
      <PageGuide
        id="owner-products"
        runOnceKey="owner-products-guide"
        steps={[
          {
            id: "welcome",
            title: "Atur Semua Produk & Jasa",
            description: "Halaman pusat inventaris Anda. Kelola barang, jasa, tiket, dan kategori dalam satu tempat.",
            target: "body",
            placement: "bottom",
          },
          {
            id: "header",
            title: "Aksi Cepat",
            description: "Tambah produk baru, import data dari file, atau export inventaris ke spreadsheet.",
            target: "[data-guide='products-header']",
            placement: "bottom",
            offset: 16,
          },
          {
            id: "overview",
            title: "Ringkasan Inventaris",
            description: "Lihat jumlah total produk, barang, jasa, tiket, dan peringatan stok menipis sekilas.",
            target: "[data-guide='products-overview']",
            placement: "bottom",
          },
          {
            id: "tabs",
            title: "Filter Tipe Produk",
            description: "Pilih tab Semua untuk melihat seluruh produk, atau filter per tipe: Barang, Jasa, atau Tiket.",
            target: "[data-guide='products-tabs'] [role='tablist']",
            placement: "bottom",
          },
          {
            id: "search",
            title: "Cari Produk",
            description: "Ketik nama produk di kolom pencarian. Data akan terfilter otomatis saat Anda mengetik.",
            target: "input[placeholder='Cari produk...']",
            placement: "bottom",
            offset: 12,
          },
          {
            id: "table",
            title: "Tabel Data Produk",
            description: "Kolom: nama & foto, harga & biaya, pajak, stok/durasi, dan toggle aktif/nonaktif. Klik ikon pensil untuk edit.",
            target: "[data-guide='products-tabs'] [role='region']",
            placement: "top",
            offset: 8,
          },
          {
            id: "categories",
            title: "Kategori Produk",
            description: "Beralih ke tab Kategori untuk membuat kelompok produk. Berguna untuk menyaring produk di POS.",
            target: "[data-slot='tabs-trigger'][value='categories']",
            placement: "bottom",
          },
        ]}
      />
      <ProductsContent />
    </>
  );
}
