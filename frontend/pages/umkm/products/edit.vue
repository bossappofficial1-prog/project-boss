<script setup lang="ts">
import { ProductType, ServiceStatus, FeeBearer, type ProductForm, type Product } from '~/types'

definePageMeta({
  layout: 'blank',
  middleware: ['auth', 'owner', 'business-required']
})

const auth = useAuthStore()
const route = useRoute()
const isLoading = ref(false)
const productId = route.params.id as string

const form = ref<ProductForm>({
  name: '',
  description: '',
  costPrice: 0,
  price: 0,
  type: ProductType.GOODS, // Default to GOODS
  quantity: 0,
  unit: '',
  status: ServiceStatus.ACTIVE, // Default to ACTIVE
  transactionFeeBearer: FeeBearer.CUSTOMER, // Default to CUSTOMER
  serviceDurationMinutes: 0,
  image: ''
})

const errors = ref<Record<string, string>>({})

const productTypeOptions = [
  { value: ProductType.GOODS, label: 'Barang' },
  { value: ProductType.SERVICE, label: 'Jasa' }
]

const serviceStatusOptions = [
  { value: ServiceStatus.ACTIVE, label: 'Aktif' },
  { value: ServiceStatus.INACTIVE, label: 'Tidak Aktif' }
]

const feeBearerOptions = [
  { value: FeeBearer.CUSTOMER, label: 'Pelanggan' },
  { value: FeeBearer.OWNER, label: 'Pemilik Bisnis' }
]

// Load existing product data
onMounted(async () => {
  if (productId) {
    isLoading.value = true
    try {
      const { data, error } = await useApi<{ product: Product }>(`/api/products/${productId}`)
      if (error.value) {
        console.error('Failed to fetch product:', error.value)
        const toast = useToast()
        toast.add({
          title: 'Error!',
          description: 'Gagal memuat data produk.',
          color: 'error'
        })
        await navigateTo('/umkm/products')
        return
      }
      if (data.value?.data?.product) {
        const product = data.value.data.product
        form.value = {
          name: product.name || '',
          description: product.description || '',
          costPrice: product.costPrice || 0,
          price: product.price || 0,
          type: product.type || ProductType.GOODS,
          quantity: product.quantity || 0,
          unit: product.unit || '',
          status: product.status || ServiceStatus.ACTIVE,
          transactionFeeBearer: product.transactionFeeBearer || FeeBearer.CUSTOMER,
          serviceDurationMinutes: product.serviceDurationMinutes || 0,
          image: product.image || ''
        }
      }
    } catch (error) {
      console.error('Product fetch error:', error)
      const toast = useToast()
      toast.add({
        title: 'Error!',
        description: 'Terjadi kesalahan saat memuat data produk.',
        color: 'error'
      })
      await navigateTo('/umkm/products')
    } finally {
      isLoading.value = false
    }
  }
})

const validateForm = (): boolean => {
  errors.value = {}
  
  if (!form.value.name.trim()) {
    errors.value.name = 'Nama produk harus diisi'
    return false
  }
  if (form.value.costPrice < 0) {
    errors.value.costPrice = 'Harga modal tidak boleh negatif'
    return false
  }
  if (form.value.price < 0) {
    errors.value.price = 'Harga jual tidak boleh negatif'
    return false
  }
  if (form.value.type === ProductType.GOODS && form.value.quantity! < 0) {
    errors.value.quantity = 'Jumlah barang tidak boleh negatif'
    return false
  }
  if (form.value.type === ProductType.SERVICE && form.value.serviceDurationMinutes! < 0) {
    errors.value.serviceDurationMinutes = 'Durasi layanan tidak boleh negatif'
    return false
  }
  
  return true
}

const submitForm = async () => {
  if (!validateForm()) return
  
  isLoading.value = true
  
  try {
    const endpoint = `/api/products/update/${productId}`
    const method = 'PUT'
    
    const { data, error } = await useApi<{ product: any }>(endpoint, {
      method,
      body: form.value
    })
    
    if (error.value) {
      if (error.value.data?.message) {
        errors.value.submit = error.value.data.message
      } else {
        errors.value.submit = 'Terjadi kesalahan saat menyimpan data produk'
      }
      return
    }
    
    const toast = useToast()
    toast.add({
      title: 'Berhasil!',
      description: 'Produk berhasil diperbarui',
      color: 'success'
    })
    
    await navigateTo('/umkm/products')
  } catch (error) {
    console.error('Product form error:', error)
    errors.value.submit = 'Terjadi kesalahan saat menyimpan data produk'
  } finally {
    isLoading.value = false
  }
}

const pageTitle = computed(() => 'Edit Produk')

const buttonText = computed(() => 'Perbarui Produk')
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <BaseBack />
      <div class="flex items-center space-x-3 mt-4">
        <div class="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
          <Icon name="lucide:package" size="24" class="text-white" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ pageTitle }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Kelola informasi produk Anda
          </p>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <form @submit.prevent="submitForm" class="space-y-6">
        <!-- Basic Information -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informasi Produk
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Produk *
              </label>
              <input
                v-model="form.name"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Masukkan nama produk"
                :class="{ 'border-red-500': errors.name }"
              />
              <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
            </div>
            
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deskripsi Produk
              </label>
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Deskripsi produk..."
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Harga Modal *
              </label>
              <input
                v-model.number="form.costPrice"
                type="number"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="0"
                :class="{ 'border-red-500': errors.costPrice }"
              />
              <p v-if="errors.costPrice" class="text-red-500 text-sm mt-1">{{ errors.costPrice }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Harga Jual *
              </label>
              <input
                v-model.number="form.price"
                type="number"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="0"
                :class="{ 'border-red-500': errors.price }"
              />
              <p v-if="errors.price" class="text-red-500 text-sm mt-1">{{ errors.price }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipe Produk *
              </label>
              <BaseSelect
                v-model="form.type"
                :options="productTypeOptions"
                placeholder="Pilih tipe produk"
              />
            </div>

            <div v-if="form.type === ProductType.GOODS">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Jumlah Stok
              </label>
              <input
                v-model.number="form.quantity"
                type="number"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="0"
                :class="{ 'border-red-500': errors.quantity }"
              />
              <p v-if="errors.quantity" class="text-red-500 text-sm mt-1">{{ errors.quantity }}</p>
            </div>

            <div v-if="form.type === ProductType.GOODS">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Satuan
              </label>
              <input
                v-model="form.unit"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Contoh: pcs, kg, liter"
              />
            </div>

            <div v-if="form.type === ProductType.SERVICE">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Durasi Layanan (menit)
              </label>
              <input
                v-model.number="form.serviceDurationMinutes"
                type="number"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="0"
                :class="{ 'border-red-500': errors.serviceDurationMinutes }"
              />
              <p v-if="errors.serviceDurationMinutes" class="text-red-500 text-sm mt-1">{{ errors.serviceDurationMinutes }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status Produk *
              </label>
              <BaseSelect
                v-model="form.status"
                :options="serviceStatusOptions"
                placeholder="Pilih status produk"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Penanggung Biaya Transaksi
              </label>
              <BaseSelect
                v-model="form.transactionFeeBearer"
                :options="feeBearerOptions"
                placeholder="Pilih penanggung biaya"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL Gambar Produk
              </label>
              <input
                v-model="form.image"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="URL gambar produk (opsional)"
              />
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errors.submit" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div class="flex items-start space-x-2">
            <Icon name="lucide:alert-circle" size="16" class="text-red-500 mt-0.5" />
            <p class="text-red-600 dark:text-red-400 text-sm">{{ errors.submit }}</p>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            @click="$router.back()"
            class="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Batal
          </button>
          
          <button
            type="submit"
            :disabled="isLoading"
            class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <span v-if="isLoading">
              <Icon name="lucide:loader-2" size="20" class="animate-spin" />
            </span>
            <span>{{ buttonText }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>