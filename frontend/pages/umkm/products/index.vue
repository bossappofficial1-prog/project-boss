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
const fileInput = ref<HTMLInputElement | null>(null)

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl
const API_TEMPLATE_URL = `${baseUrl}/products/template/import`
const downloadTemplate = async () => {
  try {
    const response = await fetch(API_TEMPLATE_URL, {
      method: 'GET',
    })
    if (!response.ok) throw new Error('Gagal mengunduh template')
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // Coba ambil nama file dari header jika ada, fallback ke default
    const disposition = response.headers.get('Content-Disposition')
    let filename = 'template-produk.xlsx'
    if (disposition && disposition.includes('filename=')) {
      filename = disposition.split('filename=')[1].replace(/"/g, '')
    }
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }, 100)
  } catch (err: any) {
    toast.add({
      title: 'Gagal Mengunduh',
      description: err.message || 'Terjadi kesalahan saat mengunduh template.',
      color: 'error',
    })
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)
  formData.append('outletId', auth.selectedOutlet?.id!)

  const toastId = toast.add({ title: 'Mengunggah file...', description: 'Mohon tunggu...', color: 'info' })

  try {
    const { error: uploadError } = await useApi('/products/bulk', {
      method: 'POST',
      body: formData,
    })

    if (uploadError.value) {
      throw uploadError.value
    }

    toast.update(toastId.id, {
      title: 'Berhasil!',
      description: 'Produk berhasil diimpor.',
      color: 'success',
    })
    refresh() // Refresh product list
  } catch (error: any) {
    toast.update(toastId.id, {
      title: 'Gagal Mengunggah',
      description: error.data?.message || 'Terjadi kesalahan saat mengunggah file.',
      color: 'error',
    })
  } finally {
    // Reset file input to allow re-uploading the same file
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

// Refactored to use useAsyncData for proper reactivity, as the custom useApi
// composable does not seem to handle reactive URLs correctly.
const { data, pending, error, refresh } = useApi<{ products: Product[] }>(`/products/outlet/${auth.selectedOutlet?.id}`
)

// The products are now directly the result of the transformed data.
const products = computed(() => data.value?.data?.products || [])

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

  const { error: deleteError } = await useApi(`/products/${productId}`, {
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

const toggleProductStatus = async (product: Product) => {
  const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

  if (newStatus === 'ACTIVE') {
    if (product.type === 'GOODS' && !product.quantity) {
      return toast.add({
        title: 'Gagal Mengaktifkan',
        description: 'Produk barang harus memiliki kuantitas untuk diaktifkan.',
        color: 'error'
      })
    }

    if (product.type === 'SERVICE') {
      const { data: bookingsData, error: bookingsError } = await useApi<{ bookings: any[] }>(`/bookings/product/${product.id}`)
      if (bookingsError.value || !bookingsData.value?.data?.bookings || bookingsData.value.data.bookings.length === 0) {
        return toast.add({
          title: 'Gagal Mengaktifkan',
          description: 'Produk jasa harus memiliki setidaknya satu jadwal untuk diaktifkan.',
          color: 'error'
        })
      }
    }
  }

  const { error } = await useApi(`/products/${product.id}`, {
    method: 'PATCH',
    body: { status: newStatus }
  })

  if (error.value) {
    return toast.add({
      title: 'Gagal',
      description: `Gagal mengubah status produk menjadi ${newStatus}.`,
      color: 'error'
    })
  }

  toast.add({
    title: 'Berhasil!',
    description: `Status produk berhasil diubah menjadi ${newStatus}.`,
    color: 'success'
  })
  refresh()
}
const tableColumns = ref([
  { key: 'name', label: 'Nama Produk', sortable: true, searchable: true },
  { key: 'type', label: 'Tipe', type: 'slot' },
  { key: 'costPrice', label: 'Harga Modal', type: 'currency' },
  { key: 'price', label: 'Harga Jual', type: 'currency' },
  { key: 'stockDuration', label: 'Stok/Durasi', type: 'slot' },
  { key: 'status', label: 'Status', type: 'badge', badgeConfig: { 'ACTIVE': 'bg-green-100 text-green-800', 'INACTIVE': 'bg-red-100 text-red-800' } },
  { key: 'actions', label: 'Aktif/Nonaktif', type: 'slot' }
])

const tableActions = ref([
  {
    label: 'Import',
    icon: 'mdi:upload',
    handler: () => triggerFileInput()
  },
  {
    label: 'Tambah Produk',
    icon: 'mdi:plus',
    variant: 'primary',
    handler: () => navigateTo('/umkm/products/create')
  }
])

const tableRowActions = ref([
  {
    key: 'edit',
    label: 'Edit',
    icon: 'lucide:pencil',
    variant: 'edit',
    handler: (row: Product) => navigateTo(`/umkm/products/${row.id}`)
  },
  {
    key: 'delete',
    label: 'Hapus',
    icon: 'lucide:trash-2',
    variant: 'delete',
    handler: (row: Product) => deleteProduct(row.id)
  },
  {
    key: 'manage-booking',
    label: 'Kelola Jadwal',
    icon: 'lucide:calendar',
    variant: 'primary',
    condition: (row: Product) => row.type === 'SERVICE',
    handler: (row: Product) => navigateTo(`/umkm/products/${row.id}/bookings`)
  }
])

const handleSearch = (term: string) => {
  searchQuery.value = term
}
</script>

<template>
  <div>
    <div v-if="pending">
      <BaseLoading />
    </div>
    <div v-else-if="error">
      <BaseErrorState :error="error" @retry="refresh" />
    </div>
    <div v-else>
      <BaseTable2 :data="products" :columns="tableColumns" :actions="tableActions" :row-actions="tableRowActions"
        title="Daftar Produk" subtitle="Kelola semua produk Anda di satu tempat" :searchable="true"
        :paginated="true" @search="handleSearch" @refresh="refresh" @export="downloadTemplate"
        :show-export="true" :show-refresh="true" search-placeholder="Cari produk..."
        empty-message="Tidak ada produk yang cocok dengan pencarian Anda.">
        <template #type="{ row }">
          {{ (row as Product).type === 'GOODS' ? 'Barang' : 'Jasa' }}
        </template>
        <template #stockDuration="{ row }">
          <span v-if="(row as Product).type === 'GOODS'">{{ (row as Product).quantity }} {{ (row as Product).unit }}</span>
          <span v-else>{{ (row as Product).serviceDurationMinutes }} menit</span>
        </template>
        <template #actions="{ row }">
          <UToggle :model-value="(row as Product).status === 'ACTIVE'" @update:model-value="() => toggleProductStatus(row as Product)" />
        </template>
      </BaseTable2>
      <input ref="fileInput" type="file" class="hidden" @change="handleFileUpload"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
    </div>
  </div>
</template>