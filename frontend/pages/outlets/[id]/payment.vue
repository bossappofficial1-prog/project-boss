<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useCartStore } from '~/stores/cart'
import type { Outlet } from '~/types'

interface OrderResponse {
    orderId: string;
    totalAmount: number;
    midtransTransactionToken: string;
    midtransRedirectUrl: string;
}

const route = useRoute()
const cartStore = useCartStore()
const router = useRouter()
const toast = useToast()
const outletId = route.params.id as string

// Redirect if cart is invalid
if (cartStore.isEmpty || cartStore.outletId !== outletId) {
    router.replace(`/outlets/${outletId}`)
}

const customerName = ref('')
const customerPhone = ref('')
const selectedPaymentMethod = ref('qris')
const isSubmitting = ref(false)

const paymentMethods = [
    { id: 'qris', name: 'QRIS', icon: 'mdi:qrcode-scan' },
    { id: 'online', name: 'Kartu & E-Wallet', icon: 'lucide:credit-card' },
]

const { data: outletResponse } = useApi<Outlet>(`/api/v1/outlets/${outletId}`)
const outlet = computed(() => outletResponse.value?.data)

const subtotal = computed(() => cartStore.totalPrice)
const adminFee = computed(() => Math.round(subtotal.value * 0.027)) // Example fee 2.7%
const total = computed(() => subtotal.value + adminFee.value)

async function handleCheckout() {
    if (!customerName.value || !customerPhone.value) {
        return toast.error({ title: 'Data Tidak Lengkap', message: 'Nama dan nomor telepon wajib diisi.' })
    }

    isSubmitting.value = true
    try {
        const payload = {
            outletId: cartStore.outletId,
            guestCustomer: {
                name: customerName.value,
                phone: customerPhone.value,
            },
            items: cartStore.items.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                bookingSlotId: item.bookingSlotId
            })),
            paymentMethod: selectedPaymentMethod.value,
        }

        const { data, error } = await useApi<OrderResponse>('/api/v1/orders', {
            method: 'POST',
            body: payload,
        })

        if (error.value) {
            throw error.value
        }

        const transactionToken = data.value?.data?.midtransTransactionToken
        if (transactionToken) {
            window.snap.pay(transactionToken, {
                onSuccess: function (result) {
                    toast.success({ title: 'Pembayaran Berhasil', message: 'Terima kasih atas pembayaran Anda.' })
                    cartStore.clearCart()
                    router.push(`/`) // Redirect to a success page or home
                },
                onPending: function (result) {
                    toast.info({ title: 'Menunggu Pembayaran', message: 'Selesaikan pembayaran Anda.' })
                },
                onError: function (result) {
                    toast.error({ title: 'Pembayaran Gagal', message: 'Silakan coba lagi.' })
                },
                onClose: function () {
                    toast.info({ title: 'Pembayaran Dibatalkan', message: 'Anda menutup popup pembayaran.' })
                }
            })
        } else {
            toast.error({ title: 'Gagal', message: 'Gagal memulai sesi pembayaran. Silakan coba lagi.' })
        }
    } catch (e: any) {
        const message = e.data?.errors?.[0]?.message || e.data?.message || 'Terjadi kesalahan saat membuat pesanan.'
        toast.error({ title: 'Checkout Gagal', message })
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div class="bg-gray-100 dark:bg-gray-900 min-h-screen">
        <div class="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
            <div class="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
                <BaseBack :to="`/outlets/${outletId}`" />
                <h1 class="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Pesanan</h1>
            </div>
        </div>

        <div class="max-w-3xl mx-auto p-4 space-y-4 pb-28">
            <!-- Order Items -->
            <BaseCard>
                <template #header>
                    <h2 class="font-semibold text-gray-900 dark:text-white">Pesanan Anda</h2>
                </template>
                <div class="divide-y divide-gray-200 dark:divide-gray-700">
                    <div v-for="item in cartStore.items" :key="item.product.id" class="py-3 flex items-start gap-4">
                        <div class="flex-grow">
                            <p class="font-medium text-gray-800 dark:text-gray-200">{{ item.quantity }}x {{
                                item.product.name }}</p>
                            <p v-if="item.bookingSlotId" class="text-xs text-gray-500 pl-5">
                                <Icon name="lucide:calendar-check" class="inline-block mr-1" />
                                Jadwal: {{ item.bookingSlotId }} <!-- Placeholder, needs formatting -->
                            </p>
                        </div>
                        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Rp{{ (item.product.price *
                            item.quantity).toLocaleString('id-ID') }}</p>
                    </div>
                </div>
            </BaseCard>

            <!-- Customer Details -->
            <BaseCard>
                <template #header>
                    <h2 class="font-semibold text-gray-900 dark:text-white">Detail Anda</h2>
                </template>
                <div class="space-y-4 p-4">
                    <UFormGroup label="Nama Lengkap" required>
                        <UInput v-model="customerName" placeholder="Masukkan nama Anda" />
                    </UFormGroup>
                    <UFormGroup label="Nomor Telepon" required>
                        <UInput v-model="customerPhone" placeholder="Contoh: 08123456789" type="tel" />
                    </UFormGroup>
                </div>
            </BaseCard>

            <!-- Payment Method -->
            <BaseCard>
                <template #header>
                    <h2 class="font-semibold text-gray-900 dark:text-white">Metode Pembayaran</h2>
                </template>
                <div class="p-4">
                    <URadioGroup v-model="selectedPaymentMethod" :options="paymentMethods" option-attribute="name"
                        value-attribute="id" />
                </div>
            </BaseCard>

            <!-- Payment Summary -->
            <BaseCard>
                <div class="p-4 space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Subtotal</span>
                        <span class="font-medium text-gray-800 dark:text-gray-200">Rp{{ subtotal.toLocaleString('id-ID')
                            }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Biaya Admin</span>
                        <span class="font-medium text-gray-800 dark:text-gray-200">Rp{{ adminFee.toLocaleString('id-ID')
                            }}</span>
                    </div>
                    <div
                        class="flex justify-between font-bold text-base pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                        <span>Total Pembayaran</span>
                        <span>Rp{{ total.toLocaleString('id-ID') }}</span>
                    </div>
                </div>
            </BaseCard>
        </div>

        <!-- Checkout Button -->
        <div
            class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
            <div class="max-w-3xl mx-auto">
                <UButton @click="handleCheckout" size="lg" block :loading="isSubmitting">
                    Bayar Sekarang
                </UButton>
            </div>
        </div>
    </div>
</template>
