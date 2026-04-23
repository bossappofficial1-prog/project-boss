"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { DashboardStats } from '@/types/dashboard';
import { Package, ShoppingCart, Wallet, Wrench, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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
			description: 'Barang fisik di inventaris',
			Icon: Package,
			color: 'var(--chart-1)',
			bg: 'bg-chart-1/10',
		},
		{
			title: 'Total Layanan',
			value: stats.totalServices.toLocaleString('id-ID'),
			description: 'Jasa & layanan tersedia',
			Icon: Wrench,
			color: 'var(--chart-2)',
			bg: 'bg-chart-2/10',
		},
		{
			title: 'Total Pesanan',
			value: stats.totalOrders.toLocaleString('id-ID'),
			description: 'Keseluruhan transaksi',
			Icon: ShoppingCart,
			color: 'var(--chart-3)',
			bg: 'bg-chart-3/10',
		},
		{
			title: 'Total Pendapatan',
			value: formatCurrencyIDR(stats.totalRevenue),
			description: 'Akumulasi omzet bisnis',
			Icon: Wallet,
			color: 'var(--chart-2)',
			bg: 'bg-chart-2/10',
		},
	];

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{cards.map((card, idx) => (
				<Card
					key={card.title}
					className="group gap-0 py-0 relative overflow-hidden rounded-md border-border/60 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-background to-muted/20"
				>
					{/* Decorative Element */}
					<div className={cn(
						"absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-5 transition-transform duration-500 group-hover:scale-150",
						card.bg
					)} />

					<CardContent className="p-5 space-y-4">
						<div className="flex items-center justify-between">
							<div className={cn(
								"p-2.5 rounded-lg transition-colors duration-300",
								card.bg,
								"text-foreground"
							)} style={{ color: card.color }}>
								<card.Icon className="h-5 w-5" />
							</div>
							<div className="p-1 rounded-full bg-muted/50 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
								<ArrowUpRight className="h-3 w-3" />
							</div>
						</div>

						<div className="space-y-1">
							<p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
								{card.title}
							</p>
							<p className="text-2xl font-black tracking-tight text-foreground tabular-nums truncate">
								{card.value}
							</p>
						</div>

						<p className="text-[10px] text-muted-foreground italic font-medium pt-1">
							{card.description}
						</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
