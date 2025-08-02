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

const { data, pending, error, execute } = useApi<HomeData>('/home', {
  query: { search: searchQuery },
  lazy: true,
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
  const homeData = data.value
  return [
    { label: 'UMKM Terdaftar', value: formatNumber(homeData?.data?.umkm), icon: 'lucide:store' },
    { label: 'Transaksi', value: formatNumber(homeData?.data?.transactions), icon: 'lucide:chart-line' },
    { label: 'Total Membership', value: formatNumber(homeData?.data?.memberships), icon: 'lucide:users' }
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
    <!-- Hero Section dengan Search -->
    <section class="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-red-800">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-10 left-20 w-32 h-32 bg-white rounded-full"></div>
        <div class="absolute bottom-20 right-32 w-24 h-24 bg-white rounded-full"></div>
        <div class="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full"></div>
      </div>

      <div class="relative max-w-7xl mx-auto px-6 py-20">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-6xl font-bold text-white mb-6">
            Jelajahi Outlet
            <span class="block text-red-200">Terbaik</span>
          </h1>
          <p class="text-xl text-red-100 max-w-3xl mx-auto leading-relaxed">
            Temukan outlet terbaik dan terpercaya di platform kami dengan mudah dan cepat.
            Ribuan pilihan menanti Anda!
          </p>
        </div>

        <!-- Search Bar -->
        <div class="max-w-2xl mx-auto">
          <div class="relative">
            <Icon name="lucide:search"
              class="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
            <input v-model="searchQuery" type="text" placeholder="Cari outlet atau bisnis favorit Anda..."
              class="w-full pl-16 pr-16 py-5 text-lg border-0 rounded-2xl focus:ring-4 focus:ring-red-300 focus:outline-none bg-white dark:bg-gray-800 dark:text-white shadow-2xl hover:shadow-3xl transition-all duration-300" />
            <button v-if="searchQuery" @click="clearSearch"
              class="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-300">
              <Icon name="lucide:x" class="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Outlets Section -->
    <section class="py-20 px-6 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto">
        <!-- Section Header -->
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            {{ searchQuery ? 'Hasil Pencarian' : 'Outlet Unggulan' }}
          </h2>
          <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {{ searchQuery ? `Menampilkan hasil pencarian untuk "${searchQuery}"` : `Outlet pilihan terbaik yang telah
            terpercaya dan berkualitas tinggi` }}
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="pending" class="flex justify-center py-20">
          <div class="text-center">
            <div class="relative mb-8">
              <div
                class="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center animate-pulse">
                <Icon name="lucide:store" class="h-10 w-10 text-white" />
              </div>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">Sedang memuat outlet...</h3>
            <p class="text-gray-600 dark:text-gray-400">Mohon tunggu sebentar, kami sedang menyiapkan yang terbaik untuk
              Anda</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-20">
          <div
            class="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Icon name="lucide:wifi-off" class="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Oops! Terjadi kesalahan</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Sepertinya ada masalah dengan koneksi. Jangan khawatir, mari coba lagi!
          </p>
          <button @click="() => execute()"
            class="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            <Icon name="lucide:refresh-cw" class="h-5 w-5 mr-3" />
            Coba Lagi
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="!outlets.length" class="text-center py-20">
          <div
            class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-8">
            <Icon name="lucide:search-x" class="h-10 w-10 text-gray-400" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {{ searchQuery ? 'Tidak ada outlet yang ditemukan' : 'Belum ada outlet terdaftar' }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {{ searchQuery ? 'Coba gunakan kata kunci yang berbeda atau lebih spesifik untuk hasil yang lebih baik.' :
              'Saat ini belum ada outlet yang terdaftar. Silakan coba lagi nanti!' }}
          </p>
          <button v-if="searchQuery" @click="clearSearch"
            class="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            <Icon name="lucide:rotate-ccw" class="h-5 w-5 mr-3" />
            Reset Pencarian
          </button>
        </div>

        <!-- Outlet Cards Grid -->
        <div v-else>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <div v-for="outlet in outlets" :key="outlet.id" class="group cursor-pointer">
              <NuxtLink :to="`/outlets/${outlet.id}`">
                <div
                  class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-600 transform hover:-translate-y-2">
                  <!-- Image Section -->
                  <div class="relative h-56 overflow-hidden">
                    <NuxtImg v-if="outlet.image" :src="outlet.image" :alt="outlet.name"
                      class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div v-else
                      class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                      <div class="text-center">
                        <Icon name="lucide:store" class="h-16 w-16 text-gray-400 mx-auto mb-3" />
                        <p class="text-gray-500 dark:text-gray-400 font-medium">Foto Segera Hadir</p>
                      </div>
                    </div>
                  </div>

                  <!-- Content Section -->
                  <div class="p-6">
                    <h3
                      class="font-bold text-xl text-gray-900 dark:text-white mb-3 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300 line-clamp-2">
                      {{ outlet.business?.name || 'Nama Bisnis' }}
                    </h3>

                    <p class="text-gray-600 dark:text-gray-400 mb-4 font-medium text-lg">
                      📍 {{ outlet.name }}
                    </p>

                    <div class="flex items-start text-gray-500 dark:text-gray-400 mb-6">
                      <Icon name="lucide:map-pin"
                        class="h-5 w-5 mr-3 text-red-500 dark:text-red-400 flex-shrink-0 mt-1" />
                      <span class="line-clamp-2 leading-relaxed">{{ outlet.address }}</span>
                    </div>

                    <!-- Rating & Action -->
                    <div class="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
                      <div class="flex items-center">
                        <div class="flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-xl">
                          <Icon name="lucide:star" class="h-5 w-5 text-yellow-500 mr-2" />
                          <span class="text-lg font-bold text-yellow-600 dark:text-yellow-400">4.9</span>
                        </div>
                        <span class="text-sm text-gray-500 dark:text-gray-400 ml-3">(148 ulasan)</span>
                      </div>
                      <div
                        class="flex items-center text-red-600 dark:text-red-400 font-bold group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors duration-300">
                        <span class="mr-2">Lihat Detail</span>
                        <Icon name="lucide:arrow-right"
                          class="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- Load More Button -->
          <div v-if="!searchQuery && outlets.length >= 6" class="text-center mt-20">
            <NuxtLink to="/outlets">
              <button
                class="bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-2">
                <Icon name="lucide:grid-3x3" class="h-6 w-6 mr-4" />
                Jelajahi Semua Outlet
              </button>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Statistics Section -->
    <section
      class="py-24 bg-gradient-to-br from-white via-gray-50 to-red-50 dark:from-gray-800 dark:via-gray-900 dark:to-red-950">
      <div class="max-w-7xl mx-auto px-6">
        <!-- Section Header -->
        <div class="text-center mb-20">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            🚀 Statistik Platform
          </h2>
          <p class="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Bergabunglah dengan ribuan UMKM Indonesia yang telah mempercayai platform kami untuk berkembang bersama
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="pending && !data" class="flex justify-center py-16">
          <div class="text-center">
            <div
              class="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <Icon name="lucide:bar-chart-3" class="h-8 w-8 text-white" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Menghitung statistik terbaru...</h3>
            <p class="text-gray-600 dark:text-gray-400">Mohon tunggu sebentar</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error && !data" class="text-center py-16">
          <div
            class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon name="lucide:alert-circle" class="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Gagal memuat statistik</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-8">Terjadi kesalahan saat memuat data statistik.</p>
          <button @click="() => execute()"
            class="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            <Icon name="lucide:refresh-cw" class="h-5 w-5 mr-3" />
            Coba Lagi
          </button>
        </div>

        <!-- Statistics Cards -->
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div v-for="(stat, index) in stats" :key="stat.label" class="group relative">

            <!-- Card with Modern Design -->
            <div
              class="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-600 transform hover:-translate-y-3 relative overflow-hidden">

              <!-- Background Gradient -->
              <div
                class="absolute inset-0 bg-gradient-to-br from-red-50 via-transparent to-transparent dark:from-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              </div>

              <div class="relative text-center">
                <!-- Icon with Premium Design -->
                <div
                  class="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-8 bg-gradient-to-br from-red-500 to-red-600 shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                  <Icon :name="stat.icon" class="h-12 w-12 text-white" />
                </div>

                <!-- Big Number with Animation -->
                <div
                  class="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-500">
                  {{ stat.value }}
                </div>

                <!-- Label with Style -->
                <div
                  class="text-xl font-bold text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">
                  {{ stat.label }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Message -->
        <div class="text-center mt-20">
          <div
            class="inline-flex items-center bg-white dark:bg-gray-800 px-8 py-4 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <Icon name="lucide:trending-up" class="h-6 w-6 text-red-500 mr-3" />
            <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Data diperbarui secara real-time untuk memberikan informasi terkini
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>