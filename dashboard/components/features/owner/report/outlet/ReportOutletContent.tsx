'use client'

import React, { useState, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    FileSpreadsheet,
    ChevronLeft,
    ChevronRight,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    ShoppingCart,
    Users,
    Receipt,
} from 'lucide-react';
import { useReportOutlet } from '@/hooks/useReport';
import { useOutletContext } from '@/components/providers/OutletProvider';
import { ReportOutleTable, Totals } from './ReportOutletTable';
import { SummaryCard } from '../SummaryCard';

type FilterType = 'daily' | 'weekly' | 'monthly';

interface FilterButtonProps {
    children: React.ReactNode;
    active: boolean;
    onClick: () => void;
}

export default function ReportOutlerContent() {
    const { selectedOutlet } = useOutletContext()
    const [filterType, setFilterType] = useState<FilterType>('daily');
    const [currentDate, setCurrentDate] = useState<Date>(new Date("2026-01-30"));

    const { data: reportOutletData, isLoading } = useReportOutlet(selectedOutlet?.id!, filterType, currentDate.toISOString())

    const totals = useMemo<Totals>(() => {
        return (reportOutletData || []).reduce((acc, curr) => ({
            jumlahTransaksi: acc.jumlahTransaksi + curr.jumlahTransaksi,
            totalPendapatan: acc.totalPendapatan + curr.totalPendapatan,
            totalPembelian: acc.totalPembelian + curr.totalPembelian,
            totalPengeluaran: acc.totalPengeluaran + curr.totalPengeluaran,
            gajiStaf: acc.gajiStaf + curr.gajiStaf,
            labaBersih: acc.labaBersih + curr.labaBersih,
        }), { jumlahTransaksi: 0, totalPendapatan: 0, totalPembelian: 0, totalPengeluaran: 0, gajiStaf: 0, labaBersih: 0 });
    }, [reportOutletData]);

    const adjustDate = (amount: number): void => {
        const newDate = new Date(currentDate);
        if (filterType === 'daily') newDate.setDate(newDate.getDate() + amount);
        if (filterType === 'weekly') newDate.setDate(newDate.getDate() + (amount * 7));
        if (filterType === 'monthly') newDate.setMonth(newDate.getMonth() + amount);
        setCurrentDate(newDate);
    };

    return (
        <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Receipt className="text-emerald-500 w-7 h-7" />
                        Laporan Outlet: <span className="text-emerald-600 dark:text-emerald-400">{selectedOutlet?.name ?? ''}</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Pantau Penjualan, Stok, Biaya & Komisi.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400">
                        <Download className="w-5 h-5" />
                    </button>
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-md flex items-center gap-2 text-sm transition-all shadow-lg shadow-emerald-900/20">
                        <FileSpreadsheet className="w-4 h-4" /> Export Excel
                    </button>
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <SummaryCard title="Pendapatan" value={totals.totalPendapatan} icon={<ArrowUpRight className="w-4 h-4 text-emerald-500" />} />
                <SummaryCard title="Pembelian Stok" value={totals.totalPembelian} icon={<ShoppingCart className="w-4 h-4 text-amber-500" />} />
                <SummaryCard title="Pengeluaran" value={totals.totalPengeluaran} icon={<ArrowDownRight className="w-4 h-4 text-rose-500" />} />
                <SummaryCard title="Gaji/Komisi" value={totals.gajiStaf} icon={<Users className="w-4 h-4 text-indigo-500" />} />
                <SummaryCard title="Laba Bersih" value={totals.labaBersih} icon={<Wallet className="w-4 h-4 text-emerald-500" />} highlight />
            </div>

            {/* Table Control */}
            <div className="bg-white dark:bg-[#1e293b] p-2 rounded-lg border border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-md dark:shadow-xl">
                <div className="flex bg-slate-100 dark:bg-[#0f172a] p-1 rounded-md border border-slate-200 dark:border-slate-700">
                    <FilterButton active={filterType === 'daily'} onClick={() => setFilterType('daily')}>Harian</FilterButton>
                    <FilterButton active={filterType === 'weekly'} onClick={() => setFilterType('weekly')}>Mingguan</FilterButton>
                    <FilterButton active={filterType === 'monthly'} onClick={() => setFilterType('monthly')}>Bulanan</FilterButton>
                </div>

                <div className="flex items-center gap-6 px-2">
                    <button onClick={() => adjustDate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-3 font-bold text-slate-900 dark:text-white">
                        <CalendarIcon className="w-5 h-5 text-emerald-500" />
                        <span className="min-w-[180px] text-center text-lg">{formatPeriodLabel(filterType, currentDate)}</span>
                    </div>
                    <button onClick={() => adjustDate(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 pr-4 uppercase tracking-widest font-bold">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    Data Terverifikasi
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1e293b] rounded-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-2"></div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest text-center">Menghitung Laporan...</span>
                    </div>
                )}
                <ReportOutleTable
                    data={reportOutletData || []}
                    totals={totals}
                />
            </div>
        </>
    );
}

const FilterButton: React.FC<FilterButtonProps> = ({ children, active, onClick }) => {
    return (
        <button onClick={onClick} className={`px-5 py-2 text-xs font-bold transition-all rounded-md ${active ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}>
            {children}
        </button>
    );
}

const formatPeriodLabel = (type: FilterType, date: Date): string => {
    if (type === 'daily') return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    if (type === 'weekly') {
        const start = new Date(date); start.setDate(date.getDate() - date.getDay());
        const end = new Date(start); end.setDate(start.getDate() + 6);
        return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`;
    }
    if (type === 'monthly') return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    return "";
};