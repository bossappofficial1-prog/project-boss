'use client';

import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSelectedOutletId } from '@/hooks/useOutlet';
import { useDailyReport } from '@/hooks/useReports';
import { formatDate } from '@/lib/utils/date';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const { outletId } = useSelectedOutletId();
  const [range, setRange] = useState<{ startDate?: string; endDate?: string }>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return { startDate: today, endDate: today };
  });
  const [productType, setProductType] = useState<'BOTH' | 'GOODS' | 'SERVICE'>('BOTH');
  const { data, loading, error } = useDailyReport(outletId, { ...range, productType });

  const rows = useMemo(() => {
    if (!data) return [] as Array<{ tanggal: string; jumlah: number; pendapatan: number; pengeluaran: number; laba: number }>;
    return data.daily.map((d) => ({
      tanggal: formatDate(d.tanggal),
      jumlah: d.jumlahTransaksi,
      pendapatan: d.totalPendapatan,
      pengeluaran: d.totalPengeluaran,
      laba: d.labaBersih,
    }));
  }, [data]);

  async function onExportXlsx() {
    if (!data) return;
    const wsData = [
      ['Tanggal', 'Jumlah Transaksi', 'Total Pendapatan', 'Total Pengeluaran', 'Laba Bersih'],
      ...rows.map(r => [r.tanggal, r.jumlah, r.pendapatan, r.pengeluaran, r.laba]),
      [],
      ['Total', data.summary.totalTransaksi, data.summary.totalPendapatan, data.summary.totalPengeluaran, data.summary.totalLabaBersih],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Harian');
    const filename = `laporan-${range.startDate || ''}${range.endDate ? `-to-${range.endDate}` : ''}-${productType.toLowerCase()}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  return (
    <DashboardLayout>
  <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-poppins">Laporan</h1>
            <p className="mt-1 text-sm text-gray-500 font-poppins">Analisis penjualan dan pengeluaran</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <input
              type="date"
              value={range.startDate || ''}
              onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-poppins bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <input
              type="date"
              value={range.endDate || ''}
              onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-poppins bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="BOTH">Semua (Barang & Jasa)</option>
              <option value="GOODS">Barang</option>
              <option value="SERVICE">Jasa</option>
            </select>
            <button onClick={onExportXlsx} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 font-poppins">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Excel
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jumlah Transaksi</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Pendapatan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Pengeluaran</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Laba Bersih</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">Memuat data...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="px-4 py-6 text-sm text-red-600">{error}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">Tidak ada data</td></tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{r.tanggal}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{r.jumlah}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Rp {r.pendapatan.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">Rp {r.pengeluaran.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Rp {r.laba.toLocaleString('id-ID')}</td>
                  </tr>
                ))
              )}
              {/* Summary row */}
              {!loading && !error && data && (
                <tr className="bg-gray-50 dark:bg-gray-900/40">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Total</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{data.summary.totalTransaksi}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Rp {data.summary.totalPendapatan.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Rp {data.summary.totalPengeluaran.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Rp {data.summary.totalLabaBersih.toLocaleString('id-ID')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
