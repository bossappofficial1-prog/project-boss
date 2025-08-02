<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div class="max-w-4xl mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <button @click="navigateToOutlet"
                            class="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors duration-200">
                            <Icon name="lucide:arrow-left" class="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Status Pembayaran</h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">{{ statusDescription }}</p>
                        </div>
                    </div>

                    <!-- Progress Indicator -->
                    <div class="hidden sm:flex items-center gap-2 text-sm">
                        <div class="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                            <div
                                class="w-6 h-6 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center">
                                <Icon name="lucide:check" class="h-3 w-3 text-white" />
                            </div>
                            <span>Pembayaran</span>
                        </div>
                        <div class="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
                        <div :class="[
                            'flex items-center gap-2',
                            paymentStatus === 'success' ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                        ]">
                            <div :class="[
                                'w-6 h-6 rounded-full flex items-center justify-center',
                                paymentStatus === 'success'
                                    ? 'bg-green-600 dark:bg-green-500'
                                    : 'bg-gray-200 dark:bg-gray-700'
                            ]">
                                <Icon name="lucide:check" class="h-3 w-3 text-white" />
                            </div>
                            <span class="font-medium">Selesai</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="max-w-4xl mx-auto px-6 py-8">
            <!-- Loading State -->
            <div v-if="isLoading" class="flex items-center justify-center py-12">
                <div class="text-center">
                    <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p class="text-gray-500 dark:text-gray-400">Memverifikasi status pembayaran...</p>
                </div>
            </div>

            <!-- Payment Status Card -->
            <div v-else
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">

                <!-- Success State -->
                <div v-if="paymentStatus === 'success'" class="p-8 text-center">
                    <div
                        class="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon name="lucide:check-circle" class="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pembayaran Berhasil!</h2>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        Terima kasih! Pembayaran Anda telah berhasil diproses.
                    </p>

                    <div v-if="orderData" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-500 dark:text-gray-400">Order ID:</span>
                                <span class="ml-2 font-mono font-medium text-gray-900 dark:text-white">{{
                                    orderData.orderId }}</span>
                            </div>
                            <div>
                                <span class="text-gray-500 dark:text-gray-400">Total:</span>
                                <span class="ml-2 font-bold text-green-600 dark:text-green-400">{{
                                    formatPrice(orderData.totalAmount) }}</span>
                            </div>
                            <div>
                                <span class="text-gray-500 dark:text-gray-400">Status:</span>
                                <span class="ml-2 inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <Icon name="lucide:check-circle" class="h-4 w-4" />
                                    Berhasil
                                </span>
                            </div>
                            <div>
                                <span class="text-gray-500 dark:text-gray-400">Waktu:</span>
                                <span class="ml-2 text-gray-900 dark:text-white">{{ formatDate(new Date()) }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                        <BaseButton @click="navigateToOutlet" variant="outline">
                            <Icon name="lucide:arrow-left" size="16" class="mr-2" />
                            Kembali ke Outlet
                        </BaseButton>
                        <BaseButton @click="navigateToHome">
                            <Icon name="lucide:home" size="16" class="mr-2" />
                            Ke Beranda
                        </BaseButton>
                    </div>
                </div>

                <!-- Pending State -->
                <div v-else-if="paymentStatus === 'pending'" class="p-8 text-center">
                    <div
                        class="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon name="lucide:clock" class="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pembayaran Tertunda</h2>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        Pembayaran Anda sedang diproses. Mohon tunggu beberapa saat.
                    </p>

                    <div v-if="orderData" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-500 dark:text-gray-400">Order ID:</span>
                                <span class="ml-2 font-mono font-medium text-gray-900 dark:text-white">{{
                                    orderData.orderId }}</span>
                            </div>
                            <div>
                                <span class="text-gray-500 dark:text-gray-400">Total:</span>
                                <span class="ml-2 font-bold text-yellow-600 dark:text-yellow-400">{{
                                    formatPrice(orderData.totalAmount) }}</span>
                            </div>
                            <div>
                                <span class="text-gray-500 dark:text-gray-400">Status:</span>
                                <span class="ml-2 inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                    <Icon name="lucide:clock" class="h-4 w-4" />
                                    Tertunda
                                </span>
                            </div>
                            <div>
                                <span class="text-gray-500 dark:text-gray-400">Waktu:</span>
                                <span class="ml-2 text-gray-900 dark:text-white">{{ formatDate(new Date()) }}</span>
                            </div>
                        </div>
                    </div>

                    <div
                        class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                        <div class="flex items-start gap-3">
                            <Icon name="lucide:info"
                                class="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div class="text-left">
                                <h4 class="font-medium text-yellow-900 dark:text-yellow-100 mb-1">Informasi Pembayaran
                                </h4>
                                <p class="text-yellow-800 dark:text-yellow-200 text-sm">
                                    Pembayaran Anda sedang diverifikasi. Status akan diperbarui secara otomatis dalam
                                    beberapa menit.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                        <BaseButton @click="checkPaymentStatus" variant="outline">
                            <Icon name="lucide:refresh-cw" size="16" class="mr-2" />
                            Cek Status
                        </BaseButton>
                        <BaseButton @click="navigateToOutlet">
                            <Icon name="lucide:arrow-left" size="16" class="mr-2" />
                            Kembali ke Outlet
                        </BaseButton>
                    </div>
                </div>

                <!-- Failed State -->
                <div v-else class="p-8 text-center">
                    <div
                        class="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon name="lucide:x-circle" class="h-10 w-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pembayaran Gagal</h2>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        Maaf, terjadi kesalahan saat memproses pembayaran Anda.
                    </p>

                    <div
                        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <div class="flex items-start gap-3">
                            <Icon name="lucide:alert-circle"
                                class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div class="text-left">
                                <h4 class="font-medium text-red-900 dark:text-red-100 mb-1">Apa yang harus dilakukan?
                                </h4>
                                <p class="text-red-800 dark:text-red-200 text-sm">
                                    Silakan coba lagi atau hubungi customer service jika masalah berlanjut.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                        <BaseButton @click="navigateToCheckout" variant="outline">
                            <Icon name="lucide:refresh-cw" size="16" class="mr-2" />
                            Coba Lagi
                        </BaseButton>
                        <BaseButton @click="navigateToOutlet">
                            <Icon name="lucide:arrow-left" size="16" class="mr-2" />
                            Kembali ke Outlet
                        </BaseButton>
                    </div>
                </div>
            </div>

            <!-- Customer Support -->
            <div class="mt-8 text-center">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Butuh bantuan? Hubungi customer service kami
                </p>
                <div class="flex justify-center gap-4">
                    <a href="https://wa.me/6281234567890" target="_blank"
                        class="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium">
                        <Icon name="lucide:phone" class="h-4 w-4" />
                        WhatsApp
                    </a>
                    <a href="mailto:support@boss.com"
                        class="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                        <Icon name="lucide:mail" class="h-4 w-4" />
                        Email
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isLoading = ref(true)
const paymentStatus = ref<'success' | 'pending' | 'failed'>('pending')
const orderData = ref<any>(null)

const statusDescription = computed(() => {
    switch (paymentStatus.value) {
        case 'success':
            return 'Pembayaran berhasil diproses'
        case 'pending':
            return 'Menunggu konfirmasi pembayaran'
        case 'failed':
            return 'Pembayaran tidak berhasil'
        default:
            return 'Memverifikasi status pembayaran'
    }
})

function formatPrice(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}

function navigateToOutlet() {
    router.push(`/outlets/${route.params.id}`)
}

function navigateToHome() {
    router.push('/')
}

function navigateToCheckout() {
    router.push(`/outlets/${route.params.id}/checkout`)
}

async function checkPaymentStatus() {
    const orderId = route.query.order_id as string
    if (!orderId) return

    try {
        isLoading.value = true

        const { data, error } = await useApi(`/orders/${orderId}/status`)

        if (error.value) {
            throw new Error(error.value.data?.message || 'Gagal memeriksa status pembayaran')
        }

        if (data.value?.success) {
            const responseData = data.value.data as any
            const status = responseData?.paymentStatus
            if (status === 'SETTLEMENT' || status === 'CAPTURE') {
                paymentStatus.value = 'success'
            } else if (status === 'PENDING' || status === 'AUTHORIZE') {
                paymentStatus.value = 'pending'
            } else {
                paymentStatus.value = 'failed'
            }

            orderData.value = responseData
        }
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: error.message,
            color: 'error'
        })
    } finally {
        isLoading.value = false
    }
}

onMounted(async () => {
    // Get status from query params
    const status = route.query.status as string
    const orderId = route.query.order_id as string

    if (status) {
        paymentStatus.value = status as 'success' | 'pending' | 'failed'
    }

    if (orderId) {
        orderData.value = {
            orderId,
            totalAmount: parseInt(route.query.total_amount as string) || 0
        }
    }

    // If we have an order ID, check the actual payment status
    if (orderId) {
        await checkPaymentStatus()
    } else {
        isLoading.value = false
    }
})
</script>