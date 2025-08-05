<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div class="max-w-4xl mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <button @click="$router.back()"
                            class="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors duration-200">
                            <Icon name="lucide:arrow-left" class="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Checkout</h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Selesaikan pembayaran Anda</p>
                        </div>
                    </div>

                    <!-- Progress Indicator -->
                    <div class="hidden sm:flex items-center gap-2 text-sm">
                        <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <div
                                class="w-6 h-6 bg-red-600 dark:bg-red-500 rounded-full flex items-center justify-center">
                                <Icon name="lucide:shopping-cart" class="h-3 w-3 text-white" />
                            </div>
                            <span class="font-medium">Pembayaran</span>
                        </div>
                        <div class="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
                        <div class="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                            <div
                                class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <Icon name="lucide:check" class="h-3 w-3" />
                            </div>
                            <span>Selesai</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="max-w-4xl mx-auto px-6 py-8">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Order Summary -->
                <div class="lg:col-span-2">
                    <div
                        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Icon name="lucide:package" class="h-5 w-5 text-red-600 dark:text-red-400" />
                                Ringkasan Pesanan
                            </h2>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {{ cartStore.totalItems }} item{{ cartStore.totalItems > 1 ? 's' : '' }} dalam pesanan
                            </p>
                        </div>

                        <div class="p-6">
                            <div class="space-y-4">
                                <div v-for="item in cartStore.items" :key="item.product.id"
                                    class="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <!-- Product Image -->
                                    <div class="flex-shrink-0">
                                        <div class="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden">
                                            <img v-if="item.product.image" :src="item.product.image"
                                                :alt="item.product.name" class="w-full h-full object-cover" />
                                            <div v-else class="w-full h-full flex items-center justify-center">
                                                <Icon name="lucide:image" class="h-6 w-6 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Product Details -->
                                    <div class="flex-1">
                                        <div class="flex justify-between items-start">
                                            <div>
                                                <h3 class="font-semibold text-gray-900 dark:text-white text-sm">
                                                    {{ item.product.name }}
                                                </h3>
                                                <p v-if="item.product.description"
                                                    class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                                    {{ item.product.description }}
                                                </p>
                                                <div class="flex items-center gap-4 mt-2">
                                                    <span class="text-sm text-gray-500 dark:text-gray-400">
                                                        Qty: {{ item.quantity }}
                                                    </span>
                                                    <span v-if="item.bookingSlotId"
                                                        class="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md">
                                                        Booking Service
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="text-right">
                                                <div class="font-semibold text-gray-900 dark:text-white">
                                                    {{ formatPrice(item.product.price * item.quantity) }}
                                                </div>
                                                <div class="text-xs text-gray-500 dark:text-gray-400">
                                                    {{ formatPrice(item.product.price) }} × {{ item.quantity }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Payment Form & Summary -->
                <div class="space-y-6">
                    <!-- Customer Information -->
                    <div
                        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Icon name="lucide:user" class="h-5 w-5 text-red-600 dark:text-red-400" />
                            Informasi Pemesan
                        </h3>

                        <form @submit.prevent="handlePayment" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nama Lengkap
                                </label>
                                <input v-model="guestName" type="text" required placeholder="Masukkan nama lengkap"
                                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200" />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nomor WhatsApp
                                </label>
                                <input v-model="guestPhone" type="tel" required placeholder="08xxxxxxxxxx"
                                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200" />
                                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Notifikasi pesanan akan dikirim ke nomor ini
                                </p>
                            </div>

                            <!-- Payment Summary -->
                            <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                                <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Rincian Pembayaran</h4>
                                <div class="space-y-2">
                                    <div class="flex justify-between text-sm">
                                        <span class="text-gray-600 dark:text-gray-400">Subtotal</span>
                                        <span class="text-gray-900 dark:text-white font-medium">{{ formatPrice(subtotal)
                                            }}</span>
                                    </div>
                                    <div class="flex justify-between text-sm">
                                        <div class="flex items-center gap-1">
                                            <span class="text-gray-600 dark:text-gray-400">Biaya Platform (3%)</span>
                                            <Icon name="lucide:info" class="h-3 w-3 text-gray-400" />
                                        </div>
                                        <span class="text-gray-900 dark:text-white font-medium">{{
                                            formatPrice(platformFee) }}</span>
                                    </div>
                                    <div class="flex justify-between text-sm">
                                        <div class="flex items-center gap-1">
                                            <span class="text-gray-600 dark:text-gray-400">Biaya Payment (1%)</span>
                                            <Icon name="lucide:info" class="h-3 w-3 text-gray-400" />
                                        </div>
                                        <span class="text-gray-900 dark:text-white font-medium">{{
                                            formatPrice(paymentFee) }}</span>
                                    </div>
                                    <div class="border-t border-gray-200 dark:border-gray-700 pt-2">
                                        <div class="flex justify-between">
                                            <span class="font-semibold text-gray-900 dark:text-white">Total</span>
                                            <span class="font-bold text-red-600 dark:text-red-400 text-lg">{{
                                                formatPrice(total) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Payment Button -->
                            <button type="submit" :disabled="isProcessing || !guestName || !guestPhone"
                                class="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                                <Icon v-if="isProcessing" name="lucide:loader-2" class="h-5 w-5 animate-spin" />
                                <Icon v-else name="lucide:credit-card" class="h-5 w-5" />
                                {{ isProcessing ? 'Memproses...' : 'Bayar Sekarang' }}
                            </button>
                        </form>

                        <!-- Security Badge -->
                        <div class="mt-4 text-center">
                            <div
                                class="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                                <Icon name="lucide:shield-check" class="h-4 w-4 text-green-500" />
                                <span>SSL Encrypted - Pembayaran Aman</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useApi } from '@/composables/useApi'

const cartStore = useCartStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const isProcessing = ref(false)
const guestName = ref('')
const guestPhone = ref('')

// Perhitungan biaya
const subtotal = computed(() => cartStore.totalPrice)
const platformFee = computed(() => Math.round(subtotal.value * 0.03)) // 3% platform fee
const paymentFee = computed(() => Math.round(subtotal.value * 0.01)) // 1% payment gateway fee
const total = computed(() => subtotal.value + platformFee.value + paymentFee.value)

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

async function handlePayment() {
    if (!guestName.value || !guestPhone.value) {
        toast.add({
            title: 'Peringatan',
            description: 'Nama dan nomor WhatsApp wajib diisi',
            color: 'warning'
        })
        return
    }

    isProcessing.value = true
    // Prepare order data according to the API specification
    try {
        const orderData = {
            guestCustomer: {
                name: guestName.value,
                phone: guestPhone.value
            },
            outletId: route.params.id,
            items: cartStore.items.map(item => ({
                productId: item.product.id,
                quantity: item.quantity
            })),
            paymentMethod: "online"
        }

        const { data, error } = await useApi('/orders', {
            method: 'POST',
            body: orderData
        })

        if (error.value) {
            throw new Error(error.value.data?.message || 'Terjadi kesalahan saat memproses pembayaran')
        }

        if (!data.value?.success) {
            throw new Error(data.value?.message || 'Terjadi kesalahan saat memproses pembayaran')
        }

        const responseData = data.value.data as any
        const { orderId, totalAmount, midtransTransactionToken, midtransRedirectUrl } = responseData

        // Use Midtrans Snap popup
        if (midtransTransactionToken && window.snap) {
            window.snap.pay(midtransTransactionToken, {
                onSuccess: (result: any) => {
                    console.log('Payment success:', result)
                    toast.add({
                        title: 'Pembayaran Berhasil!',
                        description: `Pesanan ${orderId} telah berhasil dibayar`,
                        color: 'success'
                    })
                    cartStore.clearCart()
                    router.push(`/outlets/${route.params.id}/payment?order_id=${orderId}&status=success&total_amount=${totalAmount}`)
                },
                onPending: (result: any) => {
                    console.log('Payment pending:', result)
                    toast.add({
                        title: 'Pembayaran Tertunda',
                        description: 'Pembayaran Anda sedang diproses',
                        color: 'warning'
                    })
                    cartStore.clearCart()
                    router.push(`/outlets/${route.params.id}/payment?order_id=${orderId}&status=pending&total_amount=${totalAmount}`)
                },
                onError: (result: any) => {
                    console.log('Payment error:', result)
                    toast.add({
                        title: 'Pembayaran Gagal',
                        description: 'Terjadi kesalahan saat memproses pembayaran',
                        color: 'error'
                    })
                    router.push(`/outlets/${route.params.id}/payment?order_id=${orderId}&status=failed&total_amount=${totalAmount}`)
                },
                onClose: () => {
                    console.log('Payment popup closed')
                    toast.add({
                        title: 'Pembayaran Dibatalkan',
                        description: 'Anda dapat mencoba lagi nanti',
                        color: 'neutral'
                    })
                }
            })
        } else if (midtransRedirectUrl) {
            // Fallback: redirect to Midtrans payment page
            window.open(midtransRedirectUrl, '_blank')
        } else {
            throw new Error('Token pembayaran tidak tersedia')
        }

    } catch (error: any) {
        console.error('Payment error:', error)
        toast.add({
            title: 'Error',
            description: error.message || 'Terjadi kesalahan yang tidak terduga',
            color: 'error'
        })
    } finally {
        isProcessing.value = false
    }
}

// Redirect if cart is empty
if (cartStore.isEmpty) {
    router.push(`/outlets/${route.params.id}`)
}
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.prose {
    max-width: none;
}

.prose pre {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    font-size: 0.875rem;
}
</style>
