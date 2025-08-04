<script setup lang="ts">
import type { OutletForm } from '~/types'

definePageMeta({
  layout: 'umkm',
  middleware: ['auth', 'owner', 'business-required']
})

const auth = useAuthStore()
const route = useRoute()
const isLoading = ref(false)
const imageFile = ref<File | null>(null)
const imageUrlPreview = ref<string | null>(null)
const isSetupMode = ref(route.query.setup === 'true')
const currentStep = ref(1)
const fileInput = ref<HTMLInputElement | null>(null)
const businessId = auth.business?.id

const form = ref<OutletForm>({
  name: '',
  address: '',
  phone: '',
  image: '',
  businessId: businessId!,
  latitude: undefined,
  longitude: undefined
})

const errors = ref<Record<string, string>>({})

// Computed property for map location
const mapLocation = computed({
  get: () => ({
    address: form.value.address,
    latitude: form.value.latitude,
    longitude: form.value.longitude
  }),
  set: (value) => {
    form.value.address = value.address || ''
    form.value.latitude = value.latitude
    form.value.longitude = value.longitude
  }
})

const steps = [
  {
    id: 1,
    title: 'Informasi Dasar',
    description: 'Nama dan kontak outlet',
    icon: 'lucide:info'
  },
  {
    id: 2,
    title: 'Lokasi',
    description: 'Alamat dan detail lokasi',
    icon: 'lucide:map-pin'
  },
  {
    id: 3,
    title: 'Gambar',
    description: 'Upload foto outlet',
    icon: 'lucide:image'
  },
  {
    id: 4,
    title: 'Review',
    description: 'Periksa dan konfirmasi',
    icon: 'lucide:check'
  }
]

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      errors.value.image = 'Ukuran gambar tidak boleh lebih dari 2MB'
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      errors.value.image = 'File harus berupa gambar'
      return
    }

    imageFile.value = file
    form.value.image = ''
    errors.value.image = ''

    const reader = new FileReader()
    reader.onload = (e) => {
      imageUrlPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const removeImage = () => {
  imageFile.value = null
  imageUrlPreview.value = null
  form.value.image = ''
  errors.value.image = ''
}

const validateStep = (step: number): boolean => {
  errors.value = {}

  switch (step) {
    case 1:
      if (!form.value.name?.trim()) {
        errors.value.name = 'Nama outlet harus diisi'
        return false
      }
      if (!form.value.phone?.trim()) {
        errors.value.phone = 'Nomor telepon harus diisi'
        return false
      }
      break
    case 2:
      if (!form.value.address?.trim()) {
        errors.value.address = 'Alamat outlet harus diisi'
        return false
      }
      if (form.value.latitude === undefined || form.value.longitude === undefined) {
        errors.value.address = 'Lokasi pada peta harus dipilih'
        return false
      }
      break
  }

  return true
}

const nextStep = () => {
  if (validateStep(currentStep.value)) {
    currentStep.value++
  }
}

const prevStep = () => {
  currentStep.value--
}

const submitForm = async () => {
  if (!validateStep(1) || !validateStep(2)) return

  isLoading.value = true
  errors.value = {}

  try {
    let imageUrl = form.value.image

    // Upload image if a file is selected
    if (imageFile.value) {
      const formData = new FormData()
      formData.append('image', imageFile.value)

      const { data: uploadData, error: uploadError } = await useApi('/upload/image', {
        method: 'POST',
        body: formData
      })

      if (uploadError.value) {
        throw uploadError.value
      }

      // Extract URL from the response structure
      imageUrl = (uploadData.value?.data as any).url || ''
    }

    const { data, error } = await useApi('/outlets', {
      method: 'POST',
      body: {
        ...form.value,
        image: imageUrl
      }
    })

    if (error.value) {
      if (error.value.data?.message) {
        errors.value.submit = error.value.data.message
      } else {
        errors.value.submit = 'Terjadi kesalahan saat membuat outlet'
      }
      return
    }

    const toast = useToast()
    toast.add({
      title: 'Berhasil!',
      description: 'Outlet berhasil dibuat'
    } as any)

    auth.fetchUserData()

    if (isSetupMode.value) {
      await navigateTo('/umkm?setup=complete')
    } else {
      await navigateTo('/umkm')
    }
  } catch (e: any) {
    errors.value.submit = e.message || 'Terjadi kesalahan yang tidak terduga'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ isSetupMode ? 'Setup Outlet Pertama' : 'Buat Outlet Baru' }}
              </h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ isSetupMode ? 'Buat outlet pertama untuk memulai bisnis Anda' : `Tambahkan outlet baru ke bisnis
                Anda` }}
              </p>
            </div>
            <BaseButton variant="outline" @click="$router.back()">
              <Icon name="lucide:arrow-left" size="16" class="mr-2" />
              Kembali
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Progress Steps -->
      <div class="mb-8">
        <nav aria-label="Progress">
          <ol class="flex items-center justify-center space-x-6">
            <li v-for="(step, index) in steps" :key="step.id" :class="[
              'flex items-center',
              index !== steps.length - 1 ? 'relative' : ''
            ]">
              <div class="flex items-center space-x-3">
                <div :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                  currentStep >= step.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                ]">
                  <Icon v-if="currentStep > step.id" name="lucide:check" size="20" />
                  <Icon v-else :name="step.icon" size="20" />
                </div>
                <div class="hidden sm:block">
                  <p :class="[
                    'text-sm font-medium',
                    currentStep >= step.id
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400'
                  ]">
                    {{ step.title }}
                  </p>
                  <p class="text-xs text-gray-400">{{ step.description }}</p>
                </div>
              </div>

              <!-- Connector -->
              <div v-if="index !== steps.length - 1" :class="[
                'hidden sm:block w-16 h-0.5 ml-6 transition-colors duration-200',
                currentStep > step.id
                  ? 'bg-primary-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              ]" />
            </li>
          </ol>
        </nav>
      </div>

      <!-- Form Content -->
      <BaseCard class="p-8">
        <form @submit.prevent="submitForm">
          <!-- Step 1: Basic Information -->
          <div v-if="currentStep === 1" class="space-y-6">
            <div class="text-center mb-8">
              <div
                class="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="lucide:info" size="24" class="text-primary-600 dark:text-primary-400" />
              </div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Informasi Dasar</h2>
              <p class="text-gray-500 dark:text-gray-400">Masukkan nama dan kontak outlet Anda</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nama Outlet *
                </label>
                <BaseInput v-model="form.name" placeholder="Masukkan nama outlet" :error="errors.name" />
                <p class="text-xs text-gray-500 mt-1">
                  Nama outlet akan ditampilkan kepada pelanggan
                </p>
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nomor Telepon *
                </label>
                <BaseInput v-model="form.phone" placeholder="Contoh: 081234567890" :error="errors.phone" />
                <p class="text-xs text-gray-500 mt-1">
                  Nomor telepon untuk dihubungi pelanggan
                </p>
              </div>
            </div>
          </div>

          <!-- Step 2: Location -->
          <div v-if="currentStep === 2" class="space-y-6">
            <div class="text-center mb-8">
              <div
                class="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="lucide:map-pin" size="24" class="text-primary-600 dark:text-primary-400" />
              </div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Lokasi Outlet</h2>
              <p class="text-gray-500 dark:text-gray-400">Pilih lokasi outlet dengan peta atau cari alamat</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lokasi Outlet *
              </label>
              <BaseMapPicker v-model="mapLocation" placeholder="Cari alamat outlet atau pilih di peta"
                :error="errors.address" />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                <Icon name="lucide:info" size="12" class="inline mr-1" />
                Gunakan pencarian atau klik pada peta untuk memilih lokasi yang tepat
              </p>
            </div>
          </div>

          <!-- Step 3: Image Upload -->
          <div v-if="currentStep === 3" class="space-y-6">
            <div class="text-center mb-8">
              <div
                class="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="lucide:image" size="24" class="text-primary-600 dark:text-primary-400" />
              </div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Foto Outlet</h2>
              <p class="text-gray-500 dark:text-gray-400">Upload foto outlet untuk menarik pelanggan
                (opsional)</p>
            </div>

            <div class="space-y-4">
              <div v-if="!imageUrlPreview"
                class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer"
                @click="fileInput?.click()">
                <Icon name="lucide:upload" size="32" class="text-gray-400 mx-auto mb-4" />
                <p class="text-gray-600 dark:text-gray-400 mb-2">
                  Klik untuk upload foto atau drag & drop
                </p>
                <p class="text-xs text-gray-500">
                  PNG, JPG hingga 2MB
                </p>
              </div>

              <div v-else class="relative">
                <img :src="imageUrlPreview" alt="Preview" class="w-full max-w-md mx-auto rounded-lg shadow-md" />
                <button type="button" @click="removeImage"
                  class="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                  <Icon name="lucide:x" size="16" />
                </button>
              </div>

              <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileChange" />

              <div class="text-center">
                <BaseButton type="button" variant="outline" @click="fileInput?.click()">
                  <Icon name="lucide:camera" size="16" class="mr-2" />
                  {{ imageUrlPreview ? 'Ganti Foto' : 'Pilih Foto' }}
                </BaseButton>
              </div>

              <p v-if="errors.image" class="text-red-500 text-sm text-center">{{ errors.image }}</p>
            </div>
          </div>

          <!-- Step 4: Review -->
          <div v-if="currentStep === 4" class="space-y-6">
            <div class="text-center mb-8">
              <div
                class="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="lucide:check" size="24" class="text-primary-600 dark:text-primary-400" />
              </div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Review & Konfirmasi</h2>
              <p class="text-gray-500 dark:text-gray-400">Periksa kembali informasi outlet Anda</p>
            </div>

            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white mb-2">Informasi Dasar</h4>
                  <div class="space-y-2">
                    <p class="text-sm">
                      <span class="text-gray-500">Nama:</span>
                      <span class="ml-2 font-medium">{{ form.name }}</span>
                    </p>
                    <p class="text-sm">
                      <span class="text-gray-500">Telepon:</span>
                      <span class="ml-2 font-medium">{{ form.phone }}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white mb-2">Lokasi</h4>
                  <div class="space-y-2">
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ form.address }}</p>
                    <div v-if="form.latitude && form.longitude" class="grid grid-cols-2 gap-2 text-xs">
                      <div class="bg-white dark:bg-gray-700 px-2 py-1 rounded">
                        <span class="text-gray-500">Lat:</span>
                        <span class="ml-1 font-mono">{{ form.latitude.toFixed(6) }}</span>
                      </div>
                      <div class="bg-white dark:bg-gray-700 px-2 py-1 rounded">
                        <span class="text-gray-500">Lng:</span>
                        <span class="ml-1 font-mono">{{ form.longitude.toFixed(6) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="imageUrlPreview" class="text-center">
                <h4 class="font-medium text-gray-900 dark:text-white mb-3">Foto Outlet</h4>
                <img :src="imageUrlPreview" alt="Outlet Preview" class="max-w-xs mx-auto rounded-lg shadow-md" />
              </div>
            </div>

            <!-- Error message -->
            <div v-if="errors.submit"
              class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div class="flex items-center">
                <Icon name="lucide:alert-circle" size="20" class="text-red-500 mr-3" />
                <p class="text-red-700 dark:text-red-300">{{ errors.submit }}</p>
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <BaseButton v-if="currentStep > 1" type="button" variant="outline" @click="prevStep">
              <Icon name="lucide:arrow-left" size="16" class="mr-2" />
              Sebelumnya
            </BaseButton>
            <div v-else></div>

            <div class="flex space-x-3">
              <BaseButton v-if="currentStep < 4" type="button" @click="nextStep">
                Selanjutnya
                <Icon name="lucide:arrow-right" size="16" class="ml-2" />
              </BaseButton>
              <BaseButton v-else type="submit" :loading="isLoading">
                <Icon name="lucide:check" size="16" class="mr-2" />
                {{ isSetupMode ? 'Selesaikan Setup' : 'Buat Outlet' }}
              </BaseButton>
            </div>
          </div>
        </form>
      </BaseCard>
    </div>
  </div>
</template>
