'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStockHistory } from '@/hooks/useStockHistory'
import { useStockData } from '@/hooks/useStockData'
import { useStockOverview } from '@/hooks/use-stock-overview'
import { useOutletContext } from '@/components/providers/OutletProvider'
import ProductSummaryCard from '@/components/owner/stock/ProductSummaryCard'
import HistoryTable from '@/components/owner/stock/HistoryTable'
import { stockApi } from '@/lib/apis/stock'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
    Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Package, History, AlertCircle, Search, ArrowDownCircle,
    ArrowUpCircle, Settings, RotateCcw, TrendingUp, Boxes,
    AlertTriangle, XCircle, DollarSign, Download,
} from 'lucide-react'

function formatCurrency(amount: number | null | undefined) {
    if (amount === null || amount === undefined) return '-'
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount)
}

function StockPageSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-52" />
                    <Skeleton className="h-4 w-72" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-md" />
                ))}
            </div>
            <Skeleton className="h-12 rounded-md" />
            <Skeleton className="h-64 rounded-md" />
        </div>
    )
}

interface OverviewCardProps {
    icon: React.ReactNode
    label: string
    value: string | number
    description?: string
    variant?: 'default' | 'warning' | 'danger' | 'success'
}

function OverviewCard({ icon, label, value, description, variant = 'default' }: OverviewCardProps) {
    const variantStyles = {
        default: 'bg-primary/10 text-primary',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        danger: 'bg-destructive/10 text-destructive',
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    }

    return (
        <Card className='pt-0'>
            <CardContent className="flex items-start gap-3 pt-6">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${variantStyles[variant]}`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold tabular-nums">{value}</p>
                    {description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default function StockContent() {
    const { selectedOutletId, outlets, isLoading: outletLoading } = useOutletContext()

    const [selectedProductGoodsId, setSelectedProductGoodsId] = useState<string>('')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('overview')
    const [isExporting, setIsExporting] = useState(false)

    const {
        stockItems,
        isLoading: isLoadingProducts,
        error: productsError,
        hasBusinessProfile,
        hasOutlet,
        setError: setProductsError,
    } = useStockData()

    const {
        productInfo,
        historyLogs,
        isLoading: isLoadingHistory,
        error: historyError,
        fetchHistory,
        formatCurrency: formatCurrencyHistory,
        formatDate,
        setError: setHistoryError,
    } = useStockHistory()

    const { data: overview, isLoading: isLoadingOverview } = useStockOverview(selectedOutletId)

    useEffect(() => {
        if (selectedProductGoodsId) {
            fetchHistory(selectedProductGoodsId)
        }
    }, [selectedProductGoodsId, fetchHistory])

    const handleProductChange = useCallback((productGoodsId: string) => {
        setSelectedProductGoodsId(productGoodsId)
        setActiveTab('history')
    }, [])

    const currentOutletName = outlets.find((o) => o.id === selectedOutletId)?.name

    const handleExport = useCallback(async () => {
        if (!selectedOutletId) return
        setIsExporting(true)
        try {
            const blob = await stockApi.exportExcel(selectedOutletId)
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `Laporan_Stok_${currentOutletName || 'outlet'}_${new Date().toISOString().split('T')[0]}.xlsx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            toast.success('Berhasil mengexport data stok')
        } catch {
            toast.error('Gagal mengexport data stok')
        } finally {
            setIsExporting(false)
        }
    }, [selectedOutletId, currentOutletName])

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return stockItems
        const q = searchQuery.toLowerCase()
        return stockItems.filter((item) => item.name.toLowerCase().includes(q))
    }, [stockItems, searchQuery])

    const lowStockItems = useMemo(() =>
        stockItems.filter((item) => {
            if (!item.goods) return false
            if (item.goods.currentStock === 0) return true
            if (item.goods.minStock && item.goods.currentStock <= item.goods.minStock) return true
            return false
        }),
        [stockItems],
    )

    if (isLoadingProducts || outletLoading) return <StockPageSkeleton />

    if (!hasBusinessProfile && !hasOutlet) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Card className="max-w-lg">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>Setup Diperlukan</CardTitle>
                                <CardDescription>
                                    Lengkapi profil bisnis dan tambahkan outlet terlebih dahulu
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                            <li>Lengkapi profil bisnis beserta informasi rekening</li>
                            <li>Tambah minimal satu outlet</li>
                        </ul>
                        <Button onClick={() => (window.location.href = '/owner/dashboard')}>
                            Ke Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const errorMessage = productsError || historyError

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Manajemen Stok</h1>
                    {currentOutletName && (
                        <p className="text-sm text-muted-foreground">
                            Outlet: <span className="font-medium text-foreground">{currentOutletName}</span>
                        </p>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={isExporting || stockItems.length === 0}
                >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? 'Mengexport...' : 'Export Excel'}
                </Button>
            </div>

            <Separator />

            {/* Error Banner */}
            {errorMessage && (
                <div className="flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/5 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">Error</p>
                        <p className="text-sm text-destructive/90">{errorMessage}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => { setProductsError(null); setHistoryError(null) }}
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Overview KPI Cards */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                {isLoadingOverview ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-md" />
                    ))
                ) : (
                    <>
                        <OverviewCard
                            icon={<Boxes className="h-5 w-5" />}
                            label="Total Produk"
                            value={overview?.totalProducts ?? stockItems.length}
                            description="Produk aktif (barang)"
                        />
                        <OverviewCard
                            icon={<DollarSign className="h-5 w-5" />}
                            label="Nilai Stok"
                            value={formatCurrency(overview?.totalStockValue ?? 0)}
                            description="Berdasarkan HPP rata-rata"
                            variant="success"
                        />
                        <OverviewCard
                            icon={<AlertTriangle className="h-5 w-5" />}
                            label="Stok Rendah"
                            value={overview?.lowStockCount ?? lowStockItems.length}
                            description="Perlu segera restock"
                            variant="warning"
                        />
                        <OverviewCard
                            icon={<XCircle className="h-5 w-5" />}
                            label="Habis"
                            value={overview?.outOfStockCount ?? 0}
                            description="Produk habis stok"
                            variant="danger"
                        />
                    </>
                )}
            </div>

            {/* Movement Summary Badges */}
            {overview?.recentMovements && Object.keys(overview.recentMovements).length > 0 && (
                <Card className='pt-0'>
                    <CardContent className="flex flex-wrap items-center gap-3 pt-6">
                        <span className="text-sm font-medium text-muted-foreground">Pergerakan 30 hari:</span>
                        {overview.recentMovements.IN && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="outline" className="gap-1.5">
                                        <ArrowDownCircle className="h-3 w-3 text-emerald-500" />
                                        Masuk: {overview.recentMovements.IN.count}x
                                        ({overview.recentMovements.IN.totalQty} unit)
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>Total barang masuk dalam 30 hari terakhir</TooltipContent>
                            </Tooltip>
                        )}
                        {overview.recentMovements.OUT && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="outline" className="gap-1.5">
                                        <ArrowUpCircle className="h-3 w-3 text-red-500" />
                                        Keluar: {overview.recentMovements.OUT.count}x
                                        ({overview.recentMovements.OUT.totalQty} unit)
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>Total barang keluar dalam 30 hari terakhir</TooltipContent>
                            </Tooltip>
                        )}
                        {overview.recentMovements.ADJUSTMENT && (
                            <Badge variant="outline" className="gap-1.5">
                                <Settings className="h-3 w-3 text-blue-500" />
                                Penyesuaian: {overview.recentMovements.ADJUSTMENT.count}x
                            </Badge>
                        )}
                        {overview.recentMovements.RETURN && (
                            <Badge variant="outline" className="gap-1.5">
                                <RotateCcw className="h-3 w-3 text-amber-500" />
                                Retur: {overview.recentMovements.RETURN.count}x
                            </Badge>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">
                        <Package className="mr-1.5 h-4 w-4" />
                        Daftar Produk
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <History className="mr-1.5 h-4 w-4" />
                        Riwayat Stok
                    </TabsTrigger>
                    {lowStockItems.length > 0 && (
                        <TabsTrigger value="alerts">
                            <AlertTriangle className="mr-1.5 h-4 w-4" />
                            Peringatan
                            <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">
                                {lowStockItems.length}
                            </Badge>
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* Products List Tab */}
                <TabsContent value="overview" className="space-y-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle className="text-base">Produk Barang</CardTitle>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari produk..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredItems.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {searchQuery ? 'Tidak ada produk ditemukan' : 'Belum ada produk barang'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredItems.map((item) => {
                                        const goods = item.goods
                                        const isLow = goods && goods.minStock && goods.currentStock <= goods.minStock
                                        const isEmpty = goods && goods.currentStock === 0

                                        return (
                                            <div
                                                key={item.id}
                                                className="group flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                                                        {item.image ? (
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="h-10 w-10 rounded-md object-cover"
                                                            />
                                                        ) : (
                                                            <Package className="h-5 w-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{item.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            {goods && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    HPP: {formatCurrency(goods.averageHpp)} · Jual: {formatCurrency(goods.sellingPrice)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1.5">
                                                            {isEmpty ? (
                                                                <Badge variant="destructive" className="text-xs">Habis</Badge>
                                                            ) : isLow ? (
                                                                <Badge variant="warning" className="text-xs">Rendah</Badge>
                                                            ) : (
                                                                <Badge variant="success" className="text-xs">Tersedia</Badge>
                                                            )}
                                                        </div>
                                                        {goods && (
                                                            <p className="mt-0.5 text-sm font-semibold tabular-nums">
                                                                {goods.currentStock} {goods.unit}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {goods && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleProductChange(goods.id)}
                                                            className="opacity-0 transition-opacity group-hover:opacity-100"
                                                        >
                                                            <History className="mr-1 h-3.5 w-3.5" />
                                                            Riwayat
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="space-y-3">
                    {/* Product Selector */}
                    <Card className='pt-0'>
                        <CardContent className="pt-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Package className="h-4 w-4" />
                                    Pilih Produk:
                                </div>
                                <Select value={selectedProductGoodsId} onValueChange={handleProductChange}>
                                    <SelectTrigger className="w-full sm:w-80">
                                        <SelectValue placeholder="Pilih produk untuk melihat riwayat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stockItems
                                            .filter((item) => item.goods?.id)
                                            .map((item) => (
                                                <SelectItem key={item.goods!.id} value={item.goods!.id}>
                                                    <span className="flex items-center gap-2">
                                                        {item.name}
                                                        <span className="text-muted-foreground">
                                                            ({item.goods!.currentStock} {item.goods!.unit || 'pcs'})
                                                        </span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {!selectedProductGoodsId ? (
                        <Card>
                            <CardContent className="py-16">
                                <div className="text-center">
                                    <History className="mx-auto mb-3 h-14 w-14 text-muted-foreground/20" />
                                    <h3 className="text-base font-semibold">Pilih Produk</h3>
                                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                                        Pilih produk dari dropdown di atas atau klik tombol &quot;Riwayat&quot; pada
                                        daftar produk untuk melihat pergerakan stok.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {productInfo && (
                                <ProductSummaryCard
                                    productInfo={productInfo}
                                    formatCurrency={formatCurrencyHistory}
                                />
                            )}
                            <HistoryTable
                                logs={historyLogs}
                                isLoading={isLoadingHistory}
                                formatCurrency={formatCurrencyHistory}
                                formatDate={formatDate}
                                unit={productInfo?.unit}
                            />
                        </div>
                    )}
                </TabsContent>

                {/* Alerts Tab */}
                {lowStockItems.length > 0 && (
                    <TabsContent value="alerts" className="space-y-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    Produk Perlu Perhatian
                                </CardTitle>
                                <CardDescription>
                                    Produk dengan stok rendah atau habis yang perlu segera diisi ulang
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {lowStockItems.map((item) => {
                                        const goods = item.goods!
                                        const isEmpty = goods.currentStock === 0

                                        return (
                                            <div
                                                key={item.id}
                                                className="group flex items-center justify-between rounded-md border p-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${isEmpty
                                                        ? 'bg-destructive/10 text-destructive'
                                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                        }`}>
                                                        {isEmpty ? (
                                                            <XCircle className="h-5 w-5" />
                                                        ) : (
                                                            <AlertTriangle className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {isEmpty ? 'Stok habis' : `Stok tersisa ${goods.currentStock} ${goods.unit}`}
                                                            {goods.minStock !== undefined && goods.minStock !== null && (
                                                                <> · Min: {goods.minStock} {goods.unit}</>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={isEmpty ? 'destructive' : 'warning'} className="text-xs">
                                                        {isEmpty ? 'Habis' : 'Rendah'}
                                                    </Badge>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleProductChange(goods.id)}
                                                    >
                                                        <History className="mr-1 h-3.5 w-3.5" />
                                                        Riwayat
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}
