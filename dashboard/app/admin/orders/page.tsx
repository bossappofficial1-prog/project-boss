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
    CornerUpLeft,
    ShieldAlert,
    UserPlus,
    FileText,
    Receipt,
    Download,
    RefreshCcw,
    Eye,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
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
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { apiClient } from "@/lib/apis/base"
import { useQuery } from "@tanstack/react-query"
import { formatCurrency } from "@/lib/utils"

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })
}

type OrderStatus = "AWAITING_PAYMENT" | "PROCESSING" | "CONFIRMED" | "READY" | "ON_GOING" | "COMPLETED" | "CANCELLED" | "RESERVED"
type PaymentStatus = "PENDING" | "PROOF_SUBMITTED" | "AWAITING_VERIFICATION" | "SUCCESS" | "FAILED" | "REFUNDED" | "EXPIRED" | "CANCELLED" | "REJECTED_MANUAL"

interface OrderItem {
    id: string
    quantity: number
    priceAtTimeOfOrder: number
    product: { name: string; type: string }
}

interface Order {
    id: string
    totalAmount: number
    taxAmount: number
    discountAmount: number
    orderStatus: OrderStatus
    paymentStatus: PaymentStatus
    notes?: string
    cancellationReason?: string
    createdAt: string
    updatedAt: string
    outlet: {
        id: string
        name: string
        business: { id: string; name: string }
    }
    guestCustomer: {
        name: string
        email?: string
        phone: string
    }
    handledByStaff?: { name: string }
    items: OrderItem[]
    transaction?: {
        id: string
        paymentMethod?: string
        status: string
        isManual: boolean
        paymentProofUrl?: string
    }
}

function useAdminOrders(params: { page: number; limit: number; search?: string; status?: string; paymentStatus?: string }) {
    return useQuery({
        queryKey: ["admin-orders", params],
        queryFn: async () => {
            const queryParams = new URLSearchParams()
            queryParams.set("page", params.page.toString())
            queryParams.set("limit", params.limit.toString())
            if (params.search) queryParams.set("search", params.search)
            if (params.status) queryParams.set("status", params.status)
            if (params.paymentStatus) queryParams.set("paymentStatus", params.paymentStatus)

            const response = await apiClient.get(`/admin/orders?${queryParams}`)
            return response.data.data
        },
    })
}

const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case "COMPLETED": return "bg-emerald-500/10 text-emerald-600 border-emerald-200"
        case "PROCESSING": return "bg-blue-500/10 text-blue-600 border-blue-200"
        case "CONFIRMED": return "bg-sky-500/10 text-sky-600 border-sky-200"
        case "READY": return "bg-amber-500/10 text-amber-600 border-amber-200"
        case "ON_GOING": return "bg-violet-500/10 text-violet-600 border-violet-200"
        case "AWAITING_PAYMENT": return "bg-orange-500/10 text-orange-600 border-orange-200"
        case "CANCELLED": return "bg-muted text-muted-foreground border-border"
        case "RESERVED": return "bg-indigo-500/10 text-indigo-600 border-indigo-200"
        default: return "bg-muted"
    }
}

const getPaymentColor = (status: PaymentStatus) => {
    switch (status) {
        case "SUCCESS": return "text-emerald-600"
        case "PENDING": return "text-amber-600"
        case "REFUNDED": return "text-blue-600"
        case "FAILED": return "text-destructive"
        case "PROOF_SUBMITTED": return "text-sky-600"
        case "AWAITING_VERIFICATION": return "text-orange-600"
        default: return "text-muted-foreground"
    }
}

export default function OrderManagement() {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState("ALL")
    const [paymentFilter, setPaymentFilter] = React.useState("ALL")
    const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [page, setPage] = React.useState(1)
    const [limit, setLimit] = React.useState(10)

    const { data, isLoading, refetch } = useAdminOrders({
        page,
        limit,
        search: searchQuery || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        paymentStatus: paymentFilter === "ALL" ? undefined : paymentFilter,
    })

    const orders: Order[] = data?.orders || []
    const pagination = data?.pagination

    const handleOrderClick = (order: Order) => {
        setSelectedOrder(order)
        setIsSheetOpen(true)
    }

    const columns = React.useMemo<ColumnDef<Order>[]>(() => [
        {
            accessorKey: "id",
            header: "Order ID",
            cell: ({ row }) => {
                const order = row.original
                return (
                    <span className="font-mono text-xs font-medium text-primary">
                        {order.id.split("-")[0]}
                    </span>
                )
            },
        },
        {
            accessorKey: "createdAt",
            header: "Tanggal",
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                    {formatDate(row.original.createdAt)}
                </span>
            ),
        },
        {
            accessorKey: "outlet.business.name",
            header: "Bisnis / Outlet",
            cell: ({ row }) => {
                const order = row.original
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{order.outlet.business.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Store className="h-3 w-3" /> {order.outlet.name}
                        </span>
                    </div>
                )
            },
        },
        {
            accessorKey: "guestCustomer.name",
            header: "Pelanggan",
            cell: ({ row }) => {
                const order = row.original
                return (
                    <div className="flex flex-col">
                        <span className="text-sm">{order.guestCustomer.name}</span>
                        <span className="text-xs text-muted-foreground">{order.guestCustomer.phone}</span>
                    </div>
                )
            },
        },
        {
            accessorKey: "orderStatus",
            header: "Status Order",
            cell: ({ row }) => (
                <Badge variant="outline" className={`text-[10px] h-5 border ${getStatusColor(row.original.orderStatus)}`}>
                    {row.original.orderStatus.replace(/_/g, " ")}
                </Badge>
            ),
        },
        {
            accessorKey: "paymentStatus",
            header: "Pembayaran",
            cell: ({ row }) => {
                const status = row.original.paymentStatus
                return (
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${getPaymentColor(status)}`}>
                        {status === "SUCCESS" && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {status === "PENDING" && <Clock className="h-3.5 w-3.5" />}
                        {status === "REFUNDED" && <CornerUpLeft className="h-3.5 w-3.5" />}
                        {status === "FAILED" && <XCircle className="h-3.5 w-3.5" />}
                        {status.replace(/_/g, " ")}
                    </div>
                )
            },
        },
        {
            accessorKey: "totalAmount",
            header: "Total",
            cell: ({ row }) => (
                <span className="text-right font-medium text-sm">
                    {formatCurrency(row.original.totalAmount)}
                </span>
            ),
        },
    ], [])

    return (
        <div className="flex flex-col space-y-3 p-3 h-full">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Order Management</h2>
                    <p className="text-muted-foreground text-sm">
                        Monitor transaksi, pembayaran, dan proses pesanan.
                    </p>
                </div>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => refetch()}>
                    <RefreshCcw className="h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* FILTERS */}
            <Card className="rounded-md border-border/50 bg-card">
                <CardContent className="p-3">
                    <div className="flex flex-col lg:flex-row gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Cari Order ID, Pelanggan, atau Bisnis..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 text-sm bg-muted/30 border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-ring/50"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px] h-9 bg-muted/30 border-border/50 text-xs">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Filter className="h-3.5 w-3.5" />
                                        <span className="truncate">{statusFilter === 'ALL' ? 'Semua Status' : statusFilter.replace(/_/g, ' ')}</span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Status</SelectItem>
                                    <SelectItem value="AWAITING_PAYMENT">Awaiting Payment</SelectItem>
                                    <SelectItem value="PROCESSING">Processing</SelectItem>
                                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                    <SelectItem value="READY">Ready</SelectItem>
                                    <SelectItem value="ON_GOING">On Going</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                <SelectTrigger className="w-[140px] h-9 bg-muted/30 border-border/50 text-xs">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CreditCard className="h-3.5 w-3.5" />
                                        <span className="truncate">{paymentFilter === 'ALL' ? 'Semua Bayar' : paymentFilter.replace(/_/g, ' ')}</span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Bayar</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="SUCCESS">Success</SelectItem>
                                    <SelectItem value="FAILED">Failed</SelectItem>
                                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* TABLE */}
            <DataTable
                columns={columns}
                data={orders}
                isLoading={isLoading}
                pagination={true}
                showColumnVisibility={false}
                showTableInfo={false}
                emptyMessage="Tidak ada order ditemukan."
                tableId="admin-orders-table"
                onRowClick={handleOrderClick}
                serverSideSearch={true}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Cari order..."
                onRefresh={refetch}
                serverSidePagination
                serverLimit={limit}
                totalItems={pagination?.total || 0}
                onPaginationChange={({ page: p, limit: l }) => { setPage(p); setLimit(l) }}
            />

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
                                            <span className="text-xs font-mono">{selectedOrder.id.split("-")[0]}</span>
                                        </div>
                                        <SheetTitle className="text-xl font-semibold">Order Detail</SheetTitle>
                                        <SheetDescription className="text-xs mt-1">
                                            {formatDate(selectedOrder.createdAt)}
                                        </SheetDescription>
                                    </div>
                                    <div className="text-right">
                                        <Badge className={`text-sm mb-1 ${getStatusColor(selectedOrder.orderStatus)}`}>
                                            {selectedOrder.orderStatus.replace(/_/g, " ")}
                                        </Badge>
                                        <div className="text-sm font-bold">{formatCurrency(selectedOrder.totalAmount)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-6 space-y-6">
                                <Tabs defaultValue="details" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 mb-4">
                                        <TabsTrigger value="details">Rincian</TabsTrigger>
                                        <TabsTrigger value="items">Item ({selectedOrder.items.length})</TabsTrigger>
                                        <TabsTrigger value="payment">Pembayaran</TabsTrigger>
                                    </TabsList>

                                    {/* TAB 1: DETAILS */}
                                    <TabsContent value="details" className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <Card className="shadow-sm border-border/50">
                                                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Informasi Pelanggan</CardTitle></CardHeader>
                                                <CardContent className="p-4 pt-0 space-y-1">
                                                    <div className="flex items-center gap-2"><User className="h-3 w-3 text-muted-foreground" /><span className="text-sm font-medium">{selectedOrder.guestCustomer.name}</span></div>
                                                    <div className="flex items-center gap-2 ml-5"><span className="text-xs text-muted-foreground">{selectedOrder.guestCustomer.phone}</span></div>
                                                    {selectedOrder.guestCustomer.email && (
                                                        <div className="flex items-center gap-2 ml-5"><span className="text-xs text-muted-foreground">{selectedOrder.guestCustomer.email}</span></div>
                                                    )}
                                                </CardContent>
                                            </Card>

                                            <Card className="shadow-sm border-border/50">
                                                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Informasi Bisnis</CardTitle></CardHeader>
                                                <CardContent className="p-4 pt-0 space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Bisnis</span>
                                                        <span className="font-medium">{selectedOrder.outlet.business.name}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Outlet</span>
                                                        <span className="font-medium">{selectedOrder.outlet.name}</span>
                                                    </div>
                                                    {selectedOrder.handledByStaff && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Staff</span>
                                                            <span className="font-medium">{selectedOrder.handledByStaff.name}</span>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>

                                            {selectedOrder.notes && (
                                                <Card className="shadow-sm border-border/50">
                                                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Catatan</CardTitle></CardHeader>
                                                    <CardContent className="p-4 pt-0">
                                                        <p className="text-sm italic text-muted-foreground">"{selectedOrder.notes}"</p>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* TAB 2: ITEMS */}
                                    <TabsContent value="items">
                                        <Card className="border border-border/50 shadow-none">
                                            <div className="divide-y">
                                                {selectedOrder.items.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between p-3">
                                                        <div>
                                                            <p className="text-sm font-medium">{item.product.name}</p>
                                                            <p className="text-xs text-muted-foreground">{item.product.type}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-muted-foreground">{item.quantity}x {formatCurrency(item.priceAtTimeOfOrder)}</p>
                                                            <p className="text-sm font-medium">{formatCurrency(item.quantity * item.priceAtTimeOfOrder)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex items-center justify-between p-3 bg-muted/30">
                                                    <span className="text-sm font-bold">Grand Total</span>
                                                    <span className="text-sm font-bold text-primary">{formatCurrency(selectedOrder.totalAmount)}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    </TabsContent>

                                    {/* TAB 3: PAYMENT */}
                                    <TabsContent value="payment" className="space-y-4">
                                        <Card className="shadow-sm border-border/50">
                                            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Status Pembayaran</CardTitle></CardHeader>
                                            <CardContent className="p-4 pt-0 space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Status</span>
                                                    <Badge variant="outline" className={`${getPaymentColor(selectedOrder.paymentStatus)}`}>
                                                        {selectedOrder.paymentStatus.replace(/_/g, " ")}
                                                    </Badge>
                                                </div>
                                                {selectedOrder.transaction && (
                                                    <>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Metode</span>
                                                            <span className="font-medium">{selectedOrder.transaction.paymentMethod || "-"}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Manual</span>
                                                            <span className="font-medium">{selectedOrder.transaction.isManual ? "Ya" : "Tidak"}</span>
                                                        </div>
                                                    </>
                                                )}
                                                {selectedOrder.transaction?.paymentProofUrl && (
                                                    <div className="pt-2">
                                                        <Button variant="outline" size="sm" className="gap-2 w-full" asChild>
                                                            <a href={selectedOrder.transaction.paymentProofUrl} target="_blank" rel="noreferrer">
                                                                <FileText className="h-4 w-4" /> Lihat Bukti Bayar
                                                            </a>
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card className="shadow-sm border-border/50">
                                            <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rincian Biaya</CardTitle></CardHeader>
                                            <CardContent className="p-4 pt-0 space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Subtotal</span>
                                                    <span>{formatCurrency(selectedOrder.totalAmount + selectedOrder.discountAmount)}</span>
                                                </div>
                                                {selectedOrder.discountAmount > 0 && (
                                                    <div className="flex justify-between text-sm text-emerald-600">
                                                        <span>Diskon</span>
                                                        <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                                                    </div>
                                                )}
                                                {selectedOrder.taxAmount > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Pajak</span>
                                                        <span>{formatCurrency(selectedOrder.taxAmount)}</span>
                                                    </div>
                                                )}
                                                <Separator />
                                                <div className="flex justify-between text-sm font-bold">
                                                    <span>Total</span>
                                                    <span className="text-primary">{formatCurrency(selectedOrder.totalAmount)}</span>
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
