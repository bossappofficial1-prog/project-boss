<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import type { Order } from '~/types'
import { useDebounceFn } from '@vueuse/core'
import { EyeIcon, PrinterIcon, PlusIcon } from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'umkm',
  middleware: ["auth", 'owner', 'business-required']
})

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()
const searchQuery = ref('')

// Use useApi instead of $fetch, with reactive endpoint and query
const outletId = computed(() => auth.selectedOutlet?.id)
const endpoint = computed(() => (outletId.value ? `/orders/${outletId.value}/goods` : ''))
const query = computed<Record<string, any>>(() => (searchQuery.value ? { q: searchQuery.value } : {}))

const { data, pending, error, refresh, execute } = useApi<Order[]>(
  endpoint as unknown as string, // runtime will resolve computed value
  { method: 'GET', query, immediate: false }
)

const orders = computed(() => (Array.isArray(data.value?.data) ? (data.value?.data as Order[]) : []))

const handleSearch = useDebounceFn((term: string) => {
  searchQuery.value = term
}, 500)

const tableColumns = ref([
  { key: 'id', label: 'ID Pesanan', sortable: true },
  { key: 'customerName', label: 'Customer', type: 'slot' },
  { key: 'createdAt', label: 'Tanggal', type: 'date', sortable: true },
  { key: 'totalAmount', label: 'Total', type: 'currency' },
  {
    key: 'orderStatus', label: 'Status Pesanan', type: 'badge', badgeConfig: {
      COMPLETED: 'bg-green-100 text-green-800',
      PROCESSING: 'bg-yellow-100 text-yellow-800',
      READY: 'bg-blue-100 text-blue-800',
      AWAITING_PAYMENT: 'bg-orange-100 text-orange-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
  },
  {
    key: 'paymentStatus', label: 'Status Pembayaran', type: 'badge', badgeConfig: {
      SUCCESS: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      REFUNDED: 'bg-purple-100 text-purple-800',
    }
  },
])

const tableActions = ref([
  {
    label: 'Buat Pesanan',
    icon: PlusIcon,
    variant: 'primary',
    handler: () => router.push('/umkm/orders/create')
  }
])

// Download receipt (PDF) using authenticated fetch and trigger browser download
const downloadingReceiptId = ref<string | null>(null)
const downloadReceipt = async (row: Order) => {
  try {
    downloadingReceiptId.value = row.id
    const config = useRuntimeConfig()
    const authStore = useAuthStore()

    const res = await fetch(`${config.public.apiBaseUrl}/orders/${row.id}/receipt`, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {})
      }
    })

    if (!res.ok) {
      // Try to read error message if available
      let message = 'Gagal mengunduh struk.'
      try {
        const data = await res.json()
        message = data?.message || message
      } catch (_) {
        // ignore
      }
      toast.add({ title: 'Cetak Struk', description: message, color: 'error' })
      return
    }

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${row.id}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
    toast.add({ title: 'Cetak Struk', description: 'Struk berhasil diunduh.', color: 'success' })
  } catch (e) {
    toast.add({ title: 'Cetak Struk', description: 'Terjadi kesalahan saat mengunduh struk.', color: 'error' })
  } finally {
    downloadingReceiptId.value = null
  }
}

const tableRowActions = ref([
  {
    key: 'view',
    label: 'Lihat Detail',
    icon: EyeIcon,
    variant: 'view',
    handler: (row: Order) => router.push(`/umkm/orders/${row.id}`)
  },
  {
    key: 'print',
    label: 'Cetak Struk',
    icon: PrinterIcon,
    variant: 'secondary',
    handler: (row: Order) => downloadReceipt(row)
  }
])

onMounted(() => {
  if (outletId.value) execute()
})

watch([outletId, searchQuery], () => {
  if (outletId.value) execute()
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
      <BaseTable2 :data="orders" :columns="tableColumns" :actions="tableActions" :row-actions="tableRowActions"
        title="Daftar Pesanan" subtitle="Kelola semua pesanan yang masuk." :searchable="true" :paginated="true"
        :show-export="false" @search="handleSearch" @refresh="refresh"
        search-placeholder="Cari ID pesanan atau nama customer..." empty-message="Belum ada pesanan yang masuk.">
        <template #customerName="{ row }">
          {{ (row as Order).customer?.name || (row as Order).guestCustomer?.name || 'Guest' }}
        </template>
      </BaseTable2>
    </div>
  </div>
</template>
