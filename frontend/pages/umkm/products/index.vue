<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Produk & Layanan
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Kelola produk dan layanan untuk {{ auth.outletFokus?.name }}
        </p>
      </div>
      <NuxtLink
        to="/umkm/products/create"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <Icon name="mdi:plus" size="20" />
        Tambah Produk
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari produk..."
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div class="sm:w-48">
          <select
            v-model="filterType"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">Semua Tipe</option>
            <option value="BARANG">Barang</option>
            <option value="JASA">Jasa</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow animate-pulse">
        <div class="space-y-3">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Products Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
        @click="viewProduct(product.id)"
      >
        <!-- Product Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {{ product.name }}
            </h3>
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                product.type === 'BARANG'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              ]"
            >
              {{ product.type === 'BARANG' ? 'Barang' : 'Jasa' }}
            </span>
          </div>
          <div class="flex items-center gap-1">
            <NuxtLink
              :to="`/umkm/products/${product.id}`"
              @click.stop
              class="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Icon name="mdi:pencil" size="16" />
            </NuxtLink>
            <button
              @click.stop="deleteProduct(product.id)"
              class="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <Icon name="mdi:delete" size="16" />
            </button>
          </div>
        </div>

        <!-- Product Info -->
        <div class="space-y-2">
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {{ product.description || 'Tidak ada deskripsi' }}
          </p>
          
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold text-blue-600 dark:text-blue-400">
              Rp {{ formatPrice(product.price) }}
            </span>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              Stok: {{ product.stock }} {{ product.unit }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && filteredProducts.length === 0" class="text-center py-12">
      <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
        <div class="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="mdi:package-variant-closed" size="40" class="text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {{ searchQuery ? 'Produk tidak ditemukan' : 'Belum ada produk' }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ searchQuery ? 'Coba ubah kata kunci pencarian' : 'Tambahkan produk pertama Anda' }}
        </p>
        <NuxtLink
          v-if="!searchQuery"
          to="/umkm/products/create"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-block"
        >
          Tambah Produk
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'umkm'
})

const auth = useAuthStore()

// Reactive data
const searchQuery = ref('')
const filterType = ref('')
const loading = ref(false)
const products = ref([])

// Simulated data based on outlet
const getProductsForOutlet = (outletId) => {
  const baseProducts = [
    {
      id: '1',
      name: 'Kopi Arabica Premium',
      description: 'Kopi arabica berkualitas tinggi dengan cita rasa yang khas',
      price: 75000,
      type: 'BARANG',
      unit: 'kg'
    },
    {
      id: '2',
      name: 'Jasa Konsultasi Bisnis',
      description: 'Layanan konsultasi untuk pengembangan bisnis UMKM',
      price: 500000,
      type: 'JASA',
      unit: 'jam'
    },
    {
      id: '3',
      name: 'Keripik Singkong',
      description: 'Keripik singkong renyah dengan berbagai varian rasa',
      price: 15000,
      type: 'BARANG',
      unit: 'pack'
    }
  ]

  // Simulate different stock levels per outlet
  const stockLevels = {
    '1': { '1': 50, '2': 999, '3': 100 }, // Outlet Pusat
    '2': { '1': 30, '2': 999, '3': 75 },  // Outlet Cabang A
    '3': { '1': 20, '2': 999, '3': 50 }   // Outlet Cabang B
  }

  return baseProducts.map(product => ({
    ...product,
    stock: stockLevels[outletId]?.[product.id] || 0
  }))
}

// Load products data
const loadProducts = async () => {
  if (!auth.outletFokus?.id) return
  
  loading.value = true
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  products.value = getProductsForOutlet(auth.outletFokus.id)
  loading.value = false
}

// Computed
const filteredProducts = computed(() => {
  let filtered = products.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(product =>
      product.name.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query))
    )
  }

  // Filter by type
  if (filterType.value) {
    filtered = filtered.filter(product => product.type === filterType.value)
  }

  return filtered
})

// Methods
const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID').format(price)
}

const viewProduct = (productId) => {
  navigateTo(`/umkm/products/${productId}`)
}

const deleteProduct = (productId) => {
  if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
    products.value = products.value.filter(p => p.id !== productId)
  }
}

// Watch for outlet changes and reload data
watch(() => auth.outletFokus, (newOutlet) => {
  if (newOutlet) {
    loadProducts()
  }
}, { immediate: true })

// Load initial data
onMounted(() => {
  loadProducts()
})
</script>