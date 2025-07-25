<template>
    <div class="min-h-screen bg-gray-50 py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Progress Steps -->
            <div class="max-w-4xl mx-auto mb-12">
                <div class="flex items-center justify-center space-x-4">
                    <div class="flex items-center">
                        <div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <i class="fas fa-shopping-cart text-sm"></i>
                        </div>
                        <div class="ml-2 text-sm font-medium text-indigo-600">Keranjang</div>
                    </div>
                    <div class="w-16 h-0.5 bg-indigo-600"></div>
                    <div class="flex items-center">
                        <div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <i class="fas fa-credit-card text-sm"></i>
                        </div>
                        <div class="ml-2 text-sm font-medium text-indigo-600">Pembayaran</div>
                    </div>
                    <div class="w-16 h-0.5 bg-gray-200"></div>
                    <div class="flex items-center">
                        <div class="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center">
                            <i class="fas fa-check text-sm"></i>
                        </div>
                        <div class="ml-2 text-sm font-medium text-gray-400">Selesai</div>
                    </div>
                </div>
            </div>

            <div class="max-w-4xl mx-auto">
                <div class="bg-white shadow-sm rounded-xl overflow-hidden">
                    <div class="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                        <!-- Order Summary -->
                        <div class="p-6 md:col-span-3 space-y-6">
                            <div class="flow-root">
                                <h2 class="text-lg font-medium text-gray-900 mb-6">Ringkasan Pesanan</h2>
                                <ul class="divide-y divide-gray-200">
                                    <li v-for="item in cartStore.items" :key="item.product.id" class="py-4 flex">
                                        <div class="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                                            <img :src="item.product.image || '/images/default-product.png'"
                                                :alt="item.product.name" class="w-full h-full object-cover">
                                        </div>
                                        <div class="ml-4 flex-1">
                                            <div class="flex justify-between">
                                                <h3 class="text-sm font-medium text-gray-900">{{ item.product.name }}
                                                </h3>
                                                <p class="text-sm font-medium text-gray-900">
                                                    {{ new Intl.NumberFormat('id-ID', {
                                                        style: 'currency', currency:
                                                            'IDR'
                                                    }).format(item.product.price * item.quantity) }}
                                                </p>
                                            </div>
                                            <p class="mt-1 text-sm text-gray-500">Qty: {{ item.quantity }}</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <!-- Price Summary -->
                            <div class="border rounded-xl bg-gray-50/50 p-4">
                                <h3 class="text-sm font-medium text-gray-900 mb-4">Rincian Pembayaran</h3>
                                <div class="space-y-3">
                                    <div class="flex justify-between text-sm">
                                        <p class="text-gray-500">Subtotal Produk</p>
                                        <p class="font-medium text-gray-900">
                                            {{ formatPrice(subtotal) }}
                                        </p>
                                    </div>
                                    <div class="flex justify-between text-sm">
                                        <div class="flex items-center">
                                            <p class="text-gray-500">Biaya Platform (3%)</p>
                                            <i class="fas fa-info-circle text-gray-400 ml-1 cursor-help"
                                                title="Biaya layanan platform untuk pengembangan sistem"></i>
                                        </div>
                                        <p class="font-medium text-gray-900">
                                            {{ formatPrice(platformFee) }}
                                        </p>
                                    </div>
                                    <div class="flex justify-between text-sm">
                                        <div class="flex items-center">
                                            <p class="text-gray-500">Biaya Payment Gateway (1%)</p>
                                            <i class="fas fa-info-circle text-gray-400 ml-1 cursor-help"
                                                title="Biaya transaksi payment gateway"></i>
                                        </div>
                                        <p class="font-medium text-gray-900">
                                            {{ formatPrice(paymentFee) }}
                                        </p>
                                    </div>
                                    <div class="pt-3 border-t border-gray-200">
                                        <div class="flex justify-between text-base font-medium">
                                            <p class="text-gray-900">Total Pembayaran</p>
                                            <p class="text-indigo-600">{{ formatPrice(total) }}</p>
                                        </div>
                                        <p class="mt-1 text-xs text-gray-500 text-right">Sudah termasuk semua biaya</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Form Guest Info & Tombol Bayar -->
                        <div class="p-6 md:col-span-2 flex flex-col justify-center">
                            <form @submit.prevent="handlePayment" class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Nama Pemesan</label>
                                    <input v-model="guestName" type="text" required placeholder="Nama lengkap"
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
                                    <input v-model="guestPhone" type="tel" required placeholder="08xxxxxxxxxx"
                                        class="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <button type="submit" :disabled="isProcessing"
                                    class="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-xl text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                                    <i class="fas fa-lock mr-2"></i>
                                    {{ isProcessing ? 'Memproses...' : 'Bayar Sekarang' }}
                                </button>
                            </form>
                            <p class="mt-4 text-sm text-center text-gray-500 flex items-center justify-center">
                                <i class="fas fa-shield-alt text-indigo-600 mr-2"></i>
                                Pembayaran aman & terenkripsi
                            </p>
                            <div v-if="paymentInstruction"
                                class="mt-6 p-4 border rounded-xl bg-green-50 text-green-800">
                                <h4 class="font-semibold mb-2">Instruksi Pembayaran</h4>
                                <div v-html="paymentInstruction"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useApi } from '@/composables/useApi'

const cartStore = useCartStore()
const router = useRouter()
const route = useRoute()

const isProcessing = ref(false)
const guestName = ref('')
const guestPhone = ref('')
const paymentInstruction = ref('')

// Perhitungan biaya
const subtotal = computed(() => cartStore.totalPrice)
const platformFee = computed(() => Math.round(subtotal.value * 0.03)) // 3% platform fee
const paymentFee = computed(() => Math.round(subtotal.value * 0.01)) // 1% payment gateway fee
const total = computed(() => subtotal.value + platformFee.value + paymentFee.value)

function formatPrice(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}

async function handlePayment() {
    if (!guestName.value || !guestPhone.value) {
        alert('Nama dan nomor WhatsApp wajib diisi')
        return
    }
    try {
        isProcessing.value = true

        const { data, error } = await useApi('/api/v1/orders', {
            method: 'POST',
            body: {
                outletId: route.params.id,
                items: cartStore.items.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity
                })),
                guestCustomer: {
                    name: guestName.value,
                    email: '', // opsional, bisa tambahkan input jika perlu
                    phone: guestPhone.value
                }
            }
        })

        if (error.value) {
            throw new Error(error.value.message || 'Terjadi kesalahan saat memproses pembayaran')
        }

        if (!data.value?.success) {
            throw new Error(data.value?.message || 'Terjadi kesalahan saat memproses pembayaran')
        }

        // Asumsikan backend mengembalikan instruksi pembayaran custom (misal: VA, QR, atau instruksi manual)
        const { paymentInstruction: instruksi, paymentInfo } = data.value.data || {}
        if (instruksi) {
            paymentInstruction.value = instruksi
        } else if (paymentInfo) {
            // fallback: render info pembayaran (misal: nomor VA, QR, dsb)
            paymentInstruction.value = `<pre>${JSON.stringify(paymentInfo, null, 2)}</pre>`
        } else {
            paymentInstruction.value = 'Pesanan berhasil dibuat. Silakan cek WhatsApp Anda untuk instruksi pembayaran.'
        }
        cartStore.clearCart()
    } catch (error) {
        alert(error.message)
    } finally {
        isProcessing.value = false
    }
}

// Redirect if cart is empty
if (cartStore.isEmpty) {
    router.push(`/outlets/${route.params.id}`)
}
</script>
