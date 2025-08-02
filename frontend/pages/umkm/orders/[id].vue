<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import type { Order } from '~/types';

definePageMeta({
  layout: 'umkm',
  middleware: ["auth", 'owner', 'business-required']
});

const route = useRoute();
const orderId = route.params.id as string;

const { data: order, pending, error, refresh } = useAsyncData(
  `order-${orderId}`,
  () => $fetch<{ data: Order }>(`/api/v1/orders/${orderId}`),
  {
    transform: (response) => response.data
  }
);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};
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
          <h2 class="text-lg font-semibold mb-4">Item Pesanan</h2>
          <BaseTable>
            <template #thead>
              <tr>
                <BaseTableHeader>Produk</BaseTableHeader>
                <BaseTableHeader>Jumlah</BaseTableHeader>
                <BaseTableHeader>Harga Satuan</BaseTableHeader>
                <BaseTableHeader>Subtotal</BaseTableHeader>
              </tr>
            </template>
            <tbody>
              <BaseTableRow v-for="item in order.items" :key="item.id">
                <td class="p-3">{{ item.product?.name || 'Produk Dihapus' }}</td>
                <td class="p-3">{{ item.quantity }}</td>
                <td class="p-3">{{ formatCurrency(item.priceAtTimeOfOrder) }}</td>
                <td class="p-3">{{ formatCurrency(item.priceAtTimeOfOrder * item.quantity) }}</td>
              </BaseTableRow>
            </tbody>
          </BaseTable>
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