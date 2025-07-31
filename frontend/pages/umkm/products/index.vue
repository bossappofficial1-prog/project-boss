<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import type { Product } from '~/types'
import { useDebounceFn } from '@vueuse/core'

definePageMeta({
  layout: 'umkm',
  middleware: ["auth", 'owner', 'business-required']
})

const auth = useAuthStore()
const toast = useToast()
const searchQuery = ref('')

// Refactored to use useAsyncData for proper reactivity, as the custom useApi
// composable does not seem to handle reactive URLs correctly.
const { data, pending, error, refresh } = useAsyncData(
  'products-list',
  () => {
    const outletId = auth.selectedOutlet?.id
    if (!outletId) {
      // If no outlet is selected, we don't fetch.
      // Returning a promise that resolves to the expected structure prevents errors.
      return Promise.resolve({ data: { products: [] } })
    }
    // Use the globally available $fetch helper from Nuxt
    return $fetch(`/api/v1/products/outlet/${outletId}`, {
      params: { q: searchQuery.value },
    })
  },
  {
    // Automatically re-fetch when the selected outlet changes.
    watch: [() => auth.selectedOutlet?.id],
    lazy: true, // Don't block navigation
    immediate: false, // We will call refresh() manually
    // Transform the response to directly get the products array.
    transform: (response: any) => response.data?.products || [],
  }
)

// The products are now directly the result of the transformed data.
const products = computed(() => data.value || [])

// Debounce the refresh function from useAsyncData to avoid excessive API calls on search.
const debouncedRefresh = useDebounceFn(refresh, 500)

// Wrap the debounced call in an arrow function to match the WatchCallback signature.
watch(searchQuery, () => {
  debouncedRefresh()
})

onMounted(() => {
  // Initial fetch if an outlet is already selected when the component mounts.
  if (auth.selectedOutlet?.id) {
    refresh()
  }
})

const deleteProduct = async (productId: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return

  const { error: deleteError } = await useApi(`/api/v1/products/delete/${productId}`, {
    method: 'DELETE'
  })

  if (deleteError.value) {
    return toast.add({
      title: 'Gagal Menghapus',
      description: deleteError.value.data?.message || 'Gagal menghapus produk.',
      color: 'error'
    })
  }

  toast.add({
    title: 'Berhasil!',
    description: 'Produk berhasil dihapus.',
    color: 'success'
  })
  refresh() // Re-fetch the product list
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Daftar Produk</h1>
      <div class="flex items-center gap-4">
        <div class="relative w-full md:w-64">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input v-model="searchQuery" type="text" placeholder="Cari produk..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>
        <NuxtLink to="/umkm/products/create">
          <BaseButton>
            <Icon name="mdi:plus" size="16" class="mr-2" />
            Tambah Produk
          </BaseButton>
        </NuxtLink>
      </div>
    </div>

    <BaseCard>
      <div v-if="pending">
        <BaseLoading />
      </div>
      <div v-else-if="error">
        <BaseErrorState :error="error" @retry="refresh" />
      </div>
      <div v-else-if="products.length === 0">
        <BaseEmptyState v-if="searchQuery" title="Produk Tidak Ditemukan"
          message="Tidak ada produk yang cocok dengan pencarian Anda." icon="mdi:magnify-close" />
        <BaseEmptyState v-else title="Belum Ada Produk" message="Tambahkan produk pertama Anda untuk mulai menjual."
          icon="mdi:package-variant-closed">
          <template #action>
            <NuxtLink to="/umkm/products/create">
              <BaseButton>
                <Icon name="mdi:plus" size="16" class="mr-2" />
                Tambah Produk
              </BaseButton>
            </NuxtLink>
          </template>
        </BaseEmptyState>
      </div>
      <BaseTable v-else>
        <template #thead>
          <thead>
            <BaseTableHeader>Nama Produk</BaseTableHeader>
            <BaseTableHeader>Tipe</BaseTableHeader>
            <BaseTableHeader>Harga Modal</BaseTableHeader>
            <BaseTableHeader>Harga Jual</BaseTableHeader>
            <BaseTableHeader>Stok/Durasi</BaseTableHeader>
            <BaseTableHeader>Status</BaseTableHeader>
            <BaseTableHeader>Aksi</BaseTableHeader>
          </thead>
        </template>
        <tbody>
          <BaseTableRow v-for="product in products" :key="product.id">
            <td class="px-4 py-3">{{ product.name }}</td>
            <td class="px-4 py-3">{{ product.type === 'GOODS' ? 'Barang' : 'Jasa' }}</td>
            <td class="px-4 py-3">Rp{{ product.costPrice.toLocaleString('id-ID') }}</td>
            <td class="px-4 py-3">Rp{{ product.price.toLocaleString('id-ID') }}</td>
            <td class="px-4 py-3">
              <span v-if="product.type === 'GOODS'">{{ product.quantity }} {{ product.unit }}</span>
              <span v-else>{{ product.serviceDurationMinutes }} menit</span>
            </td>
            <td class="px-4 py-3">
              <BaseBadge :variant="product.status === 'ACTIVE' ? 'success' : 'gray'">
                {{ product.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif' }}
              </BaseBadge>
            </td>
            <td class="px-4 py-3">
              <div class="flex space-x-2">
                <NuxtLink :to="`/umkm/products/${product.id}/edit`">
                  <BaseButton size="sm" variant="outline">Edit</BaseButton>
                </NuxtLink>
                <BaseButton size="sm" variant="error" @click="deleteProduct(product.id)">Hapus</BaseButton>
              </div>
            </td>
          </BaseTableRow>
        </tbody>
      </BaseTable>
    </BaseCard>
  </div>
</template>