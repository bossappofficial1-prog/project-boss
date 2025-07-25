<script setup lang="ts">
import type { Outlet } from '~/types'
import { useDebounceFn } from '@vueuse/core'

interface HomeData {
  umkm: number
  transactions: number
  memberships: number
  outlets: Outlet[]
}

interface StatItem {
  label: string
  value: string
  icon: string
}

const searchQuery = ref('');

const { data, pending, error, execute } = useApi<HomeData>('/api/v1/home', {
  query: { search: searchQuery },
  lazy: true, // Set to true to prevent initial fetch
  immediate: false
})

const debouncedFetch = useDebounceFn(() => {
  execute()
}, 500)

watch(searchQuery, () => {
  debouncedFetch()
})

const outlets = computed(() => data.value?.data?.outlets || [])

function formatNumber(num: number = 0): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M+'
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K+'
  return num.toString()
}

const stats = computed<StatItem[]>(() => {
  const homeData = data.value?.data
  return [
    { label: 'UMKM Terdaftar', value: formatNumber(homeData?.umkm), icon: 'lucide:store' },
    { label: 'Transaksi', value: formatNumber(homeData?.transactions), icon: 'lucide:chart-line' },
    { label: 'Total Membership', value: formatNumber(homeData?.memberships), icon: 'lucide:users' }
  ]
})

const clearSearch = () => {
  searchQuery.value = ''
}

onMounted(() => {
  execute()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Search Section - Header -->
    <section class="py-8 bg-white dark:bg-gray-800">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              Jelajahi Outlet
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Temukan outlet terbaik di platform kami.
            </p>
          </div>
          <div class="relative w-full sm:w-auto">
            <Icon name="lucide:search"
              class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input v-model="searchQuery" type="text" placeholder="Cari outlet atau bisnis..."
              class="w-full sm:w-64 pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white dark:bg-gray-700 dark:text-white transition-all duration-300" />
            <button v-if="searchQuery" @click="clearSearch"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <Icon name="lucide:x" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Businesses -->
    <section class="py-12 px-4 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto">
        <div v-if="pending">
          <BaseLoading size="lg" text="Sedang memuat data..." variant="spinner" />
        </div>
        <div v-else-if="error">
          <BaseErrorState :error="error" title="Gagal Memuat Data"
            description="Terjadi kesalahan saat memuat data. Silakan coba lagi." @retry="execute"
            icon="lucide:wifi-off" />
        </div>
        <div v-else-if="!outlets.length">
          <BaseEmptyState icon="lucide:search-x" title="Tidak Ada Outlet Ditemukan"
            :description="searchQuery ? 'Coba gunakan kata kunci yang berbeda.' : 'Belum ada outlet yang terdaftar.'"
            :action-text="searchQuery ? 'Reset Pencarian' : ''" action-icon="lucide:rotate-ccw" @action="clearSearch" />
        </div>
        <div v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <NuxtLink v-for="outlet in outlets" :key="outlet.id" :to="`/outlets/${outlet.id}`">
              <BaseCard hover clickable padding="none"
                class="overflow-hidden group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                <div class="relative">
                  <NuxtImg v-if="outlet.image" :src="outlet.image" :alt="outlet.name"
                    class="w-full h-48 object-cover" />
                  <div v-else class="w-full h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <Icon name="lucide:image" class="h-12 w-12 text-gray-400" />
                  </div>
                  <div v-if="!searchQuery" class="absolute top-3 left-3">
                    <span class="px-2.5 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">
                      Unggulan
                    </span>
                  </div>
                </div>
                <div class="p-4">
                  <h3
                    class="font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors duration-300 truncate">
                    {{ outlet.business?.name || 'Nama Bisnis' }}
                  </h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {{ outlet.name }}
                  </p>
                  <div class="flex items-start text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <Icon name="mdi:map-marker" class="h-5 w-5 mr-1.5 text-gray-400 flex-shrink-0" />
                    <span class="line-clamp-2">{{ outlet.address }}</span>
                  </div>
                </div>
              </BaseCard>
            </NuxtLink>
          </div>
          <div v-if="!searchQuery && outlets.length >= 6" class="text-center mt-12">
            <NuxtLink to="/outlets">
              <BaseButton variant="outline" size="lg" class="px-8 py-3">
                <Icon name="lucide:plus" class="h-5 w-5 mr-2" />
                Lihat Semua Outlet
              </BaseButton>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section - Moved Below Outlets -->
    <section class="py-16 bg-white dark:bg-gray-800">
      <div class="max-w-7xl mx-auto px-4">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Statistik Platform
        </h2>
        <div v-if="pending && !data">
          <BaseLoading size="md" text="Memuat statistik..." variant="dots" />
        </div>
        <div v-else-if="error && !data">
          <BaseErrorState :error="error" title="Gagal Memuat Statistik" @retry="execute" compact />
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div v-for="stat in stats" :key="stat.label" class="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-center">
            <Icon :name="stat.icon" size="28" class="text-primary-600 dark:text-primary-400 mx-auto mb-3" />
            <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
