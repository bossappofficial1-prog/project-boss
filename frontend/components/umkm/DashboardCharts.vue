<script setup lang="ts">
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js';
import type { OrderStats } from '~/types';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

const props = defineProps<{
  stats: OrderStats | null
}>();

const chartData = computed(() => {
  if (!props.stats) {
    return {
      labels: [],
      datasets: [],
    };
  }

  const labels = Object.keys(props.stats);
  const orderData = labels.map(label => props.stats![label].totalOrders);
  const revenueData = labels.map(label => props.stats![label].totalRevenue);

  return {
    labels,
    datasets: [
      {
        label: 'Total Pesanan',
        backgroundColor: '#f87979',
        borderColor: '#f87979',
        data: orderData,
        tension: 0.2,
      },
      {
        label: 'Total Pendapatan',
        backgroundColor: '#79f8f8',
        borderColor: '#79f8f8',
        data: revenueData,
        tension: 0.2,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
};
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <BaseCard>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistik Pesanan (30 Hari Terakhir)</h3>
      <div class="h-80">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </BaseCard>
  </div>
</template>