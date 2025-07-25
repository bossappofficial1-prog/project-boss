import { defineStore } from 'pinia'
import type { Product } from '~/types'

export interface CartItem {
  product: Product
  quantity: number
  bookingSlotId?: string
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    outletId: null as string | null,
    isOpen: false,
  }),

  getters: {
    totalItems: (state) => {
      return state.items.reduce((total, item) => total + item.quantity, 0)
    },
    totalPrice: (state) => {
      return state.items.reduce((total, item) => total + item.product.price * item.quantity, 0)
    },
    isEmpty: (state) => state.items.length === 0,
  },

  actions: {
    addItem(product: Product, quantity = 1, bookingSlotId?: string) {
      // If cart is from a different outlet, clear it first
      if (this.outletId && this.outletId !== product.outletId) {
        this.clearCart()
      }
      this.outletId = product.outletId

      const existingItem = this.items.find(item => item.product.id === product.id)
      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        this.items.push({ product, quantity, bookingSlotId })
      }
    },

    removeItem(productId: string) {
      this.items = this.items.filter(item => item.product.id !== productId)
      if (this.items.length === 0) {
        this.outletId = null
      }
    },

    updateQuantity(productId: string, quantity: number) {
      const item = this.items.find(item => item.product.id === productId)
      if (item) {
        if (quantity > 0) {
          item.quantity = quantity
        } else {
          this.removeItem(productId)
        }
      }
    },

    clearCart() {
      this.items = []
      this.outletId = null
    },

    toggleCart() {
      this.isOpen = !this.isOpen
    },
  },
  persist: true,
})
