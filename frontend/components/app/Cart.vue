<template>
    <div>
        <!-- Cart Toggle Button -->
        <button @click="cartStore.toggleCart"
            class="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center">
            <div class="relative">
                <Icon name="lucide:shopping-bag" class="h-6 w-6" />
                <span v-if="cartStore.totalItems > 0"
                    class="absolute -top-2 -right-2 bg-white text-red-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-red-600 animate-pulse">
                    {{ cartStore.totalItems }}
                </span>
            </div>
        </button>

        <!-- Cart Sidebar -->
        <Transition name="cart">
            <div v-if="cartStore.isOpen" class="fixed inset-0 z-50 overflow-hidden">
                <!-- Overlay -->
                <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                    @click="cartStore.toggleCart"></div>

                <!-- Cart Panel -->
                <div class="absolute inset-y-0 right-0 max-w-full flex">
                    <div class="relative w-screen max-w-md">
                        <div class="h-full flex flex-col bg-white dark:bg-gray-900 shadow-2xl">
                            <!-- Header -->
                            <div
                                class="px-6 py-6 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <Icon name="lucide:shopping-bag" class="h-6 w-6 text-white" />
                                        <h2 class="text-xl font-bold text-white">Keranjang Belanja</h2>
                                    </div>
                                    <button @click="cartStore.toggleCart"
                                        class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors duration-200">
                                        <Icon name="lucide:x" class="h-5 w-5 text-white" />
                                    </button>
                                </div>

                                <div v-if="!cartStore.isEmpty"
                                    class="mt-4 text-white/90 text-sm flex items-center gap-2">
                                    <Icon name="lucide:package" class="h-4 w-4" />
                                    <span>{{ cartStore.totalItems }} item{{ cartStore.totalItems > 1 ? 's' : '' }} di
                                        keranjang</span>
                                </div>
                            </div>

                            <!-- Cart Items -->
                            <div class="flex-1 overflow-y-auto py-6">
                                <!-- Empty State -->
                                <div v-if="cartStore.isEmpty" class="text-center py-16 px-6">
                                    <div
                                        class="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Icon name="lucide:shopping-cart" class="h-12 w-12 text-gray-400" />
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Keranjang
                                        Kosong</h3>
                                    <p class="text-gray-500 dark:text-gray-400 mb-6">Mulai berbelanja untuk menambahkan
                                        item ke keranjang
                                        Anda</p>
                                    <button @click="cartStore.toggleCart"
                                        class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors duration-200">
                                        Mulai Belanja
                                    </button>
                                </div>

                                <!-- Cart Items List -->
                                <div v-else class="space-y-4 px-6">
                                    <div v-for="item in cartStore.items" :key="item.product.id"
                                        class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
                                        <div class="flex gap-4">
                                            <!-- Product Image -->
                                            <div class="flex-shrink-0">
                                                <div
                                                    class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                                                    <img v-if="item.product.image" :src="item.product.image"
                                                        :alt="item.product.name" class="w-full h-full object-cover" />
                                                    <div v-else class="w-full h-full flex items-center justify-center">
                                                        <Icon name="lucide:image" class="h-6 w-6 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Product Details -->
                                            <div class="flex-1">
                                                <div class="flex justify-between items-start mb-2">
                                                    <h3
                                                        class="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                                                        {{ item.product.name }}
                                                    </h3>
                                                    <button @click="cartStore.removeItem(item.product.id)"
                                                        class="w-6 h-6 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 rounded-full flex items-center justify-center transition-colors duration-200 ml-2">
                                                        <Icon name="lucide:trash-2"
                                                            class="h-3 w-3 text-red-600 dark:text-red-400" />
                                                    </button>
                                                </div>

                                                <div class="flex justify-between items-end">
                                                    <div class="text-red-600 dark:text-red-400 font-bold text-sm">
                                                        {{ formatCurrency(item.product.price) }}
                                                    </div>

                                                    <!-- Quantity Controls -->
                                                    <div class="flex items-center gap-3">
                                                        <button
                                                            @click="cartStore.updateQuantity(item.product.id, item.quantity - 1)"
                                                            class="w-8 h-8 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                                                            :disabled="item.quantity <= 1"
                                                            :class="{ 'opacity-50 cursor-not-allowed': item.quantity <= 1 }">
                                                            <Icon name="lucide:minus"
                                                                class="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                                        </button>

                                                        <span
                                                            class="w-8 text-center font-semibold text-gray-900 dark:text-white text-sm">
                                                            {{ item.quantity }}
                                                        </span>

                                                        <button
                                                            @click="cartStore.updateQuantity(item.product.id, item.quantity + 1)"
                                                            class="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center transition-colors duration-200">
                                                            <Icon name="lucide:plus" class="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <!-- Booking Slot Info -->
                                                <div v-if="item.bookingSlotId"
                                                    class="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md flex items-center gap-1">
                                                    <Icon name="lucide:calendar" class="h-3 w-3" />
                                                    <span>Layanan Booking</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div v-if="!cartStore.isEmpty"
                                class="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <div class="px-6 py-6">
                                    <!-- Price Summary -->
                                    <div class="space-y-3 mb-6">
                                        <div class="flex justify-between text-sm">
                                            <span class="text-gray-600 dark:text-gray-400">Subtotal ({{
                                                cartStore.totalItems }} item{{
                                                    cartStore.totalItems > 1 ? 's' : '' }})</span>
                                            <span class="font-semibold text-gray-900 dark:text-white">{{
                                                formatCurrency(cartStore.totalPrice)
                                                }}</span>
                                        </div>
                                        <div class="flex justify-between text-sm">
                                            <span class="text-gray-600 dark:text-gray-400">Biaya layanan</span>
                                            <span class="text-gray-600 dark:text-gray-400">Dihitung saat checkout</span>
                                        </div>
                                        <div class="h-px bg-gray-200 dark:bg-gray-700"></div>
                                        <div class="flex justify-between">
                                            <span class="font-bold text-gray-900 dark:text-white">Total Estimasi</span>
                                            <span class="font-bold text-red-600 dark:text-red-400 text-lg">{{
                                                formatCurrency(cartStore.totalPrice) }}</span>
                                        </div>
                                    </div>

                                    <!-- Action Buttons -->
                                    <div class="space-y-3">
                                        <button @click="navigateToCheckout"
                                            class="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                                            <Icon name="lucide:credit-card" class="h-5 w-5" />
                                            Checkout Sekarang
                                        </button>

                                        <button @click="cartStore.toggleCart"
                                            class="w-full py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                                            <Icon name="lucide:arrow-left" class="h-4 w-4" />
                                            Lanjut Belanja
                                        </button>
                                    </div>

                                    <!-- Security Badge -->
                                    <div class="mt-4 text-center">
                                        <div
                                            class="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                                            <Icon name="lucide:shield-check" class="h-4 w-4 text-green-500" />
                                            <span>Pembayaran aman & terenkripsi</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

function formatCurrency(price: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price)
}

function navigateToCheckout() {
    const router = useRouter()
    const route = useRoute()
    cartStore.toggleCart()

    if (cartStore.items.length > 0) {
        const firstItem = cartStore.items[0]
        let outletId = route.params.id
        if (!outletId && firstItem.product.outletId) {
            outletId = firstItem.product.outletId
        }
        if (!outletId) {
            alert('Tidak dapat menentukan outlet. Silakan kembali ke halaman outlet untuk melakukan checkout.')
            return
        }

        setTimeout(() => {
            router.push(`/outlets/${outletId}/checkout`)
        }, 200) // delay
    } else {
        alert('Keranjang kosong')
    }
}
</script>

<style scoped>
.cart-enter-active,
.cart-leave-active {
    transition: all 0.3s ease;
}

.cart-enter-from,
.cart-leave-to {
    opacity: 0;
}

.cart-enter-active .relative,
.cart-leave-active .relative {
    transition: transform 0.3s ease;
}

.cart-enter-from .relative,
.cart-leave-to .relative {
    transform: translateX(100%);
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
