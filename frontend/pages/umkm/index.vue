<template>
  <div class="space-y-6">
    <!-- Outlet Selection Screen -->
    <div v-if="!auth.outletFokus" class="max-w-2xl mx-auto">
      <BaseCard padding="p-8">
        <div class="text-center mb-8">
          <div class="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="mdi:store" size="40" class="text-primary-600 dark:text-primary-400" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Selamat Datang di Dashboard UMKM
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Pilih outlet untuk memulai mengelola bisnis Anda
          </p>
        </div>
      </BaseCard>
    </div>

    <!-- Dashboard Content -->
    <div v-else>
      <!-- Header with Back Button -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-4">
          <button
            @click="handleBackToOutletSelection"
            class="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <Icon name="mdi:arrow-left" size="20" />
            <span class="text-sm font-medium">Ganti Outlet</span>
          </button>
          <div class="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Dashboard
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ outletName || 'Belum pilih outlet' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Outlet Info Card -->
      <BaseCard class="mb-6" hover>
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <Icon name="mdi:store" size="24" class="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ outletName }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Outlet ID: {{ outletId }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm font-medium text-green-600 dark:text-green-400">
              Aktif
            </span>
          </div>
        </div>
      </BaseCard>

      <!-- Dashboard Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <BaseCard hover class="text-center">
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Icon name="mdi:package-variant" size="24" class="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">24</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">Total Produk</p>
        </BaseCard>

        <BaseCard hover class="text-center">
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Icon name="mdi:clipboard-list" size="24" class="text-green-600 dark:text-green-400" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">12</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">Pesanan Hari Ini</p>
        </BaseCard>

        <BaseCard hover class="text-center">
          <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Icon name="mdi:account-group" size="24" class="text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">8</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">Antrian Saat Ini</p>
        </BaseCard>

        <BaseCard hover class="text-center">
          <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Icon name="mdi:currency-usd" size="24" class="text-purple-600 dark:text-purple-400" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">2.5M</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">Omzet Bulan Ini</p>
        </BaseCard>
      </div>

      <!-- Quick Actions -->
      <BaseCard>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Aksi Cepat
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NuxtLink 
            to="/umkm/products"
            class="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 transition-colors group"
          >
            <Icon name="mdi:plus" size="24" class="text-gray-400 group-hover:text-primary-500 mb-2" />
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-500">
              Tambah Produk
            </span>
          </NuxtLink>

          <NuxtLink 
            to="/umkm/orders"
            class="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 transition-colors group"
          >
            <Icon name="mdi:clipboard-list" size="24" class="text-gray-400 group-hover:text-primary-500 mb-2" />
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-500">
              Lihat Pesanan
            </span>
          </NuxtLink>

          <NuxtLink 
            to="/umkm/queue"
            class="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 transition-colors group"
          >
            <Icon name="mdi:account-group" size="24" class="text-gray-400 group-hover:text-primary-500 mb-2" />
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-500">
              Kelola Antrian
            </span>
          </NuxtLink>

          <NuxtLink 
            to="/umkm/reports"
            class="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 transition-colors group"
          >
            <Icon name="mdi:chart-line" size="24" class="text-gray-400 group-hover:text-primary-500 mb-2" />
            <span class="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-500">
              Lihat Laporan
            </span>
          </NuxtLink>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'

definePageMeta({
  layout: 'umkm'
})

const auth = useAuthStore()
console.log('Auth Store:', auth);

const outletId = computed(() => auth.outletFokus?.id || 'Tidak ada ID outlet')
const outletName = computed(() => auth.outletFokus?.name || 'Belum pilih outlet')

const handleBackToOutletSelection = () => {
  auth.setOutletFokus(null)
}
</script>
