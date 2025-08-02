<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Antrian</h1>
    </div>

    <!-- Filter & Search -->
    <div class="flex justify-between items-center">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cari antrian..."
        class="border p-2 rounded w-64"
      />
    </div>

    <!-- Tabel Antrian -->
    <BaseTable>
      <template #thead>
        <tr>
          <BaseTableHeader>ID Pesanan</BaseTableHeader>
          <BaseTableHeader>Customer</BaseTableHeader>
          <BaseTableHeader>Tanggal</BaseTableHeader>
          <BaseTableHeader>Status Antrian</BaseTableHeader>
          <BaseTableHeader>Aksi</BaseTableHeader>
        </tr>
      </template>

      <tr v-if="pending">
        <td colspan="5" class="text-center p-4">
          <BaseLoading />
        </td>
      </tr>
      <tr v-else-if="error">
        <td colspan="5" class="text-center p-4">
          <BaseErrorState :error="error" @retry="refresh" />
        </td>
      </tr>
      <tr v-else-if="queues.length === 0">
        <td colspan="5" class="text-center p-4">
          <BaseEmptyState title="Antrian Kosong" message="Tidak ada antrian saat ini." icon="mdi:account-group-outline" />
        </td>
      </tr>
      <BaseTableRow v-else v-for="queue in queues" :key="queue.id">
        <td class="p-3">{{ queue.id }}</td>
        <td class="p-3">{{ queue.customer?.name || queue.guestCustomer?.name || 'Guest' }}</td>
        <td class="p-3">{{ new Date(queue.createdAt).toLocaleString() }}</td>
        <td class="p-3">
          <BaseBadge :variant="getQueueStatusVariant(queue.queueStatus)">
            {{ queue.queueStatus }}
          </BaseBadge>
        </td>
        <td class="p-3">
          <div class="flex space-x-2">
            <BaseButton v-if="queue.queueStatus === 'IN_QUEUE'" size="sm" @click="updateQueueStatus(queue.id, OrderQueueStatus.IN_PROGRESS)">Mulai Kerjakan</BaseButton>
            <BaseButton v-if="queue.queueStatus === 'IN_PROGRESS'" size="sm" @click="updateQueueStatus(queue.id, OrderQueueStatus.COMPLETED)">Selesai</BaseButton>
          </div>
        </td>
      </BaseTableRow>

      <template #footer>
        <BasePagination
          :current-page="currentPage"
          :total-pages="totalPages"
          @previous="prevPage"
          @next="nextPage"
        />
      </template>
    </BaseTable>

  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { OrderQueueStatus } from '~/types'
import type { Order } from '~/types'
import { useDebounceFn } from '@vueuse/core'

definePageMeta({
  layout: 'umkm',
  middleware: ["auth", 'owner', 'business-required']
})

const auth = useAuthStore()
const toast = useToast()
const searchQuery = ref('')
const currentPage = ref(1)
const perPage = 10

const { data, pending, error, refresh } = useAsyncData(
  'queues-list',
  () => {
    const outletId = auth.selectedOutlet?.id
    if (!outletId) {
      return Promise.resolve({ data: { orders: [], total: 0 } })
    }
    return $fetch(`/api/v1/orders/outlet/${outletId}`, {
      params: {
        q: searchQuery.value,
        page: currentPage.value,
        limit: perPage,
        status: ['IN_QUEUE', 'IN_PROGRESS'] // Fetch only active queues
      },
    })
  },
  {
    watch: [() => auth.selectedOutlet?.id, currentPage],
    lazy: true,
    immediate: false,
    transform: (response: any) => {
      return {
        orders: response.data?.orders || [],
        total: response.data?.total || 0
      }
    },
  }
)

const queues = computed(() => data.value?.orders || [])
const totalQueues = computed(() => data.value?.total || 0)

const totalPages = computed(() => Math.ceil(totalQueues.value / perPage))

const debouncedRefresh = useDebounceFn(refresh, 500)

watch(searchQuery, () => {
  currentPage.value = 1
  debouncedRefresh()
})

onMounted(() => {
  if (auth.selectedOutlet?.id) {
    refresh()
  }
})

async function updateQueueStatus(orderId: string, status: OrderQueueStatus) {
  const { error } = await useApi(`/api/v1/orders/${orderId}/status`, {
    method: 'PUT',
    body: { status }
  })

  if (error.value) {
    toast.add({ title: 'Gagal Memperbarui Status', description: error.value.data?.message || 'Terjadi kesalahan.', color: 'error' })
    return
  }

  toast.add({ title: 'Status Berhasil Diperbarui', color: 'success' })
  refresh()
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function getQueueStatusVariant(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'IN_PROGRESS':
      return 'info'
    case 'IN_QUEUE':
      return 'primary'
    case 'AWAITING_PAYMENT':
      return 'warning'
    case 'CANCELLED':
      return 'error'
    default:
      return 'gray'
  }
}
</script>
