"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { useOutletsQuery } from "@/hooks/useOutlets";
import { useOrders } from "@/hooks/useOrdersReactQuery";
import OrdersTable from "./OrdersTable";
import OrderDetailDialog from "./OrderDetailDialog";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyOutletState } from "@/components/ui/empty-outlet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <Skeleton className="h-100 rounded-md" />
    </div>
  );
}

export default function OrdersContent() {
  const router = useRouter();
  const { selectedOutletId: outletId, isLoading: outletLoading } = useOutletContext();
  const { data: authData, isLoading: authLoading } = useOutletsQuery();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchKey, setSearchKey] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, isFetching } = useOrders({
    outletId: outletId!,
    page,
    limit,
    search: searchKey,
    status: activeTab,
    paymentStatus,
  });

  const handlePaginationChange = (params: { page: number; limit: number }) => {
    setPage(params.page);
    setLimit(params.limit);
  };

  if (outletLoading || authLoading) return <PageSkeleton />;

  const hasOutlet = authData?.outlets && authData.outlets.length > 0;
  if (!outletLoading && !hasOutlet) {
    return <EmptyOutletState onAddOutlet={() => router.push(`/owner#add-outlet`)} />;
  }

  const currentOutletName = authData?.outlets?.find((o) => o.id === outletId)?.name || "Semua Outlet";

  const items = Array.isArray(data) ? data : (data?.data || []);
  const meta = data?.meta || { total: 0 };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Daftar Pesanan"
        description={`Outlet: ${currentOutletName}`}
      />

      <div className="flex w-full md:w-72">
        <Select
          value={paymentStatus}
          onValueChange={(value) => {
            setPaymentStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Filter pembayaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Pembayaran</SelectItem>
            <SelectItem value="PENDING">Tertunda</SelectItem>
            <SelectItem value="AWAITING_VERIFICATION">Menunggu Verifikasi</SelectItem>
            <SelectItem value="SUCCESS">Berhasil</SelectItem>
            <SelectItem value="EXPIRED">Kadaluarsa</SelectItem>
            <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
            <SelectItem value="PROOF_SUBMITTED">Bukti Terkirim</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" onValueChange={(val) => { setActiveTab(val); setPage(1); }} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="AWAITING_PAYMENT">Menunggu Bayar</TabsTrigger>
          <TabsTrigger value="PROCESSING">Diproses</TabsTrigger>
          <TabsTrigger value="CONFIRMED">Dikonfirmasi</TabsTrigger>
          <TabsTrigger value="COMPLETED">Selesai</TabsTrigger>
          <TabsTrigger value="CANCELLED">Batal</TabsTrigger>
        </TabsList>
        <OrdersTable
          data={items}
          isLoading={isLoading && !isFetching}
          isRefetching={isFetching}
          searchKey={searchKey}
          onSearchChange={(value) => {
            setSearchKey(value);
            setPage(1);
          }}
          page={page}
          limit={limit}
          totalItems={meta.total || items.length}
          onPaginationChange={handlePaginationChange}
          onViewDetail={(order) => {
            setDetailOrderId(order.id);
            setDetailOpen(true);
          }}
        />
      </Tabs>

      <OrderDetailDialog
        orderId={detailOrderId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setDetailOrderId(null);
          }
        }}
      />
    </div>
  );
}
