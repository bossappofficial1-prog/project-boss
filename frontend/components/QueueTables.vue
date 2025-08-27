<script setup lang="ts">
import { ProductType, OrderQueueStatus, type Order } from '~/types'

interface Props {
  queues: Order[]
  pending: boolean
  error: any
  selectedTab: ProductType
  searchQuery: string
}

interface Emits {
  (e: 'search', value: string): void
  (e: 'refresh'): void
  (e: 'updateStatus', orderId: string, status: OrderQueueStatus): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Helper functions
const getCustomerName = (order: Order) => {
  return order.customer?.name || order.guestCustomer?.name || 'Guest'
}

const getCustomerEmail = (order: Order) => {
  return order.customer?.email || order.guestCustomer?.email || ''
}

// Table configuration
const tableColumns = computed(() => [
  { key: 'id', label: 'ID Pesanan', sortable: true },
  { key: 'customerName', label: 'Customer', type: 'slot' },
  { key: 'createdAt', label: 'Tanggal Pesan', type: 'date', sortable: true },
  ...(props.selectedTab === ProductType.SERVICE ? 
    [{ key: 'bookingDate', label: 'Tanggal Booking', type: 'date', sortable: true }] : 
    []
  ),
  { 
    key: 'queueStatus', 
    label: 'Status Antrian', 
    type: 'badge', 
    badgeConfig: {
      [OrderQueueStatus.IN_QUEUE]: 'bg-blue-100 text-blue-800',
      [OrderQueueStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
      [OrderQueueStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [OrderQueueStatus.CANCELLED]: 'bg-red-100 text-red-800',
    } 
  },
])

const tableRowActions = computed(() => [
  {
    key: 'start',
    label: 'Mulai Kerjakan',
    icon: 'lucide:play-circle',
    variant: 'edit',
    condition: (row: Order) => row.queueStatus === OrderQueueStatus.IN_QUEUE,
    handler: (row: Order) => emit('updateStatus', row.id, OrderQueueStatus.IN_PROGRESS)
  },
  {
    key: 'complete',
    label: 'Selesaikan',
    icon: 'lucide:check-circle',
    variant: 'primary',
    condition: (row: Order) => row.queueStatus === OrderQueueStatus.IN_PROGRESS,
    handler: (row: Order) => emit('updateStatus', row.id, OrderQueueStatus.COMPLETED)
  }
])

const tableTitle = computed(() => 
  `Daftar Antrian ${props.selectedTab === ProductType.GOODS ? 'Barang' : 'Jasa'}`
)

const tableSubtitle = computed(() => 
  `Kelola antrian ${props.selectedTab === ProductType.GOODS ? 'barang' : 'jasa'} yang sedang berlangsung.`
)

const emptyMessage = computed(() => 
  `Tidak ada antrian aktif untuk ${props.selectedTab === ProductType.GOODS ? 'barang' : 'jasa'}.`
)
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="pending && !queues.length">
      <BaseLoading />
    </div>
    
    <!-- Error State -->
    <div v-else-if="error">
      <BaseErrorState 
        :error="error" 
        @retry="emit('refresh')" 
      />
    </div>
    
    <!-- Main Table -->
    <div v-else>
      <BaseTable2
        :data="queues"
        :columns="tableColumns"
        :row-actions="tableRowActions"
        :title="tableTitle"
        :subtitle="tableSubtitle"
        :searchable="true"
        :paginated="true"
        :show-export="false"
        search-placeholder="Cari ID pesanan atau nama customer..."
        :empty-message="emptyMessage"
        @search="emit('search', $event)"
        @refresh="emit('refresh')"
      >
        <!-- Customer Name Slot -->
        <template #customerName="{ row }">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <Icon name="lucide:user" class="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ getCustomerName(row as Order) }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ getCustomerEmail(row as Order) || 'No email' }}
              </p>
            </div>
          </div>
        </template>
      </BaseTable2>
    </div>
  </div>
</template>