<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import { CustomerType, type Product, type OrderForm, type GuestCustomerForm } from '~/types';
import { useDebounceFn } from '@vueuse/core';

definePageMeta({
  layout: 'blank', // Use a blank layout for a focused POS-like experience
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
const isSearching = ref(false);

const outletId = computed(() => auth.selectedOutlet?.id);

const fetchProducts = useDebounceFn(async () => {
  if (!outletId.value || searchQuery.value.length < 2) {
    products.value = [];
    return;
  }
  isSearching.value = true;
  const { data } = await useApi<{ products: Product[] }>(`/products/outlet/${outletId.value}`, {
    query: { q: searchQuery.value, status: 'ACTIVE' } // Only search for active products
  });
  products.value = data.value?.data?.products || [];
  isSearching.value = false;
}, 300);

watch(searchQuery, fetchProducts);

function addToCart(product: Product) {
  if (product.type === 'GOODS' && (product.quantity ?? 0) <= 0) {
    toast.add({ title: 'Stok Habis', description: `${product.name} tidak tersedia.`, color: 'warning' });
    return;
  }
  const existingItem = cart.value.find(item => item.product.id === product.id);
  if (existingItem) {
    if (product.type === 'GOODS' && existingItem.quantity >= (product.quantity ?? 0)) {
      toast.add({ title: 'Stok Tidak Cukup', description: `Stok ${product.name} tidak mencukupi.`, color: 'warning' });
      return;
    }
    existingItem.quantity++;
  } else {
    cart.value.push({ product, quantity: 1 });
  }
  searchQuery.value = ''; // Clear search after adding to cart
  products.value = [];
}

function removeFromCart(productId: string) {
  cart.value = cart.value.filter(item => item.product.id !== productId);
}

function updateQuantity(productId: string, quantity: number) {
  const item = cart.value.find(item => item.product.id === productId);
  if (item) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    if (item.product.type === 'GOODS' && quantity > (item.product.quantity ?? 0)) {
      toast.add({ title: 'Stok Tidak Cukup', description: `Stok ${item.product.name} hanya tersisa ${item.product.quantity}.`, color: 'warning' });
      item.quantity = item.product.quantity ?? 0;
      return;
    }
    item.quantity = quantity;
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
      name: customer.value.name || 'Pelanggan Kasir',
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
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="flex flex-col lg:flex-row h-screen">
      
      <!-- Main Content: Product & Cart -->
      <div class="flex-1 p-6 lg:p-8 flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-4">
            <NuxtLink to="/umkm/orders" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              <Icon name="lucide:arrow-left" size="24" />
            </NuxtLink>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Kasir</h1>
          </div>
          <div class="text-sm text-gray-500">
            Outlet: <span class="font-semibold text-gray-800 dark:text-gray-200">{{ auth.selectedOutlet?.name }}</span>
          </div>
        </div>

        <!-- Product Search -->
        <div class="relative mb-6">
          <Icon name="lucide:search" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size="20" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Ketik untuk mencari produk..." 
            class="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
          />
          <div v-if="isSearching" class="absolute right-4 top-1/2 -translate-y-1/2">
            <Icon name="lucide:loader-2" class="animate-spin" />
          </div>
          <div v-if="products.length > 0" class="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <ul>
              <li v-for="product in products" :key="product.id" @click="addToCart(product)" class="p-4 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center">
                <div>
                  <p class="font-semibold">{{ product.name }}</p>
                  <p v-if="product.type === 'GOODS'" class="text-sm text-gray-500">Stok: {{ product.quantity }}</p>
                </div>
                <span class="font-semibold">{{ formatCurrency(product.price) }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Cart -->
        <div class="flex-1 overflow-y-auto bg-white dark:bg-gray-800/50 rounded-xl p-4">
          <h2 class="text-lg font-semibold mb-4 px-2">Keranjang Pesanan</h2>
          <div v-if="cart.length === 0" class="text-center text-gray-500 py-16">
            <Icon name="lucide:shopping-cart" size="48" class="mx-auto mb-4 text-gray-400" />
            <p>Keranjang masih kosong.</p>
            <p class="text-sm">Cari produk untuk ditambahkan.</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="item in cart" :key="item.product.id" class="flex items-center justify-between bg-gray-100 dark:bg-gray-700/50 p-3 rounded-lg">
              <div class="flex-1">
                <p class="font-semibold">{{ item.product.name }}</p>
                <p class="text-sm text-gray-500">{{ formatCurrency(item.product.price) }}</p>
              </div>
              <div class="flex items-center space-x-3">
                <input type="number" :value="item.quantity" @input="updateQuantity(item.product.id, +($event.target as HTMLInputElement).value)" class="w-20 p-2 border rounded-md bg-white dark:bg-gray-800 text-center" min="0" />
                <button @click="removeFromCart(item.product.id)" class="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                  <Icon name="lucide:trash-2" size="18" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar: Order Summary -->
      <div class="lg:w-1/3 bg-white dark:bg-gray-800 p-6 lg:p-8 border-l dark:border-gray-700 flex flex-col">
        <h2 class="text-xl font-bold mb-6">Ringkasan Pesanan</h2>
        
        <div class="flex-1 space-y-6">
          <div>
            <h3 class="text-lg font-semibold mb-4">Informasi Pelanggan <span class="text-sm font-normal text-gray-500">(Opsional)</span></h3>
            <div class="space-y-4">
              <UInput v-model="customer.name" placeholder="Nama Pelanggan" icon="i-heroicons-user" />
              <UInput v-model="customer.email" type="email" placeholder="Email" icon="i-heroicons-envelope" />
              <UInput v-model="customer.phone" type="tel" placeholder="Telepon" icon="i-heroicons-phone" />
            </div>
          </div>
        </div>

        <div class="border-t dark:border-gray-700 pt-6 mt-6">
          <div class="flex justify-between items-center mb-4">
            <span class="text-lg font-semibold">Total Tagihan</span>
            <span class="text-2xl font-bold text-primary-500">{{ formatCurrency(totalAmount) }}</span>
          </div>
          <UButton @click="submitOrder" :loading="isLoading" :disabled="cart.length === 0" size="xl" block>
            Buat Pesanan & Lanjut Pembayaran
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>