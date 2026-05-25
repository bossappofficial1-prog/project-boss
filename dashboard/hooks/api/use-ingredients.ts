import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ingredientApi } from "@/lib/apis/ingredient";

const KEYS = {
  list: (outletId: string) => ["ingredients", outletId] as const,
  detail: (id: string) => ["ingredients", "detail", id] as const,
};

export function useIngredients(outletId: string | undefined) {
  return useQuery({
    queryKey: KEYS.list(outletId ?? ""),
    queryFn: () => ingredientApi.listByOutlet(outletId!),
    enabled: !!outletId,
    staleTime: 30_000,
  });
}

export function useIngredientDetail(id: string | null) {
  return useQuery({
    queryKey: KEYS.detail(id ?? ""),
    queryFn: () => ingredientApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      name: string;
      purchaseUnit: string;
      recipeUnit: string;
      conversionFactor: number;
      minStock?: number;
      outletId: string;
    }) => ingredientApi.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ingredients", variables.outletId],
      });
    },
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        name?: string;
        purchaseUnit?: string;
        recipeUnit?: string;
        conversionFactor?: number;
        minStock?: number | null;
      };
    }) => ingredientApi.update(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      if (res?.id) {
        queryClient.invalidateQueries({ queryKey: ["ingredients", "detail", res.id] });
      }
    },
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ingredientApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      // Hapus juga resep karena HPP akan bergeser
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useAddIngredientStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        quantity: number;
        totalCost: number;
        referenceId?: string;
        notes?: string;
      };
    }) => ingredientApi.addStock(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients", "detail", variables.id] });
      // Invalidate resep & produk juga karena HPP berubah dengan stok baru
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useAdjustIngredientStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        quantity: number;
        notes?: string;
      };
    }) => ingredientApi.adjustStock(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients", "detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
