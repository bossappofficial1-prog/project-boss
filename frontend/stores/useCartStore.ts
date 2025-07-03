import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    selectedProduct: null as null | {
      id: string
      name: string
      price: number
      stock: number
      unit: string
      description: string
    },
  }),

  actions: {
    setSelectedProduct(product: {
      id: string
      name: string
      price: number
      stock: number
      unit: string
      description: string
    }) {
      this.selectedProduct = product
    },
    clearSelectedProduct() {
      this.selectedProduct = null
    },
    clearCart() {
      this.selectedProduct = null
    }
  },
  persist: true
})
