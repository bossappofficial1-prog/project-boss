'use client'

import { useState, useMemo } from 'react'
import { ProductItem, useProductsData } from '@/hooks/useProductsData'
import { productApi } from '@/lib/api'
import { toast } from 'sonner'
import { resolveUploadImageUrl } from '@/lib/url'
import { formatCurrency } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { DataTable } from '@/components/ui/data-table'
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'

import ImportDataModal from '@/components/modals/ImportDataModal'
import AddOrEditProductServiceModal from '@/components/modals/AddProductServiceModal'
import ConfirmationModal from '@/components/ui/confirmation-modal'
import TicketDetailDialog from './TicketDetailDialog'

import {
    Package, Wrench, AlertCircle, Plus, Upload, Download,
    PenBox, Trash2, Boxes, TrendingUp, Clock, Ticket, Eye,
} from 'lucide-react'

function PageSkeleton() {
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
    const styles = {
        default: 'bg-primary/10 text-primary',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        danger: 'bg-destructive/10 text-destructive',
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    }

    return (
        <Card className="pt-0">
            <CardContent className="flex items-start gap-3 pt-6">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${styles[variant]}`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold tabular-nums">{value}</p>
                    {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
                </div>
            </CardContent>
        </Card>
    )
}

export default function ProductsContent() {
    const [showAddOrEditModal, setShowAddOrEditModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showTicketDetail, setShowTicketDetail] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [action, setAction] = useState<'add' | 'edit'>('add')
    const [isExporting, setIsExporting] = useState(false)
    const [activeTab, setActiveTab] = useState('all')

    const {
        products, outlets, selectedOutlet, currentPage, itemsPerPage,
        totalProducts, searchQuery, isLoading, error, hasBusinessProfile,
        hasOutlet, setCurrentPage, setItemsPerPage, setError,
        handleSearch, handleDeleteProduct, handleToggleStatus,
        handleExportProducts, handleRefreshData, formatDuration,
    } = useProductsData()

    const currentOutletName = outlets.find((o) => o.id === selectedOutlet)?.name

    const overview = useMemo(() => {
        const goods = products.filter((p) => p.type === 'GOODS')
        const services = products.filter((p) => p.type === 'SERVICE')
        const tickets = products.filter((p) => p.type === 'TICKET')
        const active = products.filter((p) => p.status === 'ACTIVE')
        const lowStock = goods.filter((p) => {
            if (!p.goods) return false
            if (p.goods.currentStock === 0) return true
            if (p.goods.minStock && p.goods.currentStock <= p.goods.minStock) return true
            return false
        })
        return { goods: goods.length, services: services.length, tickets: tickets.length, active: active.length, lowStock: lowStock.length }
    }, [products])

    const handleDelete = async (productId: string) => {
        try {
            setActionLoading(true)
            await handleDeleteProduct(productId)
            setShowDeleteModal(false)
            toast.success('Berhasil menghapus produk')
        } catch (err) {
            toast.error((err as any).message || 'Gagal menghapus produk')
        } finally {
            setActionLoading(false)
        }
    }

    const handleExport = async () => {
        setIsExporting(true)
        try {
            await handleExportProducts()
            toast.success('Berhasil mengexport data produk')
        } catch {
            toast.error('Gagal mengexport data produk')
        } finally {
            setIsExporting(false)
        }
    }

    if (isLoading && products.length === 0) return <PageSkeleton />

    if (!isLoading && !hasBusinessProfile && !hasOutlet) {
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

    const pageSizeOptions = (() => {
        const base = [5, 10, 20, 50, 100]
        const norm = Number.isFinite(itemsPerPage) && itemsPerPage > 0 ? itemsPerPage : 10
        if (!base.includes(norm)) base.push(norm)
        return base.sort((a, b) => a - b)
    })()

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Kelola Produk & Jasa</h1>
                        {currentOutletName && (
                            <p className="text-sm text-muted-foreground">
                                Outlet: <span className="font-medium text-foreground">{currentOutletName}</span>
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => { setAction('add'); setShowAddOrEditModal(true) }} disabled={!hasOutlet}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowImportModal(true)} disabled={!hasOutlet}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleExport} disabled={isExporting || products.length === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            {isExporting ? 'Mengexport...' : 'Export'}
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/5 p-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-destructive">Error</p>
                            <p className="text-sm text-destructive/90">{error}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-6 w-6 p-0">
                            ✕
                        </Button>
                    </div>
                )}

                {/* Overview Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <OverviewCard
                        icon={<Boxes className="h-5 w-5" />}
                        label="Total Produk"
                        value={totalProducts}
                        description={`${overview.active} aktif`}
                    />
                    <OverviewCard
                        icon={<Package className="h-5 w-5" />}
                        label="Barang"
                        value={overview.goods}
                        variant="default"
                    />
                    <OverviewCard
                        icon={<Wrench className="h-5 w-5" />}
                        label="Jasa"
                        value={overview.services}
                        variant="success"
                    />
                    <OverviewCard
                        icon={<Ticket className="h-5 w-5" />}
                        label="Tiket"
                        value={overview.tickets}
                        variant="default"
                    />
                    <OverviewCard
                        icon={<AlertCircle className="h-5 w-5" />}
                        label="Stok Rendah"
                        value={overview.lowStock}
                        variant={overview.lowStock > 0 ? 'danger' : 'default'}
                        description={overview.lowStock > 0 ? 'Perlu restock' : 'Semua aman'}
                    />
                </div>

                {/* Data Table */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="all">Semua</TabsTrigger>
                        <TabsTrigger value="goods">Barang</TabsTrigger>
                        <TabsTrigger value="service">Jasa</TabsTrigger>
                        <TabsTrigger value="ticket">Tiket</TabsTrigger>
                    </TabsList>

                    {['all', 'goods', 'service', 'ticket'].map((tab) => (
                        <TabsContent key={tab} value={tab} className="mt-3">
                            <DataTable
                                data={
                                    tab === 'all' ? products
                                        : tab === 'goods' ? products.filter((p) => p.type === 'GOODS')
                                            : tab === 'service' ? products.filter((p) => p.type === 'SERVICE')
                                                : products.filter((p) => p.type === 'TICKET')
                                }
                                onRefresh={handleRefreshData}
                                isRefreshing={isLoading}
                                showColumnVisibility
                                serverSidePagination
                                totalItems={tab === 'all' ? totalProducts : undefined}
                                serverPage={tab === 'all' ? currentPage : undefined}
                                serverLimit={tab === 'all' ? itemsPerPage : undefined}
                                onPaginationChange={tab === 'all' ? ({ page, limit }) => {
                                    setItemsPerPage(limit)
                                    setCurrentPage(page)
                                } : undefined}
                                pageSizeOptions={pageSizeOptions}
                                serverSideSearch={tab === 'all'}
                                onSearchChange={tab === 'all' ? handleSearch : undefined}
                                searchValue={tab === 'all' ? searchQuery : undefined}
                                searchPlaceholder="Cari produk..."
                                searchDebounceMs={300}
                                columns={[
                                    {
                                        accessorKey: 'name',
                                        header: 'Produk',
                                        cell(props) {
                                            const p = props.row.original as ProductItem
                                            return (
                                                <div className="flex items-center gap-3 w-[180px]">
                                                    <img
                                                        src={resolveUploadImageUrl(p.image)}
                                                        alt={p.name}
                                                        className="w-10 h-10 rounded-md object-cover"
                                                        onError={(e) => {
                                                            (e.currentTarget as HTMLImageElement).src = '/defaults/default-product-image.png'
                                                        }}
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{p.name}</p>
                                                        <Badge variant="outline" className={`text-[10px] mt-0.5 ${p.type === 'GOODS' ? 'border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400' : p.type === 'SERVICE' ? 'border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400' : 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400'}`}>
                                                            {p.type === 'GOODS' ? 'Barang' : p.type === 'SERVICE' ? 'Jasa' : 'Tiket'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            )
                                        },
                                    },
                                    {
                                        accessorKey: 'price',
                                        header: 'Harga',
                                        cell(props) {
                                            const p = props.row.original as ProductItem
                                            const price = p.type === 'GOODS' ? p.goods?.sellingPrice : p.type === 'TICKET' ? p.ticket?.sellingPrice : p.service?.sellingPrice
                                            return (
                                                <div>
                                                    <p className="font-medium tabular-nums">{formatCurrency(price ?? 0)}</p>
                                                    {p.type === 'GOODS' && (
                                                        <p className="text-xs text-muted-foreground">
                                                            HPP: {formatCurrency(p.goods?.averageHpp ?? 0)}
                                                        </p>
                                                    )}
                                                    {p.type === 'SERVICE' && p.service && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Komisi: {p.service.commissionType === 'PERCENTAGE'
                                                                ? `${p.service.commissionValue}%`
                                                                : formatCurrency(p.service.commissionValue)}
                                                        </p>
                                                    )}
                                                    {p.type === 'TICKET' && p.ticket && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Kuota: {p.ticket.totalQuota - p.ticket.soldCount} tersisa
                                                        </p>
                                                    )}
                                                </div>
                                            )
                                        },
                                    },
                                    {
                                        accessorKey: 'detail',
                                        header: 'Detail',
                                        enableSorting: false,
                                        cell(props) {
                                            const p = props.row.original as ProductItem
                                            if (p.type === 'GOODS') {
                                                const isLow = p.goods && (p.goods.currentStock === 0 || (p.goods.minStock != null && p.goods.currentStock <= p.goods.minStock))
                                                return (
                                                    <div className="space-y-0.5">
                                                        <p className={`text-sm tabular-nums ${isLow ? 'text-destructive font-semibold' : ''}`}>
                                                            Stok: {p.goods?.currentStock ?? 0} {p.goods?.unit}
                                                        </p>
                                                        {p.goods?.minStock != null && (
                                                            <p className="text-xs text-muted-foreground">Min: {p.goods.minStock}</p>
                                                        )}
                                                    </div>
                                                )
                                            }
                                            if (p.type === 'TICKET' && p.ticket) {
                                                const available = p.ticket.totalQuota - p.ticket.soldCount
                                                const isSoldOut = available <= 0
                                                return (
                                                    <div className="space-y-0.5">
                                                        <p className={`text-sm tabular-nums ${isSoldOut ? 'text-destructive font-semibold' : ''}`}>
                                                            {isSoldOut ? 'Habis' : `${available}/${p.ticket.totalQuota} tiket`}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(p.ticket.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                )
                                            }
                                            return (
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatDuration(p.service?.durationMinutes)}
                                                </div>
                                            )
                                        },
                                    },
                                    {
                                        accessorKey: 'status',
                                        header: 'Status',
                                        enableSorting: false,
                                        cell(props) {
                                            const p = props.row.original as ProductItem
                                            return (
                                                <Switch
                                                    checked={p.status === 'ACTIVE'}
                                                    onCheckedChange={() => handleToggleStatus(p as any)}
                                                />
                                            )
                                        },
                                    },
                                ]}
                                rowActions={(row: ProductItem) => [
                                    ...(row.type === 'TICKET' ? [{
                                        label: 'Detail',
                                        icon: Eye,
                                        variant: 'ghost' as const,
                                        className: 'text-amber-700 hover:text-amber-800 hover:bg-amber-100',
                                        onClick(r: ProductItem) {
                                            setSelectedProduct(r)
                                            setShowTicketDetail(true)
                                        },
                                    }] : []),
                                    {
                                        label: 'Edit',
                                        icon: PenBox,
                                        variant: 'ghost' as const,
                                        className: 'text-blue-700 hover:text-blue-800 hover:bg-blue-100',
                                        onClick(r: ProductItem) {
                                            setSelectedProduct(r)
                                            setAction('edit')
                                            setShowAddOrEditModal(true)
                                        },
                                    },
                                    {
                                        label: 'Hapus',
                                        icon: Trash2,
                                        variant: 'ghost' as const,
                                        className: 'text-red-500 hover:text-red-600 hover:bg-red-100',
                                        onClick(r: ProductItem) {
                                            setSelectedProduct(r)
                                            setShowDeleteModal(true)
                                        },
                                    },
                                ]}
                                actionViewType="flex"
                                enableColumnResizing
                            />
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            {/* Modals */}
            <AddOrEditProductServiceModal
                action={action}
                open={showAddOrEditModal}
                onOpenChange={setShowAddOrEditModal}
                outletId={selectedOutlet || null}
                data={selectedProduct}
                initialData={{ ...selectedProduct }}
                onSuccess={() => {
                    handleRefreshData()
                    if (action === 'edit') setSelectedProduct(null)
                }}
            />

            <ImportDataModal
                open={showImportModal}
                onOpenChange={setShowImportModal}
                outletId={selectedOutlet || null}
                onImported={handleRefreshData}
            />

            {showDeleteModal && selectedProduct && (
                <ConfirmationModal
                    open={showDeleteModal}
                    onOpenChange={setShowDeleteModal}
                    description={`Yakin ingin menghapus produk '${selectedProduct.name}'? Tindakan ini tidak dapat dibatalkan.`}
                    title="Konfirmasi Hapus"
                    onConfirm={() => handleDelete(selectedProduct.id)}
                    confirmVariant="destructive"
                    loading={actionLoading}
                />
            )}

            <TicketDetailDialog
                product={selectedProduct}
                open={showTicketDetail}
                onOpenChange={setShowTicketDetail}
            />
        </>
    )
}
