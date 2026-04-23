"use client";

import { useState } from "react";
import { useOutletsQuery } from "@/hooks/useOutlets";
import { useCustomers } from "@/hooks/useCustomers";
import { useRouter } from "next/navigation";
import CustomerTable from "./CustomerTable";
import CustomerDetailDialog from "./CustomerDetailDialog";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyOutletState } from "@/components/ui/empty-outlet";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutletContext } from "@/components/providers/OutletProvider";

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-muted/30" />
        <Skeleton className="h-4 w-96 bg-muted/20" />
      </div>
      <div className="rounded-md border border-border/40 p-1">
        <div className="h-12 border-b border-border/40 bg-muted/5 flex items-center px-4">
          <Skeleton className="h-4 w-32 bg-muted/20" />
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-muted/10 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CustomerContent() {
  const router = useRouter();
  const { selectedOutletId: outletId, isLoading: outletLoading } = useOutletContext();
  const { data: authData, isLoading: authLoading } = useOutletsQuery();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchKey, setSearchKey] = useState("");
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, isFetching } = useCustomers(outletId, {
    page,
    limit,
    search: searchKey,
  });

  const handlePaginationChange = (params: { page: number; limit: number }) => {
    setPage(params.page);
    setLimit(params.limit);
  };

  if (outletLoading || authLoading) return <PageSkeleton />;

  const hasOutlet = authData?.outlets && authData.outlets.length > 0;
  if (!outletLoading && !hasOutlet) {
    return <EmptyOutletState onAddOutlet={() => router.push(`/owner/dashboard#add-outlet`)} />;
  }

  const currentOutletName = authData?.outlets?.find((o) => o.id === outletId)?.name || "Semua Outlet";

  const customers = data?.members || [];
  const meta = data?.pagination || { total: 0 };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Data Pelanggan"
        description={`Kelola basis data pelanggan dan pantau riwayat transaksi untuk ${currentOutletName}`}
      />

      <CustomerTable
        data={customers}
        isLoading={isLoading && !isFetching}
        isRefetching={isFetching}
        searchKey={searchKey}
        onSearchChange={(value) => {
          setSearchKey(value);
          setPage(1); // Reset page to 1 when searching
        }}
        page={page}
        limit={limit}
        totalItems={meta.total}
        onPaginationChange={handlePaginationChange}
        onViewDetail={(customer) => {
          setDetailCustomerId(customer.id);
          setDetailOpen(true);
        }}
      />

      <CustomerDetailDialog
        customerId={detailCustomerId}
        outletId={outletId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setDetailCustomerId(null);
          }
        }}
      />
    </div>
  );
}
