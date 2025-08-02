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
  { icon: 'lucide:package', label: 'Total Produk', value: props.summary?.totalProducts ?? 0, color: 'text-blue-500' },
  { icon: 'lucide:concierge-bell', label: 'Total Layanan', value: props.summary?.totalServices ?? 0, color: 'text-green-500' },
  { icon: 'lucide:shopping-cart', label: 'Total Pesanan', value: props.summary?.totalOrders ?? 0, color: 'text-yellow-500' },
  { icon: 'lucide:wallet', label: 'Total Pendapatan', value: formatCurrency(props.summary?.totalRevenue ?? 0), color: 'text-purple-500' },
]);
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <BaseCard v-for="(item, index) in summaryItems" :key="index">
      <div class="flex items-center space-x-4">
        <div class="w-12 h-12 rounded-full flex items-center justify-center" :class="item.color.replace('text', 'bg').replace('500', '100')">
          <Icon :name="item.icon" size="24" :class="item.color" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ item.label }}</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ item.value }}</p>
        </div>
      </div>
    </BaseCard>
  </div>
</template>