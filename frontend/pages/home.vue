<script setup lang="ts">
import type { Outlet } from '~/types'

interface HomeData {
  umkm: number
  total_transaction: number
  total_membership: number
}
interface StatItem {
  label: string
  value: string
  icon: string
}

const search = ref('');

const {
  data: outletsResponse,
  error: outletError,
  pending: outletPending,
  execute: outletExecute
} = await useApi<Outlet[]>('/api/outlets', {
  query: {
    limit: 3,
    search: search.value,
  },
  lazy: true
})

const outlets = computed(() => outletsResponse.value?.data || [])

const {
  data: homeResponse,
  error: homeError,
  pending: homePending,
  execute: homeExecute
} = await useApi<HomeData>('/api/home', { lazy: true },)

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M+'
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K+'
  return num.toString()
}

const stats = ref<StatItem[]>([
  { label: 'UMKM Terdaftar', value: '0', icon: 'lucide:store' },
  { label: 'Transaksi', value: '0', icon: 'lucide:chart-line' },
  { label: 'Total Membership', value: '0', icon: 'lucide:users' }
])

watch(
  () => homeResponse.value?.data,
  (val) => {
    if (!val) return
    stats.value = [
      { label: 'UMKM Terdaftar', value: formatNumber(val.umkm), icon: 'lucide:store' },
      { label: 'Transaksi', value: formatNumber(val.total_transaction), icon: 'lucide:chart-line' },
      { label: 'Total Membership', value: formatNumber(val.total_membership), icon: 'lucide:users' }
    ]
  }
)

onMounted(async () => {
  await outletExecute()
  await homeExecute()
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Featured Businesses -->
    <section class="py-6 px-2 md:px-3 lg:px-5 xl:px-8 bg-white dark:bg-gray-900">
      <div class="mb-6 flex w-full items-center justify-between">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
          Outlet Unggulan
        </h2>
        <div class="flex">
          <input v-model="search" @keydown.enter="() => outletExecute()" type="text" placeholder="Cari outlet..."
            class="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-gray-800 dark:text-white" />
          <BaseButton variant="primary" class="rounded-r-lg rounded-l-none pr-2" @click="outletExecute">
            <Icon name="lucide:search" class="h-5 w-5" />
          </BaseButton>
        </div>
      </div>

      <div v-if="outletPending" class="flex justify-center items-center space-x-2 text-primary-700">
        <Icon name="line-md:loading-alt-loop" class="h-8 w-8" />
        <span>Sedang memuat data...</span>
      </div>
      <div v-else-if="outletError" class="text-center text-red-700">Terjadi kesalahan: {{ outletError.message }}</div>
      <div v-else class="grid md:grid-cols-3 gap-8">
        <BaseCard v-for="outlet in outlets" :key="outlet.id" hover clickable padding="none"
          class="overflow-hidden group">
          <NuxtImg v-if="outlet.image" :src="outlet.image" :alt="outlet.name"
            class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
          <div v-else
            class="w-full h-48 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 text-sm">
            Tidak ada gambar
          </div>

          <div class="p-6">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{{ outlet.business?.name }}</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              {{ outlet.name }}
            </p>

            <div class="flex items-center justify-between">
              <div class="flex items-center text-gray-500 dark:text-gray-400">
                <Icon name="mdi:map-marker" size="16" class="mr-1" />
                <span class="text-sm">{{ outlet.address }}</span>
              </div>
              <NuxtLink :to="`/outlets/${outlet.id}`">
                <BaseButton size="sm" variant="outline">
                  Lihat Detail
                </BaseButton>
              </NuxtLink>
            </div>
          </div>
        </BaseCard>
      </div>
    </section>

    <!-- Stats Section -->
    <div v-if="homePending" class="flex justify-center items-center space-x-2 text-primary-700">
      <Icon name="line-md:loading-alt-loop" class="h-8 w-8" />
      <span>Sedang memuat data...</span>
    </div>
    <div v-else-if="homeError" class="text-center text-red-700">Terjadi kesalahan: {{ homeError.message }}</div>
    <section v-else class="py-16 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="stat in stats" :key="stat.label" class="text-center group">
            <div
              class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Icon :name="stat.icon" size="32" class="text-primary-600 dark:text-primary-400" />
            </div>
            <div class="text-3xl font-bold text-gray-900 dark:text-white mb-2">{{ stat.value }}</div>
            <div class="text-gray-600 dark:text-gray-400">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>