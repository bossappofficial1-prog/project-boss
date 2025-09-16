"use client";

import React from 'react';
import type { DashboardStats } from '@/types/dashboard';

export function formatCurrencyIDR(amount: number) {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0,
	}).format(amount);
}

interface StatsCardsProps {
	stats: DashboardStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
			{/* Total Produk */}
			<div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg dark:shadow-gray-900/20 p-4 sm:p-6 border border-red-50 dark:border-gray-700 card-hover animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
				<div className="flex items-center justify-between">
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Produk</p>
						<p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalProducts}</p>
						<p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">Barang & Jasa</p>
					</div>
					<div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-gradient rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
						<svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
						</svg>
					</div>
				</div>
			</div>

			{/* Total Layanan */}
			<div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg dark:shadow-gray-900/20 p-4 sm:p-6 border border-red-50 dark:border-gray-700 card-hover animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
				<div className="flex items-center justify-between">
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Layanan</p>
						<p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalServices}</p>
						<p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">Jasa Tersedia</p>
					</div>
					<div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-gradient rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
						<svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</div>
				</div>
			</div>

			{/* Total Pesanan */}
			<div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg dark:shadow-gray-900/20 p-4 sm:p-6 border border-red-50 dark:border-gray-700 card-hover animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
				<div className="flex items-center justify-between">
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pesanan</p>
						<p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalOrders}</p>
						<p className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-1">Hari Ini</p>
					</div>
					<div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-gradient rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
						<svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
						</svg>
					</div>
				</div>
			</div>

			{/* Total Pendapatan */}
			<div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg dark:shadow-gray-900/20 p-4 sm:p-6 border border-red-50 dark:border-gray-700 card-hover animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
				<div className="flex items-center justify-between">
					<div className="flex-1 min-w-0">
						<p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pendapatan</p>
						<p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 break-words">{formatCurrencyIDR(stats.totalRevenue)}</p>
						<p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">Keseluruhan</p>
					</div>
					<div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-gradient rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
						<svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
				</div>
			</div>
		</div>
	);
}
