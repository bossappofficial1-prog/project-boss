<script setup>
const { data: outletsRes, error, pending, execute } = await useApi('/outlets', {
  query: {
    limit: 3
  }
}, true)

const outlets = computed(() => outletsRes.value?.data || [])

const stats = ref([
  { label: 'UMKM Terdaftar', value: '1,200+', icon: 'mdi:store' },
  { label: 'Transaksi Berhasil', value: '15,000+', icon: 'mdi:chart-line' },
  { label: 'Pengguna Aktif', value: '8,500+', icon: 'mdi:account-group' }
])

onMounted( async ()=>{
  await execute()
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Featured Businesses -->
    <section class="py-6 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Outlet Unggulan
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Temukan Outlet terbaik yang telah dipercaya oleh ribuan pelanggan
          </p>
        </div>

        <div v-if="pending" class="flex justify-center items-center space-x-2 text-primary-700">
          <Icon name="line-md:loading-alt-loop" class="h-8 w-8" />
          <span>Sedang memuat data...</span>
        </div>
        <div v-else-if="error" class="text-center text-red-700">Terjadi kesalahan: {{ error.message }}</div>
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
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{{ outlet.business_name }}</h3>
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

        <div class="text-center mt-12">
          <NuxtLink to="/outlets">
            <BaseButton size="lg" variant="primary">
              Lihat Semua Outlet
              <Icon name="material-symbols:arrow-forward-ios-rounded" class="ml-2" />
            </BaseButton>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="py-16 bg-white dark:bg-gray-900">
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