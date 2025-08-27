<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { ProductType, type Order } from '~/types'
import { useQueueManagement } from '~/composables/useQueueManagement'

definePageMeta({
  layout: 'umkm',
  middleware: ["auth", 'owner', 'business-required']
})

const auth = useAuthStore()
const selectedTab = ref<ProductType>(ProductType.GOODS)

const tabs = [
  { key: ProductType.GOODS, label: 'Antrian Barang', icon: 'lucide:package' },
  { key: ProductType.SERVICE, label: 'Antrian Jasa', icon: 'lucide:concierge-bell' }
]

// Use the queue management composable
const {
  queues,
  pending,
  error,
  searchQuery,
  handleSearch,
  refresh,
  updateQueueStatus
} = useQueueManagement(selectedTab)

// Watch for outlet changes
watch(() => auth.selectedOutlet?.id, (newOutletId) => {
  if (newOutletId) {
    refresh()
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Manajemen Antrian
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Kelola antrian pesanan barang dan jasa
        </p>
      </div>
    </div>

    <!-- Tab Navigation -->
    <UTabs :items="tabs" v-model="selectedTab">
      <template #default="{ item }">
        <div class="flex items-center gap-2 relative">
          <Icon :name="item.icon" class="w-4 h-4" />
          <span class="truncate">{{ item.label }}</span>
          <span 
            v-if="item.key === selectedTab" 
            class="absolute -right-4 w-2 h-2 rounded-full bg-primary-500" 
          />
        </div>
      </template>
    </UTabs>

    <!-- Main Content -->
    <QueueTable
      :queues="queues"
      :pending="pending"
      :error="error"
      :selected-tab="selectedTab"
      :search-query="searchQuery"
      @search="handleSearch"
      @refresh="refresh"
      @update-status="updateQueueStatus"
    />
  </div>
</template>
