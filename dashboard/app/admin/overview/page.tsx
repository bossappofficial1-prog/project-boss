"use client"

import React, { useState } from "react"
import {
    DollarSign,
    Users,
    Activity,
    AlertCircle,
    Ticket,
    Wallet,
    ArrowRight,
    Briefcase
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { useKPIs, useRevenue } from "@/hooks/useOverview"
import { formatCurrencyIDR } from "@/components/owner/dashboard/StatsCards"
import { KpiCard } from "@/components/features/admin/overview/KpisCard"
import { RevenueChart } from "@/components/features/admin/overview/RevenueChart"
import { RecentActivity } from "@/components/features/admin/overview/RecentActivity"
import { PayoutVsRequestChart } from "@/components/features/admin/overview/PayoutVsRequestChart"

// --- MOCK DATA (Adjusted for IDR) ---
const revenueData = [
    { name: "Jan", total: 45000000 },
    { name: "Feb", total: 52000000 },
    { name: "Mar", total: 48000000 },
    { name: "Apr", total: 61000000 },
    { name: "May", total: 58000000 },
    { name: "Jun", total: 75000000 },
    { name: "Jul", total: 72000000 },
]

const payoutData = [
    { name: "Sen", requests: 40, payouts: 24 },
    { name: "Sel", requests: 30, payouts: 13 },
    { name: "Rab", requests: 20, payouts: 98 },
    { name: "Kam", requests: 27, payouts: 39 },
    { name: "Jum", requests: 18, payouts: 48 },
    { name: "Sab", requests: 23, payouts: 38 },
    { name: "Min", requests: 34, payouts: 43 },
]

const activityFeed = [
    {
        id: 1,
        type: "login",
        user: "Budi Santoso",
        action: "Login dari perangkat baru",
        time: "2 mnt lalu",
        avatar: "/avatars/01.png",
        status: "neutral"
    },
    {
        id: 2,
        type: "withdrawal",
        user: "Siti Aminah",
        action: "Permintaan penarikan Rp 1.200.000",
        time: "15 mnt lalu",
        avatar: "/avatars/02.png",
        status: "warning"
    },
    {
        id: 3,
        type: "error",
        user: "Sistem",
        action: "Timeout Gateway Pembayaran (API-500)",
        time: "1 jam lalu",
        avatar: "",
        status: "critical"
    },
    {
        id: 4,
        type: "ticket",
        user: "Rian Pratama",
        action: "Membuka tiket #4029: Masalah Login",
        time: "2 jam lalu",
        avatar: "/avatars/03.png",
        status: "neutral"
    },
]

export default function DashboardOverview() {
    const [from, setFilterFrom] = useState<string>()
    const [to, setFilterTo] = useState<string>()
    const { data: kpiData } = useKPIs();
    const { data: revenueData } = useRevenue(from, to)

    return (
        <div className="flex flex-col space-y-3 p-3">
            {/* --- TITLE & ACTIONS --- */}
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="hidden md:flex shadow-sm rounded-md">
                        Download Laporan
                    </Button>
                </div>
            </div>

            {/* --- KPI SECTION 1: REVENUE (Grid 3) --- */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <KpiCard
                    Icon={DollarSign}
                    title="Pendapatan (Hari Ini)"
                    nominal={formatCurrencyIDR(kpiData?.today || 0)}
                    growth={kpiData?.todayGrowth || 0}
                    description="dari kemarin"
                />
                <KpiCard
                    Icon={Activity}
                    title="Pendapatan (Mingguan)"
                    nominal={formatCurrencyIDR(kpiData?.week || 0)}
                    growth={kpiData?.weekGrowth || 0}
                    description="dari minggu lalu"
                />
                <KpiCard
                    Icon={DollarSign}
                    title="Pendapatan (Bulanan)"
                    nominal={formatCurrencyIDR(kpiData?.month || 0)}
                    growth={kpiData?.monthGrowth || 0}
                    description="dari bulan lalu"
                />
            </div>

            {/* --- KPI SECTION 2: OPERATIONAL (Grid 4) --- */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    Icon={Briefcase}
                    title="Bisnis Aktif"
                    nominal={(kpiData?.businessActive || 0).toString()}
                />
                <KpiCard
                    Icon={Wallet}
                    title="Penarikan Tertunda"
                    nominal={(kpiData?.withdrawalPending || 0).toString()}
                />
                <KpiCard
                    Icon={AlertCircle}
                    title="Transaksi Gagal"
                    nominal={(kpiData?.failedTransaction || 0).toString()}
                />
                <KpiCard
                    Icon={Ticket}
                    title="Tiket Terbuka"
                    nominal={`23`}
                />
            </div>

            {/* --- MAIN CONTENT: CHART & FEED --- */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">

                {/* REVENUE TREND CHART */}
                <RevenueChart onFilterChange={(filter) => {
                    setFilterFrom(filter.from);
                    setFilterTo(filter.to);
                }} data={revenueData} />

                {/* RECENT ACTIVITY FEED */}
                <RecentActivity data={activityFeed} />
            </div>

            {/* --- BOTTOM ROW: PAYOUT CHART & QUICK ACTIONS --- */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">

                {/* PAYOUTS VS REQUESTS CHART */}
                <PayoutVsRequestChart data={payoutData} />

                {/* QUICK ACTIONS */}
                <Card className="col-span-3 shadow-md rounded-md border-border/50">
                    <CardHeader>
                        <CardTitle>Aksi Cepat</CardTitle>
                        <CardDescription>Kelola fungsi sistem utama dengan efisien.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <Button variant="outline" className="h-14 w-full justify-start gap-4 rounded-md shadow-sm hover:bg-muted/50 border-border/50 group">
                            <div className="flex items-center justify-center p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                                <Wallet className="h-5 w-5 text-primary" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-sm">Proses Penarikan</div>
                                <div className="text-xs text-muted-foreground">Review 24 permintaan tertunda</div>
                            </div>
                            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        </Button>

                        <Button variant="outline" className="h-14 w-full justify-start gap-4 rounded-md shadow-sm hover:bg-muted/50 border-border/50 group">
                            <div className="flex items-center justify-center p-2 bg-blue-500/10 rounded-md group-hover:bg-blue-500/20 transition-colors">
                                <Users className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-sm">Kelola Pesanan</div>
                                <div className="text-xs text-muted-foreground">Cek transaksi terbaru</div>
                            </div>
                            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-blue-500" />
                        </Button>

                        <Button variant="outline" className="h-14 w-full justify-start gap-4 rounded-md shadow-sm hover:bg-muted/50 border-border/50 group">
                            <div className="flex items-center justify-center p-2 bg-emerald-500/10 rounded-md group-hover:bg-emerald-500/20 transition-colors">
                                <Activity className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-sm">Kesehatan Sistem</div>
                                <div className="text-xs text-muted-foreground">Semua sistem operasional</div>
                            </div>
                            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-emerald-500" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}