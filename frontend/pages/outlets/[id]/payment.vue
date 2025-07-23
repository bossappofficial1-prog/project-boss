<script setup>
import { useCartStore } from '~/stores/cart'

const cartStore = useCartStore()
const selectedProduct = computed(() => cartStore.selectedProduct)

const quantity = ref(1)
const subtotal = computed(() => selectedProduct.value ? quantity.value * selectedProduct.value.price : 0)

async function handleCheckout() {
    const { data, error } = await useFetch('/api/orders', {
        method: 'POST',
        body: {
            customerId: 'user-1', // dummy
            outletId: selectedProduct.value.outletId || 'outlet-1',
            totalAmount: subtotal.value,
            items: [
                {
                    productId: selectedProduct.value.id,
                    quantity: quantity.value,
                    price: selectedProduct.value.price
                }
            ]
        }
    })

    if (data.value?.success) {
        alert(`Order berhasil dibuat, token: ${data.value.data.midtransTransactionToken}`)
        cartStore.clearCart()
        navigateTo('/home')
    } else {
        alert('Gagal membuat order')
    }
}
</script>

<template>
    <div class="max-w-xl mx-auto py-12">
        <div class="absolute top-16 left-4">
            <BaseBack />
        </div>
        <h1 class="text-2xl font-bold mb-6">Pembayaran Produk</h1>

        <div v-if="selectedProduct">
            <div class="mb-4">
                <p class="font-medium text-lg">{{ selectedProduct.name }}</p>
                <p class="text-gray-500">{{ selectedProduct.description }}</p>
            </div>

            <div class="flex items-center mb-4">
                <span class="mr-2">Jumlah:</span>
                <input v-model="quantity" type="number" min="1" class="border rounded px-3 py-1 w-20" />
            </div>

            <div class="text-xl font-bold mb-6">
                Subtotal: Rp{{ subtotal.toLocaleString() }}
            </div>

            <BaseButton variant="primary" @click="handleCheckout">Bayar Sekarang</BaseButton>
        </div>

        <div v-else class="text-gray-500">Belum ada produk dipilih.</div>
    </div>
</template>
