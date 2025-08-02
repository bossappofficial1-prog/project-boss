<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import type { DashboardSummary, OrderStats } from '~/types';

const auth = useAuthStore();
const summary = ref<DashboardSummary | null>(null);
const stats = ref<OrderStats | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

const outletId = computed(() => auth.selectedOutlet?.id);

async function fetchData() {
  if (!outletId.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    const [summaryResponse, statsResponse] = await Promise.all([
      useApi<DashboardSummary>(`/dashboard/summary?outletId=${outletId.value}`),
      useApi<OrderStats>(`/dashboard/stats?outletId=${outletId.value}&period=month`)
    ]);

    if (summaryResponse.error.value) throw summaryResponse.error.value;
    if (statsResponse.error.value) throw statsResponse.error.value;

    summary.value = summaryResponse.data.value?.data || null;
    stats.value = statsResponse.data.value?.data || null;
  } catch (e: any) {
    error.value = e.data?.message || 'Gagal memuat data dashboard';
  } finally {
    isLoading.value = false;
  }
}

watch(outletId, fetchData, { immediate: true });
</script>

<template>
  <div>
    <div v-if="isLoading" class="text-center py-12">
      <Icon name="lucide:loader-2" size="48" class="animate-spin text-primary-500" />
      <p class="mt-4 text-gray-600 dark:text-gray-400">Memuat data dashboard...</p>
    </div>
    <div v-else-if="error" class="text-center py-12">
      <Icon name="lucide:alert-triangle" size="48" class="text-red-500" />
      <p class="mt-4 text-red-600 dark:text-red-400">{{ error }}</p>
      <BaseButton @click="fetchData" class="mt-4">Coba Lagi</BaseButton>
    </div>
    <div v-else class="space-y-6">
      <UmkmDashboardSummary :summary="summary" />
      <UmkmDashboardCharts :stats="stats" />
    </div>
  </div>
</template>