<script setup>
import { useApi } from "@/composables/useApi"
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const limit = ref(parseInt(route.query.limit) || 6)
const page = ref(parseInt(route.query.page) || 1)
const search = ref(route.query.search || '')

// Panggil ke backend via useApi
const { data: outletsRes, error, pending, refresh, execute } = useApi('/outlets', {
  query: {
    limit,
    page,
    search
  },
  watch: [limit, page, search],
  lazy: true
})

const outlets = computed(() => outletsRes.value?.data || [])
const pagination = computed(() => outletsRes.value?.pagination || {})

function updateQuery() {
  router.replace({
    path: '/outlets',
    query: {
      limit: limit.value,
      page: page.value,
      search: search.value
    }
  })
  refresh()
}

onMounted(() => {
  execute()
})
</script>

<template>
  <div class="">
    <section class="py-6 bg-gray-100 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-10">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Semua Outlet</h2>
          <div class="flex">
            <input
              v-model="search"
              @keydown.enter="updateQuery"
              type="text"
              placeholder="Cari outlet..."
              class="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-gray-800 dark:text-white"
            />
            <BaseButton variant="primary" class="rounded-r-lg rounded-l-none pr-2" @click="updateQuery">
              <Icon name="lucide:search" class="h-5 w-5" />
            </BaseButton>
          </div>
        </div>

        <div v-if="pending" class="flex justify-center items-center space-x-2 text-primary-700">
          <Icon name="line-md:loading-alt-loop" class="h-8 w-8" />
          <span>Sedang memuat data...</span>
        </div>
        <div v-else-if="error" class="text-center text-red-700">Terjadi kesalahan: {{ error.message }}</div>
        <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <BaseCard v-for="outlet in outlets" :key="outlet.id" hover clickable padding="none"
            class="overflow-hidden group">
            <NuxtImg v-if="outlet.image" :src="outlet.image" :alt="outlet.name"
              class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
            <div v-else
              class="w-full h-48 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 text-sm">
              Tidak ada gambar
            </div>

            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-1">{{ outlet.business_name }}</h3>
              <p class="text-primary-600 dark:text-primary-400 mb-1">
                {{ outlet.name }}
              </p>
              <p class="text-gray-600 text-sm dark:text-gray-400 mb-4">
                {{ outlet.product_count }} Produk / layanan
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

        <div v-if="pagination.totalPages > 1" class="flex justify-center mt-8 space-x-2">
  <button
    class="px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
    :disabled="page === 1"
    @click="page--; updateQuery()"
  >
    <Icon name="lucide:chevron-left" />
  </button>

  <button
    v-for="n in pagination.totalPages"
    :key="n"
    class="px-3 py-1 border rounded"
    :class="page === n ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
    @click="page = n; updateQuery()"
  >
    {{ n }}
  </button>

  <button
    class="px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
    :disabled="page === pagination.totalPages"
    @click="page++; updateQuery()"
  >
    <Icon name="lucide:chevron-right" />
  </button>
</div>

      </div>
    </section>
  </div>
</template>
