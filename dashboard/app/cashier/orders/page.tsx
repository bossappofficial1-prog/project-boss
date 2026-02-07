"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useGoodsOrders } from "@/hooks/useOrders";
import { OrdersHeader } from "@/components/owner/orders/Header";
import { OrdersControls } from "@/components/owner/orders/Controls";
import { OrdersEmptyState } from "@/components/owner/orders/EmptyState";
import { OrdersSkeleton } from "@/components/owner/orders/Skeleton";
import { DataTable } from "@/components/ui/data-table";
import type { GoodsOrder } from "@/lib/apis/order";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { useEmitSocket } from "@/hooks/useEmitSocket";
import { SOCKET_EVENT } from "@/types/socket";
import { createOrderColumns } from "@/components/owner/orders/columns";
import { ProofPreviewDialog } from "@/components/owner/orders/ProofPreviewDialog";
import { useOrderActions } from "@/hooks/useOrderActions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCashierContext } from "../layout";
import { useRouter } from "next/navigation";

type StatusFilterValue = "all" | "pending" | "processing" | "ready" | "completed";

export default function CashierOrdersPage() {
  const router = useRouter();
  const { outletData } = useCashierContext();
  const outletId = outletData?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const { emitEvent } = useEmitSocket();

  const {
    data: orders,
    loading,
    error,
    refetch,
  } = useGoodsOrders({
    outletId,
    autoRefresh: false,
  });

  const {
    pendingOrderId,
    confirmState,
    confirmOpen,
    setConfirmOpen,
    executeStatusUpdate,
    requestStatusUpdate,
    requestManualConfirmation,
    requestReady,
    requestComplete,
    requestCancel,
    rowActions: buildRowActions,
    triggerProofPreview,
    closeProofPreview,
    proofOrder,
  } = useOrderActions({
    onSuccess: refetch,
  });

  useSocketEvent(SOCKET_EVENT.PAYMENT_NEW, (data) => {
    toast.info(`Ada pesanan baru!, orderID: ${data.orderId}`);
    refetch();
  });

  useEffect(() => {
    if (!outletId) return;
    emitEvent(SOCKET_EVENT.JOIN_OUTLET, { outletId });
  }, [emitEvent, outletId]);

  const filteredOrders = useMemo(() => {
    if (!orders || !orders.length) return [] as GoodsOrder[];

    return orders.filter((order) => {
      if (order.orderStatus === "COMPLETED" && statusFilter !== "completed") {
        return false;
      }

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && order.orderStatus === "AWAITING_PAYMENT") ||
        (statusFilter === "processing" && order.orderStatus === "PROCESSING") ||
        (statusFilter === "ready" && order.orderStatus === "READY") ||
        (statusFilter === "completed" && order.orderStatus === "COMPLETED");

      if (!matchesStatus) {
        return false;
      }

      if (!searchQuery) {
        return true;
      }

      const query = searchQuery.toLowerCase();
      const nameMatch = order.guestCustomer?.name?.toLowerCase().includes(query);
      const phoneMatch = order.guestCustomer?.phone?.includes(searchQuery);
      const idMatch = order.id.toLowerCase().includes(query);

      return Boolean(nameMatch || phoneMatch || idMatch);
    });
  }, [orders, searchQuery, statusFilter]);

  const columns = useMemo(
    () =>
      createOrderColumns({
        onStatusChange: requestStatusUpdate,
        onPreviewProof: triggerProofPreview,
        pendingOrderId,
      }),
    [pendingOrderId, requestStatusUpdate, triggerProofPreview],
  );

  if (!outletId) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Memuat data outlet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Gagal memuat data</h3>
          <p className="mb-4 text-muted-foreground">
            {typeof error === "string" ? error : "Terjadi kesalahan saat memuat pesanan"}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white shadow hover:bg-red-700">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto px-4 py-6">
      <OrdersHeader
        onRefresh={refetch}
        onCreateQuick={() => {
          router.push("/cashier/pos");
        }}
      />

      <OrdersControls
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {loading ? (
        <OrdersSkeleton />
      ) : !filteredOrders.length ? (
        <OrdersEmptyState
          hasFilters={Boolean(searchQuery) || statusFilter !== "all"}
          onClearFilters={() => {
            setSearchQuery("");
            setStatusFilter("all");
          }}
          onCreateOrder={() => {
            router.push("/cashier/pos");
          }}
        />
      ) : (
        <div className="border rounded-md">
          <DataTable<GoodsOrder, unknown>
            columns={columns}
            data={filteredOrders}
            rowActions={(order) => buildRowActions(order)}
            actionViewType="dropdown"
            onRefresh={refetch}
            isLoading={loading}
            emptyMessage="Tidak ada pesanan"
            showTableInfo={true}
            pagination={true}
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen && Boolean(confirmState)}
        onOpenChange={setConfirmOpen}
        title={confirmState?.title ?? "Konfirmasi"}
        description={confirmState?.description}
        confirmLabel={confirmState?.confirmLabel ?? "Konfirmasi"}
        confirmVariant={confirmState?.confirmVariant}
        confirmLoading={Boolean(pendingOrderId)}
        onConfirm={executeStatusUpdate}
        showInput={confirmState?.showInput}
        inputPlaceholder={confirmState?.inputPlaceholder}
        inputRequired={confirmState?.inputRequired}
        align="left"
      />

      <ProofPreviewDialog
        order={proofOrder}
        open={Boolean(proofOrder)}
        onOpenChange={(open) => {
          if (!open) {
            closeProofPreview();
          }
        }}
      />
    </div>
  );
}
