<script setup lang="ts">
import type { BusinessForm, FeeBearer } from '~/types'

definePageMeta({
  layout: 'blank',
  middleware: ['auth', 'owner']
})

const auth = useAuthStore()
const isLoading = ref(false)

const form = ref<BusinessForm>({
  name: '',
  description: '',
  bankName: '',
  bankAccount: '',
  accountHolder: '',
  defaultTransactionFeeBearer: 'CUSTOMER' as FeeBearer
})

const errors = ref<Record<string, string>>({})

const feeOptions = [
  { value: 'CUSTOMER', label: 'Pelanggan menanggung biaya transaksi' },
  { value: 'OWNER', label: 'Saya yang menanggung biaya transaksi' }
]

// Load existing business data if available
onMounted(async () => {
  if (auth.user?.business) {
    const business = auth.user.business
    form.value = {
      name: business.name || '',
      description: business.description || '',
      bankName: business.bankName || '',
      bankAccount: business.bankAccount || '',
      accountHolder: business.accountHolder || '',
      defaultTransactionFeeBearer: business.defaultTransactionFeeBearer || 'CUSTOMER'
    }
  }
})

const validateForm = (): boolean => {
  errors.value = {}
  
  if (!form.value.name.trim()) {
    errors.value.name = 'Nama bisnis harus diisi'
    return false
  }
  
  return true
}

const submitForm = async () => {
  if (!validateForm()) return
  
  isLoading.value = true
  
  try {
    const endpoint = '/api/business/update'
    const method = 'PUT'
    
    const { data, error } = await useApi<{ business: any }>(endpoint, {
      method,
      body: form.value
    })
    
    if (error.value) {
      if (error.value.data?.message) {
        errors.value.submit = error.value.data.message
      } else {
        errors.value.submit = 'Terjadi kesalahan saat menyimpan data bisnis'
      }
      return
    }
    
    const toast = useToast()
    toast.add({
      title: 'Berhasil!',
      description: 'Profil bisnis berhasil diperbarui',
      color: 'success'
    })
    
    await navigateTo('/umkm')
  } catch (error) {
    console.error('Business form error:', error)
    errors.value.submit = 'Terjadi kesalahan saat menyimpan data bisnis'
  } finally {
    isLoading.value = false
  }
}

const pageTitle = computed(() => 'Edit Profil Bisnis')

const buttonText = computed(() => 'Perbarui Profil')
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-3 mb-4">
        <div class="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
          <Icon name="lucide:building-2" size="24" class="text-white" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ pageTitle }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Kelola informasi bisnis Anda
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
            Informasi Dasar
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Bisnis *
              </label>
              <input
                v-model="form.name"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Masukkan nama bisnis Anda"
                :class="{ 'border-red-500': errors.name }"
              />
              <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
            </div>
            
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deskripsi Bisnis
              </label>
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Ceritakan tentang bisnis Anda..."
              ></textarea>
              <p class="text-gray-500 text-sm mt-1">
                Deskripsi akan membantu pelanggan memahami bisnis Anda
              </p>
            </div>
          </div>
        </div>

        <!-- Bank Information -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informasi Bank
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Bank
              </label>
              <select
                v-model="form.bankName"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              >
                <option value="">Pilih Bank</option>
                <option value="BCA">BCA</option>
                <option value="BNI">BNI</option>
                <option value="BRI">BRI</option>
                <option value="Mandiri">Mandiri</option>
                <option value="CIMB Niaga">CIMB Niaga</option>
                <option value="Danamon">Danamon</option>
                <option value="Permata">Permata</option>
                <option value="BTN">BTN</option>
                <option value="BSI">BSI</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nomor Rekening
              </label>
              <input
                v-model="form.bankAccount"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="1234567890"
                :class="{ 'border-red-500': errors.bankAccount }"
              />
              <p v-if="errors.bankAccount" class="text-red-500 text-sm mt-1">{{ errors.bankAccount }}</p>
            </div>
            
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Pemilik Rekening *
              </label>
              <input
                v-model="form.accountHolder"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Nama sesuai dengan rekening bank"
                :class="{ 'border-red-500': errors.accountHolder }"
              />
              <p v-if="errors.accountHolder" class="text-red-500 text-sm mt-1">{{ errors.accountHolder }}</p>
            </div>
          </div>
        </div>

        <!-- Transaction Fee Settings -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Pengaturan Biaya Transaksi
          </h2>
          
          <div class="space-y-3">
            <div
              v-for="option in feeOptions"
              :key="option.value"
              class="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              @click="form.defaultTransactionFeeBearer = option.value as FeeBearer"
            >
              <input
                :id="option.value"
                v-model="form.defaultTransactionFeeBearer"
                :value="option.value"
                type="radio"
                class="w-4 h-4 text-primary-500 focus:ring-primary-500"
              />
              <label :for="option.value" class="flex-1 cursor-pointer">
                <div class="font-medium text-gray-900 dark:text-white">
                  {{ option.label }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ option.value === 'CUSTOMER' ? 'Biaya transaksi akan ditambahkan ke total pembayaran pelanggan' : 'Biaya transaksi akan dipotong dari penghasilan Anda' }}
                </div>
              </label>
            </div>
          </div>
          
          <div class="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <div class="flex items-start space-x-2">
              <Icon name="lucide:alert-triangle" size="16" class="text-yellow-500 mt-0.5" />
              <p class="text-yellow-700 dark:text-yellow-300 text-sm">
                Pengaturan ini akan menjadi default untuk semua produk. Anda dapat mengubahnya per produk nanti.
              </p>
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