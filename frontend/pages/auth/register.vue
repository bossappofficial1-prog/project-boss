<script setup lang="ts">
import type { RegisterForm } from '~/types'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const currentStep = ref(1)
const totalSteps = 3
const isLoading = ref(false)
const showVerification = ref(false)
const verificationCode = ref('')

const form = ref<RegisterForm>({
  email: '',
  name: '',
  password: '',
  confirmPassword: '',
  phone: ''
})

const errors = ref<Record<string, string>>({})

const stepTitles = [
  'Informasi Dasar',
  'Kontak',
  'Keamanan'
]

const validateStep = (step: number): boolean => {
  errors.value = {}
  
  switch (step) {
    case 1:
      if (!form.value.name.trim()) {
        errors.value.name = 'Nama lengkap harus diisi'
        return false
      }
      if (!form.value.email.trim()) {
        errors.value.email = 'Email harus diisi'
        return false
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
        errors.value.email = 'Format email tidak valid'
        return false
      }
      break
    
    case 2:
      if (!form.value.phone?.trim()) {
        errors.value.phone = 'Nomor telepon harus diisi'
        return false
      }
      if (!/^(\+62|62|0)[0-9]{8,13}$/.test(form.value.phone)) {
        errors.value.phone = 'Format nomor telepon tidak valid'
        return false
      }
      break
    
    case 3:
      if (!form.value.password) {
        errors.value.password = 'Password harus diisi'
        return false
      }
      if (form.value.password.length < 8) {
        errors.value.password = 'Password minimal 8 karakter'
        return false
      }
      if (form.value.password !== form.value.confirmPassword) {
        errors.value.confirmPassword = 'Konfirmasi password tidak cocok'
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
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const submitForm = async () => {
  if (!validateStep(currentStep.value)) return
  
  isLoading.value = true
  errors.value = {}
  
  try {
    const { error } = await useApi('/auth/register', {
      method: 'POST',
      body: (({ confirmPassword, ...rest }) => rest)(form.value)
    })
    
    if (error.value) {
      errors.value.submit = error.value.data?.message || 'Terjadi kesalahan saat mendaftar'
      return
    }
    
    showVerification.value = true
    
  } catch (e) {
    errors.value.submit = 'Terjadi kesalahan yang tidak terduga.'
  } finally {
    isLoading.value = false
  }
}

const handleVerification = async () => {
  if (!verificationCode.value.trim()) {
    errors.value.submit = 'Kode verifikasi harus diisi'
    return
  }
  isLoading.value = true
  errors.value = {}

  try {
    const { error } = await useApi('/auth/verify', {
      method: 'POST',
      body: {
        email: form.value.email,
        code: verificationCode.value
      }
    })

    if (error.value) {
      errors.value.submit = error.value.data?.message || 'Verifikasi gagal. Silakan coba lagi.'
      return
    }

    await navigateTo('/auth/login?message=verification-success')

  } catch (e) {
    errors.value.submit = 'Terjadi kesalahan saat verifikasi.'
  } finally {
    isLoading.value = false
  }
}

const progressPercentage = computed(() => (currentStep.value / totalSteps) * 100)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-8">
      <!-- Verification Form -->
      <div v-if="showVerification">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="lucide:mail-check" size="32" class="text-white" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Verifikasi Email Anda
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            Kami telah mengirimkan kode verifikasi ke <strong>{{ form.email }}</strong>.
          </p>
        </div>

        <form @submit.prevent="handleVerification">
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kode Verifikasi
              </label>
              <input
                v-model="verificationCode"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Masukkan 6 digit kode"
                :class="{ 'border-red-500': errors.submit }"
              />
            </div>
          </div>

          <div v-if="errors.submit" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <p class="text-red-600 dark:text-red-400 text-sm">{{ errors.submit }}</p>
          </div>

          <div class="mt-8">
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <span v-if="isLoading">
                <Icon name="lucide:loader-2" size="20" class="animate-spin" />
              </span>
              <span>Verifikasi</span>
            </button>
          </div>
        </form>
      </div>
      
      <!-- Registration Form -->
      <div v-else>
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="lucide:store" size="32" class="text-white" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Daftar Sebagai Owner UMKM
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            {{ stepTitles[currentStep - 1] }}
          </p>
        </div>

        <!-- Progress Bar -->
        <div class="mb-8">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Step {{ currentStep }} dari {{ totalSteps }}
            </span>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ Math.round(progressPercentage) }}%
            </span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-primary-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
        </div>

        <!-- Form Steps -->
        <form @submit.prevent="currentStep === totalSteps ? submitForm() : nextStep()">
          <!-- Step 1: Informasi Dasar -->
          <div v-if="currentStep === 1" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Lengkap
              </label>
              <input
                v-model="form.name"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Masukkan nama lengkap Anda"
                :class="{ 'border-red-500': errors.name }"
              />
              <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                v-model="form.email"
                type="email"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="contoh@email.com"
                :class="{ 'border-red-500': errors.email }"
              />
              <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
            </div>
          </div>

          <!-- Step 2: Kontak -->
          <div v-if="currentStep === 2" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nomor Telepon
              </label>
              <input
                v-model="form.phone"
                type="tel"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="08123456789"
                :class="{ 'border-red-500': errors.phone }"
              />
              <p v-if="errors.phone" class="text-red-500 text-sm mt-1">{{ errors.phone }}</p>
              <p class="text-gray-500 text-sm mt-1">
                Nomor telepon akan digunakan untuk komunikasi terkait bisnis Anda
              </p>
            </div>
          </div>

          <!-- Step 3: Keamanan -->
          <div v-if="currentStep === 3" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                v-model="form.password"
                type="password"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Minimal 8 karakter"
                :class="{ 'border-red-500': errors.password }"
              />
              <p v-if="errors.password" class="text-red-500 text-sm mt-1">{{ errors.password }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Konfirmasi Password
              </label>
              <input
                v-model="form.confirmPassword"
                type="password"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Ulangi password"
                :class="{ 'border-red-500': errors.confirmPassword }"
              />
              <p v-if="errors.confirmPassword" class="text-red-500 text-sm mt-1">{{ errors.confirmPassword }}</p>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errors.submit" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <p class="text-red-600 dark:text-red-400 text-sm">{{ errors.submit }}</p>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between mt-8">
            <button
              v-if="currentStep > 1"
              type="button"
              @click="prevStep"
              class="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Sebelumnya
            </button>
            <div v-else></div>

            <button
              type="submit"
              :disabled="isLoading"
              class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <span v-if="isLoading">
                <Icon name="lucide:loader-2" size="20" class="animate-spin" />
              </span>
              <span>
                {{ currentStep === totalSteps ? 'Daftar' : 'Selanjutnya' }}
              </span>
            </button>
          </div>
        </form>

        <!-- Login Link -->
        <div class="text-center mt-6">
          <p class="text-gray-600 dark:text-gray-400">
            Sudah punya akun?
            <NuxtLink to="/auth/login" class="text-primary-500 hover:text-primary-600 font-medium">
              Masuk disini
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
