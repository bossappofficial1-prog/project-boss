"use client"

import React from "react"
import {
    Store,
    MapPin,
    Clock,
    Phone,
    MoreHorizontal,
    Search,
    Filter,
    AlertTriangle,
    CheckCircle2,
    Power,
    Ban,
    Edit,
    ShoppingBag,
    Users,
    Map
} from "lucide-react"

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
    CardDescription
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
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
type OutletStatus = "OPEN" | "CLOSED" | "MAINTENANCE"

interface Outlet {
    id: string
    name: string
    businessName: string
    address: string
    status: OutletStatus
    complianceIssue: boolean
    complianceNote?: string
    contact: string
    operatingHours: string
    productsCount: number
    staffCount: number
    expenses: { name: string; amount: number }[]
    staffRoster: { name: string; role: string; avatar?: string }[]
}

// --- MOCK DATA ---
const OUTLETS: Outlet[] = [
    {
        id: "OUT-001",
        name: "Kopi Senja - Senopati",
        businessName: "Kopi Kenangan Senja",
        address: "Jl. Senopati No. 10, Jakarta Selatan",
        status: "OPEN",
        complianceIssue: false,
        contact: "+62 812-3456-7890",
        operatingHours: "08:00 - 22:00",
        productsCount: 45,
        staffCount: 8,
        expenses: [
            { name: "Sewa", amount: 15000000 },
            { name: "Gaji", amount: 25000000 },
            { name: "Bahan", amount: 12000000 },
            { name: "Util", amount: 3000000 },
        ],
        staffRoster: [
            { name: "Andi Wijaya", role: "Manager" },
            { name: "Dewi Sartika", role: "Cashier" }
        ]
    },
    {
        id: "OUT-002",
        name: "Martabak Sultan - Dago",
        businessName: "Martabak Sultan",
        address: "Jl. Ir. H. Juanda No. 50, Bandung",
        status: "CLOSED",
        complianceIssue: true,
        complianceNote: "Izin Kebersihan Expired",
        contact: "+62 813-9999-8888",
        operatingHours: "16:00 - 23:00",
        productsCount: 12,
        staffCount: 4,
        expenses: [
            { name: "Sewa", amount: 5000000 },
            { name: "Gaji", amount: 8000000 },
            { name: "Bahan", amount: 6000000 },
            { name: "Util", amount: 1500000 },
        ],
        staffRoster: [
            { name: "Bambang Pamungkas", role: "Kitchen" }
        ]
    },
    {
        id: "OUT-003",
        name: "Kopi Senja - Tebet",
        businessName: "Kopi Kenangan Senja",
        address: "Jl. Tebet Raya No. 22, Jakarta Selatan",
        status: "MAINTENANCE",
        complianceIssue: false,
        contact: "+62 812-1111-2222",
        operatingHours: "08:00 - 22:00",
        productsCount: 45,
        staffCount: 6,
        expenses: [
            { name: "Sewa", amount: 12000000 },
            { name: "Gaji", amount: 18000000 },
            { name: "Bahan", amount: 10000000 },
            { name: "Util", amount: 2500000 },
        ],
        staffRoster: []
    }
]

export default function OutletManagement() {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState("ALL")
    const [selectedOutlet, setSelectedOutlet] = React.useState<Outlet | null>(null)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)

    const filteredOutlets = OUTLETS.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.businessName.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "ALL" || item.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const handleRowClick = (outlet: Outlet) => {
        setSelectedOutlet(outlet)
        setIsSheetOpen(true)
    }

    return (
        <div className="flex flex-col space-y-3 p-3 h-full">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Manajemen Outlet</h2>
                    <p className="text-muted-foreground text-sm">
                        Pantau lokasi fisik, status operasional, dan kepatuhan.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline">Export Data</Button>
                </div>
            </div>

            {/* FILTERS */}
            <Card className="rounded-md shadow-md border-border/50 bg-card">
                <CardContent className="p-3">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama outlet atau bisnis..."
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
                                        {statusFilter === 'ALL' ? 'Semua Status' : statusFilter}
                                    </span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Status</SelectItem>
                                <SelectItem value="OPEN">Buka (Open)</SelectItem>
                                <SelectItem value="CLOSED">Tutup (Closed)</SelectItem>
                                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* TABLE */}
            <Card className="rounded-md shadow-md border-border/50 flex-1 overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Nama Outlet</TableHead>
                            <TableHead>Bisnis Owner</TableHead>
                            <TableHead>Lokasi</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Kepatuhan</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOutlets.map((outlet) => (
                            <TableRow
                                key={outlet.id}
                                className="cursor-pointer hover:bg-muted/30 transition-colors group"
                                onClick={() => handleRowClick(outlet)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                            <Store className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm group-hover:text-primary transition-colors">{outlet.name}</span>
                                            <span className="text-xs text-muted-foreground">ID: {outlet.id}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm">{outlet.businessName}</TableCell>
                                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-3 w-3" /> {outlet.address}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={
                                        outlet.status === 'OPEN' ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" :
                                            outlet.status === 'CLOSED' ? "bg-destructive/10 text-destructive border-destructive/20" :
                                                "bg-amber-500/10 text-amber-600 border-amber-200"
                                    }>
                                        {outlet.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {outlet.complianceIssue ? (
                                        <div className="flex items-center gap-1.5 text-destructive text-xs font-medium bg-destructive/5 px-2 py-1 rounded-full w-fit">
                                            <AlertTriangle className="h-3 w-3" /> Flagged
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                                            <CheckCircle2 className="h-3 w-3" /> Clean
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                                <Edit className="mr-2 h-4 w-4 text-muted-foreground" /> Edit Kontak
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                                <Power className="mr-2 h-4 w-4 text-muted-foreground" /> Force Close/Open
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>
                                                <Ban className="mr-2 h-4 w-4" /> Suspend Outlet
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* SHEET DETAIL */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto p-0 gap-0">
                    {selectedOutlet && (
                        <>
                            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/50 p-6 pb-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <Badge variant="outline" className="mb-2 bg-primary/5 text-primary border-primary/20">
                                            {selectedOutlet.businessName}
                                        </Badge>
                                        <SheetTitle className="text-xl font-bold leading-none mb-1">{selectedOutlet.name}</SheetTitle>
                                        <SheetDescription className="flex items-center gap-2 text-xs">
                                            <MapPin className="h-3 w-3" /> {selectedOutlet.address}
                                        </SheetDescription>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge className={
                                            selectedOutlet.status === 'OPEN' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-destructive"
                                        }>
                                            {selectedOutlet.status}
                                        </Badge>
                                        {selectedOutlet.complianceIssue && (
                                            <Badge variant="outline" className="text-destructive border-destructive bg-destructive/10 animate-pulse">
                                                <AlertTriangle className="h-3 w-3 mr-1" /> Non-Compliant
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
                                        <Power className="h-3 w-3 mr-2" /> {selectedOutlet.status === 'OPEN' ? 'Force Close' : 'Force Open'}
                                    </Button>
                                    <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
                                        <Edit className="h-3 w-3 mr-2" /> Edit Kontak
                                    </Button>
                                    <Button size="sm" variant="destructive" className="flex-1 text-xs h-8">
                                        <Ban className="h-3 w-3 mr-2" /> Suspend
                                    </Button>
                                </div>
                            </div>

                            <div className="p-6">
                                <Tabs defaultValue="overview">
                                    <TabsList className="grid w-full grid-cols-3 mb-6">
                                        <TabsTrigger value="overview">Overview</TabsTrigger>
                                        <TabsTrigger value="operations">Operasional</TabsTrigger>
                                        <TabsTrigger value="expenses">Keuangan</TabsTrigger>
                                    </TabsList>

                                    {/* TAB: OVERVIEW */}
                                    <TabsContent value="overview" className="space-y-4">
                                        {selectedOutlet.complianceIssue && (
                                            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 flex gap-3 items-start">
                                                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="text-sm font-bold text-destructive">Masalah Kepatuhan Terdeteksi</h4>
                                                    <p className="text-xs text-muted-foreground mt-1">{selectedOutlet.complianceNote}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="aspect-video w-full bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground border border-border/50 relative overflow-hidden">
                                            <Map className="h-8 w-8 mb-2 opacity-50" />
                                            <span className="text-xs">Peta Lokasi (Simulasi)</span>
                                            <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-[10px] backdrop-blur">
                                                {selectedOutlet.address}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <Card className="shadow-sm border-border/50">
                                                <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2"><Clock className="h-3 w-3" /> Jam Operasional</CardTitle></CardHeader>
                                                <CardContent className="p-4 pt-0"><div className="text-sm font-bold">{selectedOutlet.operatingHours}</div></CardContent>
                                            </Card>
                                            <Card className="shadow-sm border-border/50">
                                                <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2"><Phone className="h-3 w-3" /> Kontak Outlet</CardTitle></CardHeader>
                                                <CardContent className="p-4 pt-0"><div className="text-sm font-bold">{selectedOutlet.contact}</div></CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>

                                    {/* TAB: OPERATIONS */}
                                    <TabsContent value="operations" className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-lg border border-border/50 bg-card shadow-sm">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                                    <Users className="h-4 w-4" />
                                                    <span className="text-xs font-medium">Total Staff</span>
                                                </div>
                                                <div className="text-2xl font-bold">{selectedOutlet.staffCount}</div>
                                            </div>
                                            <div className="p-4 rounded-lg border border-border/50 bg-card shadow-sm">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                                    <ShoppingBag className="h-4 w-4" />
                                                    <span className="text-xs font-medium">Produk Terdaftar</span>
                                                </div>
                                                <div className="text-2xl font-bold">{selectedOutlet.productsCount}</div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-medium mb-3">Daftar Staff di Outlet Ini</h4>
                                            <div className="space-y-2">
                                                {selectedOutlet.staffRoster.length > 0 ? (
                                                    selectedOutlet.staffRoster.map((staff, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-2 bg-muted/20 rounded-md border border-border/50">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarFallback>{staff.name[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-xs font-medium">{staff.name}</span>
                                                            </div>
                                                            <Badge variant="secondary" className="text-[10px] h-5">{staff.role}</Badge>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-xs text-muted-foreground italic">Belum ada staff terdaftar.</p>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* TAB: EXPENSES */}
                                    <TabsContent value="expenses">
                                        <Card className="shadow-none border border-border/50">
                                            <CardHeader>
                                                <CardTitle className="text-sm">Ringkasan Pengeluaran Bulanan</CardTitle>
                                                <CardDescription>Breakdown biaya operasional outlet ini.</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="h-[200px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={selectedOutlet.expenses} layout="vertical">
                                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                                                            <XAxis type="number" hide />
                                                            <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} interval={0} />
                                                            <Tooltip
                                                                formatter={(value: number) => formatIDR(value)}
                                                                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                                                            />
                                                            <Bar dataKey="amount" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <Separator className="my-4" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-muted-foreground">Total Pengeluaran</span>
                                                    <span className="text-lg font-bold">
                                                        {formatIDR(selectedOutlet.expenses.reduce((acc, curr) => acc + curr.amount, 0))}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
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