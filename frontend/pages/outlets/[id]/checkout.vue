<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <!-- Header -->
        <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div class="max-w-4xl mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <button @click="$router.back()" aria-label="Kembali ke halaman sebelumnya"
                            class="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors duration-200 focus:ring-2 focus:ring-red-500 focus:outline-none">
                            <Icon name="lucide:arrow-left" class="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Checkout</h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Selesaikan pembayaran Anda</p>
                        </div>
                    </div>

                    <!-- Progress Indicator -->
                    <nav class="hidden sm:flex items-center gap-2 text-sm" aria-label="Progress checkout">
                        <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <div class="w-6 h-6 bg-red-600 dark:bg-red-500 rounded-full flex items-center justify-center"
                                aria-current="step">
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
                    </nav>
                </div>
            </div>
        </header>

        <main class="max-w-4xl mx-auto px-6 py-8">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Order Summary -->
                <section class="lg:col-span-2" aria-labelledby="order-summary-title">
                    <div
                        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 id="order-summary-title"
                                class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
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
                </section>

                <!-- Payment Form & Summary -->
                <aside class="space-y-6">
                    <!-- Customer Information -->
                    <div
                        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Icon name="lucide:user" class="h-5 w-5 text-red-600 dark:text-red-400" />
                            Informasi Pemesan
                        </h3>

                        <form @submit.prevent="handlePayment" class="space-y-4" novalidate>
                            <div>
                                <label for="guest-name"
                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nama Lengkap *
                                </label>
                                <input id="guest-name" v-model="guestName" type="text" required
                                    placeholder="Masukkan nama lengkap" autocomplete="name" :class="[
                                        'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200',
                                        validationErrors.guestName
                                            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200'
                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                                    ]" @blur="validateField('guestName')" aria-describedby="guest-name-error" />
                                <p v-if="validationErrors.guestName" id="guest-name-error"
                                    class="text-red-600 dark:text-red-400 text-xs mt-1">
                                    {{ validationErrors.guestName }}
                                </p>
                            </div>

                            <div>
                                <label for="guest-phone"
                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nomor WhatsApp *
                                </label>
                                <input id="guest-phone" v-model="guestPhone" type="tel" required
                                    placeholder="08xxxxxxxxxx" autocomplete="tel" :class="[
                                        'w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200',
                                        validationErrors.guestPhone
                                            ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200'
                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                                    ]" @blur="validateField('guestPhone')"
                                    aria-describedby="guest-phone-error guest-phone-help" />
                                <p id="guest-phone-help" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Notifikasi pesanan akan dikirim ke nomor ini
                                </p>
                                <p v-if="validationErrors.guestPhone" id="guest-phone-error"
                                    class="text-red-600 dark:text-red-400 text-xs mt-1">
                                    {{ validationErrors.guestPhone }}
                                </p>
                            </div>

                            <!-- Promo Code Section -->
                            <BasePromoInput :subtotal="subtotal" :outlet-id="route.params.id as string"
                                placeholder="Masukkan kode promo" input-id="checkout-promo-code"
                                :show-available-promos="true" @promo-applied="handlePromoApplied"
                                @promo-removed="handlePromoRemoved" />

                            <!-- Payment Summary -->
                            <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h4 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Icon name="lucide:calculator" class="h-4 w-4 text-red-600 dark:text-red-400" />
                                    Rincian Pembayaran
                                </h4>
                                <div class="space-y-2">
                                    <div class="flex justify-between text-sm">
                                        <span class="text-gray-600 dark:text-gray-400">Subtotal</span>
                                        <span class="text-gray-900 dark:text-white font-medium">{{ formatPrice(subtotal)
                                            }}</span>
                                    </div>

                                    <!-- Discount from promo -->
                                    <div v-if="currentPromo && currentPromo.discountAmount > 0"
                                        class="flex justify-between text-sm">
                                        <span class="text-green-600 dark:text-green-400">Diskon {{ currentPromo.code
                                            }}</span>
                                        <span class="text-green-600 dark:text-green-400 font-medium">-{{
                                            formatPrice(currentPromo.discountAmount) }}</span>
                                    </div>

                                    <!-- Show fees only if customer bears them -->
                                    <template v-if="feeBearer === 'CUSTOMER'">
                                        <div class="flex justify-between text-sm">
                                            <div class="flex items-center gap-1">
                                                <span class="text-gray-600 dark:text-gray-400">Biaya Admin App
                                                    (2%)</span>
                                                <button type="button" @click="showFeeInfo = !showFeeInfo"
                                                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                    :aria-expanded="showFeeInfo" aria-label="Info biaya administrasi">
                                                    <Icon name="lucide:info" class="h-3 w-3" />
                                                </button>
                                            </div>
                                            <span class="text-gray-900 dark:text-white font-medium">{{
                                                formatPrice(appFee) }}</span>
                                        </div>
                                        <div class="flex justify-between text-sm">
                                            <div class="flex items-center gap-1">
                                                <span class="text-gray-600 dark:text-gray-400">Biaya Payment
                                                    (0.7%)</span>
                                                <button type="button" @click="showFeeInfo = !showFeeInfo"
                                                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                    :aria-expanded="showFeeInfo"
                                                    aria-label="Info biaya payment gateway">
                                                    <Icon name="lucide:info" class="h-3 w-3" />
                                                </button>
                                            </div>
                                            <span class="text-gray-900 dark:text-white font-medium">{{
                                                formatPrice(paymentFee) }}</span>
                                        </div>
                                    </template>

                                    <!-- Fee info panel -->
                                    <div v-if="showFeeInfo && feeBearer === 'CUSTOMER'"
                                        class="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                        <p class="mb-2"><strong>Biaya Admin App:</strong> Biaya operasional platform
                                            untuk pemeliharaan sistem.</p>
                                        <p><strong>Biaya Payment:</strong> Biaya yang dikenakan oleh gateway pembayaran
                                            untuk memproses transaksi.</p>
                                    </div>

                                    <div v-else-if="feeBearer === 'OWNER'"
                                        class="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div class="flex items-center gap-2">
                                            <Icon name="lucide:gift" class="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            <span class="text-blue-600 dark:text-blue-400 font-medium">Semua biaya
                                                ditanggung oleh penjual</span>
                                        </div>
                                    </div>

                                    <div class="border-t border-gray-200 dark:border-gray-700 pt-2">
                                        <div class="flex justify-between">
                                            <span class="font-semibold text-gray-900 dark:text-white">Total</span>
                                            <span class="font-bold text-red-600 dark:text-red-400 text-lg">{{
                                                formatPrice(totalAmount) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Payment Button -->
                            <button type="submit" :disabled="!isFormValid || isProcessing"
                                class="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none flex items-center justify-center gap-2 shadow-lg hover:shadow-xl focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed"
                                :aria-label="isProcessing ? 'Sedang memproses pembayaran' : 'Lanjutkan ke pembayaran'">
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
                </aside>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useApi } from '@/composables/useApi'
import BasePromoInput from '@/components/base/BasePromoInput.vue'

// Constants for API endpoints
const API_ENDPOINTS = {
    ORDERS: '/orders',
    OUTLET_DETAILS: (id: string) => `/outlets/${id}`,
} as const

// Constants for validation
const VALIDATION_RULES = {
    PHONE_MIN_LENGTH: 10,
    PHONE_MAX_LENGTH: 15,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
} as const

// Types
interface ValidationErrors {
    guestName?: string
    guestPhone?: string
}

interface OutletSettings {
    feeBearer: 'CUSTOMER' | 'OWNER'
    appFeeRate: number
    paymentFeeRate: number
}

interface AppliedPromo {
    code: string
    discountAmount: number
    type: 'PERCENTAGE' | 'FIXED_AMOUNT'
    value: number
    description?: string
}

// Composables
const cartStore = useCartStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

// Reactive state
const isProcessing = ref(false)
const showFeeInfo = ref(false)

// Form data
const guestName = ref('')
const guestPhone = ref('')
const currentPromo = ref<AppliedPromo | null>(null)

// Validation
const validationErrors = ref<ValidationErrors>({})

// Outlet settings with defaults
const outletSettings = ref<OutletSettings>({
    feeBearer: 'CUSTOMER',
    appFeeRate: 0.02, // 2%
    paymentFeeRate: 0.007, // 0.7%
})

// Computed properties
const subtotal = computed(() => cartStore.totalPrice)
const discountAmount = computed(() => currentPromo.value?.discountAmount || 0)
const subtotalAfterDiscount = computed(() => Math.max(0, subtotal.value - discountAmount.value))
const feeBearer = computed(() => outletSettings.value.feeBearer)

const appFee = computed(() => {
    if (feeBearer.value === 'CUSTOMER') {
        return Math.round(subtotalAfterDiscount.value * outletSettings.value.appFeeRate)
    }
    return 0
})

const paymentFee = computed(() => {
    if (feeBearer.value === 'CUSTOMER') {
        return Math.round(subtotalAfterDiscount.value * outletSettings.value.paymentFeeRate)
    }
    return 0
})

const totalAmount = computed(() => {
    return subtotalAfterDiscount.value + appFee.value + paymentFee.value
})

const isFormValid = computed(() => {
    return guestName.value.trim().length >= VALIDATION_RULES.NAME_MIN_LENGTH &&
        guestPhone.value.trim().length >= VALIDATION_RULES.PHONE_MIN_LENGTH &&
        Object.keys(validationErrors.value).length === 0
})

// Validation functions
function validateField(fieldName: keyof ValidationErrors) {
    const errors: ValidationErrors = { ...validationErrors.value }

    switch (fieldName) {
        case 'guestName':
            const name = guestName.value.trim()
            if (!name) {
                errors.guestName = 'Nama lengkap wajib diisi'
            } else if (name.length < VALIDATION_RULES.NAME_MIN_LENGTH) {
                errors.guestName = `Nama minimal ${VALIDATION_RULES.NAME_MIN_LENGTH} karakter`
            } else if (name.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
                errors.guestName = `Nama maksimal ${VALIDATION_RULES.NAME_MAX_LENGTH} karakter`
            } else {
                delete errors.guestName
            }
            break

        case 'guestPhone':
            const phone = guestPhone.value.trim()
            const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,11}$/
            if (!phone) {
                errors.guestPhone = 'Nomor WhatsApp wajib diisi'
            } else if (!phoneRegex.test(phone)) {
                errors.guestPhone = 'Format nomor WhatsApp tidak valid'
            } else if (phone.length < VALIDATION_RULES.PHONE_MIN_LENGTH) {
                errors.guestPhone = `Nomor minimal ${VALIDATION_RULES.PHONE_MIN_LENGTH} digit`
            } else if (phone.length > VALIDATION_RULES.PHONE_MAX_LENGTH) {
                errors.guestPhone = `Nomor maksimal ${VALIDATION_RULES.PHONE_MAX_LENGTH} digit`
            } else {
                delete errors.guestPhone
            }
            break
    }

    validationErrors.value = errors
}

// Utility functions
function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

function normalizePhoneNumber(phone: string): string {
    // Convert phone number to standard format
    let normalized = phone.trim().replace(/\D/g, '') // Remove non-digits

    if (normalized.startsWith('0')) {
        normalized = '62' + normalized.substring(1)
    } else if (normalized.startsWith('8')) {
        normalized = '62' + normalized
    }

    return normalized
}

// Business logic functions
async function fetchOutletSettings() {
    try {
        const { data, error } = await useApi(API_ENDPOINTS.OUTLET_DETAILS(route.params.id as string))

        if (error.value) {
            console.warn('Failed to fetch outlet settings:', error.value)
            return
        }

        if (data.value?.success && data.value.data) {
            const outlet: any = data.value.data
            outletSettings.value = {
                feeBearer: outlet.business?.feeBearer || 'CUSTOMER',
                appFeeRate: outlet.business?.appFeeRate || 0.02,
                paymentFeeRate: outlet.business?.paymentFeeRate || 0.007,
            }
        }
    } catch (error) {
        console.warn('Error fetching outlet settings:', error)
    }
}

// Promo event handlers
const handlePromoApplied = (promo: AppliedPromo) => {
    currentPromo.value = promo
    toast.add({
        title: 'Kode Promo Berhasil!',
        description: `Anda hemat ${formatPrice(promo.discountAmount)}`,
        color: 'success'
    })
}

const handlePromoRemoved = () => {
    currentPromo.value = null
    toast.add({
        title: 'Kode Promo Dihapus',
        description: 'Kode promo berhasil dihapus',
        color: 'neutral'
    })
}

async function handlePayment() {
    // Validate all fields
    validateField('guestName')
    validateField('guestPhone')

    if (!isFormValid.value) {
        toast.add({
            title: 'Form Tidak Valid',
            description: 'Mohon perbaiki data yang tidak valid',
            color: 'warning'
        })
        return
    }

    isProcessing.value = true

    try {
        const orderData = {
            guestCustomer: {
                name: guestName.value.trim(),
                phone: normalizePhoneNumber(guestPhone.value)
            },
            outletId: route.params.id,
            items: cartStore.items.map(item => ({
                productId: item.product.id,
                quantity: item.quantity
            })),
            paymentMethod: "online",
            promoCode: currentPromo.value?.code || undefined
        }

        const { data, error } = await useApi(API_ENDPOINTS.ORDERS, {
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

// Watchers for real-time validation
watch(guestName, () => {
    if (validationErrors.value.guestName) {
        validateField('guestName')
    }
})

watch(guestPhone, () => {
    if (validationErrors.value.guestPhone) {
        validateField('guestPhone')
    }
})

// Lifecycle
onMounted(async () => {
    // Redirect if cart is empty
    if (cartStore.isEmpty) {
        toast.add({
            title: 'Keranjang Kosong',
            description: 'Silakan tambahkan produk terlebih dahulu',
            color: 'warning'
        })
        router.push(`/outlets/${route.params.id}`)
        return
    }

    // Fetch outlet settings to determine fee bearer
    await fetchOutletSettings()
})

// Page meta
definePageMeta({
    layout: 'blank',
    title: 'Checkout - Pembayaran'
})
</script>

<style scoped>
/* Line clamp utility */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Smooth transitions for form elements */
input:focus {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

/* Loading animation for buttons */
@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: .7;
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Enhanced button hover effects */
button:hover:not(:disabled) {
    transform: translateY(-1px);
}

button:active:not(:disabled) {
    transform: translateY(0);
}

/* Custom scrollbar for overflow content */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #f3f4f6;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

/* Dark mode scrollbar */
.dark .custom-scrollbar::-webkit-scrollbar-track {
    background: #374151;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #6b7280;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
}

/* Focus visible improvements for accessibility */
*:focus-visible {
    outline: 2px solid #dc2626;
    outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .bg-gray-50 {
        background-color: white;
    }

    .dark .bg-gray-800 {
        background-color: black;
    }

    .text-gray-500 {
        color: #000;
    }

    .dark .text-gray-400 {
        color: #fff;
    }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* Print styles */
@media print {
    .no-print {
        display: none;
    }

    .bg-white,
    .dark .bg-gray-800 {
        background: white !important;
    }

    .text-white,
    .dark .text-white {
        color: black !important;
    }

    .shadow-sm,
    .shadow-lg {
        box-shadow: none !important;
    }
}

/* Custom animation for success states */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.slide-in {
    animation: slideIn 0.3s ease-out;
}

/* Enhanced focus states for form elements */
input:focus,
button:focus {
    box-shadow:
        0 0 0 2px white,
        0 0 0 4px #dc2626,
        0 1px 3px 0 rgb(0 0 0 / 0.1);
}

.dark input:focus,
.dark button:focus {
    box-shadow:
        0 0 0 2px #1f2937,
        0 0 0 4px #dc2626,
        0 1px 3px 0 rgb(0 0 0 / 0.1);
}
</style>
