<script setup>
import { useRoute } from 'vue-router'
import { useCartStore } from '~/stores/cart'

const route = useRoute()
const outletId = route.params.id

const { data: outletRes, error:errorO, pending:pendingO, execute: executeOutlet } = useApi(`/outlets/${outletId}`)
const { data: productRes, error:errorP, pending:pendingP, execute: executeProduct } = useApi(`/outlets/${outletId}/products`, {
  query:{
    search:"GOODS"
  }
}, true)
const { data: serviceRes, error:errorS, pending:pendingS, execute: executeService } = useApi(`/outlets/${outletId}/products`, {
  query:{
    search:"SERVICE"
  }
}, true)

const outlet = computed(() => outletRes.value?.data || {})
const products = computed(() => productRes.value?.data || {})
const services = computed(() => serviceRes.value?.data || {})

const cartStore = useCartStore()

function handleSelectProduct(product) {
  cartStore.setSelectedProduct(product)
  navigateTo(`/outlets/${outletId}/payment`)
}
function handleSelectService(product) {
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
        <div v-if="pendingO" class="flex justify-center items-center space-x-2 text-primary-700">
          <Icon name="line-md:loading-alt-loop" class="h-8 w-8" />
          <span>Memuat detail outlet...</span>
        </div>

        <div v-else-if="errorO" class="text-center text-red-700">
          Terjadi kesalahan: {{ errorO.message }}
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

          
          <h2 class="text-xl text-primary-600 dark:text-primary-400">
              Daftar Produk
            </h2>
        <div v-if="pendingP" class="flex justify-center items-center space-x-2 text-primary-700">
          <Icon name="line-md:loading-alt-loop" class="h-8 w-8" />
          <span>Memuat data produk...</span>
        </div>

        <div v-else-if="errorP" class="text-center text-red-700">
          Terjadi kesalahan: {{ errorO.message }}
        </div>
        <template v-else>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BaseCard v-for="product in products" :key="product.id" hover class="overflow-hidden"
              @click="handleSelectProduct(product)">
              
            <NuxtImg v-if="product.image" :src="product.image" :alt="product.name"
              class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {{ product.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {{ product.description }}
                </p>
                <div class="text-primary-600 dark:text-primary-400 font-bold mb-1">
                  Rp{{ product.price }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Stok: {{ product.stock }} {{ product.unit }}
                </div>
              </div>
            </BaseCard>
          </div>

          <div v-if="!products?.length" class="text-center text-gray-500 dark:text-gray-400 mt-6">
            Tidak ada produk tersedia.
          </div>
        </template>
        
          <h2 class="text-xl text-primary-600 dark:text-primary-400">
              Daftar Layanan
            </h2>
        <div v-if="pendingP" class="flex justify-center items-center space-x-2 text-primary-700">
          <Icon name="line-md:loading-alt-loop" class="h-8 w-8" />
          <span>Memuat data layanan...</span>
        </div>

        <div v-else-if="errorP" class="text-center text-red-700">
          Terjadi kesalahan: {{ errorO.message }}
        </div>
        <template v-else>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BaseCard v-for="service in services" :key="service.id" hover class="overflow-hidden"
              @click="handleSelectService(service)">
              
            <NuxtImg v-if="service.image" :src="service.image" :alt="service.name"
              class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {{ service.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {{ service.description }}
                </p>
                <div class="text-primary-600 dark:text-primary-400 font-bold mb-1">
                  Rp{{ service.price }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Stok: {{ service.stock }} {{ service.unit }}
                </div>
              </div>
            </BaseCard>
          </div>

          <div v-if="!services?.length" class="text-center text-gray-500 dark:text-gray-400 mt-6">
            Tidak ada layanan tersedia.
          </div>
        </template>
        </div>
      </div>
    </section>
  </div>
</template>
