<script setup>
import { useRoute } from 'vue-router'
import { useCartStore } from '@/stores/useCartStore'

const route = useRoute()
const outletId = route.params.id

const { data: outletRes, error, pending } = await useLazyFetch(`/api/outlets/${outletId}`)

const outlet = computed(() => outletRes.value?.data || {})

const cartStore = useCartStore()

function handleSelectProduct(product) {
  cartStore.setSelectedProduct(product)
  navigateTo(`/outlets/${outletId}/payment`)
}
</script>

<template>
  <div class="relative">
    <div class="absolute top-4 left-4">
      <BaseBack />
    </div>

    <section class="py-6 bg-white dark:bg-gray-900">
      <div class="max-w-5xl mx-auto px-4">
        <div v-if="pending" class="flex justify-center items-center space-x-2 text-primary-700">
          <Icon name="line-md:loading-alt-loop" class="h-8 w-8" />
          <span>Memuat detail outlet...</span>
        </div>

        <div v-else-if="error" class="text-center text-red-700">
          Terjadi kesalahan: {{ error.message }}
        </div>

        <div v-else>
          <!-- Info Outlet -->
          <div class="text-center mb-10">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {{ outlet.business.name }}
            </h1>
            <h2 class="text-xl text-primary-600 dark:text-primary-400">
              {{ outlet.name }}
            </h2>
            <p class="text-gray-600 dark:text-gray-400 mt-2">
              {{ outlet.address }} — {{ outlet.phone }}
            </p>
          </div>

          <!-- Daftar Produk -->
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BaseCard v-for="product in outlet.products" :key="product.id" hover class="overflow-hidden"
              @click="handleSelectProduct(product)">
              <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {{ product.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {{ product.description }}
                </p>
                <div class="text-primary-600 dark:text-primary-400 font-bold mb-1">
                  Rp{{ product.price.toLocaleString() }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Stok: {{ product.stock }} {{ product.unit }}
                </div>
              </div>
            </BaseCard>
          </div>

          <div v-if="!outlet.products?.length" class="text-center text-gray-500 dark:text-gray-400 mt-6">
            Tidak ada produk tersedia.
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
