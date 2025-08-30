<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import type { DashboardSummary, OrderStats, NotificationsResponse } from '~/types';

const auth = useAuthStore();
const summary = ref<DashboardSummary | null>(null);
const stats = ref<OrderStats | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const router = useRouter();

// Alerts sourced from API notifications, initially empty
const alerts = ref<Array<{
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  dismissible?: boolean;
}>>([]);

const dismissAlert = (id: string) => {
  const index = alerts.value.findIndex(alert => alert.id === id);
  if (index > -1) {
    alerts.value.splice(index, 1);
  }
};

const outletId = computed(() => auth.selectedOutlet?.id);

async function fetchData() {
  if (error.value && error.value == 'Token expired') {
    await auth.logout();
    router.push('/auth/login');
  };
  if (!outletId.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    const [summaryResponse, statsResponse, notificationsResponse] = await Promise.all([
      useApi<DashboardSummary>(`/dashboard/summary?outletId=${outletId.value}`),
      useApi<OrderStats>(`/dashboard/stats?outletId=${outletId.value}&period=month`),
      useApi<NotificationsResponse>(`/notifications?outletId=${outletId.value}&threshold=5`)
    ]);

    if (summaryResponse.error.value) throw summaryResponse.error.value;
    if (statsResponse.error.value) throw statsResponse.error.value;
    if (notificationsResponse.error.value) throw notificationsResponse.error.value;

    summary.value = summaryResponse.data.value?.data || null;
    stats.value = statsResponse.data.value?.data || null;

    // Map notifications to dashboard alerts, only when needed
    const items = notificationsResponse.data.value?.data?.items || [];
    const mapped = items
      .flatMap((n) => {
        if (n.type === 'NEW_ORDERS' && (n as any).count > 0) {
          return [{
            id: `${n.type}-${n.time}`,
            type: 'success' as const,
            title: n.title,
            message: n.message,
            timestamp: new Date(n.time),
            dismissible: true,
          }];
        }
        if (n.type === 'LOW_STOCK' && (n as any).count > 0) {
          return [{
            id: `${n.type}-${n.time}`,
            type: 'warning' as const,
            title: n.title,
            message: n.message,
            timestamp: new Date(n.time),
            dismissible: true,
          }];
        }
        if (n.type === 'WEEKLY_REPORT') {
          // Only show when report is available (based on message from API)
          if (typeof n.message === 'string' && n.message.toLowerCase().includes('sudah tersedia')) {
            return [{
              id: `${n.type}-${n.time}`,
              type: 'info' as const,
              title: n.title,
              message: n.message,
              timestamp: new Date(n.time),
              dismissible: true,
            }];
          }
        }
        return [] as any[];
      });
    alerts.value = mapped;
  } catch (e: any) {
    error.value = e.data?.message || 'Gagal memuat data dashboard';
  } finally {
    isLoading.value = false;
  }
}

watch(outletId, fetchData, { immediate: true });
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header Dashboard -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 mb-8">
      <div class="px-6 py-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Selamat datang kembali! Berikut adalah ringkasan bisnis Anda hari ini.
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <div
              class="flex items-center space-x-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span class="text-sm font-medium text-green-700 dark:text-green-300">Live Data</span>
            </div>
            <BaseButton @click="fetchData" variant="outline" size="sm">
              <Icon name="lucide:refresh-cw" size="16" class="mr-2" />
              Refresh
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <div class="px-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-20">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4">
          <Icon name="lucide:loader-2" size="32" class="animate-spin text-primary-500" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Memuat Dashboard</h3>
        <p class="text-gray-600 dark:text-gray-400">Sedang mengambil data terbaru...</p>

        <!-- Loading skeleton -->
        <div class="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="i in 4" :key="i" class="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div class="flex-1">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-20">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
          <Icon name="lucide:alert-triangle" size="32" class="text-red-500" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Terjadi Kesalahan</h3>
        <p class="text-red-600 dark:text-red-400 mb-6">{{ error }}</p>
        <BaseButton @click="fetchData" class="inline-flex items-center">
          <Icon name="lucide:refresh-cw" size="16" class="mr-2" />
          Coba Lagi
        </BaseButton>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="space-y-8 pb-8">
        <!-- Alerts Section -->
        <UmkmDashboardAlert :alerts="alerts" @dismiss="dismissAlert" />

        <UmkmDashboardSummary :summary="summary" />
        <UmkmDashboardCharts :stats="stats" />

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <BaseCard class="group hover:shadow-lg transition-all duration-300 cursor-pointer"
            @click="navigateTo('/umkm/products/create')">
            <div class="flex items-center space-x-3">
              <div
                class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Icon name="lucide:plus" size="20" class="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Tambah Produk</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Buat produk baru</p>
              </div>
            </div>
          </BaseCard>

          <BaseCard class="group hover:shadow-lg transition-all duration-300 cursor-pointer"
            @click="navigateTo('/umkm/orders')">
            <div class="flex items-center space-x-3">
              <div
                class="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Icon name="lucide:shopping-cart" size="20" class="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Kelola Pesanan</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Lihat pesanan terbaru</p>
              </div>
            </div>
          </BaseCard>

          <BaseCard class="group hover:shadow-lg transition-all duration-300 cursor-pointer"
            @click="navigateTo('/umkm/reports')">
            <div class="flex items-center space-x-3">
              <div
                class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Icon name="lucide:bar-chart" size="20" class="text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Laporan</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Analisis penjualan</p>
              </div>
            </div>
          </BaseCard>

          <BaseCard class="group hover:shadow-lg transition-all duration-300 cursor-pointer"
            @click="navigateTo('/umkm/account')">
            <div class="flex items-center space-x-3">
              <div
                class="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Icon name="lucide:settings" size="20" class="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Pengaturan</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Konfigurasi outlet</p>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>
  </div>
</template>