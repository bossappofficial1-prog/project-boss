<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Daftar Pesanan</h1>
      <NuxtLink to="/umkm/orders/create">
        <BaseButton>
          <Icon name="mdi:plus" size="16" class="mr-2" />
          Buat Pesanan
        </BaseButton>
      </NuxtLink>
    </div>

    <!-- Filter & Search -->
    <div class="flex justify-between items-center">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cari pesanan..."
        class="border p-2 rounded w-64"
      />
    </div>

    <!-- Tabel Transaksi -->
    <BaseTable>
      <template #thead>
        <tr>
          <BaseTableHeader>ID Pesanan</BaseTableHeader>
          <BaseTableHeader>Customer</BaseTableHeader>
          <BaseTableHeader>Tanggal</BaseTableHeader>
          <BaseTableHeader>Total</BaseTableHeader>
          <BaseTableHeader>Status Antrian</BaseTableHeader>
          <BaseTableHeader>Status Pembayaran</BaseTableHeader>
          <BaseTableHeader>Aksi</BaseTableHeader>
        </tr>
      </template>

      <tr v-if="pending">
        <td colspan="7" class="text-center p-4">
          <BaseLoading />
        </td>
      </tr>
      <tr v-else-if="error">
        <td colspan="7" class="text-center p-4">
          <BaseErrorState :error="error" @retry="refresh" />
        </td>
      </tr>
      <tr v-else-if="orders.length === 0">
        <td colspan="7" class="text-center p-4">
          <BaseEmptyState title="Belum Ada Pesanan" message="Belum ada pesanan yang masuk." icon="mdi:cart-off" />
        </td>
      </tr>
      <BaseTableRow v-else v-for="order in orders" :key="order.id">
        <td class="p-3">{{ order.id }}</td>
        <td class="p-3">{{ order.customer?.name || order.guestCustomer?.name || 'Guest' }}</td>
        <td class="p-3">{{ new Date(order.createdAt).toLocaleString() }}</td>
        <td class="p-3">Rp {{ order.totalAmount.toLocaleString() }}</td>
        <td class="p-3">
          <BaseBadge :variant="getQueueStatusVariant(order.queueStatus)">
            {{ order.queueStatus }}
          </BaseBadge>
        </td>
        <td class="p-3">
          <BaseBadge :variant="getPaymentStatusVariant(order.paymentStatus)">
            {{ order.paymentStatus }}
          </BaseBadge>
        </td>
        <td class="p-3">
          <NuxtLink :to="`/umkm/orders/${order.id}`">
            <BaseButton size="sm" variant="outline">Lihat</BaseButton>
          </NuxtLink>
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
import type { Order } from '~/types'
import { useDebounceFn } from '@vueuse/core'

definePageMeta({
  layout: 'umkm',
  middleware: ["auth", 'owner', 'business-required']
})

const auth = useAuthStore()
const searchQuery = ref('')
const currentPage = ref(1)
const perPage = 10

const { data, pending, error, refresh } = useAsyncData(
  'orders-list',
  () => {
    const outletId = auth.selectedOutlet?.id
    if (!outletId) {
      return Promise.resolve({ data: { orders: [], total: 0 } })
    }
    return $fetch(`/api/v1/orders/outlet/${outletId}`, {
      params: {
        q: searchQuery.value,
        page: currentPage.value,
        limit: perPage
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

const orders = computed(() => data.value?.orders || [])
const totalOrders = computed(() => data.value?.total || 0)

const totalPages = computed(() => Math.ceil(totalOrders.value / perPage))

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
    case 'AWAITING_PAYMENT':
      return 'warning'
    case 'CANCELLED':
      return 'error'
    default:
      return 'gray'
  }
}

function getPaymentStatusVariant(status: string) {
  switch (status) {
    case 'SUCCESS':
      return 'success'
    case 'PENDING':
      return 'warning'
    case 'FAILURE':
      return 'error'
    default:
      return 'gray'
  }
}
</script>
