"use client"

import React from "react"
import {
    Search,
    Filter,
    MoreHorizontal,
    ShoppingCart,
    Calendar,
    CreditCard,
    User,
    Store,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowUpRight,
    ExternalLink,
    CornerUpLeft,
    ShieldAlert,
    UserPlus,
    FileText,
    Receipt,
    Download
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
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
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange"

// --- HELPER ---
const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })
}

// --- TYPES ---
type OrderStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "DISPUTED"
type PaymentStatus = "PAID" | "UNPAID" | "REFUNDED" | "FAILED"

interface OrderItem {
    name: string
    quantity: number
    price: number
    variant?: string
}

interface Order {
    id: string
    date: string
    businessName: string
    outletName: string
    customerName: string
    customerEmail: string
    status: OrderStatus
    paymentStatus: PaymentStatus
    paymentMethod: string
    totalAmount: number
    items: OrderItem[]
    bookingSlot?: string // e.g., "22 Nov 2023, 14:00 - 16:00"
    manualProofUrl?: string // Link to uploaded proof
    transactionId: string
    notes?: string
}

// --- MOCK DATA ---
const ORDERS: Order[] = [
    {
        id: "ORD-2023-8821",
        date: "2023-11-22T14:30:00",
        businessName: "Kopi Kenangan Senja",
        outletName: "Senopati",
        customerName: "Budi Santoso",
        customerEmail: "budi@gmail.com",
        status: "COMPLETED",
        paymentStatus: "PAID",
        paymentMethod: "QRIS",
        totalAmount: 145000,
        transactionId: "TRX-QRS-992811",
        items: [
            { name: "Kopi Kenangan Mantan", quantity: 2, price: 25000, variant: "Large" },
            { name: "Roti Coklat", quantity: 2, price: 15000 },
            { name: "Croissant Butter", quantity: 1, price: 20000 },
            { name: "Hazelnut Latte", quantity: 1, price: 45000 },
        ]
    },
    {
        id: "ORD-2023-8822",
        date: "2023-11-22T15:15:00",
        businessName: "Martabak Sultan",
        outletName: "Dago",
        customerName: "Siti Aminah",
        customerEmail: "siti.aminah@yahoo.com",
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentMethod: "Bank Transfer (Manual)",
        totalAmount: 85000,
        transactionId: "TRX-MAN-112233",
        manualProofUrl: "https://example.com/proof.jpg", // Simulasi link
        items: [
            { name: "Martabak Manis Coklat Keju", quantity: 1, price: 85000, variant: "Special" }
        ],
        notes: "Tolong jangan gosong ya kak"
    },
    {
        id: "ORD-2023-8823",
        date: "2023-11-21T19:00:00",
        businessName: "Barber King",
        outletName: "Tebet",
        customerName: "Rian Pratama",
        customerEmail: "rian.pratama@tech.id",
        status: "DISPUTED",
        paymentStatus: "PAID",
        paymentMethod: "Credit Card",
        totalAmount: 120000,
        transactionId: "TRX-CC-554422",
        bookingSlot: "21 Nov 2023, 19:00 - 20:00",
        items: [
            { name: "Gentleman Cut & Wash", quantity: 1, price: 120000 }
        ]
    },
    {
        id: "ORD-2023-8824",
        date: "2023-11-20T10:00:00",
        businessName: "Kopi Kenangan Senja",
        outletName: "Senopati",
        customerName: "Jessica W.",
        customerEmail: "jessica@corp.com",
        status: "CANCELLED",
        paymentStatus: "REFUNDED",
        paymentMethod: "E-Wallet",
        totalAmount: 45000,
        transactionId: "TRX-EWL-778899",
        items: [
            { name: "Americano Ice", quantity: 2, price: 22500 }
        ]
    },
]

export default function OrderManagement() {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState("ALL")
    const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)

    // --- FILTER LOGIC ---
    const filteredOrders = ORDERS.filter(order => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.businessName.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === "ALL" || order.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const handleOrderClick = (order: Order) => {
        setSelectedOrder(order)
        setIsSheetOpen(true)
    }

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case "COMPLETED": return "bg-emerald-500/10 text-emerald-600 border-emerald-200"
            case "PENDING": return "bg-amber-500/10 text-amber-600 border-amber-200"
            case "CONFIRMED": return "bg-blue-500/10 text-blue-600 border-blue-200"
            case "CANCELLED": return "bg-muted text-muted-foreground border-border"
            case "DISPUTED": return "bg-destructive/10 text-destructive border-destructive/20"
            default: return "bg-muted"
        }
    }

    const getPaymentColor = (status: PaymentStatus) => {
        switch (status) {
            case "PAID": return "text-emerald-600"
            case "UNPAID": return "text-amber-600"
            case "REFUNDED": return "text-blue-600"
            case "FAILED": return "text-destructive"
            default: return "text-muted-foreground"
        }
    }

    return (
        <div className="flex flex-col space-y-3 p-3 h-full">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Order Management</h2>
                    <p className="text-muted-foreground text-sm">
                        Monitor transaksi, pembayaran, dan proses pesanan.
                    </p>
                </div>
                <Button size="sm" className="shadow-sm">
                    <Download className="mr-2 h-4 w-4" /> Export Laporan
                </Button>
            </div>

            {/* FILTERS & SEARCH BAR */}
            <Card className="rounded-md shadow-md border-border/50 bg-card">
                <CardContent className="p-3">
                    <div className="flex flex-col lg:flex-row gap-3">

                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari Order ID, Pelanggan, atau Bisnis..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-muted/30 border-border/50 h-9 text-sm"
                            />
                        </div>

                        {/* Filter Group */}
                        <div className="flex flex-wrap gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px] h-9 bg-muted/30 border-border/50 text-xs">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Filter className="h-3.5 w-3.5" />
                                        <span className="truncate">{statusFilter === 'ALL' ? 'Semua Status' : statusFilter}</span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Status</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="DISPUTED">Disputed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* DATE RANGE PICKER */}
                            <DatePickerWithRange />

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 border-border/50 bg-muted/30 text-muted-foreground text-xs font-normal">
                                        <Calendar className="mr-2 h-3.5 w-3.5" /> Rentang Tanggal
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <div className="p-4 text-sm text-muted-foreground">
                                        {/* Placeholder for Date Range Picker Component */}
                                        [Date Range Picker Component]
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 border-border/50 bg-muted/30 text-muted-foreground text-xs font-normal">
                                        <CreditCard className="mr-2 h-3.5 w-3.5" /> Rentang Harga
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="end">
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium leading-none">Filter Harga</h4>
                                            <p className="text-sm text-muted-foreground">Tentukan rentang nominal transaksi.</p>
                                        </div>
                                        <div className="grid gap-2">
                                            <div className="grid grid-cols-3 items-center gap-4">
                                                <span className="text-xs">Min</span>
                                                <Input id="min" defaultValue="0" className="col-span-2 h-8" />
                                            </div>
                                            <div className="grid grid-cols-3 items-center gap-4">
                                                <span className="text-xs">Max</span>
                                                <Input id="max" defaultValue="1000000" className="col-span-2 h-8" />
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ORDERS TABLE */}
            <Card className="rounded-md shadow-md border-border/50 flex-1 overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[140px]">Order ID</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Bisnis / Outlet</TableHead>
                            <TableHead>Pelanggan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Pembayaran</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.map((order) => (
                            <TableRow
                                key={order.id}
                                className="cursor-pointer hover:bg-muted/30 transition-colors group"
                                onClick={() => handleOrderClick(order)}
                            >
                                <TableCell className="font-mono text-xs font-medium text-primary">
                                    {order.id}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    {formatDate(order.date)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{order.businessName}</span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Store className="h-3 w-3" /> {order.outletName}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm">{order.customerName}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`text-[10px] h-5 border ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className={`flex items-center gap-1.5 text-xs font-medium ${getPaymentColor(order.paymentStatus)}`}>
                                        {order.paymentStatus === 'PAID' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                        {order.paymentStatus === 'UNPAID' && <Clock className="h-3.5 w-3.5" />}
                                        {order.paymentStatus === 'REFUNDED' && <CornerUpLeft className="h-3.5 w-3.5" />}
                                        {order.paymentStatus === 'FAILED' && <XCircle className="h-3.5 w-3.5" />}
                                        {order.paymentStatus}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium text-sm">
                                    {formatIDR(order.totalAmount)}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* DETAIL SHEET */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto p-0 gap-0">
                    {selectedOrder && (
                        <>
                            {/* Sticky Header */}
                            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/50 p-6 pb-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <ShoppingCart className="h-4 w-4" />
                                            <span className="text-xs font-mono">{selectedOrder.id}</span>
                                        </div>
                                        <SheetTitle className="text-xl font-bold">Order Detail</SheetTitle>
                                        <SheetDescription className="text-xs mt-1">
                                            {formatDate(selectedOrder.date)}
                                        </SheetDescription>
                                    </div>
                                    <div className="text-right">
                                        <Badge className={`text-sm mb-1 ${getStatusColor(selectedOrder.status)}`}>
                                            {selectedOrder.status}
                                        </Badge>
                                        <div className="text-sm font-bold">{formatIDR(selectedOrder.totalAmount)}</div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1 text-xs h-8 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10">
                                        <ShieldAlert className="h-3 w-3 mr-2" /> Eskalasi Masalah
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="outline" className="flex-1 text-xs h-8">
                                                Force Status <ArrowUpRight className="h-3 w-3 ml-2" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ubah Status Paksa</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem>Set to Confirmed</DropdownMenuItem>
                                            <DropdownMenuItem>Set to Completed</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive">Set to Cancelled</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Button size="sm" className="flex-1 text-xs h-8">
                                        <UserPlus className="h-3 w-3 mr-2" /> Assign Staff
                                    </Button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-6 space-y-6">

                                {/* Tabs for Organization */}
                                <Tabs defaultValue="details" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 mb-4">
                                        <TabsTrigger value="details">Rincian</TabsTrigger>
                                        <TabsTrigger value="items">Item ({selectedOrder.items.length})</TabsTrigger>
                                        <TabsTrigger value="actions">Tindakan</TabsTrigger>
                                    </TabsList>

                                    {/* TAB 1: DETAILS */}
                                    <TabsContent value="details" className="space-y-4">
                                        {/* Booking Slot Info (Conditional) */}
                                        {selectedOrder.bookingSlot && (
                                            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex gap-3 items-start">
                                                <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="text-sm font-bold text-primary">Jadwal Booking/Reservasi</h4>
                                                    <p className="text-xs text-muted-foreground mt-1">{selectedOrder.bookingSlot}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Manual Proof (Conditional) */}
                                        {selectedOrder.manualProofUrl && (
                                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3 items-start">
                                                <FileText className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                                <div className="w-full">
                                                    <h4 className="text-sm font-bold text-amber-600">Bukti Transfer Manual</h4>
                                                    <p className="text-xs text-muted-foreground mt-1 mb-2">User mengunggah bukti pembayaran manual.</p>
                                                    <Button variant="outline" size="sm" className="h-7 text-xs w-full border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">
                                                        <ExternalLink className="h-3 w-3 mr-2" /> Lihat Bukti (Read-Only)
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 gap-4">
                                            <Card className="shadow-sm border-border/50">
                                                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Informasi Pelanggan</CardTitle></CardHeader>
                                                <CardContent className="p-4 pt-0 space-y-1">
                                                    <div className="flex items-center gap-2"><User className="h-3 w-3 text-muted-foreground" /><span className="text-sm font-medium">{selectedOrder.customerName}</span></div>
                                                    <div className="flex items-center gap-2 ml-5"><span className="text-xs text-muted-foreground">{selectedOrder.customerEmail}</span></div>
                                                </CardContent>
                                            </Card>

                                            <Card className="shadow-sm border-border/50">
                                                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Informasi Transaksi</CardTitle></CardHeader>
                                                <CardContent className="p-4 pt-0 space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Metode</span>
                                                        <span className="font-medium">{selectedOrder.paymentMethod}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Ref ID</span>
                                                        <span className="font-mono text-xs bg-muted px-1 rounded">{selectedOrder.transactionId}</span>
                                                    </div>
                                                    {selectedOrder.notes && (
                                                        <div className="pt-2 border-t border-border/50 mt-2">
                                                            <p className="text-xs text-muted-foreground mb-1">Catatan User:</p>
                                                            <p className="text-sm italic">"{selectedOrder.notes}"</p>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>

                                    {/* TAB 2: ITEMS */}
                                    <TabsContent value="items">
                                        <Card className="border border-border/50 shadow-none">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="h-9">Item</TableHead>
                                                        <TableHead className="h-9 text-right">Qty</TableHead>
                                                        <TableHead className="h-9 text-right">Harga</TableHead>
                                                        <TableHead className="h-9 text-right">Total</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {selectedOrder.items.map((item, idx) => (
                                                        <TableRow key={idx} className="hover:bg-muted/20">
                                                            <TableCell className="py-3">
                                                                <div className="font-medium text-sm">{item.name}</div>
                                                                {item.variant && <div className="text-xs text-muted-foreground">Variant: {item.variant}</div>}
                                                            </TableCell>
                                                            <TableCell className="text-right py-3">{item.quantity}x</TableCell>
                                                            <TableCell className="text-right py-3 text-xs text-muted-foreground">{formatIDR(item.price)}</TableCell>
                                                            <TableCell className="text-right py-3 font-medium">{formatIDR(item.price * item.quantity)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow className="hover:bg-transparent border-t-2 border-border/50">
                                                        <TableCell colSpan={3} className="text-right font-bold">Grand Total</TableCell>
                                                        <TableCell className="text-right font-bold text-primary">{formatIDR(selectedOrder.totalAmount)}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </Card>
                                    </TabsContent>

                                    {/* TAB 3: ACTIONS (REFUND, ETC) */}
                                    <TabsContent value="actions" className="space-y-4">
                                        <Card className="border-dashed border-destructive/30 bg-destructive/5">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                                                    <Receipt className="h-4 w-4" /> Proses Refund
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <p className="text-xs text-muted-foreground">
                                                    Buat catatan refund internal. Aksi ini tidak otomatis mengembalikan dana ke user, namun mencatat status refund di sistem.
                                                </p>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium">Alasan Refund / Catatan</label>
                                                    <Textarea placeholder="Contoh: Stok habis, user minta cancel..." className="bg-background text-xs h-20" />
                                                </div>
                                                <Button size="sm" variant="destructive" className="w-full">
                                                    Buat Catatan Refund
                                                </Button>
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