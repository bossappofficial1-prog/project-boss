"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import {
    Store,
    MapPin,
    Search,
    Filter,
    Navigation,
    Clock,
    Phone,
    X,
    Building2,
    Users,
    ShoppingBag,
    ArrowLeft,
    Power
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select"
import {
    Map as MapComponent,
    MapMarker,
    MarkerContent,
    MarkerPopup,
    MapControls,
    useMap
} from "@/components/ui/map"
import {
    useGetAdminOutlets,
    useGetAdminBusinesses,
    useUpdateOutletForceClose
} from "@/hooks/api/use-admin-control"
import { gooeyToast } from "goey-toast"

type Position = { lat: number; lng: number }

// Helper component to recenter and fly to coordinates using the Map context
function MapFlyController({ targetPosition }: { targetPosition: Position | null }) {
    const { map, isLoaded } = useMap()

    useEffect(() => {
        if (!map || !isLoaded || !targetPosition) return
        map.flyTo({
            center: [targetPosition.lng, targetPosition.lat],
            zoom: 15,
            duration: 1500,
            essential: true
        })
    }, [map, isLoaded, targetPosition])

    return null
}

export default function SebaranOutletMap() {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [businessFilter, setBusinessFilter] = useState("ALL")
    const [selectedOutlet, setSelectedOutlet] = useState<any | null>(null)
    const [focusPosition, setFocusPosition] = useState<Position | null>(null)

    // Debounce search input
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Load outlets (limit 1000 to fetch all for full map display)
    const { data: outletsData, isLoading: isLoadingOutlets, refetch: refetchOutlets } = useGetAdminOutlets({
        page: 1,
        limit: 1000,
        search: debouncedSearch,
        status: statusFilter === "ALL" ? undefined : statusFilter
    })

    // Load businesses for dropdown filter
    const { data: businessesData } = useGetAdminBusinesses({
        page: 1,
        limit: 100
    })

    const forceCloseMutation = useUpdateOutletForceClose()

    const outlets = outletsData?.outlets || []
    const businesses = businessesData?.businesses || []

    // Filter outlets locally if businessFilter is active
    const filteredOutlets = useMemo(() => {
        return outlets.filter((outlet: any) => {
            if (businessFilter !== "ALL" && outlet.business?.id !== businessFilter) {
                return false
            }
            return true
        })
    }, [outlets, businessFilter])

    // Calculate map stats
    const stats = useMemo(() => {
        const total = filteredOutlets.length
        const open = filteredOutlets.filter((o: any) => o.isOpen).length
        const closed = total - open
        return { total, open, closed }
    }, [filteredOutlets])

    // Smoothly fly to an outlet coordinates and open details card
    const handleFocusOutlet = (outlet: any) => {
        if (!outlet.latitude || !outlet.longitude) {
            gooeyToast.warning(`Outlet "${outlet.name}" tidak memiliki koordinat lokasi yang valid.`)
            return
        }
        setSelectedOutlet(outlet)
        setFocusPosition({ lat: outlet.latitude, lng: outlet.longitude })
    }

    const handleForceCloseToggle = async (outlet: any) => {
        try {
            await forceCloseMutation.mutateAsync({
                outletId: outlet.id,
                isClosed: outlet.isOpen
            })
            gooeyToast.success(`Outlet "${outlet.name}" berhasil di${outlet.isOpen ? 'tutup' : 'buka'} secara paksa.`)

            // If the currently viewed outlet is the one updated, sync local state
            if (selectedOutlet?.id === outlet.id) {
                setSelectedOutlet({
                    ...selectedOutlet,
                    isOpen: !selectedOutlet.isOpen
                })
            }
            refetchOutlets()
        } catch (error) {
            gooeyToast.error("Gagal memperbarui status operasional outlet")
        }
    }

    // Default Map center (Jakarta, Indonesia) if no outlets are available
    const defaultCenter: [number, number] = [106.8456, -6.2088]

    // Compute map center dynamic: first valid outlet coordinate or default
    const mapCenter = useMemo<[number, number]>(() => {
        if (focusPosition) return [focusPosition.lng, focusPosition.lat]
        const firstValid = filteredOutlets.find((o: any) => o.latitude && o.longitude)
        if (firstValid) return [firstValid.longitude, firstValid.latitude]
        return defaultCenter
    }, [filteredOutlets, focusPosition])

    useEffect(() => {
        document.title = "Peta Sebaran Outlet | BOSS Platform"
    }, [])

    return (
        <div className="flex flex-col md:flex-row gap-3 h-[calc(100vh-65px)] p-3 overflow-hidden select-none">

            {/* LEFT COLUMN: Panel control search, filter, and outlet list */}
            <div className="w-full md:w-80 lg:w-96 flex flex-col gap-3 h-full overflow-hidden shrink-0">

                {/* Section Header */}
                <Card className="shadow-md border-border/50 bg-card p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/admin/outlets">
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <CardTitle className="text-lg font-bold tracking-tight">Sebaran Outlet</CardTitle>
                            <CardDescription className="text-xs">Pantau pemetaan outlet secara real-time</CardDescription>
                        </div>
                    </div>

                    {/* Live Stats Row */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/40 text-center">
                        <div className="bg-muted/30 py-1.5 rounded-lg border border-border/30">
                            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Total</div>
                            <div className="text-base font-bold text-foreground">{stats.total}</div>
                        </div>
                        <div className="bg-emerald-500/5 py-1.5 rounded-lg border border-emerald-500/10">
                            <div className="text-[10px] text-emerald-600 uppercase font-semibold flex items-center justify-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Buka
                            </div>
                            <div className="text-base font-bold text-emerald-600">{stats.open}</div>
                        </div>
                        <div className="bg-destructive/5 py-1.5 rounded-lg border border-destructive/10">
                            <div className="text-[10px] text-destructive uppercase font-semibold">Tutup</div>
                            <div className="text-base font-bold text-destructive">{stats.closed}</div>
                        </div>
                    </div>
                </Card>

                {/* Filters Card */}
                <Card className="shadow-md border-border/50 bg-card p-3 rounded-xl">
                    <div className="flex flex-col gap-2.5">

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama outlet..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-muted/30 border-border/50 h-9 rounded-lg"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Dropdown Filters Row */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* Business/Tenant Filter */}
                            <Select value={businessFilter} onValueChange={setBusinessFilter}>
                                <SelectTrigger className="bg-muted/30 border-border/50 text-xs h-9 rounded-lg px-2">
                                    <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">
                                            {businessFilter === "ALL"
                                                ? "Semua Bisnis"
                                                : businesses.find((b: any) => b.id === businessFilter)?.name || "Bisnis"
                                            }
                                        </span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Bisnis</SelectItem>
                                    {businesses.map((b: any) => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="bg-muted/30 border-border/50 text-xs h-9 rounded-lg px-2">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Filter className="h-3.5 w-3.5 shrink-0" />
                                        <span>
                                            {statusFilter === "ALL" ? "Semua Status" : statusFilter}
                                        </span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Status</SelectItem>
                                    <SelectItem value="OPEN">Buka (Open)</SelectItem>
                                    <SelectItem value="CLOSED">Tutup (Closed)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>

                {/* Outlet List Scroll Panel */}
                <div className="flex-1 overflow-y-auto rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-inner p-2 space-y-2">
                    {isLoadingOutlets ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
                            <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mb-2" />
                            Memuat daftar outlet...
                        </div>
                    ) : filteredOutlets.length === 0 ? (
                        <div className="text-center py-12 text-xs text-muted-foreground">
                            Tidak ada outlet yang sesuai dengan kriteria filter.
                        </div>
                    ) : (
                        filteredOutlets.map((outlet: any) => (
                            <div
                                key={outlet.id}
                                onClick={() => handleFocusOutlet(outlet)}
                                className={`p-3 rounded-lg border text-left transition-all duration-300 cursor-pointer select-none ${selectedOutlet?.id === outlet.id
                                    ? "bg-primary/5 border-primary shadow-sm"
                                    : "bg-card border-border/40 hover:border-border-foreground/20 hover:bg-muted/10"
                                    }`}
                            >
                                <div className="flex items-start gap-2.5">
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${outlet.isOpen
                                        ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/10"
                                        : "bg-destructive/5 text-destructive border-destructive/10"
                                        }`}>
                                        <Store className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <span className="font-semibold text-xs leading-none text-foreground truncate">{outlet.name}</span>
                                            <Badge variant="outline" className={`text-[8px] px-1 py-0 h-4 uppercase ${outlet.isOpen
                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                                : "bg-destructive/10 text-destructive border-destructive/20"
                                                }`}>
                                                {outlet.isOpen ? 'Buka' : 'Tutup'}
                                            </Badge>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground truncate mb-1">
                                            Owner: <span className="font-medium text-foreground">{outlet.business?.name || "N/A"}</span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground/80 flex items-center gap-1 truncate">
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{outlet.address || "Belum ada alamat"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: Full Map and Detail Overlay */}
            <div className="flex-1 h-full rounded-2xl border border-border/60 shadow-xl overflow-hidden relative bg-muted group">
                <MapComponent
                    center={mapCenter}
                    zoom={focusPosition ? 15 : 12}
                    theme="light"
                >
                    <MapControls
                        position="top-right"
                        showZoom={true}
                        showCompass={false}
                        showLocate={true}
                    />

                    {/* Handles flyTo coordinate movements smoothly */}
                    <MapFlyController targetPosition={focusPosition} />

                    {/* Plot all outlets with glowing active/inactive pins */}
                    {filteredOutlets.map((outlet: any) => {
                        if (!outlet.latitude || !outlet.longitude) return null
                        return (
                            <MapMarker
                                key={`marker-${outlet.id}`}
                                longitude={outlet.longitude}
                                latitude={outlet.latitude}
                                onClick={() => handleFocusOutlet(outlet)}
                            >
                                <MarkerContent>
                                    <div className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-white shadow-xl transition-all duration-300 hover:scale-110 ${selectedOutlet?.id === outlet.id
                                        ? "bg-primary scale-110 shadow-2xl z-50 ring-2 ring-primary/20"
                                        : outlet.isOpen
                                            ? "bg-emerald-500"
                                            : "bg-rose-500"
                                        }`}>
                                        <Store className="h-4 w-4" />
                                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${outlet.isOpen ? "bg-emerald-400" : "bg-rose-400"
                                                }`}></span>
                                            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 border border-white ${outlet.isOpen ? "bg-emerald-500" : "bg-rose-500"
                                                }`}></span>
                                        </span>
                                    </div>
                                </MarkerContent>
                                <MarkerPopup className="p-0 m-0">
                                    <div className="p-3 w-64 rounded-lg bg-card text-card-foreground shadow-lg border border-border/40 select-none">
                                        <div className="flex justify-between items-start gap-2 mb-1.5">
                                            <span className="font-semibold text-xs leading-tight text-foreground truncate">{outlet.name}</span>
                                            <Badge variant="outline" className={`text-[8px] px-1 py-0 h-4 uppercase ${outlet.isOpen
                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                                : "bg-destructive/10 text-destructive border-destructive/20"
                                                }`}>
                                                {outlet.isOpen ? 'Buka' : 'Tutup'}
                                            </Badge>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground/80 mb-2 border-b border-border/30 pb-1.5">
                                            Tenant: <span className="font-medium text-foreground">{outlet.business?.name || "N/A"}</span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground/80 flex items-center gap-1 truncate mb-2">
                                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{outlet.address || "Belum ada alamat"}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="w-full text-xs font-semibold h-7 bg-muted/40 hover:bg-muted/70 rounded"
                                            onClick={() => handleFocusOutlet(outlet)}
                                        >
                                            Fokus di Detail Panel
                                        </Button>
                                    </div>
                                </MarkerPopup>
                            </MapMarker>
                        )
                    })}
                </MapComponent>

                {/* DETAIL OVERLAY: Google-style detail drawer overlay inside the map container */}
                {selectedOutlet && (
                    <div className="absolute top-4 left-4 z-10 w-80 max-w-full rounded-2xl border border-border/60 bg-background/95 backdrop-blur shadow-2xl p-4 transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                            <div className="overflow-hidden">
                                <Badge variant="outline" className="mb-1 text-[9px] px-1.5 py-0 h-4 bg-primary/5 text-primary border-primary/20 truncate">
                                    {selectedOutlet.business?.name}
                                </Badge>
                                <h3 className="font-bold text-sm leading-tight text-foreground truncate">{selectedOutlet.name}</h3>
                                <div className="text-[10px] text-muted-foreground/80 flex items-center gap-1 truncate mt-0.5">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{selectedOutlet.address || "Tidak ada alamat"}</span>
                                </div>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 rounded-lg shrink-0 hover:bg-muted"
                                onClick={() => setSelectedOutlet(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-muted/40 p-2 rounded-lg border border-border/30">
                                <div className="text-[9px] text-muted-foreground flex items-center gap-1.5">
                                    <Users className="h-3 w-3" /> Total Staff
                                </div>
                                <div className="text-sm font-bold mt-0.5">{selectedOutlet._count?.staff || 0} orang</div>
                            </div>
                            <div className="bg-muted/40 p-2 rounded-lg border border-border/30">
                                <div className="text-[9px] text-muted-foreground flex items-center gap-1.5">
                                    <ShoppingBag className="h-3 w-3" /> Produk
                                </div>
                                <div className="text-sm font-bold mt-0.5">{selectedOutlet._count?.products || 0} item</div>
                            </div>
                        </div>

                        {/* Extra Contacts/Operations Details */}
                        <div className="space-y-2 border-t border-border/40 pt-2.5 mb-3 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                                <span className="font-medium text-foreground">Operasional:</span>
                                <span>Mengikuti Jadwal</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                                <span className="font-medium text-foreground">Kontak:</span>
                                <span className="truncate">{selectedOutlet.phone || "-"}</span>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs h-8 rounded-lg"
                                onClick={() => handleForceCloseToggle(selectedOutlet)}
                                disabled={forceCloseMutation.isPending}
                            >
                                <Power className="h-3.5 w-3.5 mr-1.5" />
                                {selectedOutlet.isOpen ? "Force Close" : "Force Open"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
