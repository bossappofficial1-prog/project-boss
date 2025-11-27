"use client"

import React from "react"
import {
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Users,
    CreditCard,
    Activity,
    AlertCircle,
    Ticket,
    Wallet,
    Server,
    ArrowRight,
    Briefcase
} from "lucide-react"
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// --- HELPER CURRENCY IDR ---
const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

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
    return (
        <div className="flex flex-col space-y-3 p-3">

            {/* --- TITLE & ACTIONS --- */}
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="hidden md:flex shadow-sm rounded-md">
                        Download Laporan
                    </Button>
                    <Button size="sm" className="shadow-sm rounded-md">
                        <ArrowRight className="mr-2 h-4 w-4" /> Live View
                    </Button>
                </div>
            </div>

            {/* --- KPI SECTION 1: REVENUE (Grid 3) --- */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Card className="shadow-md rounded-md border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pendapatan (Hari Ini)
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatIDR(18500000)}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <span className="text-emerald-500 flex items-center font-medium">
                                +20.1% <ArrowUpRight className="h-3 w-3 ml-0.5" />
                            </span>
                            <span className="ml-1">dari kemarin</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-md rounded-md border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pendapatan (Mingguan)
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatIDR(128390000)}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <span className="text-emerald-500 flex items-center font-medium">
                                +4.5% <ArrowUpRight className="h-3 w-3 ml-0.5" />
                            </span>
                            <span className="ml-1">dari minggu lalu</span>
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-md rounded-md border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pendapatan (Bulanan)
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatIDR(452231000)}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <span className="text-rose-500 flex items-center font-medium">
                                -1.2% <ArrowDownRight className="h-3 w-3 ml-0.5" />
                            </span>
                            <span className="ml-1">dari bulan lalu</span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* --- KPI SECTION 2: OPERATIONAL (Grid 4) --- */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-md rounded-md border-border/50 bg-accent/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bisnis Aktif</CardTitle>
                        <Briefcase className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">573</div>
                        <p className="text-xs text-muted-foreground">+2 baru hari ini</p>
                    </CardContent>
                </Card>

                <Card className="shadow-md rounded-md border-border/50 bg-accent/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Penarikan Tertunda</CardTitle>
                        <Wallet className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">24</div>
                        <p className="text-xs  text-amber-600 font-medium">Perlu tinjauan</p>
                    </CardContent>
                </Card>

                <Card className="shadow-md rounded-md border-border/50 bg-accent/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transaksi Gagal</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">7</div>
                        <p className="text-xs  text-destructive font-medium">Error kritis</p>
                    </CardContent>
                </Card>

                <Card className="shadow-md rounded-md border-border/50 bg-accent/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tiket Terbuka</CardTitle>
                        <Ticket className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">3 prioritas tinggi</p>
                    </CardContent>
                </Card>
            </div>

            {/* --- MAIN CONTENT: CHART & FEED --- */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">

                {/* REVENUE TREND CHART */}
                <Card className="col-span-4 shadow-md rounded-md border-border/50">
                    <CardHeader>
                        <CardTitle>Tren Pendapatan</CardTitle>
                        <CardDescription>
                            Performa pendapatan Anda selama 7 bulan terakhir.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => {
                                            // Format ringkas untuk axis Y (e.g. 10Jt)
                                            return new Intl.NumberFormat("id-ID", { notation: "compact", compactDisplay: "short" }).format(value)
                                        }}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => formatIDR(value)}
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                                        itemStyle={{ color: 'var(--card-foreground)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="var(--primary)"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* RECENT ACTIVITY FEED */}
                <Card className="col-span-3 shadow-md rounded-md border-border/50 flex flex-col">
                    <CardHeader>
                        <CardTitle>Aktivitas Terbaru</CardTitle>
                        <CardDescription>Event sistem dan aksi user terkini.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <ScrollArea className="h-[300px] px-6">
                            <div className="space-y-6">
                                {activityFeed.map((item) => (
                                    <div key={item.id} className="flex items-start gap-4 group">
                                        {item.avatar ? (
                                            <Avatar className="h-9 w-9 border border-border">
                                                <AvatarImage src={item.avatar} alt={item.user} />
                                                <AvatarFallback>{item.user.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted">
                                                <Server className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        )}

                                        <div className="grid gap-1">
                                            <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                                                {item.user}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.action}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-muted-foreground">{item.time}</span>
                                                {item.status === 'critical' && <Badge variant="destructive" className="text-[10px] h-4 px-1 rounded-[4px]">Kritis</Badge>}
                                                {item.status === 'warning' && <Badge variant="secondary" className="text-[10px] h-4 px-1 rounded-[4px] text-amber-600 bg-amber-100 dark:bg-amber-900/30">Review</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="border-t border-border/50 p-3">
                        <Button variant="ghost" size="sm" className="w-full text-muted-foreground text-xs">Lihat semua aktivitas</Button>
                    </CardFooter>
                </Card>
            </div>

            {/* --- BOTTOM ROW: PAYOUT CHART & QUICK ACTIONS --- */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">

                {/* PAYOUTS VS REQUESTS CHART */}
                <Card className="col-span-4 shadow-md rounded-md border-border/50">
                    <CardHeader>
                        <CardTitle>Pembayaran vs Permintaan</CardTitle>
                        <CardDescription>Perbandingan permintaan penarikan vs pembayaran diproses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={payoutData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--muted)/0.4' }}
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                                    />
                                    <Bar dataKey="requests" name="Permintaan" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="payouts" name="Dibayar" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* QUICK ACTIONS */}
                <Card className="col-span-3 shadow-md rounded-md border-border/50">
                    <CardHeader>
                        <CardTitle>Aksi Cepat</CardTitle>
                        <CardDescription>Kelola fungsi sistem utama dengan efisien.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
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