'use client'

import React, { useState, useMemo, useEffect } from 'react';
import {
	Calendar as CalendarIcon,
	FileSpreadsheet,
	ChevronLeft,
	ChevronRight,
	TrendingUp,
	Download,
	Info,
	Filter,
	ArrowUpRight,
	ArrowDownRight,
	Wallet,
	ShoppingCart,
	Users,
	Receipt,
	Sun,
	Moon,
	Activity
} from 'lucide-react';
import { useReportOutlet } from '@/hooks/useReport';
import { useOutletContext } from '@/components/providers/OutletProvider';


interface ReportRow {
	label: string;
	jumlahTransaksi: number;
	totalPendapatan: number;
	totalPembelian: number;
	totalPengeluaran: number;
	gajiStaf: number;
	labaBersih: number;
	trend: number[];
}

interface Totals {
	jumlahTransaksi: number;
	totalPendapatan: number;
	totalPembelian: number;
	totalPengeluaran: number;
	gajiStaf: number;
	labaBersih: number;
}

type FilterType = 'daily' | 'weekly' | 'monthly';

interface SparklineProps {
	data: number[];
	color?: string;
	width?: number;
	height?: number;
}

interface SummaryCardProps {
	title: string;
	value: number;
	icon: React.ReactNode;
	highlight?: boolean;
}

interface FilterButtonProps {
	children: React.ReactNode;
	active: boolean;
	onClick: () => void;
}

const formatCurrency = (val: number): string => {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	}).format(val);
};

const Sparkline: React.FC<SparklineProps> = ({ data, color = "#10b981", width = 80, height = 30 }) => {
	if (!data || data.length < 2) return <div className="w-20 h-[30px] bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />;

	const min = Math.min(...data);
	const max = Math.max(...data);
	const range = max - min || 1;

	const points = data.map((val, i) => {
		const x = (i / (data.length - 1)) * width;
		const y = height - ((val - min) / range) * height;
		return `${x},${y}`;
	}).join(' ');

	return (
		<svg width={width} height={height} className="overflow-visible">
			<polyline
				fill="none"
				stroke={color}
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				points={points}
				className="drop-shadow-sm"
			/>
		</svg>
	);
};

export default function App() {
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

				<div className="overflow-x-auto">
					<table className="w-full text-sm text-left border-collapse">
						<thead>
							<tr className="bg-slate-50 dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
								<th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px]">{filterType === 'monthly' ? 'Minggu Ke-' : 'Tanggal'}</th>
								<th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px] text-center whitespace-nowrap">Trx</th>
								<th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px] text-right">Penjualan</th>
								<th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px] text-center">Tren</th>
								<th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px] text-right">Stok</th>
								<th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px] text-right text-rose-500 dark:text-rose-400/80">Biaya</th>
								<th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px] text-right text-indigo-500 dark:text-indigo-400/80">Gaji</th>
								<th className="px-6 py-5 font-bold uppercase tracking-wider text-[11px] text-right text-slate-900 dark:text-white">Laba Bersih</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
							{reportOutletData ? reportOutletData.map((row, idx) => (
								<tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
									<td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
										{row.label}
									</td>
									<td className="px-6 py-4 text-center">
										<span className={`px-2 py-1 rounded text-xs font-bold ${row.jumlahTransaksi > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'}`}>
											{row.jumlahTransaksi}
										</span>
									</td>
									<td className="px-6 py-4 text-right tabular-nums text-slate-600 dark:text-slate-300">
										{formatCurrency(row.totalPendapatan)}
									</td>
									<td className="px-6 py-4 text-center">
										<div className="inline-flex items-center justify-center p-1 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-100 dark:border-slate-800">
											<Sparkline data={row.trend} color={row.labaBersih > 0 ? "#10b981" : "#f43f5e"} />
										</div>
									</td>
									<td className="px-6 py-4 text-right tabular-nums text-amber-600 dark:text-amber-400/80">
										{formatCurrency(row.totalPembelian)}
									</td>
									<td className="px-6 py-4 text-right tabular-nums text-rose-600 dark:text-rose-400/80">
										{formatCurrency(row.totalPengeluaran)}
									</td>
									<td className="px-6 py-4 text-right tabular-nums text-indigo-600 dark:text-indigo-300">
										{formatCurrency(row.gajiStaf)}
									</td>
									<td className="px-6 py-4 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
										{formatCurrency(row.labaBersih)}
									</td>
								</tr>
							)) : (
								<tr><td colSpan={8} className="px-6 py-20 text-center text-slate-400 italic">Data tidak ditemukan...</td></tr>
							)}
						</tbody>
						<tfoot>
							<tr className="bg-slate-100 dark:bg-[#0f172a] font-bold border-t-2 border-slate-200 dark:border-slate-700">
								<td className="px-6 py-6 text-slate-900 dark:text-white">Total</td>
								<td className="px-6 py-6 text-center text-slate-900 dark:text-white">{totals.jumlahTransaksi}</td>
								<td className="px-6 py-6 text-right text-slate-900 dark:text-white tabular-nums">{formatCurrency(totals.totalPendapatan)}</td>
								<td className="px-6 py-6 text-center"><Activity className="w-5 h-5 mx-auto text-emerald-500 opacity-50" /></td>
								<td className="px-6 py-6 text-right text-amber-600 tabular-nums">{formatCurrency(totals.totalPembelian)}</td>
								<td className="px-6 py-6 text-right text-rose-600 tabular-nums">{formatCurrency(totals.totalPengeluaran)}</td>
								<td className="px-6 py-6 text-right text-indigo-600 tabular-nums">{formatCurrency(totals.gajiStaf)}</td>
								<td className="px-6 py-6 text-right text-emerald-600 dark:text-emerald-400 tabular-nums text-xl">
									{formatCurrency(totals.labaBersih)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
		</>
	);
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, highlight = false }) => {
	return (
		<div className={`p-4 rounded-md border transition-all ${highlight
			? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'
			: 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-800 shadow-sm'
			}`}>
			<div className="flex items-center justify-between mb-2">
				<span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{title}</span>
				{icon}
			</div>
			<p className={`text-sm font-bold truncate ${highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
				{formatCurrency(value)}
			</p>
		</div>
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

const generateMockData = (type: FilterType, date: Date): ReportRow[] => {
	const data: ReportRow[] = [];
	let count = type === 'daily' ? 1 : type === 'weekly' ? 7 : 4;
	for (let i = 0; i < count; i++) {
		const p = Math.floor(Math.random() * 3000000);
		const b = Math.floor(Math.random() * 800000);
		const e = Math.floor(Math.random() * 400000);
		const g = Math.floor(p * 0.1);
		data.push({
			label: type === 'daily' ? date.toISOString().split('T')[0] : type === 'weekly' ? `Hari ${i + 1}` : `Minggu ${i + 1}`,
			jumlahTransaksi: Math.floor(Math.random() * 30),
			totalPendapatan: p,
			totalPembelian: b,
			totalPengeluaran: e,
			gajiStaf: g,
			labaBersih: p - b - e - g,
			trend: Array.from({ length: 12 }, () => Math.floor(Math.random() * 500000))
		});
	}
	return data;
};