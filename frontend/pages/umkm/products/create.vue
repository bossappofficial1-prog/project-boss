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
          Tambah Produk
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Tambahkan produk atau layanan baru untuk {{ auth.outletFokus?.name }}
        </p>
      </div>
    </div>

    <!-- Form -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
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

        <!-- Initial Stock -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Stok Awal
          </label>
          <input
            v-model.number="form.initialStock"
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
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
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

const auth = useAuthStore()
const router = useRouter()

// Form data
const form = reactive({
  name: '',
  type: '',
  description: '',
  price: 0,
  unit: 'pcs',
  initialStock: 0
})

const isSubmitting = ref(false)

// Computed
const isFormValid = computed(() => {
  return form.name.trim() && form.type && form.price > 0
})

// Methods
const submitForm = async () => {
  if (!isFormValid.value) return

  isSubmitting.value = true
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate adding product
    console.log('Produk baru:', {
      ...form,
      outletId: auth.outletFokus?.id,
      id: Date.now().toString(),
      createdAt: new Date()
    })

    // Redirect to products list
    await router.push('/umkm/products')
    
  } catch (error) {
    console.error('Error adding product:', error)
    alert('Terjadi kesalahan saat menyimpan produk')
  } finally {
    isSubmitting.value = false
  }
}
</script>