"use client"

import React from "react"
import {
    Building2,
    Search,
    Filter,
    MoreHorizontal,
    Wallet,
    CreditCard,
    MapPin,
    Tag,
    Image as ImageIcon,
    Users,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    FileText,
    Ban,
    Edit,
    ExternalLink,
    ArrowUpRight,
    ArrowDownRight,
    Store
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select"

// --- HELPER ---
const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

// --- TYPES ---
type VerificationStatus = "verified" | "pending" | "rejected"
type BusinessStatus = "active" | "suspended"

interface Business {
    id: string
    name: string
    owner: string
    email: string
    status: BusinessStatus
    verificationStatus: VerificationStatus
    walletBalance: number
    createdAt: string
    logo?: string
    // Detail fields
    phone: string
    address: string
    bankInfo: {
        bankName: string
        accountNumber: string
        accountHolder: string
    }
    stats: {
        totalMembers: number
        activePromos: number
        totalOutlets: number
    }
}

// --- MOCK DATA ---
const BUSINESSES: Business[] = [
    {
        id: "BIZ-001",
        name: "Kopi Kenangan Senja",
        owner: "Budi Santoso",
        email: "budi@kopisenja.com",
        status: "active",
        verificationStatus: "verified",
        walletBalance: 15400000,
        createdAt: "2023-05-12",
        logo: "/avatars/biz-01.png",
        phone: "+62 812-3456-7890",
        address: "Jl. Sudirman No. 45, Jakarta Selatan",
        bankInfo: {
            bankName: "BCA",
            accountNumber: "1234567890",
            accountHolder: "PT Kopi Kenangan Senja"
        },
        stats: { totalMembers: 1250, activePromos: 3, totalOutlets: 5 }
    },
    {
        id: "BIZ-002",
        name: "Martabak Sultan",
        owner: "Siti Aminah",
        email: "siti@martabaksultan.id",
        status: "active",
        verificationStatus: "pending",
        walletBalance: 2500000,
        createdAt: "2023-08-20",
        phone: "+62 813-9999-8888",
        address: "Jl. Ahmad Yani No. 12, Bandung",
        bankInfo: {
            bankName: "Mandiri",
            accountNumber: "9876543210",
            accountHolder: "Siti Aminah"
        },
        stats: { totalMembers: 450, activePromos: 1, totalOutlets: 2 }
    },
    {
        id: "BIZ-003",
        name: "Fashion Hits Store",
        owner: "Rian Pratama",
        email: "rian@fashionhits.com",
        status: "suspended",
        verificationStatus: "verified",
        walletBalance: 450000,
        createdAt: "2023-02-10",
        phone: "+62 811-2233-4455",
        address: "Mangga Dua Square Lt. 3, Jakarta Utara",
        bankInfo: {
            bankName: "BRI",
            accountNumber: "5555666677",
            accountHolder: "Rian Pratama"
        },
        stats: { totalMembers: 890, activePromos: 5, totalOutlets: 1 }
    },
]

export default function BusinessManagement() {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState("ALL")
    const [selectedBusiness, setSelectedBusiness] = React.useState<Business | null>(null)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)

    const filteredBusinesses = BUSINESSES.filter((biz) => {
        const matchesSearch = biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            biz.owner.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "ALL" || biz.verificationStatus === statusFilter
        return matchesSearch && matchesStatus
    })

    const handleRowClick = (biz: Business) => {
        setSelectedBusiness(biz)
        setIsSheetOpen(true)
    }

    return (
        <div className="flex flex-col space-y-3 p-3 h-full">

            {/* --- HEADER & ACTIONS --- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Business Listings</h2>
                    <p className="text-muted-foreground text-sm">
                        Kelola profil bisnis, verifikasi, dan keuangan mitra.
                    </p>
                </div>
                <Button size="sm" className="shadow-sm">
                    <ExternalLink className="mr-2 h-4 w-4" /> Review Verifikasi (3)
                </Button>
            </div>

            {/* --- FILTERS --- */}
            <Card className="rounded-md shadow-md border-border/50 bg-card">
                <CardContent className="p-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama bisnis atau pemilik..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-muted/30 border-border/50"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] bg-muted/30 border-border/50">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Filter className="h-3.5 w-3.5" />
                                    <span className="truncate text-xs font-medium">
                                        {statusFilter === 'ALL' ? 'Semua Status Verifikasi' : statusFilter}
                                    </span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua</SelectItem>
                                <SelectItem value="verified">Terverifikasi</SelectItem>
                                <SelectItem value="pending">Menunggu Verifikasi</SelectItem>
                                <SelectItem value="rejected">Ditolak</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* --- TABLE LIST --- */}
            <Card className="rounded-md shadow-md border-border/50 flex-1 overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Nama Bisnis</TableHead>
                            <TableHead>Pemilik</TableHead>
                            <TableHead>Status Akun</TableHead>
                            <TableHead>Saldo Wallet</TableHead>
                            <TableHead>Verifikasi Manual</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBusinesses.map((biz) => (
                            <TableRow
                                key={biz.id}
                                className="cursor-pointer hover:bg-muted/30 transition-colors group"
                                onClick={() => handleRowClick(biz)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 rounded-md border border-border/50">
                                            <AvatarImage src={biz.logo} alt={biz.name} />
                                            <AvatarFallback className="rounded-md"><Building2 className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm group-hover:text-primary transition-colors">{biz.name}</span>
                                            <span className="text-xs text-muted-foreground">{biz.createdAt}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm">{biz.owner}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={
                                        biz.status === 'active'
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800"
                                            : "bg-destructive/10 text-destructive border-destructive/20"
                                    }>
                                        {biz.status === 'active' ? 'Active' : 'Suspended'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-medium font-mono text-sm">
                                    {formatIDR(biz.walletBalance)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {biz.verificationStatus === 'verified' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                        {biz.verificationStatus === 'pending' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                        {biz.verificationStatus === 'rejected' && <XCircle className="h-4 w-4 text-destructive" />}
                                        <span className="text-xs capitalize text-muted-foreground">
                                            {biz.verificationStatus}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* --- DETAIL SHEET (DRAWER) --- */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto p-0 gap-0">
                    {selectedBusiness && (
                        <>
                            {/* Sheet Header */}
                            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/50 p-6 pb-4">
                                <SheetHeader className="text-left space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-16 w-16 rounded-lg border border-border shadow-sm">
                                                <AvatarImage src={selectedBusiness.logo} />
                                                <AvatarFallback className="rounded-lg text-xl bg-muted"><Store /></AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <SheetTitle className="text-xl font-bold">{selectedBusiness.name}</SheetTitle>
                                                <SheetDescription className="flex items-center gap-2 mt-1">
                                                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{selectedBusiness.id}</span>
                                                    <span>•</span>
                                                    <span className="text-xs">{selectedBusiness.email}</span>
                                                </SheetDescription>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {selectedBusiness.status === 'active' ? (
                                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
                                                    <Ban className="h-4 w-4 mr-2" /> Suspend
                                                </Button>
                                            ) : (
                                                <Button variant="outline" size="sm" className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 border-emerald-200">
                                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Unsuspend
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </SheetHeader>
                            </div>

                            {/* Content Tabs */}
                            <div className="p-6">
                                <Tabs defaultValue="overview" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4 mb-6">
                                        <TabsTrigger value="overview">Profil</TabsTrigger>
                                        <TabsTrigger value="finance">Keuangan</TabsTrigger>
                                        <TabsTrigger value="outlets">Outlet</TabsTrigger>
                                        <TabsTrigger value="promo">Promo</TabsTrigger>
                                    </TabsList>

                                    {/* TAB 1: OVERVIEW */}
                                    <TabsContent value="overview" className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Card className="shadow-sm border-border/50">
                                                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Member</CardTitle></CardHeader>
                                                <CardContent><div className="text-2xl font-bold">{selectedBusiness.stats.totalMembers}</div></CardContent>
                                            </Card>
                                            <Card className="shadow-sm border-border/50">
                                                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Promo Aktif</CardTitle></CardHeader>
                                                <CardContent><div className="text-2xl font-bold">{selectedBusiness.stats.activePromos}</div></CardContent>
                                            </Card>
                                        </div>

                                        <Card className="shadow-sm border-border/50">
                                            <CardHeader>
                                                <CardTitle className="text-base">Informasi Kontak</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3 text-sm">
                                                <div className="flex justify-between py-2 border-b border-border/30">
                                                    <span className="text-muted-foreground">Pemilik</span>
                                                    <span className="font-medium">{selectedBusiness.owner}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-border/30">
                                                    <span className="text-muted-foreground">Telepon</span>
                                                    <span className="font-medium">{selectedBusiness.phone}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-border/30">
                                                    <span className="text-muted-foreground">Alamat</span>
                                                    <span className="font-medium text-right max-w-[60%]">{selectedBusiness.address}</span>
                                                </div>
                                                <div className="flex justify-between py-2 items-center">
                                                    <span className="text-muted-foreground">Status KYC</span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="uppercase text-[10px]">{selectedBusiness.verificationStatus}</Badge>
                                                        <Button variant="link" size="sm" className="h-auto p-0 text-blue-600">Lihat Dokumen</Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* TAB 2: FINANCE */}
                                    <TabsContent value="finance" className="space-y-4">
                                        <Card className="bg-primary/5 border-primary/20 shadow-sm">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm font-medium text-primary">Saldo Dompet Aktif</CardTitle>
                                                    <Wallet className="h-4 w-4 text-primary" />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-bold text-primary">{formatIDR(selectedBusiness.walletBalance)}</div>
                                            </CardContent>
                                        </Card>

                                        <Card className="shadow-sm border-border/50">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-base">Informasi Rekening Bank</CardTitle>
                                                <Button variant="ghost" size="sm" className="h-8 text-xs">
                                                    <Edit className="mr-2 h-3 w-3" /> Edit (Admin)
                                                </Button>
                                            </CardHeader>
                                            <CardContent className="space-y-3 text-sm">
                                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                                                    <div className="h-10 w-10 rounded bg-white flex items-center justify-center shadow-sm">
                                                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{selectedBusiness.bankInfo.bankName}</p>
                                                        <p className="font-mono text-muted-foreground">{selectedBusiness.bankInfo.accountNumber}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">A.N {selectedBusiness.bankInfo.accountHolder}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <div>
                                            <h4 className="text-sm font-medium mb-3">Transaksi Terakhir</h4>
                                            <div className="space-y-2">
                                                {/* Mock Transactions */}
                                                {[1, 2, 3].map((i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-card border border-border/50 rounded-lg shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${i % 2 === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                                {i % 2 === 0 ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium">{i % 2 === 0 ? 'Top Up Saldo' : 'Penarikan Dana'}</p>
                                                                <p className="text-xs text-muted-foreground">20 Nov 2023, 14:30</p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-sm font-medium ${i % 2 === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {i % 2 === 0 ? '+' : '-'}{formatIDR(500000 * i)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* TAB 3: OUTLETS (Mock) */}
                                    <TabsContent value="outlets">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-medium">Daftar Outlet ({selectedBusiness.stats.totalOutlets})</h4>
                                                <Button size="sm" variant="outline" className="h-7 text-xs">Detail Lokasi</Button>
                                            </div>
                                            {[1, 2].map((item) => (
                                                <div key={item} className="flex items-start gap-3 p-3 border border-border/50 rounded-lg">
                                                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium">Outlet Cabang {item}</p>
                                                        <p className="text-xs text-muted-foreground">Jl. Contoh No. {item}, Jakarta</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>

                                    {/* TAB 4: PROMO & BANNERS (Mock) */}
                                    <TabsContent value="promo">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><Tag className="h-4 w-4" /> Promo Aktif</h4>
                                                <Card className="p-3 border-dashed border-border bg-muted/20">
                                                    <p className="text-sm font-medium">Diskon Akhir Tahun</p>
                                                    <p className="text-xs text-muted-foreground">Potongan 20% All Item • Berakhir 31 Des</p>
                                                </Card>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Banner Aplikasi</h4>
                                                <div className="h-24 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs border border-border">
                                                    Banner Image Placeholder
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                </Tabs>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}