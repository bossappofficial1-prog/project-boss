<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { OrderQueueStatus, OrderPaymentStatus, type Order } from '~/types'
import { useDebounceFn } from '@vueuse/core'

definePageMeta({
  layout: 'umkm',
  middleware: ["auth", 'owner', 'business-required']
})

const auth = useAuthStore()
const router = useRouter()
const searchQuery = ref('')

const { data, pending, error, refresh } = useAsyncData(
  'orders-list',
  async () => {
    const outletId = auth.selectedOutlet?.id
    if (!outletId) return { orders: [], total: 0 }

    const params = new URLSearchParams()
    if (searchQuery.value) {
      params.append('q', searchQuery.value)
    }
    
    const response = await $fetch<{ data: { orders: Order[], total: number } }>(`/api/v1/orders/outlet/${outletId}?${params.toString()}`)
    return response.data
  },
  {
    watch: [searchQuery, () => auth.selectedOutlet?.id],
    default: () => ({ orders: [], total: 0 })
  }
)

const orders = computed(() => data.value?.orders || [])

const handleSearch = useDebounceFn((term: string) => {
  searchQuery.value = term
}, 500)

const tableColumns = ref([
  { key: 'id', label: 'ID Pesanan', sortable: true },
  { key: 'customerName', label: 'Customer', type: 'slot' },
  { key: 'createdAt', label: 'Tanggal', type: 'date', sortable: true },
  { key: 'totalAmount', label: 'Total', type: 'currency' },
  { key: 'queueStatus', label: 'Status Antrian', type: 'badge', badgeConfig: {
      [OrderQueueStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [OrderQueueStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
      [OrderQueueStatus.IN_QUEUE]: 'bg-blue-100 text-blue-800',
      [OrderQueueStatus.AWAITING_PAYMENT]: 'bg-orange-100 text-orange-800',
      [OrderQueueStatus.CANCELLED]: 'bg-red-100 text-red-800',
    }
  },
  { key: 'paymentStatus', label: 'Status Pembayaran', type: 'badge', badgeConfig: {
      [OrderPaymentStatus.SETTLEMENT]: 'bg-green-100 text-green-800',
      [OrderPaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [OrderPaymentStatus.FAILURE]: 'bg-red-100 text-red-800',
      [OrderPaymentStatus.EXPIRE]: 'bg-gray-100 text-gray-800',
    }
  },
])

const tableActions = ref([
  {
    label: 'Buat Pesanan',
    icon: 'lucide:plus',
    variant: 'primary',
    handler: () => router.push('/umkm/orders/create')
  }
])

const tableRowActions = ref([
  {
    key: 'view',
    label: 'Lihat Detail',
    icon: 'lucide:eye',
    variant: 'view',
    handler: (row: Order) => router.push(`/umkm/orders/${row.id}`)
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
    <div v-if="pending && !orders.length">
      <BaseLoading />
    </div>
    <div v-else-if="error">
      <BaseErrorState :error="error" @retry="refresh" />
    </div>
    <div v-else>
      <BaseTable2
        :data="orders"
        :columns="tableColumns"
        :actions="tableActions"
        :row-actions="tableRowActions"
        title="Daftar Pesanan"
        subtitle="Kelola semua pesanan yang masuk."
        :searchable="true"
        :paginated="true"
        :show-export="false"
        @search="handleSearch"
        @refresh="refresh"
        search-placeholder="Cari ID pesanan atau nama customer..."
        empty-message="Belum ada pesanan yang masuk."
      >
        <template #customerName="{ row }">
          {{ (row as Order).customer?.name || (row as Order).guestCustomer?.name || 'Guest' }}
        </template>
      </BaseTable2>
    </div>
  </div>
</template>
