<script setup lang="ts">
import type { OutletForm } from '~/types'

definePageMeta({
  layout: 'blank',
  middleware: ['auth', 'owner', 'business-required']
})

const auth = useAuthStore()
const isLoading = ref(false)
const imageFile = ref<File | null>(null)
const imageUrlPreview = ref<string | null>(null)

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    // check file size
    if (file.size > 2 * 1024 * 1024) {
      errors.value.image = 'Ukuran gambar tidak boleh lebih dari 2MB.'
      return
    }
    
    imageFile.value = file
    form.value.image = '' // Clear previous image URL if a new file is selected
    errors.value.image = '' // Clear previous error

    const reader = new FileReader()
    reader.onload = (e) => {
      imageUrlPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

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
  errors.value = {}

  let finalImageUrl = form.value.image

  if (imageFile.value) {
    const formData = new FormData()
    formData.append('image', imageFile.value)

    try {
      const { data: uploadData, error: uploadError } = await useApi<{
        url: string
      }>('/upload/image', {
        method: 'POST',
        body: formData
      })

      if (uploadError.value || !uploadData.value?.data?.url) {
        errors.value.image = 'Gagal mengunggah gambar.'
        isLoading.value = false
        return
      }
      finalImageUrl = uploadData.value.data.url
    } catch (e) {
      console.error('Image upload error', e)
      errors.value.image = 'Terjadi kesalahan saat mengunggah gambar.'
      isLoading.value = false
      return
    }
  }

  try {
    const endpoint = '/outlets'
    const method = 'POST'

    const payload = {
      ...form.value,
      image: finalImageUrl,
      businessId: auth.business?.id
    }

    const { data, error } = await useApi<{ outlet: any }>(endpoint, {
      method,
      body: payload
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
                Gambar Outlet
              </label>
              <div class="mt-2">
                <div class="flex items-center gap-x-3">
                  <img v-if="imageUrlPreview" :src="imageUrlPreview" alt="Preview" class="h-24 w-24 rounded-lg object-cover">
                  <img v-else-if="form.image" :src="form.image" alt="Current Image" class="h-24 w-24 rounded-lg object-cover">
                  <div v-else class="h-24 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <Icon name="lucide:image" class="w-10 h-10 text-gray-400" />
                  </div>
                  <div>
                    <label
                      for="file-upload"
                      class="cursor-pointer rounded-md bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <span>Pilih Gambar</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        class="sr-only"
                        accept="image/*"
                        @change="handleFileChange"
                      >
                    </label>
                    <p class="text-xs leading-5 text-gray-600 dark:text-gray-400 mt-1">
                      PNG, JPG, GIF up to 2MB.
                    </p>
                  </div>
                </div>
                <p v-if="errors.image" class="text-red-500 text-sm mt-1">{{ errors.image }}</p>
              </div>
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