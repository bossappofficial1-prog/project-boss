<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const orderId = computed(() => route.query.order_id as string)
const status = computed(() => route.query.status as string)
const outletId = computed(() => route.params.id as string)

const statusInfo = computed(() => {
    if (status.value === 'success') {
        return {
            icon: 'lucide:check-circle-2',
            iconClass: 'text-green-500',
            title: 'Pembayaran Berhasil',
            message: `Pesanan Anda dengan ID ${orderId.value} telah berhasil diproses. Terima kasih telah memesan!`,
            buttonText: 'Kembali ke Outlet',
            buttonAction: () => { router.push(`/outlets/${outletId.value}`); }
        }
    }
    if (status.value === 'pending') {
        return {
            icon: 'lucide:hourglass',
            iconClass: 'text-yellow-500',
            title: 'Menunggu Pembayaran',
            message: `Pesanan Anda dengan ID ${orderId.value} sedang menunggu pembayaran. Silakan selesaikan pembayaran Anda.`,
            buttonText: 'Kembali ke Halaman Utama',
            buttonAction: () => { router.push('/'); }
        }
    }
    return {
        icon: 'lucide:x-circle',
        iconClass: 'text-red-500',
        title: 'Status Tidak Diketahui',
        message: `Terjadi masalah dengan pesanan Anda. Silakan hubungi dukungan jika masalah berlanjut.`,
        buttonText: 'Kembali ke Halaman Utama',
        buttonAction: () => { router.push('/'); }
    }
})

// Load Midtrans Snap script
useHead({
    script: [
        {
            src: 'https://app.sandbox.midtrans.com/snap/snap.js',
            'data-client-key': 'YOUR_MIDTRANS_CLIENT_KEY' // Replace with your actual client key
        }
    ]
})
</script>

<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div class="max-w-md w-full mx-auto">
            <div
                class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 text-center p-6 sm:p-10">
                <div class="flex justify-center mb-6">
                    <Icon :name="statusInfo.icon" :class="statusInfo.iconClass" class="h-20 w-20 sm:h-24 sm:w-24" />
                </div>
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">{{ statusInfo.title }}</h1>
                <p class="text-gray-600 dark:text-gray-400 mb-8 text-sm sm:text-base">
                    {{ statusInfo.message }}
                </p>
                <UButton @click="statusInfo.buttonAction" size="lg" block>
                    {{ statusInfo.buttonText }}
                </UButton>
            </div>
        </div>
    </div>
</template>
