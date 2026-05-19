"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { useOutletsQuery } from "@/hooks/useOutlets";
import { useBookingsList, type BookingListItem } from "@/hooks/use-booking";
import BookingsTable from "./BookingsTable";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyOutletState } from "@/components/ui/empty-outlet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function BookingsContent() {
  const router = useRouter();
  const { selectedOutletId: outletId, isLoading: outletLoading } = useOutletContext();
  const { data: authData, isLoading: authLoading } = useOutletsQuery();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchKey, setSearchKey] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  const { data, isLoading, isFetching } = useBookingsList({
    outletId: outletId!,
    page,
    limit,
    search: searchKey,
    status: activeTab,
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

  const items: BookingListItem[] = data?.data || [];
  const meta = data?.meta || { total: 0 };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Daftar Booking"
        description={`Outlet: ${currentOutletName}`}
      />

      <Tabs defaultValue="ALL" onValueChange={(val) => { setActiveTab(val); setPage(1); }} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="ALL">Semua</TabsTrigger>
          <TabsTrigger value="BOOKED">Dibooking</TabsTrigger>
          <TabsTrigger value="BLOCKED">Diblokir</TabsTrigger>
        </TabsList>
        <BookingsTable
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
        />
      </Tabs>
    </div>
  );
}
