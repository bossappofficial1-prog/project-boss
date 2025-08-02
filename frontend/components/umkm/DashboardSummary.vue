<script setup lang="ts">
import type { DashboardSummary } from '~/types';

const props = defineProps<{
  summary: DashboardSummary | null
}>();

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const summaryItems = computed(() => [
  {
    icon: 'lucide:package',
    label: 'Total Produk',
    value: props.summary?.totalProducts ?? 0,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    trend: '+5.2%',
    trendUp: true
  },
  {
    icon: 'lucide:concierge-bell',
    label: 'Total Layanan',
    value: props.summary?.totalServices ?? 0,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    trend: '+8.1%',
    trendUp: true
  },
  {
    icon: 'lucide:shopping-cart',
    label: 'Total Pesanan',
    value: props.summary?.totalOrders ?? 0,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    trend: '+12.3%',
    trendUp: true
  },
  {
    icon: 'lucide:wallet',
    label: 'Total Pendapatan',
    value: formatCurrency(props.summary?.totalRevenue ?? 0),
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    trend: '+15.7%',
    trendUp: true
  },
]);
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <BaseCard v-for="(item, index) in summaryItems" :key="index"
      class="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden"
      :class="[item.bgColor, item.borderColor, 'border-l-4']">
      <!-- Background decoration -->
      <div
        class="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300"
        :class="item.color.replace('text', 'bg')"></div>

      <div class="relative z-10">
        <div class="flex items-center justify-between mb-4">
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            :class="item.bgColor">
            <Icon :name="item.icon" size="24" :class="item.color" />
          </div>
          <div class="flex items-center space-x-1">
            <Icon :name="item.trendUp ? 'lucide:trending-up' : 'lucide:trending-down'" size="16"
              :class="item.trendUp ? 'text-green-500' : 'text-red-500'" />
            <span class="text-xs font-medium"
              :class="item.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ item.trend }}
            </span>
          </div>
        </div>

        <div class="space-y-1">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ item.label }}</p>
          <p
            class="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-200">
            {{ item.value }}
          </p>
        </div>

        <!-- Progress bar animation -->
        <div class="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
          <div class="h-1 rounded-full transition-all duration-1000 ease-out group-hover:w-full"
            :class="item.color.replace('text', 'bg')" :style="{ width: '0%' }"
            style="animation: fillBar 2s ease-out forwards;"></div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
@keyframes fillBar {
  from {
    width: 0%;
  }

  to {
    width: 100%;
  }
}

.group:nth-child(1) .transition-all {
  animation-delay: 0.1s;
}

.group:nth-child(2) .transition-all {
  animation-delay: 0.2s;
}

.group:nth-child(3) .transition-all {
  animation-delay: 0.3s;
}

.group:nth-child(4) .transition-all {
  animation-delay: 0.4s;
}
</style>