<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import type { Product } from '~/types'

definePageMeta({
  layout: 'umkm',
  middleware: ["auth", 'owner', 'business-required']
})

const auth = useAuthStore()
const isLoading = ref(false)
const products = ref<Product[]>([])

const fetchProducts = async () => {
  isLoading.value = true
  try {
    const { data, error } = await useApi<{ products: Product[] }>(`/api/products/outlet/${auth.selectedOutlet?.id}`)
    if (error.value) {
      console.error('Failed to fetch products:', error.value)
      const toast = useToast()
      toast.error({
        title: 'Error!',
        message: 'Gagal memuat daftar produk.'
      })
      return
    }
    products.value = data.value?.data?.products || []
  } catch (error) {
    console.error('Products fetch error:', error)
    const toast = useToast()
    toast.error({
      title: 'Error!',
      message: 'Terjadi kesalahan saat memuat daftar produk.'
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (auth.selectedOutlet?.id) {
    fetchProducts()
  }
})

watch(() => auth.selectedOutlet?.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    fetchProducts()
  }
})

const deleteProduct = async (productId: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return

  isLoading.value = true
  try {
    const { error } = await useApi(`/api/products/delete/${productId}`, {
      method: 'DELETE'
    })

    if (error.value) {
      const toast = useToast()
      toast.error({
        title: 'Error!',
        message: error.value.data?.message || 'Gagal menghapus produk.'
      })
      return
    }

    const toast = useToast()
    toast.success({
      title: 'Berhasil!',
      message: 'Produk berhasil dihapus.'
    })
    fetchProducts() // Refresh the list
  } catch (error) {
    console.error('Delete product error:', error)
    const toast = useToast()
    toast.error({
      title: 'Error!',
      message: 'Terjadi kesalahan saat menghapus produk.'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Daftar Produk</h1>
      <NuxtLink to="/umkm/products/create">
        <BaseButton>
          <Icon name="mdi:plus" size="16" class="mr-2" />
          Tambah Produk
        </BaseButton>
      </NuxtLink>
    </div>

    <BaseCard>
      <div v-if="isLoading" class="p-4 text-center">
        <Icon name="lucide:loader-2" size="32" class="animate-spin text-primary-500" />
        <p class="text-gray-500 mt-2">Memuat produk...</p>
      </div>
      <div v-else-if="products.length === 0" class="text-center py-12">
        <Icon name="mdi:package-variant-closed" size="64" class="text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Belum ada produk
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          Tambahkan produk pertama Anda untuk mulai menjual
        </p>
        <NuxtLink to="/umkm/products/create">
          <BaseButton>
            <Icon name="mdi:plus" size="16" class="mr-2" />
            Tambah Produk
          </BaseButton>
        </NuxtLink>
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