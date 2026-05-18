"use client"

import React from "react"
import {
    Building2,
    Search,
    Filter,
    Wallet,
    CreditCard,
    MapPin,
    Users,
    CheckCircle2,
    AlertTriangle,
    Ban,
    ExternalLink,
    Store,
    Trash2
} from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { DataTable } from "@/components/ui/data-table"
import { useGetAdminBusinesses, useUpdateBusinessSuspend, useDeleteBusiness } from "@/hooks/api/use-admin-control"
import { toast } from "sonner"
import ConfirmationModal from "@/components/ui/confirmation-modal"

export default function BusinessManagement() {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState("ALL")
    const [selectedBusiness, setSelectedBusiness] = React.useState<any | null>(null)
    const [isSheetOpen, setIsSheetOpen] = React.useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = React.useState(searchQuery)
    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const { data, isLoading } = useGetAdminBusinesses({
        page: 1,
        limit: 100,
        search: debouncedSearch,
        status: statusFilter === "ALL" ? undefined : statusFilter
    });

    const toggleSuspend = useUpdateBusinessSuspend();
    const deleteBusiness = useDeleteBusiness();

    const businesses = data?.businesses || [];

    const handleRowClick = (biz: any) => {
        setSelectedBusiness(biz)
        setIsSheetOpen(true)
    }

    const handleToggleSuspend = async () => {
        if (!selectedBusiness) return;
        const isCurrentlySuspended = selectedBusiness.subscriptionStatus === 'SUSPENDED';
        try {
            await toggleSuspend.mutateAsync({
                businessId: selectedBusiness.id,
                isSuspended: !isCurrentlySuspended
            });
            toast.success(`Bisnis berhasil di${isCurrentlySuspended ? 'aktifkan' : 'suspend'}`);
            // Update local state for immediate feedback
            setSelectedBusiness({
                ...selectedBusiness,
                subscriptionStatus: !isCurrentlySuspended ? 'SUSPENDED' : 'ACTIVE'
            });
        } catch (error) {
            toast.error("Gagal mengubah status bisnis");
        }
    }

    const handleDeleteBusiness = async () => {
        if (!selectedBusiness) return;
        try {
            await deleteBusiness.mutateAsync(selectedBusiness.id);
            toast.success("Bisnis berhasil dihapus");
            setIsSheetOpen(false);
            setIsDeleteOpen(false);
        } catch (error) {
            toast.error("Gagal menghapus bisnis");
        }
    }

    const columns = React.useMemo<ColumnDef<any>[]>(() => [
        {
            accessorKey: "name",
            header: "Nama Bisnis",
            cell: ({ row }) => {
                const biz = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 rounded-md border border-border/50">
                            <AvatarFallback className="rounded-md"><Building2 className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium text-sm">{biz.name}</span>
                            <span className="text-xs text-muted-foreground">{new Date(biz.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "owner",
            header: "Pemilik",
            cell: ({ row }) => {
                const biz = row.original;
                return (
                    <div className="text-sm">
                        <div>{biz.owner?.name || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{biz.owner?.email}</div>
                    </div>
                );
            }
        },
        {
            accessorKey: "subscriptionStatus",
            header: "Status Akun",
            cell: ({ row }) => {
                const biz = row.original;
                return (
                    <Badge variant="outline" className={
                        biz.subscriptionStatus === 'ACTIVE'
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                    }>
                        {biz.subscriptionStatus}
                    </Badge>
                );
            }
        },
        {
            accessorKey: "_count.outlets",
            header: "Total Outlet",
            cell: ({ row }) => {
                const biz = row.original;
                return <span className="font-medium text-sm">{biz._count?.outlets || 0}</span>;
            }
        },
        {
            accessorKey: "owner.isVerified",
            header: "Verifikasi KYC",
            cell: ({ row }) => {
                const biz = row.original;
                return (
                    <div className="flex items-center gap-2">
                        {biz.owner?.isVerified ? (
                            <><CheckCircle2 className="h-4 w-4 text-emerald-500" /><span className="text-xs text-muted-foreground">Verified</span></>
                        ) : (
                            <><AlertTriangle className="h-4 w-4 text-amber-500" /><span className="text-xs text-muted-foreground">Pending</span></>
                        )}
                    </div>
                );
            }
        }
    ], []);

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
                    <ExternalLink className="mr-2 h-4 w-4" /> Review Verifikasi
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
                                        {statusFilter === 'ALL' ? 'Semua Status' : statusFilter}
                                    </span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                <SelectItem value="EXPIRED">Expired</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* --- TABLE LIST --- */}
            <Card className="rounded-md shadow-md border-border/50 flex-1 overflow-hidden p-3 bg-card">
                <DataTable
                    columns={columns}
                    data={businesses}
                    isLoading={isLoading}
                    pagination={true}
                    showColumnVisibility={false}
                    showTableInfo={false}
                    emptyMessage="Tidak ada bisnis ditemukan."
                    tableId="admin-businesses-table"
                    onRowClick={handleRowClick}
                />
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
                                                <AvatarFallback className="rounded-lg text-xl bg-muted"><Store /></AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <SheetTitle className="text-xl font-bold">{selectedBusiness.name}</SheetTitle>
                                                <SheetDescription className="flex items-center gap-2 mt-1">
                                                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{selectedBusiness.id.split('-')[0]}</span>
                                                    <span>•</span>
                                                    <span className="text-xs">{selectedBusiness.owner?.email}</span>
                                                </SheetDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedBusiness.subscriptionStatus !== 'SUSPENDED' ? (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                                    onClick={handleToggleSuspend}
                                                    disabled={toggleSuspend.isPending}
                                                >
                                                    <Ban className="h-4 w-4 mr-2" /> Suspend
                                                </Button>
                                            ) : (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                                                    onClick={handleToggleSuspend}
                                                    disabled={toggleSuspend.isPending}
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Unsuspend
                                                </Button>
                                            )}
                                            <Button 
                                                variant="destructive" 
                                                size="sm" 
                                                onClick={() => setIsDeleteOpen(true)}
                                                disabled={deleteBusiness.isPending}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Hapus
                                            </Button>
                                        </div>
                                    </div>
                                </SheetHeader>
                            </div>

                            {/* Content Tabs */}
                            <div className="p-6">
                                <Tabs defaultValue="overview" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-6">
                                        <TabsTrigger value="overview">Profil & Info</TabsTrigger>
                                        <TabsTrigger value="outlets">Daftar Outlet</TabsTrigger>
                                    </TabsList>

                                    {/* TAB 1: OVERVIEW */}
                                    <TabsContent value="overview" className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Card className="shadow-sm border-border/50">
                                                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Outlet</CardTitle></CardHeader>
                                                <CardContent><div className="text-2xl font-bold">{selectedBusiness._count?.outlets || 0}</div></CardContent>
                                            </Card>
                                            <Card className="shadow-sm border-border/50">
                                                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Transaksi (Sukses)</CardTitle></CardHeader>
                                                <CardContent><div className="text-2xl font-bold">{selectedBusiness._count?.orders || 0}</div></CardContent>
                                            </Card>
                                        </div>

                                        <Card className="shadow-sm border-border/50">
                                            <CardHeader>
                                                <CardTitle className="text-base">Informasi Kontak</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3 text-sm">
                                                <div className="flex justify-between py-2 border-b border-border/30">
                                                    <span className="text-muted-foreground">Pemilik</span>
                                                    <span className="font-medium">{selectedBusiness.owner?.name}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-border/30">
                                                    <span className="text-muted-foreground">Telepon</span>
                                                    <span className="font-medium">{selectedBusiness.owner?.phone || '-'}</span>
                                                </div>
                                                <div className="flex justify-between py-2 border-b border-border/30">
                                                    <span className="text-muted-foreground">Status KYC</span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="uppercase text-[10px]">
                                                            {selectedBusiness.owner?.isVerified ? 'VERIFIED' : 'PENDING'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="shadow-sm border-border/50">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-base">Informasi Rekening Bank</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3 text-sm">
                                                {selectedBusiness.bankName ? (
                                                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                                                        <div className="h-10 w-10 rounded bg-white flex items-center justify-center shadow-sm">
                                                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{selectedBusiness.bankName}</p>
                                                            <p className="font-mono text-muted-foreground">{selectedBusiness.bankAccount}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">A.N {selectedBusiness.accountHolder}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground italic">Belum ada informasi rekening bank.</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* TAB 2: OUTLETS */}
                                    <TabsContent value="outlets">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-medium">Daftar Outlet ({selectedBusiness.outlets?.length || 0})</h4>
                                            </div>
                                            {selectedBusiness.outlets?.map((item: any) => (
                                                <div key={item.id} className="flex items-start gap-3 p-3 border border-border/50 rounded-lg">
                                                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground max-w-sm truncate">{item.address || 'Tidak ada alamat'}</p>
                                                        <p className="text-xs text-primary mt-1 font-medium">{item._count?.orders || 0} Orders</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!selectedBusiness.outlets || selectedBusiness.outlets.length === 0) && (
                                                <p className="text-xs text-muted-foreground italic">Belum ada outlet.</p>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            <ConfirmationModal
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                title="Hapus Bisnis"
                description={`Apakah Anda yakin ingin menghapus bisnis "${selectedBusiness?.name}"? Tindakan ini permanen dan akan menghapus seluruh data terkait bisnis ini termasuk seluruh outlet, produk, dan transaksi.`}
                confirmText="Hapus"
                align="left"
                onConfirm={handleDeleteBusiness}
                loading={deleteBusiness.isPending}
                confirmLoadingLabel="Menghapus..."
            />
        </div>
    )
}