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

// Reactive endpoint that depends on the selected outlet
const apiEndpoint = computed(() => {
  if (!auth.selectedOutlet?.id) return null
  return `/api/v1/products/outlet/${auth.selectedOutlet.id}`
})

const { data, pending, error, execute, refresh } = useApi<{ products: Product[] }>(apiEndpoint, {
  query: { q: searchQuery },
  lazy: true,
  immediate: false,
})

const products = computed(() => data.value?.data?.products || [])

const fetchProducts = () => {
  if (apiEndpoint.value) {
    execute()
  }
}

const debouncedFetchProducts = useDebounceFn(fetchProducts, 500)

onMounted(fetchProducts)

watch(searchQuery, debouncedFetchProducts)

watch(() => auth.selectedOutlet?.id, (newId) => {
  if (newId) {
    // Use nextTick to ensure computed `apiEndpoint` is updated before fetching
    nextTick(fetchProducts)
  }
})

const deleteProduct = async (productId: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return

  const { error: deleteError } = await useApi(`/api/v1/products/delete/${productId}`, {
    method: 'DELETE'
  })

  if (deleteError.value) {
    return toast.error({
      title: 'Gagal Menghapus',
      message: deleteError.value.data?.message || 'Gagal menghapus produk.'
    })
  }

  toast.success({
    title: 'Berhasil!',
    message: 'Produk berhasil dihapus.'
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