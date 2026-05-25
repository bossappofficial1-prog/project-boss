import { apiCall } from './base';

export interface Ingredient {
  id: string;
  name: string;
  purchaseUnit: string;
  recipeUnit: string;
  conversionFactor: number;
  currentStock: number;
  averageCost: number;
  minStock: number | null;
  outletId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IngredientStockBatch {
  id: string;
  ingredientId: string;
  purchaseQuantity: number;
  remainingQuantity: number;
  costPerRecipeUnit: number;
  createdAt: string;
}

export interface IngredientStockLog {
  id: string;
  ingredientId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'POS_DEDUCTION' | 'SPOILAGE';
  quantity: number;
  costPerUnit: number | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface IngredientDetails extends Ingredient {
  batches: IngredientStockBatch[];
  stockLogs: IngredientStockLog[];
}

export const ingredientApi = {
  listByOutlet: (outletId: string) =>
    apiCall<Ingredient[]>(`/ingredients/outlet/${outletId}`),

  getById: (id: string) =>
    apiCall<IngredientDetails>(`/ingredients/${id}`),

  create: (data: {
    name: string;
    purchaseUnit: string;
    recipeUnit: string;
    conversionFactor: number;
    minStock?: number;
    outletId: string;
  }) =>
    apiCall<Ingredient>('/ingredients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: {
      name?: string;
      purchaseUnit?: string;
      recipeUnit?: string;
      conversionFactor?: number;
      minStock?: number | null;
    },
  ) =>
    apiCall<Ingredient>(`/ingredients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiCall<void>(`/ingredients/${id}`, {
      method: 'DELETE',
    }),

  addStock: (
    id: string,
    data: {
      quantity: number;
      totalCost: number;
      referenceId?: string;
      notes?: string;
    },
  ) =>
    apiCall<any>(`/ingredients/${id}/stock`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adjustStock: (
    id: string,
    data: {
      quantity: number;
      notes?: string;
    },
  ) =>
    apiCall<IngredientDetails>(`/ingredients/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
