import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recipeApi } from "@/lib/apis/recipe";

const KEYS = {
  byProduct: (productId: string) => ["recipes", "by-product", productId] as const,
};

export function useRecipeByProduct(productId: string | undefined) {
  return useQuery({
    queryKey: KEYS.byProduct(productId ?? ""),
    queryFn: () => recipeApi.getByProductId(productId!),
    enabled: !!productId,
    staleTime: 30_000,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { productId: string; notes?: string }) =>
      recipeApi.create(payload),
    onSuccess: (res) => {
      if (res?.productId) {
        queryClient.invalidateQueries({
          queryKey: ["recipes", "by-product", res.productId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useAddRecipeIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipeId,
      payload,
    }: {
      recipeId: string;
      payload: {
        ingredientId: string;
        quantity: number;
      };
    }) => recipeApi.addIngredient(recipeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useRemoveRecipeIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipeId,
      ingredientId,
    }: {
      recipeId: string;
      ingredientId: string;
    }) => recipeApi.removeIngredient(recipeId, ingredientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateRecipeNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipeId,
      notes,
    }: {
      recipeId: string;
      notes: string | null;
    }) => recipeApi.updateNotes(recipeId, notes),
    onSuccess: (res) => {
      if (res?.productId) {
        queryClient.invalidateQueries({
          queryKey: ["recipes", "by-product", res.productId],
        });
      }
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recipeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
