<script setup lang="ts">
import type { LoginForm } from '~/types'

definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const auth = useAuthStore()
const route = useRoute()
const isLoading = ref(false)

const form = ref<LoginForm>({
  email: '',
  password: ''
})

const errors = ref<Record<string, string>>({})
const showSuccessMessage = ref(false)

// Check for registration success message
onMounted(() => {
  if (route.query.message === 'registration-success') {
    showSuccessMessage.value = true
    setTimeout(() => {
      showSuccessMessage.value = false
    }, 5000)
  }
})

const validateForm = (): boolean => {
  errors.value = {}

  if (!form.value.email.trim()) {
    errors.value.email = 'Email harus diisi'
    return false
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Format email tidak valid'
    return false
  }

  if (!form.value.password) {
    errors.value.password = 'Password harus diisi'
    return false
  }

  return true
}

const submitForm = async () => {
  if (!validateForm()) return

  isLoading.value = true

  try {
    await auth.login(form.value)
  } catch (error: any) {
    console.error('Login error:', error)

    if (error.data?.message) {
      errors.value.submit = error.data.message
    } else {
      errors.value.submit = 'Email atau password salah'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="lucide:store" size="32" class="text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Selamat Datang Kembali
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Masuk ke akun Anda untuk melanjutkan
        </p>
      </div>

      <!-- Success Message -->
      <div v-if="showSuccessMessage"
        class="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
        <div class="flex items-start space-x-3">
          <Icon name="lucide:check-circle" size="20" class="text-green-500 mt-0.5" />
          <div>
            <h3 class="font-medium text-green-900 dark:text-green-100">Registrasi Berhasil!</h3>
            <p class="text-green-700 dark:text-green-300 text-sm mt-1">
             Periksa email untuk konfirmasi email anda sebelum login!
            </p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="submitForm" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input v-model="form.email" type="email"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            placeholder="contoh@email.com" :class="{ 'border-red-500': errors.email }" />
          <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <input v-model="form.password" type="password"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            placeholder="Masukkan password" :class="{ 'border-red-500': errors.password }" />
          <p v-if="errors.password" class="text-red-500 text-sm mt-1">{{ errors.password }}</p>
        </div>

        <!-- Error Message -->
        <div v-if="errors.submit"
          class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div class="flex items-start space-x-2">
            <Icon name="lucide:alert-circle" size="16" class="text-red-500 mt-0.5" />
            <p class="text-red-600 dark:text-red-400 text-sm">{{ errors.submit }}</p>
          </div>
        </div>

        <!-- Submit Button -->
        <button type="submit" :disabled="isLoading"
          class="w-full px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2">
          <span v-if="isLoading">
            <Icon name="lucide:loader-2" size="20" class="animate-spin" />
          </span>
          <span>{{ isLoading ? 'Masuk...' : 'Masuk' }}</span>
        </button>
      </form>

      <!-- Register Link -->
      <div class="text-center mt-6">
        <p class="text-gray-600 dark:text-gray-400">
          Belum punya akun?
          <NuxtLink to="/auth/register" class="text-primary-500 hover:text-primary-600 font-medium">
            Daftar
          </NuxtLink>
        </p>
      </div>

      <!-- Forgot Password -->
      <!-- <div class="text-center mt-4">
        <NuxtLink to="/auth/forgot-password" class="text-sm text-gray-500 hover:text-primary-500 transition-colors">
          Lupa password?
        </NuxtLink>
      </div> -->
    </div>
  </div>
</template>
