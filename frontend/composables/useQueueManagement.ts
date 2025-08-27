import { useAuthStore } from '~/stores/auth'
import { OrderQueueStatus, ProductType, type Order } from '~/types'
import { useDebounceFn } from '@vueuse/core'

export function useQueueManagement(selectedTab: Ref<ProductType>) {
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
      params.append('productType', selectedTab.value)
      
      if (searchQuery.value) {
        params.append('q', searchQuery.value)
      }
      
      const response = await $fetch<{ data: { orders: Order[] } }>(
        `/api/v1/orders/outlet/${outletId}?${params.toString()}`
      )
      
      return response.data
    },
    {
      watch: [searchQuery, selectedTab, () => auth.selectedOutlet?.id],
      default: () => ({ orders: [] }),
      server: false
    }
  )

  // Computed properties
  const queues = computed(() => data.value?.orders || [])

  // Debounced search handler
  const handleSearch = useDebounceFn((term: string) => {
    searchQuery.value = term
  }, 500)

  // Update queue status function
  const updateQueueStatus = async (orderId: string, status: OrderQueueStatus) => {
    const { error: updateError } = await useApi(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: { status }
    })

    if (updateError.value) {
      const errorMessage = updateError.value.data?.message || 'Terjadi kesalahan saat memperbarui status.'
      toast.add({ 
        title: 'Gagal Memperbarui Status', 
        description: errorMessage, 
        color: 'error' 
      })
      return
    }

    toast.add({ 
      title: 'Status Berhasil Diperbarui', 
      color: 'success' 
    })
    
    await refresh()
  }

  return {
    queues,
    pending,
    error,
    searchQuery,
    handleSearch,
    refresh,
    updateQueueStatus
  }
}