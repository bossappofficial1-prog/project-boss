<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Query param state
const limit = ref(parseInt(route.query.limit) || 6)
const page = ref(parseInt(route.query.page) || 1)
const search = ref(route.query.search || '')

// Fetch data
const { data: outletsRes, error, pending, refresh } = await useLazyFetch(`/api/outlets`, {
  query: {
    limit,
    page,
    search
  },
  watch: [limit, page, search]
})

const outlets = computed(() => outletsRes.value?.data || [])
const pagination = computed(() => outletsRes.value?.pagination || {})

// Update URL & refresh data
function updateQuery() {
  router.push({
    path: '/outlets',
    query: {
      limit: limit.value,
      page: page.value,
      search: search.value
    }
  })
  refresh()
}
</script>

<template>
  <div class="">
    <section class="py-6 bg-gray-100 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white">UMKM</h2>
          <div class="flex space-x-3">
            <input
              v-model="search"
              @keydown.enter="updateQuery"
              type="text"
              placeholder="Cari UMKM..."
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-gray-800 dark:text-white"
            />
            <BaseButton variant="primary" @click="updateQuery">Cari</BaseButton>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="pending" class="flex justify-center items-center space-x-2 text-primary-700">
          <Icon name="line-md:loading-alt-loop" class="h-8 w-8" />
          <span>Memuat data...</span>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="text-center text-red-700">
          {{ error.message }}
        </div>

        <!-- Data -->
        <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <BaseCard
            v-for="outlet in outlets"
            :key="outlet.id"
            hover
            clickable
            padding="none"
            class="overflow-hidden group"
          >
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{{ outlet.business.name }}</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">{{ outlet.name }}</p>
              <div class="flex items-center justify-between">
                <div class="flex items-center text-gray-500 dark:text-gray-400">
                  <Icon name="mdi:map-marker" size="16" class="mr-1" />
                  <span class="text-sm">{{ outlet.address }}</span>
                </div>
                <NuxtLink :to="`/outlets/${outlet.id}`">
                  <BaseButton size="sm" variant="outline">Lihat</BaseButton>
                </NuxtLink>
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="flex justify-center mt-8 space-x-2">
          <BaseButton
            :disabled="page === 1"
            @click="page--; updateQuery()"
            variant="outline"
            size="sm"
          >
          <Icon name="material-symbols:arrow-back-ios-rounded" />
          </BaseButton>
          <BaseButton
            v-for="n in pagination.totalPages"
            :key="n"
            :variant="page === n ? 'primary' : 'outline'"
            size="sm"
            @click="page = n; updateQuery()"
          >
            {{ n }}
          </BaseButton>
          <BaseButton
            :disabled="page === pagination.totalPages"
            @click="page++; updateQuery()"
            variant="outline"
            size="sm"
          >
          <Icon name="material-symbols:arrow-forward-ios-rounded" />
          </BaseButton>
        </div>
      </div>
    </section>
  </div>
</template>
