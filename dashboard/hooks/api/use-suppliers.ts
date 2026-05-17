import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  supplierApi,
  type CreateSupplierPayload,
  type UpdateSupplierPayload,
} from "@/lib/apis/supplier";

const KEYS = {
  list: (outletId: string) => ["suppliers", outletId] as const,
  detail: (id: string) => ["suppliers", "detail", id] as const,
  byProduct: (productGoodsId: string) =>
    ["suppliers", "by-product", productGoodsId] as const,
};

export function useSuppliers(outletId: string | undefined, search?: string) {
  return useQuery({
    queryKey: [...KEYS.list(outletId ?? ""), search],
    queryFn: () => supplierApi.list({ outletId: outletId!, search }),
    enabled: !!outletId,
    staleTime: 30_000,
    select: (res) => ({ suppliers: res.data, meta: res.meta }),
  });
}

export function useSupplierDetail(id: string | null) {
  return useQuery({
    queryKey: KEYS.detail(id ?? ""),
    queryFn: () => supplierApi.getById(id!),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function useSuppliersByProduct(productGoodsId: string | null) {
  return useQuery({
    queryKey: KEYS.byProduct(productGoodsId ?? ""),
    queryFn: () => supplierApi.getByProduct(productGoodsId!),
    enabled: !!productGoodsId,
    select: (res) => res.data,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSupplierPayload) => supplierApi.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["suppliers", variables.outletId],
      });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSupplierPayload;
    }) => supplierApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => supplierApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}
