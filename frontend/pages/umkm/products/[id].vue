<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <button
        @click="$router.back()"
        class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <Icon name="mdi:arrow-left" size="24" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Edit Produk
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Ubah informasi produk/layanan di {{ auth.outletFokus?.name }}
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div class="animate-pulse space-y-4">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else-if="!product" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
      <Icon name="mdi:alert-circle" size="48" class="text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Produk tidak ditemukan
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Produk yang Anda cari tidak tersedia
      </p>
      <NuxtLink
        to="/umkm/products"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-block"
      >
        Kembali ke Daftar Produk
      </NuxtLink>
    </div>

    <!-- Form -->
    <div v-else class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <form @submit.prevent="submitForm" class="space-y-6">
        <!-- Product Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nama Produk/Layanan *
          </label>
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Masukkan nama produk/layanan"
          />
        </div>

        <!-- Product Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipe *
          </label>
          <select
            v-model="form.type"
            required
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Pilih tipe</option>
            <option value="BARANG">Barang</option>
            <option value="JASA">Jasa</option>
          </select>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Deskripsi
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Masukkan deskripsi produk/layanan"
          ></textarea>
        </div>

        <!-- Price -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Harga *
          </label>
          <div class="relative">
            <span class="absolute left-3 top-2 text-gray-500">Rp</span>
            <input
              v-model.number="form.price"
              type="number"
              required
              min="0"
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="0"
            />
          </div>
        </div>

        <!-- Unit -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Satuan
          </label>
          <input
            v-model="form.unit"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="pcs, kg, jam, dll"
          />
        </div>

        <!-- Current Stock -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Stok Saat Ini
          </label>
          <input
            v-model.number="form.stock"
            type="number"
            min="0"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="0"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-4 pt-4">
          <button
            type="button"
            @click="$router.back()"
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="!isFormValid || isSubmitting"
            class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'umkm'
})

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const productId = route.params.id
const loading = ref(true)
const product = ref(null)
const isSubmitting = ref(false)

// Form data
const form = reactive({
  name: '',
  type: '',
  description: '',
  price: 0,
  unit: 'pcs',
  stock: 0
})

// Load product data
const loadProduct = async () => {
  if (!auth.outletFokus?.id) return

  loading.value = true
  const { data, error } = await useApi(`/products/${productId}`)

  if (error.value) {
    // Handle error, e.g., show a toast message
    console.error('Error fetching product:', error.value)
    product.value = null
  } else {
    product.value = data.value?.data
    if (product.value) {
      // Initialize form with product data
      form.name = product.value.name
      form.type = product.value.type
      form.description = product.value.description || ''
      form.price = product.value.price
      form.unit = product.value.unit || 'pcs'
      form.stock = product.value.quantity // Assuming API returns quantity
    }
  }
  
  loading.value = false
}

// Computed
const isFormValid = computed(() => {
  return form.name.trim() && form.type && form.price > 0
})

// Methods
const submitForm = async () => {
  if (!isFormValid.value) return

  isSubmitting.value = true
  
  try {
    const { error } = await useApi(`/products/${productId}`, {
      method: 'PATCH',
      body: form,
    })

    if (error.value) {
      console.error('Error updating product:', error.value)
      alert('Terjadi kesalahan saat memperbarui produk')
      return
    }

    const toast = useToast()
    toast.add({
      title: 'Berhasil!',
      description: 'Produk berhasil diperbarui.',
      color: 'success'
    })

    // Redirect to products list
    await router.push('/umkm/products')
    
  } catch (error) {
    console.error('Error updating product:', error)
    alert('Terjadi kesalahan saat memperbarui produk')
  } finally {
    isSubmitting.value = false
  }
}

// Watch for outlet changes and reload data
watch(() => auth.outletFokus, (newOutlet) => {
  if (newOutlet) {
    loadProduct()
  }
}, { immediate: true })

// Load initial data
onMounted(() => {
  loadProduct()
})
</script>