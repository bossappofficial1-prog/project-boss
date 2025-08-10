<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { OrderQueueStatus, ProductType, type Order } from '~/types'
import { useDebounceFn } from '@vueuse/core'

definePageMeta({
  layout: 'umkm',
  middleware: ["auth", 'owner', 'business-required']
})

const auth = useAuthStore()
const toast = useToast()
const searchQuery = ref('')
const selectedTab = ref<ProductType>(ProductType.GOODS)

const tabs = [
  { key: ProductType.GOODS, label: 'Antrian Barang', icon: 'lucide:package' },
  { key: ProductType.SERVICE, label: 'Antrian Jasa', icon: 'lucide:concierge-bell' }
]

// API data fetching
const { data, pending, error, refresh } = useAsyncData(
  'queues',
  async () => {
    const outletId = auth.selectedOutlet?.id
    if (!outletId) return { orders: [] }

    const params = new URLSearchParams()
    params.append('status', OrderQueueStatus.IN_QUEUE)
    params.append('status', OrderQueueStatus.IN_PROGRESS)
    params.append('productType', selectedTab.value) // Filter by product type
    if (searchQuery.value) {
      params.append('q', searchQuery.value)
    }
    
    const response = await $fetch<{ data: { orders: Order[] } }>(`/api/v1/orders/outlet/${outletId}?${params.toString()}`)
    return response.data
  },
  {
    watch: [searchQuery, selectedTab, () => auth.selectedOutlet?.id],
    default: () => ({ orders: [] })
  }
)

const queues = computed(() => data.value?.orders || [])

const handleSearch = useDebounceFn((term: string) => {
  searchQuery.value = term
}, 500)

// Table configuration
const tableColumns = computed(() => [
  { key: 'id', label: 'ID Pesanan', sortable: true },
  { key: 'customerName', label: 'Customer', type: 'slot' },
  { key: 'createdAt', label: 'Tanggal Pesan', type: 'date', sortable: true },
  ...(selectedTab.value === ProductType.SERVICE ? [{ key: 'bookingDate', label: 'Tanggal Booking', type: 'date', sortable: true }] : []),
  { key: 'queueStatus', label: 'Status Antrian', type: 'badge', badgeConfig: {
      [OrderQueueStatus.IN_QUEUE]: 'bg-blue-100 text-blue-800',
      [OrderQueueStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
      [OrderQueueStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [OrderQueueStatus.CANCELLED]: 'bg-red-100 text-red-800',
    } 
  },
])

const updateQueueStatus = async (orderId: string, status: OrderQueueStatus) => {
  const { error: updateError } = await useApi(`/orders/${orderId}/status`, {
    method: 'PUT',
    body: { status }
  })

  if (updateError.value) {
    toast.add({ title: 'Gagal Memperbarui Status', description: updateError.value.data?.message || 'Terjadi kesalahan.', color: 'error' })
    return
  }

  toast.add({ title: 'Status Berhasil Diperbarui', color: 'success' })
  refresh()
}

const tableRowActions = ref([
  {
    key: 'start',
    label: 'Mulai Kerjakan',
    icon: 'lucide:play-circle',
    variant: 'edit',
    condition: (row: Order) => row.queueStatus === OrderQueueStatus.IN_QUEUE,
    handler: (row: Order) => updateQueueStatus(row.id, OrderQueueStatus.IN_PROGRESS)
  },
  {
    key: 'complete',
    label: 'Selesaikan',
    icon: 'lucide:check-circle',
    variant: 'primary',
    condition: (row: Order) => row.queueStatus === OrderQueueStatus.IN_PROGRESS,
    handler: (row: Order) => updateQueueStatus(row.id, OrderQueueStatus.COMPLETED)
  }
])

onMounted(() => {
  if (auth.selectedOutlet?.id) {
    refresh()
  }
})
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Antrian</h1>

    <UTabs :items="tabs" v-model="selectedTab">
      <template #default="{ item }">
        <div class="flex items-center gap-2 relative">
          <Icon :name="item.icon" class="w-4 h-4" />
          <span class="truncate">{{ item.label }}</span>
          <span v-if="item.key === selectedTab" class="absolute -right-4 w-2 h-2 rounded-full bg-primary-500" />
        </div>
      </template>
    </UTabs>

    <div v-if="pending && !queues.length">
      <BaseLoading />
    </div>
    <div v-else-if="error">
      <BaseErrorState :error="error" @retry="refresh" />
    </div>
    <div v-else>
      <BaseTable2
        :data="queues"
        :columns="tableColumns"
        :row-actions="tableRowActions"
        :title="`Daftar Antrian ${selectedTab === 'GOODS' ? 'Barang' : 'Jasa'}`"
        :subtitle="`Kelola antrian ${selectedTab === 'GOODS' ? 'barang' : 'jasa'} yang sedang berlangsung.`"
        :searchable="true"
        :paginated="true"
        :show-export="false"
        @search="handleSearch"
        @refresh="refresh"
        search-placeholder="Cari ID pesanan atau nama customer..."
        empty-message="Tidak ada antrian yang aktif untuk tipe ini."
      >
        <template #customerName="{ row }">
          {{ (row as Order).customer?.name || (row as Order).guestCustomer?.name || 'Guest' }}
        </template>
      </BaseTable2>
    </div>
  </div>
</template>
