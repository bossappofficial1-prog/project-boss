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
  if (!email.value || !password.value) {
    return
  }

  isLoading.value = true

  try {
    // Simulate API call
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

    if (authStore.user.role === 'OWNER') {
      router.push('/umkm')
    } else {
      router.push('/home')
    }
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
  <div class="min-h-screen flex">
    <!-- Left Side - Form -->
    <div class="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
      <div class="w-full max-w-md">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="flex items-center justify-center mb-6">
            <Icon name="mdi:bag-personal" class="w-12 h-12 text-primary-600" />
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Selamat Datang Kembali
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Masuk ke akun BOSS Anda untuk melanjutkan
          </p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <BaseInput
              v-model="email"
              type="email"
              placeholder="Masukkan email Anda"
              required
              :disabled="isLoading"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <BasePasswordInput
              v-model="password"
              placeholder="Masukkan password Anda"
              required
              :disabled="isLoading"
            />
          </div>

          <BaseButton
          class="w-full"
            type="submit"
            variant="primary"
            size="lg"
            full-width
            :loading="isLoading"
            :disabled="!email || !password"
          >
            {{ isLoading ? 'Memproses...' : 'Masuk' }}
          </BaseButton>
        </form>

        <!-- Divider -->
        <div class="mt-8 mb-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-900 text-gray-500">Atau</span>
            </div>
          </div>
        </div>

        <!-- Social Login -->
        <div class="space-y-3">
          <BaseButton
            class="w-full"
            variant="outline"
            size="lg"
            full-width
            :disabled="isLoading"
          >
            <Icon name="mdi:google" class="mr-2" />
            Masuk dengan Google
          </BaseButton>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Belum punya akun?
            <NuxtLink
              to="/register"
              class="text-primary-600 hover:text-primary-500 font-medium"
            >
              Daftar sekarang
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>

    <!-- Right Side - Image/Illustration -->
    <div class="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 to-primary-800 items-center justify-center p-12">
      <div class="text-center text-white">
        <div class="w-64 h-64 mx-auto mb-8 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
          <Icon name="mdi:chart-line" size="120" class="text-white/80" />
        </div>
        <h2 class="text-3xl font-bold mb-4">
          Kelola Bisnis dengan Mudah
        </h2>
        <p class="text-xl text-primary-100 max-w-md">
          Platform terpadu untuk mengelola UMKM, menerima pembayaran, dan mengembangkan bisnis Anda
        </p>
      </div>
    </div>

    <div class="absolute top-4 right-4">
      <BaseColorMode />
    </div>

    <div class="absolute top-4 left-4">
      <BaseBack />
    </div>
  </div>
</template>
