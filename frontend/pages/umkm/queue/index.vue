<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { OrderQueueStatus, type Order } from '~/types'
import { useDebounceFn } from '@vueuse/core'

definePageMeta({
  layout: 'umkm',
  middleware: ["auth", 'owner', 'business-required']
})

const auth = useAuthStore()
const toast = useToast()
const searchQuery = ref('')

// API data fetching
const { data, pending, error, refresh } = useAsyncData(
  'queues',
  async () => {
    const outletId = auth.selectedOutlet?.id
    if (!outletId) return { orders: [] }

    const params = new URLSearchParams()
    params.append('status', OrderQueueStatus.IN_QUEUE)
    params.append('status', OrderQueueStatus.IN_PROGRESS)
    if (searchQuery.value) {
      params.append('q', searchQuery.value)
    }
    
    // Using $fetch which is the foundation of useApi
    const response = await $fetch<{ data: { orders: Order[] } }>(`/api/v1/orders/outlet/${outletId}?${params.toString()}`)
    return response.data
  },
  {
    watch: [searchQuery, () => auth.selectedOutlet?.id],
    default: () => ({ orders: [] })
  }
)

const queues = computed(() => data.value?.orders || [])

// Debounced search handler
const handleSearch = useDebounceFn((term: string) => {
  searchQuery.value = term
  // The watch on useAsyncData will trigger the refresh automatically
}, 500)

// Table configuration
const tableColumns = ref([
  { key: 'id', label: 'ID Pesanan', sortable: true },
  { key: 'customerName', label: 'Customer', type: 'slot' },
  { key: 'createdAt', label: 'Tanggal', type: 'date', sortable: true },
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
  <div>
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
        title="Antrian"
        subtitle="Kelola antrian pesanan yang sedang berlangsung."
        :searchable="true"
        :paginated="true"
        :show-export="false"
        @search="handleSearch"
        @refresh="refresh"
        search-placeholder="Cari berdasarkan ID pesanan atau nama customer..."
        empty-message="Tidak ada antrian yang aktif saat ini."
      >
        <template #customerName="{ row }">
          {{ (row as Order).customer?.name || (row as Order).guestCustomer?.name || 'Guest' }}
        </template>
        <!-- The badge for queueStatus is handled by the badgeConfig in tableColumns -->
      </BaseTable2>
    </div>
  </div>
</template>
