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
        description={`Outlet: ${currentOutletName}`}
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
