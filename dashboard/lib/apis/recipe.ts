import { apiCall } from './base';
import type { Ingredient } from './ingredient';

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId: string;
  quantity: number;
  ingredient: Ingredient;
}

export interface Recipe {
  id: string;
  productId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  ingredients: RecipeIngredient[];
}

export const recipeApi = {
  create: (data: { productId: string; notes?: string }) =>
    apiCall<Recipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getByProductId: (productId: string) =>
    apiCall<Recipe>(`/recipes/product/${productId}`),

  addIngredient: (
    recipeId: string,
    data: {
      ingredientId: string;
      quantity: number;
    },
  ) =>
    apiCall<RecipeIngredient>(`/recipes/${recipeId}/ingredient`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeIngredient: (recipeId: string, ingredientId: string) =>
    apiCall<void>(`/recipes/${recipeId}/ingredient/${ingredientId}`, {
      method: 'DELETE',
    }),

  updateNotes: (recipeId: string, notes: string | null) =>
    apiCall<Recipe>(`/recipes/${recipeId}/notes`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),

  delete: (id: string) =>
    apiCall<void>(`/recipes/${id}`, {
      method: 'DELETE',
    }),
};
