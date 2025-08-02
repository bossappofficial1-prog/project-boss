<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Daftar Transaksi</h1>
    </div>

    <!-- Filter & Search -->
    <div class="flex justify-between items-center">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cari transaksi..."
        class="border p-2 rounded w-64"
      />
    </div>

    <!-- Tabel Transaksi -->
    <BaseTable>
      <template #thead>
        <tr>
          <BaseTableHeader>ID Transaksi</BaseTableHeader>
          <BaseTableHeader>ID Pesanan</BaseTableHeader>
          <BaseTableHeader>Tanggal</BaseTableHeader>
          <BaseTableHeader>Jumlah</BaseTableHeader>
          <BaseTableHeader>Metode</BaseTableHeader>
          <BaseTableHeader>Status</BaseTableHeader>
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
      <tr v-else-if="transactions.length === 0">
        <td colspan="7" class="text-center p-4">
          <BaseEmptyState title="Belum Ada Transaksi" message="Belum ada transaksi yang tercatat." icon="mdi:cash-multiple" />
        </td>
      </tr>
      <BaseTableRow v-else v-for="transaction in transactions" :key="transaction.id">
        <td class="p-3">{{ transaction.id }}</td>
        <td class="p-3">{{ transaction.orderId }}</td>
        <td class="p-3">{{ new Date(transaction.createdAt).toLocaleString() }}</td>
        <td class="p-3">Rp {{ transaction.amount.toLocaleString() }}</td>
        <td class="p-3">{{ transaction.paymentMethod }}</td>
        <td class="p-3">
          <BaseBadge :variant="getStatusVariant(transaction.status)">
            {{ transaction.status }}
          </BaseBadge>
        </td>
        <td class="p-3">
          <NuxtLink :to="`/umkm/orders/${transaction.orderId}`">
            <BaseButton size="sm" variant="outline">Lihat Pesanan</BaseButton>
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
import type { Transaction } from '~/types'
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
  'transactions-list',
  () => {
    const outletId = auth.selectedOutlet?.id
    if (!outletId) {
      return Promise.resolve({ data: { transactions: [], total: 0 } })
    }
    return $fetch(`/api/v1/transactions/outlet/${outletId}`, {
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
        transactions: response.data?.transactions || [],
        total: response.data?.total || 0
      }
    },
  }
)

const transactions = computed(() => data.value?.transactions || [])
const totalTransactions = computed(() => data.value?.total || 0)

const totalPages = computed(() => Math.ceil(totalTransactions.value / perPage))

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

function getStatusVariant(status: string) {
  switch (status) {
    case 'SUCCESS':
      return 'success'
    case 'PENDING':
      return 'warning'
    case 'FAILED':
      return 'error'
    default:
      return 'gray'
  }
}
</script>
