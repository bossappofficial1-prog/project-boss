<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { CustomerType } from '~/types';
import type { Product, OrderForm, GuestCustomerForm } from '~/types';
import { useDebounceFn } from '@vueuse/core';

definePageMeta({
  layout: 'umkm',
  middleware: ["auth", 'owner', 'business-required']
});

const auth = useAuthStore();
const toast = useToast();
const router = useRouter();
const searchQuery = ref('');
const products = ref<Product[]>([]);
const cart = ref<{ product: Product; quantity: number }[]>([]);
const customer = ref<GuestCustomerForm>({ name: '', email: '', phone: '' });
const isLoading = ref(false);

const outletId = computed(() => auth.selectedOutlet?.id);

const fetchProducts = useDebounceFn(async () => {
  if (!outletId.value || searchQuery.value.length < 2) {
    products.value = [];
    return;
  }
  const { data } = await useApi<{ products: Product[] }>(`/products/outlet/${outletId.value}`, {
    query: { q: searchQuery.value }
  });
  products.value = data.value?.data?.products || [];
}, 500);

watch(searchQuery, fetchProducts);

function addToCart(product: Product) {
  const existingItem = cart.value.find(item => item.product.id === product.id);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.value.push({ product, quantity: 1 });
  }
}

function removeFromCart(productId: string) {
  cart.value = cart.value.filter(item => item.product.id !== productId);
}

function updateQuantity(productId: string, quantity: number) {
  const item = cart.value.find(item => item.product.id === productId);
  if (item) {
    if (quantity > 0) {
      item.quantity = quantity;
    } else {
      removeFromCart(productId);
    }
  }
}

const totalAmount = computed(() => {
  return cart.value.reduce((total, item) => total + item.product.price * item.quantity, 0);
});

async function submitOrder() {
  if (cart.value.length === 0) {
    toast.add({ title: 'Keranjang Kosong', description: 'Tambahkan produk ke keranjang terlebih dahulu.', color: 'warning' });
    return;
  }

  isLoading.value = true;

  const orderData: OrderForm = {
    outletId: outletId.value!,
    customerType: CustomerType.GUEST,
    items: cart.value.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    })),
    customer: {
      name: customer.value.name || 'Pelanggan',
      email: customer.value.email,
      phone: customer.value.phone
    }
  };

  const { data, error } = await useApi<{ orderId: string, paymentUrl: string }>('/orders', {
    method: 'POST',
    body: orderData
  });

  isLoading.value = false;

  if (error.value) {
    toast.add({ title: 'Gagal Membuat Pesanan', description: error.value.data?.message || 'Terjadi kesalahan.', color: 'error' });
    return;
  }

  toast.add({ title: 'Pesanan Berhasil Dibuat', description: `Pesanan #${data.value?.data?.orderId} berhasil dibuat.`, color: 'success' });
  if (data.value?.data?.paymentUrl) {
    window.open(data.value.data.paymentUrl, '_blank');
  }
  router.push('/umkm/orders');
}

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
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Buat Pesanan Baru (Kasir)</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-6">
        <!-- Product Search -->
        <BaseCard>
          <h2 class="text-lg font-semibold mb-4">Cari Produk</h2>
          <input v-model="searchQuery" type="text" placeholder="Ketik nama produk..." class="w-full p-2 border rounded" />
          <div v-if="products.length > 0" class="mt-4 space-y-2 max-h-60 overflow-y-auto">
            <div v-for="product in products" :key="product.id" @click="addToCart(product)" class="p-2 border rounded hover:bg-gray-100 cursor-pointer flex justify-between">
              <span>{{ product.name }}</span>
              <span>{{ formatCurrency(product.price) }}</span>
            </div>
          </div>
        </BaseCard>

        <!-- Cart -->
        <BaseCard>
          <h2 class="text-lg font-semibold mb-4">Keranjang</h2>
          <div v-if="cart.length === 0" class="text-center text-gray-500">
            Keranjang masih kosong.
          </div>
          <div v-else class="space-y-4">
            <div v-for="item in cart" :key="item.product.id" class="flex items-center justify-between">
              <div>
                <p class="font-semibold">{{ item.product.name }}</p>
                <p class="text-sm text-gray-500">{{ formatCurrency(item.product.price) }}</p>
              </div>
              <div class="flex items-center space-x-2">
                <input type="number" :value="item.quantity" @input="updateQuantity(item.product.id, +($event.target as HTMLInputElement).value)" class="w-16 p-1 border rounded" min="0" />
                <BaseButton size="sm" variant="error" @click="removeFromCart(item.product.id)">Hapus</BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Order Summary -->
      <div class="space-y-6">
        <BaseCard>
          <h2 class="text-lg font-semibold mb-4">Informasi Pelanggan (Opsional)</h2>
          <div class="space-y-4">
            <input v-model="customer.name" type="text" placeholder="Nama Pelanggan" class="w-full p-2 border rounded" />
            <input v-model="customer.email" type="email" placeholder="Email Pelanggan" class="w-full p-2 border rounded" />
            <input v-model="customer.phone" type="tel" placeholder="Telepon Pelanggan" class="w-full p-2 border rounded" />
          </div>
        </BaseCard>
        <BaseCard>
          <h2 class="text-lg font-semibold mb-4">Total</h2>
          <p class="text-3xl font-bold">{{ formatCurrency(totalAmount) }}</p>
          <BaseButton @click="submitOrder" :disabled="isLoading || cart.length === 0" class="w-full mt-4">
            <span v-if="isLoading">Memproses...</span>
            <span v-else>Buat Pesanan & Bayar</span>
          </BaseButton>
        </BaseCard>
      </div>
    </div>
  </div>
</template>