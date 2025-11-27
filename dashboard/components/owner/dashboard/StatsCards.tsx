"use client";

import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import type { DashboardStats } from '@/types/dashboard';
import { Boxes, Cog, ShoppingCart, Wallet } from 'lucide-react';

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
	const cards = [
		{
			title: 'Total Produk',
			value: stats.totalProducts.toLocaleString('id-ID'),
			valueClass: 'text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100',
			description: 'Barang & Jasa',
			descriptionClass: 'text-sm font-medium text-green-600 dark:text-green-400',
			Icon: Boxes,
			iconClass: 'bg-blue-500/10 text-blue-600',
			delay: 0.1,
		},
		{
			title: 'Total Layanan',
			value: stats.totalServices.toLocaleString('id-ID'),
			valueClass: 'text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100',
			description: 'Jasa Tersedia',
			descriptionClass: 'text-sm font-medium text-blue-600 dark:text-blue-400',
			Icon: Cog,
			iconClass: 'bg-indigo-500/10 text-indigo-600',
			delay: 0.2,
		},
		{
			title: 'Total Pesanan',
			value: stats.totalOrders.toLocaleString('id-ID'),
			valueClass: 'text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100',
			description: 'Keseluruhan',
			descriptionClass: 'text-sm font-medium text-orange-600 dark:text-orange-400',
			Icon: ShoppingCart,
			iconClass: 'bg-orange-500/10 text-orange-600',
			delay: 0.3,
		},
		{
			title: 'Total Pendapatan',
			value: formatCurrencyIDR(stats.totalRevenue),
			valueClass: 'text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 break-words',
			description: 'Keseluruhan',
			descriptionClass: 'text-sm font-medium text-green-600 dark:text-green-400',
			Icon: Wallet,
			iconClass: 'bg-green-500/10 text-green-600',
			delay: 0.4,
		},
	];

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
			{cards.map(({ title, value, valueClass, description, descriptionClass, Icon, iconClass, delay }) => (
				<Card
					key={title}
					className="card-hover animate-fade-in-up rounded-lg"
					style={{ animationDelay: `${delay}s` }}
				>
					<CardHeader className="space-y-0">
						<div className="flex items-center justify-between gap-3">
							<div className="min-w-0">
								<p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
								<p className={`mt-1 ${valueClass}`}>{value}</p>
								<p className={`mt-2 ${descriptionClass}`}>{description}</p>
							</div>
							<div className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconClass} sm:h-16 sm:w-16`}>
								<Icon className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={2.4} />
							</div>
						</div>
					</CardHeader>
				</Card>
			))}
		</div>
	);
}
