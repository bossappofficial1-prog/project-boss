<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import { ProductType, ServiceStatus, FeeBearer, type Product, type ProductForm } from '~/types'

definePageMeta({
  layout: 'blank',
  middleware: ['auth', 'owner', 'business-required']
})

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const productId = route.params.id as string
const isLoading = ref(false)
const product = ref<Product | null>(null)

const form = ref<ProductForm>({
  name: '',
  description: '',
  costPrice: 0,
  price: 0,
  type: ProductType.GOODS,
  quantity: 0,
  unit: '',
  status: ServiceStatus.INACTIVE,
  transactionFeeBearer: FeeBearer.CUSTOMER,
  outletId: auth.selectedOutlet?.id!,
  serviceDurationMinutes: 0,
  image: ''
})

const errors = ref<Record<string, string>>({})

const productTypeOptions = [
  { value: ProductType.GOODS, label: 'Barang' },
  { value: ProductType.SERVICE, label: 'Jasa' }
]

const feeBearerOptions = [
  { value: FeeBearer.CUSTOMER, label: 'Pelanggan' },
  { value: FeeBearer.OWNER, label: 'Pemilik Bisnis' }
]

const loadProduct = async () => {
  isLoading.value = true
  const { data, error } = await useApi<Product>(`/products/${productId}`)
  isLoading.value = false

  if (error.value || !data.value?.data) {
    toast.add({ title: 'Error', description: 'Gagal memuat data produk.', color: 'error' })
    product.value = null
    return
  }

  product.value = data.value.data
  // Populate form with existing data
  form.value = {
    ...form.value,
    name: product.value.name,
    description: product.value.description || '',
    costPrice: product.value.costPrice,
    price: product.value.price,
    type: product.value.type,
    quantity: product.value.quantity,
    unit: product.value.unit || '',
    status: product.value.status,
    transactionFeeBearer: product.value.transactionFeeBearer,
    serviceDurationMinutes: product.value.serviceDurationMinutes,
    image: product.value.image || ''
  }
}

const validateForm = (): boolean => {
  errors.value = {}
  if (!form.value.name.trim()) errors.value.name = 'Nama produk harus diisi'
  if (form.value.costPrice < 0) errors.value.costPrice = 'Harga modal tidak boleh negatif'
  if (form.value.price < 0) errors.value.price = 'Harga jual tidak boleh negatif'
  if (form.value.type === ProductType.GOODS && (form.value.quantity ?? 0) < 0) {
    errors.value.quantity = 'Jumlah barang tidak boleh negatif'
  }
  if (form.value.type === ProductType.SERVICE && (form.value.serviceDurationMinutes ?? 0) < 0) {
    errors.value.serviceDurationMinutes = 'Durasi layanan tidak boleh negatif'
  }
  return Object.keys(errors.value).length === 0
}

const submitForm = async () => {
  if (!validateForm()) return

  isLoading.value = true
  const { error } = await useApi(`/products/${productId}`, {
    method: 'PATCH',
    body: form.value
  })
  isLoading.value = false

  if (error.value) {
    errors.value.submit = error.value.data?.message || 'Terjadi kesalahan saat memperbarui produk.'
    return
  }

  toast.add({ title: 'Berhasil!', description: 'Produk berhasil diperbarui.', color: 'success' })
  await router.push('/umkm/products')
}

const handleFileChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('image', file)

  isLoading.value = true
  const { data, error } = await useApi<{ url: string }>('/upload/image', { method: 'POST', body: formData })
  isLoading.value = false

  if (error.value || !data.value?.data?.url) {
    errors.value.image = 'Gagal mengunggah gambar.'
    return
  }
  form.value.image = data.value.data.url
}

const removeImage = async () => {
  if (!form.value.image) return
  isLoading.value = true
  await useApi('/upload/image', { method: 'DELETE', body: { url: form.value.image } })
  form.value.image = ''
  isLoading.value = false
}

onMounted(loadProduct)

const pageTitle = 'Edit Produk'
const buttonText = 'Simpan Perubahan'
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <BaseBack />
      <div class="flex items-center space-x-3 mt-4">
        <div class="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
          <Icon name="lucide:package-edit" size="24" class="text-white" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ pageTitle }}</h1>
          <p class="text-gray-600 dark:text-gray-400">Perbarui informasi produk Anda.</p>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div v-if="product" class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <form @submit.prevent="submitForm" class="space-y-6">
        <!-- Basic Information -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informasi Produk</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Produk *</label>
              <UInput v-model="form.name" placeholder="Masukkan nama produk" :class="{ 'border-red-500': errors.name }" />
              <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deskripsi Produk</label>
              <UTextarea v-model="form.description" placeholder="Deskripsi produk..." />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Harga Modal *</label>
              <UInput v-model.number="form.costPrice" type="number" placeholder="0" :class="{ 'border-red-500': errors.costPrice }" />
              <p v-if="errors.costPrice" class="text-red-500 text-sm mt-1">{{ errors.costPrice }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Harga Jual *</label>
              <UInput v-model.number="form.price" type="number" placeholder="0" :class="{ 'border-red-500': errors.price }" />
              <p v-if="errors.price" class="text-red-500 text-sm mt-1">{{ errors.price }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipe Produk *</label>
              <BaseSelect v-model="form.type" :options="productTypeOptions" placeholder="Pilih tipe produk" />
            </div>
            <div v-if="form.type === ProductType.GOODS">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jumlah Stok</label>
              <UInput v-model.number="form.quantity" type="number" placeholder="0" :class="{ 'border-red-500': errors.quantity }" />
              <p v-if="errors.quantity" class="text-red-500 text-sm mt-1">{{ errors.quantity }}</p>
            </div>
            <div v-if="form.type === ProductType.GOODS">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Satuan</label>
              <UInput v-model="form.unit" placeholder="Contoh: pcs, kg, liter" />
            </div>
            <div v-if="form.type === ProductType.SERVICE">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Durasi Layanan (menit)</label>
              <UInput v-model.number="form.serviceDurationMinutes" type="number" placeholder="0" :class="{ 'border-red-500': errors.serviceDurationMinutes }" />
              <p v-if="errors.serviceDurationMinutes" class="text-red-500 text-sm mt-1">{{ errors.serviceDurationMinutes }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Penanggung Biaya Transaksi</label>
              <BaseSelect v-model="form.transactionFeeBearer" :options="feeBearerOptions" placeholder="Pilih penanggung biaya" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gambar Produk</label>
              <div v-if="form.image" class="relative">
                <img :src="form.image" alt="Preview Gambar" class="w-full h-auto rounded-lg mb-2" />
                <button @click="removeImage" type="button" class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1">
                  <Icon name="lucide:x" size="16" />
                </button>
              </div>
              <UInput v-else type="file" @change="handleFileChange" accept="image/*" />
              <p v-if="errors.image" class="text-red-500 text-sm mt-1">{{ errors.image }}</p>
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
          <UButton type="button" @click="$router.back()" variant="outline">Batal</UButton>
          <UButton type="submit" :loading="isLoading">{{ buttonText }}</UButton>
        </div>
      </form>
    </div>
    <div v-else-if="isLoading" class="text-center">
      <BaseLoading />
    </div>
    <div v-else class="text-center">
      <BaseErrorState error="Produk tidak ditemukan." @retry="loadProduct" />
    </div>
  </div>
</template>