<script setup>
import { ref } from 'vue'
import { useRouter } from '#app'
import { useAuthStore } from '~/stores/useAuthStore'

const email = ref('')
const password = ref('')
const isLoading = ref(false)

const router = useRouter()
const authStore = useAuthStore()

async function handleLogin() {
  if (!email.value || !password.value) return

  isLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))

    const userData = {
      id: 1,
      email: email.value,
      name: 'John Doe',
      avatar: null,
      role: 'OWNER',
    }

    authStore.setUser(userData)
    authStore.setToken('fake-jwt-token')

    router.push('/umkm')
  } catch (error) {
    console.error('Login failed:', error)
  } finally {
    isLoading.value = false
  }
}

definePageMeta({
  layout: 'blank'
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">

    <!-- Back Button -->
    <div class="absolute top-4 left-4 z-10">
      <NuxtLink to="/home" class="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 shadow backdrop-blur-sm">
        <Icon name="mdi:arrow-left" class="mr-1" />
        Kembali
      </NuxtLink>
    </div>

    <!-- Color Mode Toggle -->
    <div class="absolute top-4 right-4 z-10">
      <BaseColorMode />
    </div>

    <!-- Main Card Container -->
    <div class="flex w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">

      <!-- Left Side - Branding -->
      <div class="hidden md:flex flex-col justify-center items-center w-1/2 bg-primary-600 text-white p-12 text-center">
        <Icon name="mdi:bag-personal" size="100" class="mb-6 opacity-80" />
        <h1 class="text-3xl font-bold mb-3">
          Selamat Datang Kembali
        </h1>
        <p class="text-primary-100">
          Login untuk mengelola outlet, produk, transaksi, dan laporan UMKM Anda dengan mudah.
        </p>
      </div>

      <!-- Right Side - Form -->
      <div class="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
        <!-- Header -->
        <div class="text-center md:text-left mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Masuk Akun
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Silakan masukkan email dan password Anda untuk melanjutkan.
          </p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-5">
          <BaseInput 
            v-model="email"
            type="email"
            placeholder="Email aktif Anda"
            required
            :disabled="isLoading"
          />

          <BasePasswordInput
            v-model="password"
            placeholder="Password Anda"
            required
            :disabled="isLoading"
          />

          <BaseButton
            class="w-full"
            type="submit"
            variant="primary"
            size="lg"
            :loading="isLoading"
            :disabled="!email || !password"
          >
            {{ isLoading ? 'Memproses...' : 'Masuk' }}
          </BaseButton>
        </form>

        <!-- Footer -->
        <div class="mt-8 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Belum punya akun?
            <NuxtLink to="/register" class="text-primary-600 hover:text-primary-500 font-medium">Daftar sekarang</NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
