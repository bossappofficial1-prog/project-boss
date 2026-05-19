"use client";

import React from "react";
import {
  Store,
  MapPin,
  Clock,
  Phone,
  Search,
  Filter,
  Power,
  Users,
  ShoppingBag,
  Map,
  Trash2,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import {
  useGetAdminOutlets,
  useUpdateOutletForceClose,
  useDeleteOutlet,
} from "@/hooks/api/use-admin-control";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import {
  Map as MapComponent,
  MapMarker,
  MarkerContent,
  MapControls,
} from "@/components/ui/map";
import Link from "next/link";

export default function OutletManagement() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [selectedOutlet, setSelectedOutlet] = React.useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const { data, isLoading, refetch } = useGetAdminOutlets({
    page: 1,
    limit: 100,
    search: searchQuery || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  const forceClose = useUpdateOutletForceClose();
  const deleteOutlet = useDeleteOutlet();

  const outlets = data?.outlets || [];

  const handleRowClick = (outlet: any) => {
    setSelectedOutlet(outlet);
    setIsSheetOpen(true);
  };

  const handleForceClose = async () => {
    if (!selectedOutlet) return;
    try {
      await forceClose.mutateAsync({
        outletId: selectedOutlet.id,
        isClosed: selectedOutlet.isOpen,
      });
      toast.success(
        `Outlet berhasil di${selectedOutlet.isOpen ? "tutup" : "buka"} secara paksa`,
      );
      // Update local state for immediate feedback
      setSelectedOutlet({
        ...selectedOutlet,
        isOpen: !selectedOutlet.isOpen,
      });
    } catch (error) {
      toast.error("Gagal mengubah status outlet");
    }
  };

  const handleDeleteOutlet = async () => {
    if (!selectedOutlet) return;
    try {
      await deleteOutlet.mutateAsync(selectedOutlet.id);
      toast.success("Outlet berhasil dihapus");
      setIsSheetOpen(false);
      setIsDeleteOpen(false);
    } catch (error) {
      toast.error("Gagal menghapus outlet");
    }
  };

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nama Outlet",
        cell: ({ row }) => {
          const outlet = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Store className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">{outlet.name}</span>
                <span className="text-xs text-muted-foreground">
                  ID: {outlet.id.split("-")[0]}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "business.name",
        header: "Bisnis Owner",
        cell: ({ row }) => {
          const outlet = row.original;
          return (
            <div className="text-sm">
              <div>{outlet.business?.name || "N/A"}</div>
              <div className="text-xs text-muted-foreground">
                {outlet.business?.owner?.name || "N/A"}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "address",
        header: "Lokasi",
        cell: ({ row }) => {
          const outlet = row.original;
          return (
            <div className="text-sm text-muted-foreground max-w-50 truncate flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {outlet.address || "Tidak ada alamat"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "isOpen",
        header: "Status",
        cell: ({ row }) => {
          const outlet = row.original;
          return (
            <Badge
              variant="outline"
              className={
                outlet.isOpen
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }
            >
              {outlet.isOpen ? "OPEN" : "CLOSED"}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col space-y-3 p-3 h-full">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Manajemen Outlet
          </h2>
          <p className="text-muted-foreground text-sm">
            Pantau lokasi fisik dan status operasional.
          </p>
        </div>
        <Link
          href={"/admin/outlets/map"}
          className="text-sm text-primary hover:underline"
        >
          <Map className="h-3.5 w-3.5 inline-block mr-1" />
          Lihat peta.
        </Link>
      </div>

      {/* TABLE */}
      <DataTable
        columns={columns}
        data={outlets}
        isLoading={isLoading}
        pagination={true}
        showColumnVisibility={false}
        showTableInfo={false}
        emptyMessage="Tidak ada outlet ditemukan."
        tableId="admin-outlets-table"
        onRowClick={handleRowClick}
        serverSideSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari nama outlet atau bisnis..."
        onRefresh={refetch}
        titleActions={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-45 bg-muted/30 border-border/50 h-9">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
                <span className="truncate text-xs font-medium">
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
        }
      />

      {/* SHEET DETAIL */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto p-0 gap-0">
          {selectedOutlet && (
            <>
              <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/50 p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge
                      variant="outline"
                      className="mb-2 bg-primary/5 text-primary border-primary/20"
                    >
                      {selectedOutlet.business?.name}
                    </Badge>
                    <SheetTitle className="text-xl font-bold leading-none mb-1">
                      {selectedOutlet.name}
                    </SheetTitle>
                    <SheetDescription className="flex items-center gap-2 text-xs">
                      <MapPin className="h-3 w-3" />{" "}
                      {selectedOutlet.address || "Alamat belum diatur"}
                    </SheetDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      className={
                        selectedOutlet.isOpen
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : "bg-destructive"
                      }
                    >
                      {selectedOutlet.isOpen ? "OPEN" : "CLOSED"}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8"
                    onClick={handleForceClose}
                    disabled={forceClose.isPending}
                  >
                    <Power className="h-3 w-3 mr-2" />{" "}
                    {selectedOutlet.isOpen ? "Force Close" : "Force Open"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 text-xs h-8 bg-destructive hover:bg-destructive/90"
                    onClick={() => setIsDeleteOpen(true)}
                    disabled={deleteOutlet.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Hapus Outlet
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <Tabs defaultValue="overview">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="operations">Operasional</TabsTrigger>
                  </TabsList>

                  {/* TAB: OVERVIEW */}
                  <TabsContent value="overview" className="space-y-4">
                    {selectedOutlet.latitude && selectedOutlet.longitude ? (
                      <div className="aspect-video w-full rounded-xl border border-border/50 shadow-md overflow-hidden relative bg-muted group">
                        {/* Sleek coordinate overlay */}
                        <div className="absolute bottom-2 left-2 z-10 rounded-md bg-background/90 backdrop-blur-sm border border-border/60 px-2.5 py-1 text-[10px] font-mono text-muted-foreground shadow-sm select-none transition-all duration-300 group-hover:border-primary/30 group-hover:text-foreground">
                          {selectedOutlet.latitude.toFixed(6)},{" "}
                          {selectedOutlet.longitude.toFixed(6)}
                        </div>

                        <MapComponent
                          center={[
                            selectedOutlet.longitude,
                            selectedOutlet.latitude,
                          ]}
                          zoom={14}
                          theme="light"
                        >
                          <MapControls
                            position="top-right"
                            showZoom={true}
                            showCompass={false}
                            showLocate={false}
                          />
                          <MapMarker
                            longitude={selectedOutlet.longitude}
                            latitude={selectedOutlet.latitude}
                          >
                            <MarkerContent>
                              <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl">
                                <Store className="h-5 w-5" />
                                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span>
                                </span>
                              </div>
                            </MarkerContent>
                          </MapMarker>
                        </MapComponent>
                      </div>
                    ) : selectedOutlet.address ? (
                      <div className="aspect-video w-full rounded-xl border border-border/50 shadow-md overflow-hidden relative bg-muted">
                        <iframe
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedOutlet.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-muted rounded-xl flex flex-col items-center justify-center text-muted-foreground border border-border/50 relative overflow-hidden">
                        <Map className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-xs">
                          Alamat outlet belum ditentukan
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <Card className="shadow-md border-border/40 bg-linear-to-br from-card to-muted/20 hover:border-primary/20 transition-all duration-300">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary/70" /> Jam
                            Operasional
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-sm font-bold text-foreground">
                            Mengikuti Jadwal
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="shadow-md border-border/40 bg-linear-to-br from-card to-muted/20 hover:border-primary/20 transition-all duration-300">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary/70" /> Kontak
                            Outlet
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-sm font-bold text-foreground">
                            {selectedOutlet.phone || "-"}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* TAB: OPERATIONS */}
                  <TabsContent value="operations" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border border-border/50 bg-card shadow-sm">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Users className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            Total Staff
                          </span>
                        </div>
                        <div className="text-2xl font-bold">
                          {selectedOutlet._count?.staff || 0}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border border-border/50 bg-card shadow-sm">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <ShoppingBag className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            Produk Terdaftar
                          </span>
                        </div>
                        <div className="text-2xl font-bold">
                          {selectedOutlet._count?.products || 0}
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

      <ConfirmationModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Hapus Outlet"
        description={`Apakah Anda yakin ingin menghapus outlet "${selectedOutlet?.name}"? Tindakan ini permanen dan akan menghapus seluruh data terkait outlet ini.`}
        confirmText="Hapus"
        align="left"
        onConfirm={handleDeleteOutlet}
        loading={deleteOutlet.isPending}
        confirmLoadingLabel="Menghapus..."
      />
    </div>
  );
}
