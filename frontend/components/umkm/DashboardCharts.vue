<script setup lang="ts">
import { Line, Doughnut, Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  BarElement,
} from 'chart.js';
import type { OrderStats } from '~/types';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  BarElement
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
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        data: orderData,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Total Pendapatan',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgb(16, 185, 129)',
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        data: revenueData,
        tension: 0.4,
        fill: true,
      },
    ],
  };
});

const doughnutData = computed(() => {
  if (!props.stats) {
    return {
      labels: [],
      datasets: [],
    };
  }

  const labels = Object.keys(props.stats);
  const orderData = labels.map(label => props.stats![label].totalOrders);

  return {
    labels,
    datasets: [
      {
        data: orderData,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(14, 165, 233, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
          'rgb(14, 165, 233)',
        ],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };
});

const barData = computed(() => {
  if (!props.stats) {
    return {
      labels: [],
      datasets: [],
    };
  }

  const labels = Object.keys(props.stats);
  const revenueData = labels.map(label => props.stats![label].totalRevenue);

  return {
    labels,
    datasets: [
      {
        label: 'Pendapatan Harian',
        data: revenueData,
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        padding: 20,
        usePointStyle: true,
        font: {
          size: 12,
          family: 'Inter, sans-serif'
        }
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
    }
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 11,
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        font: {
          size: 11,
        }
      }
    }
  },
  elements: {
    point: {
      hoverBackgroundColor: '#fff',
    }
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false
  }
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
        usePointStyle: true,
        font: {
          size: 12,
          family: 'Inter, sans-serif'
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
    }
  },
  cutout: '60%',
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
    }
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 11,
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        font: {
          size: 11,
        }
      }
    }
  }
};
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <!-- Grafik Trend Line -->
    <BaseCard class="xl:col-span-2 group hover:shadow-xl transition-all duration-300">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tren Statistik</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">30 hari terakhir</p>
        </div>
        <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      </div>
      <div class="h-80">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </BaseCard>

    <!-- Distribusi Pesanan -->
    <BaseCard class="group hover:shadow-xl transition-all duration-300">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Distribusi Pesanan</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">Per hari</p>
        </div>
        <Icon name="lucide:pie-chart" class="w-5 h-5 text-gray-400" />
      </div>
      <div class="h-80">
        <Doughnut :data="doughnutData" :options="doughnutOptions" />
      </div>
    </BaseCard>

    <!-- Pendapatan Harian -->
    <BaseCard class="xl:col-span-3 group hover:shadow-xl transition-all duration-300">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Pendapatan Harian</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">Dalam rupiah</p>
        </div>
        <div class="flex items-center space-x-2">
          <Icon name="lucide:trending-up" class="w-5 h-5 text-green-500" />
          <span class="text-sm font-medium text-green-600 dark:text-green-400">+12.5%</span>
        </div>
      </div>
      <div class="h-64">
        <Bar :data="barData" :options="barOptions" />
      </div>
    </BaseCard>
  </div>
</template>