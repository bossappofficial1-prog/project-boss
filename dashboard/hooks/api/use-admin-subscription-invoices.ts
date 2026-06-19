"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";
import {
    adminSubscriptionInvoiceApi,
    type AdminSubscriptionInvoiceListParams,
    type SubscriptionInvoiceListResponse,
    type SubscriptionInvoiceRecord,
    type SubscriptionInvoiceStatus,
} from "@/lib/apis/admin-subscription-invoices";

export type AdminSubscriptionInvoiceStatusFilter =
    | "all"
    | "awaiting"
    | "pending"
    | "approved"
    | "rejected"
    | "expired";

const STATUS_PRESETS: Record<Exclude<AdminSubscriptionInvoiceStatusFilter, "all">, SubscriptionInvoiceStatus[]> = {
    awaiting: ["PROOF_SUBMITTED", "AWAITING_VERIFICATION"],
    pending: ["PENDING"],
    approved: ["SUCCESS"],
    rejected: ["REJECTED_MANUAL"],
    expired: ["EXPIRED", "CANCELLED"],
};

export interface UseAdminSubscriptionInvoicesState {
    invoices: SubscriptionInvoiceRecord[];
    total: number;
    totalPages: number;
    isLoading: boolean;
    isRefetching: boolean;
    error: string | null;
    statusFilter: AdminSubscriptionInvoiceStatusFilter;
    setStatusFilter: (value: AdminSubscriptionInvoiceStatusFilter) => void;
    search: string;
    setSearch: (value: string) => void;
    page: number;
    setPage: (value: number) => void;
    limit: number;
    setLimit: (value: number) => void;
    refetch: () => Promise<void>;
    verifyInvoice: (invoiceId: string) => Promise<void>;
    rejectInvoice: (params: { invoiceId: string; reason: string }) => Promise<void>;
    isProcessing: (invoiceId: string) => boolean;
}

export function useAdminSubscriptionInvoices(): UseAdminSubscriptionInvoicesState {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<AdminSubscriptionInvoiceStatusFilter>("awaiting");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [processingMap, setProcessingMap] = useState<Record<string, "verify" | "reject">>({});

    const queryParams = useMemo(() => {
        const params: AdminSubscriptionInvoiceListParams = {
            page,
            limit,
        };

        if (statusFilter !== "all") {
            params.status = STATUS_PRESETS[statusFilter];
        }

        const trimmedSearch = search.trim();
        if (trimmedSearch.length > 0) {
            params.search = trimmedSearch;
        }

        return params;
    }, [statusFilter, page, limit, search]);

    const listQuery = useQuery<SubscriptionInvoiceListResponse>({
        queryKey: ["admin-subscription-invoices", queryParams],
        queryFn: () => adminSubscriptionInvoiceApi.list(queryParams),
        staleTime: 30_000,
    });

    const markProcessing = useCallback((invoiceId: string, action: "verify" | "reject" | null) => {
        setProcessingMap((prev) => {
            const next = { ...prev };
            if (action) {
                next[invoiceId] = action;
            } else {
                delete next[invoiceId];
            }
            return next;
        });
    }, []);

    const invalidateList = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ["admin-subscription-invoices"] });
    }, [queryClient]);

    const verifyMutation = useMutation({
        mutationFn: async (invoiceId: string) => adminSubscriptionInvoiceApi.verify(invoiceId),
        onSuccess: async () => {
            gooeyToast.success("Invoice langganan berhasil diverifikasi.");
            await invalidateList();
        },
        onError: (err: any) => {
            const message = err?.message ?? "Gagal memverifikasi invoice langganan.";
            gooeyToast.error(message);
        },
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ invoiceId, reason }: { invoiceId: string; reason: string }) =>
            adminSubscriptionInvoiceApi.reject({ invoiceId, reason }),
        onSuccess: async () => {
            gooeyToast.warning("Invoice langganan ditolak.");
            await invalidateList();
        },
        onError: (err: any) => {
            const message = err?.message ?? "Gagal menolak invoice langganan.";
            gooeyToast.error(message);
        },
    });

    const verifyInvoice = useCallback(
        async (invoiceId: string) => {
            markProcessing(invoiceId, "verify");
            try {
                await verifyMutation.mutateAsync(invoiceId);
            } finally {
                markProcessing(invoiceId, null);
            }
        },
        [markProcessing, verifyMutation]
    );

    const rejectInvoice = useCallback(
        async ({ invoiceId, reason }: { invoiceId: string; reason: string }) => {
            markProcessing(invoiceId, "reject");
            try {
                await rejectMutation.mutateAsync({ invoiceId, reason });
            } finally {
                markProcessing(invoiceId, null);
            }
        },
        [markProcessing, rejectMutation]
    );

    const refetch = useCallback(async () => {
        await listQuery.refetch();
    }, [listQuery]);

    const isProcessing = useCallback((invoiceId: string) => Boolean(processingMap[invoiceId]), [processingMap]);

    return {
        invoices: listQuery.data?.data ?? [],
        total: listQuery.data?.total ?? 0,
        totalPages: listQuery.data?.totalPages ?? 1,
        isLoading: listQuery.isLoading,
        isRefetching: listQuery.isFetching,
        error: listQuery.error instanceof Error ? listQuery.error.message : null,
        statusFilter,
        setStatusFilter: (value) => {
            setStatusFilter(value);
            setPage(1);
        },
        search,
        setSearch: (value) => {
            setSearch(value);
            setPage(1);
        },
        page,
        setPage,
        limit,
        setLimit: (value) => {
            setLimit(value);
            setPage(1);
        },
        refetch,
        verifyInvoice,
        rejectInvoice,
        isProcessing,
    };
}
