<template>
    <div>
        <!-- Cart Toggle Button -->
        <button @click="cartStore.toggleCart"
            class="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg hover:from-indigo-700 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105">
            <div class="relative">
                <i class="fas fa-shopping-bag text-xl"></i>
                <span v-if="cartStore.totalItems > 0"
                    class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-medium rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                    {{ cartStore.totalItems }}
                </span>
            </div>
        </button>

        <!-- Cart Sidebar -->
        <div v-if="cartStore.isOpen" class="fixed inset-0 z-50 overflow-hidden" @click.self="cartStore.toggleCart">
            <!-- Overlay -->
            <div class="absolute inset-0 bg-black bg-opacity-50 transition-opacity"></div>

            <!-- Cart Panel -->
            <div class="absolute inset-y-0 right-0 max-w-full flex">
                <div class="relative w-screen max-w-md">
                    <div class="h-full flex flex-col bg-white shadow-xl">
                        <!-- Header -->
                        <div class="px-4 py-6 bg-indigo-600 text-white sm:px-6">
                            <div class="flex items-center justify-between">
                                <h2 class="text-lg font-medium">Keranjang Belanja</h2>
                                <button @click="cartStore.toggleCart"
                                    class="rounded-md text-white hover:text-gray-200 focus:outline-none">
                                    <i class="fas fa-times text-xl"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Cart Items -->
                        <div class="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                            <div v-if="cartStore.isEmpty" class="text-center py-8">
                                <i class="fas fa-shopping-cart text-4xl text-gray-400"></i>
                                <p class="mt-4 text-gray-500">Keranjang belanja Anda kosong</p>
                            </div>

                            <div v-else class="space-y-4">
                                <div v-for="item in cartStore.items" :key="item.product.id"
                                    class="flex items-start space-x-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <!-- Product Image -->
                                    <div class="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                                        <img :src="item.product.image || '/images/default-product.png'"
                                            :alt="item.product.name"
                                            class="w-full h-full object-cover transform hover:scale-110 transition-transform duration-200">
                                    </div>

                                    <!-- Product Details -->
                                    <div class="flex-1">
                                        <div class="flex justify-between items-start">
                                            <div>
                                                <h3 class="text-base font-medium text-gray-900">{{ item.product.name }}
                                                </h3>
                                                <p class="mt-1 text-sm text-gray-500 line-clamp-2">{{
                                                    item.product.description }}</p>
                                            </div>
                                            <button @click="cartStore.removeItem(item.product.id)"
                                                class="text-gray-400 hover:text-red-500 transition-colors duration-200">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>

                                        <div class="mt-3 flex items-end justify-between">
                                            <p class="text-sm font-semibold text-indigo-600">
                                                {{ new Intl.NumberFormat('id-ID', {
                                                    style: 'currency', currency: 'IDR'
                                                }).format(item.product.price) }}
                                            </p>

                                            <!-- Quantity Controls -->
                                            <div class="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                                <button
                                                    @click="cartStore.updateQuantity(item.product.id, item.quantity - 1)"
                                                    class="px-2 py-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                                                    :disabled="item.quantity <= 1"
                                                    :class="{ 'opacity-50 cursor-not-allowed': item.quantity <= 1 }">
                                                    <i class="fas fa-minus text-xs"></i>
                                                </button>
                                                <span class="w-8 text-center text-sm font-medium text-gray-700">{{
                                                    item.quantity }}</span>
                                                <button
                                                    @click="cartStore.updateQuantity(item.product.id, item.quantity + 1)"
                                                    class="px-2 py-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                                                    :disabled="item.quantity >= item.product.stock"
                                                    :class="{ 'opacity-50 cursor-not-allowed': item.quantity >= item.product.stock }">
                                                    <i class="fas fa-plus text-xs"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="border-t border-gray-200 bg-gray-50">
                            <div class="px-4 py-6 sm:px-6">
                                <div class="space-y-4">
                                    <div class="flex justify-between text-base">
                                        <p class="text-gray-500">Subtotal</p>
                                        <p class="font-medium text-gray-900">{{ new Intl.NumberFormat('id-ID', {
                                            style:
                                                'currency', currency: 'IDR'
                                        }).format(cartStore.totalPrice) }}</p>
                                    </div>
                                    <div class="flex justify-between text-base">
                                        <p class="text-gray-500">Pengiriman</p>
                                        <p class="font-medium text-gray-900">Dihitung saat checkout</p>
                                    </div>
                                    <div class="flex justify-between text-base font-medium">
                                        <p class="text-gray-900">Total Estimasi</p>
                                        <p class="text-indigo-600">{{ new Intl.NumberFormat('id-ID', {
                                            style:
                                                'currency', currency: 'IDR'
                                        }).format(cartStore.totalPrice) }}</p>
                                    </div>
                                </div>

                                <div class="mt-6 space-y-3">
                                    <button :disabled="cartStore.isEmpty" @click="navigateToCheckout"
                                        class="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-xl text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                                        <i class="fas fa-lock mr-2 text-sm"></i>
                                        Checkout Sekarang
                                    </button>

                                    <button @click="cartStore.toggleCart"
                                        class="w-full flex justify-center items-center px-6 py-3 border border-gray-300 rounded-xl text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                                        <i class="fas fa-arrow-left mr-2 text-sm"></i>
                                        Lanjut Belanja
                                    </button>
                                </div>

                                <p class="mt-4 text-sm text-center text-gray-500 flex items-center justify-center">
                                    <i class="fas fa-shield-alt text-indigo-600 mr-2"></i>
                                    Pembayaran aman & terenkripsi
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

function navigateToCheckout() {
    const router = useRouter()
    const route = useRoute()
    const outletId = route.params.id

    // Tutup popup keranjang sebelum pindah ke halaman checkout
    cartStore.toggleCart()

    if (outletId) {
        setTimeout(() => {
            router.push(`/outlets/${outletId}/checkout`)
        }, 200) // beri delay agar animasi close terasa smooth
    }
}
</script>
