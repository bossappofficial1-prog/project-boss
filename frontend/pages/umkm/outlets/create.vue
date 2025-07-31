<script setup lang="ts">
import type { OutletForm } from '~/types'

definePageMeta({
  layout: 'blank',
  middleware: ['auth', 'owner', 'business-required']
})

const auth = useAuthStore()
const isLoading = ref(false)

const form = ref<OutletForm>({
  name: '',
  address: '',
  phone: '',
  image: ''
})

const errors = ref<Record<string, string>>({})

const validateForm = (): boolean => {
  errors.value = {}
  
  if (!form.value.name.trim()) {
    errors.value.name = 'Nama outlet harus diisi'
    return false
  }
  
  return true
}

const submitForm = async () => {
  if (!validateForm()) return
  
  isLoading.value = true
  
  try {
    const endpoint = '/api/outlets/create'
    const method = 'POST'
    
    const { data, error } = await useApi<{ outlet: any }>(endpoint, {
      method,
      body: form.value
    })
    
    if (error.value) {
      if (error.value.data?.message) {
        errors.value.submit = error.value.data.message
      } else {
        errors.value.submit = 'Terjadi kesalahan saat menyimpan data outlet'
      }
      return
    }
    
    const toast = useToast()
    toast.add({
      title: 'Berhasil!',
      description: 'Outlet berhasil dibuat',
      color: 'success'
    })
    
    await navigateTo('/umkm')
  } catch (error) {
    console.error('Outlet form error:', error)
    errors.value.submit = 'Terjadi kesalahan saat menyimpan data outlet'
  } finally {
    isLoading.value = false
  }
}

const pageTitle = computed(() => 'Tambah Outlet Baru')

const buttonText = computed(() => 'Tambah Outlet')
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <BaseBack />
      <div class="flex items-center space-x-3 mt-4">
        <div class="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
          <Icon name="lucide:store" size="24" class="text-white" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ pageTitle }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Tambahkan informasi outlet baru Anda
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
            Informasi Outlet
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Outlet *
              </label>
              <input
                v-model="form.name"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Masukkan nama outlet Anda"
                :class="{ 'border-red-500': errors.name }"
              />
              <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
            </div>
            
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alamat
              </label>
              <textarea
                v-model="form.address"
                rows="3"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Alamat lengkap outlet Anda"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nomor Telepon
              </label>
              <input
                v-model="form.phone"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Nomor telepon outlet"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL Gambar Outlet
              </label>
              <input
                v-model="form.image"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="URL gambar outlet (opsional)"
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