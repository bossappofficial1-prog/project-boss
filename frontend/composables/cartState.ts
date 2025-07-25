// cartState.ts
import { ref } from 'vue'

// Create a single instance of the cart state
const isCartOpen = ref(false)

export const useCartState = () => {
  const openCart = () => {
    isCartOpen.value = true
  }

  const closeCart = () => {
    isCartOpen.value = false
  }

  const toggleCart = () => {
    isCartOpen.value = !isCartOpen.value
  }

  return {
    isCartOpen,
    openCart,
    closeCart,
    toggleCart
  }
}
