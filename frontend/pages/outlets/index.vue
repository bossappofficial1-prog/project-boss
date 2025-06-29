<script setup>
import { useApiFetch } from "@/composables/useApiFetch"
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const limit = ref(parseInt(route.query.limit) || 6)
const page = ref(parseInt(route.query.page) || 1)
const search = ref(route.query.search || '')

// Panggil ke backend via useApiFetch
const { data: outletsRes, error, pending, refresh, execute } = useApiFetch('/outlets', {
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

// Jalankan pertama kali
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
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{{ outlet.business_name }}</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                {{ outlet.name }}
              </p>

              <div class="flex items-center justify-between">
                <div class="flex items-center text-gray-500 dark:text-gray-400">
                  <Icon name="mdi:map-marker" size="16" class="mr-1" />
                  <span class="text-sm">{{ outlet.address }}</span>
                </div>
                <NuxtLink to="/outlets/{{ outlet.id }}">
                  <BaseButton size="sm" variant="outline">
                    Lihat Detail
                  </BaseButton>
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
