<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { OrderPaymentStatus } from '~/types';
import type { Order } from '~/types';

definePageMeta({
  layout: 'umkm',
  middleware: ["auth", 'owner', 'business-required']
});

const route = useRoute();
const orderId = route.params.id as string;

const { data, pending, error, refresh } = useApi<Order>(`/orders/${orderId}`, {
  method: 'GET',
  immediate: true
});
const order = computed(() => data.value?.data as Order | undefined)

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};
const toast = useToast();
const qrisImageUrl = ref<string | null>(null);
const isGeneratingQris = ref(false);

async function generateQris() {
  isGeneratingQris.value = true;
  const { data, error } = await useApi<{ qr_code: string }>(`/payments/${orderId}/qris`, {
    method: 'POST'
  });
  isGeneratingQris.value = false;

  if (error.value) {
    toast.add({ title: 'Gagal Membuat QRIS', description: error.value.data?.message || 'Terjadi kesalahan.', color: 'error' });
    return;
  }

  if (data.value?.data?.qr_code) {
    qrisImageUrl.value = data.value.data.qr_code;
    toast.add({ title: 'QRIS Berhasil Dibuat', color: 'success' });
  }
}

const tableColumns = [
  { key: 'productName', label: 'Produk' },
  { key: 'quantity', label: 'Jumlah' },
  { key: 'priceAtTimeOfOrder', label: 'Harga Satuan', type: 'currency' },
  { key: 'subtotal', label: 'Subtotal', type: 'currency' }
];

const tableData = computed(() => {
  return order.value?.items?.map(item => ({
    ...item,
    productName: item.product?.name || 'Produk Dihapus',
    subtotal: item.priceAtTimeOfOrder * item.quantity
  })) || [];
});
</script>

<template>
  <div class="space-y-6">
    <BaseBack to="/umkm/orders">Kembali ke Daftar Pesanan</BaseBack>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Detail Pesanan #{{ orderId }}</h1>

    <div v-if="pending">
      <BaseLoading />
    </div>
    <div v-else-if="error">
      <BaseErrorState :error="error" @retry="refresh" />
    </div>
    <div v-else-if="order" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <BaseCard>
          <BaseTable2 :data="tableData" :columns="tableColumns" :searchable="false" :paginated="false"
            :show-header="false" :show-footer="false" />
        </BaseCard>
      </div>
      <div class="space-y-6">
        <BaseCard>
          <h2 class="text-lg font-semibold mb-4">Ringkasan</h2>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span>Total Pesanan:</span>
              <span>{{ formatCurrency(order.totalAmount) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Status Antrian:</span>
              <BaseBadge>{{ order.queueStatus }}</BaseBadge>
            </div>
            <div class="flex justify-between">
              <span>Status Pembayaran:</span>
              <BaseBadge>{{ order.paymentStatus }}</BaseBadge>
            </div>
          </div>
        </BaseCard>

        <BaseCard v-if="order.paymentStatus === OrderPaymentStatus.PENDING">
          <h2 class="text-lg font-semibold mb-4">Pembayaran QRIS</h2>
          <div v-if="qrisImageUrl" class="text-center">
            <img :src="qrisImageUrl" alt="QRIS Code" class="mx-auto w-64 h-64" />
            <p class="mt-2 text-sm text-gray-500">Pindai untuk membayar</p>
          </div>
          <UButton v-else @click="generateQris" :loading="isGeneratingQris" block>
            Buat Kode QRIS
          </UButton>
        </BaseCard>

        <BaseCard>
          <h2 class="text-lg font-semibold mb-4">Pelanggan</h2>
          <div v-if="order.customer" class="space-y-2">
            <p><strong>Nama:</strong> {{ order.customer.name }}</p>
            <p><strong>Email:</strong> {{ order.customer.email }}</p>
            <p><strong>Telepon:</strong> {{ order.customer.phone }}</p>
          </div>
          <div v-else-if="order.guestCustomer" class="space-y-2">
            <p><strong>Nama:</strong> {{ order.guestCustomer.name }}</p>
            <p><strong>Email:</strong> {{ order.guestCustomer.email }}</p>
            <p><strong>Telepon:</strong> {{ order.guestCustomer.phone }}</p>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>