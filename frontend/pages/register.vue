<script setup>
import { ref } from 'vue'
import { useRouter } from '#app'
import { useAuthStore } from '~/stores/useAuthStore'

const name = ref('')
const email = ref('')
const password = ref('')
const isLoading = ref(false)

const router = useRouter()
const authStore = useAuthStore()

async function handleRegister() {
  if (!name.value || !email.value || !password.value) return

  isLoading.value = true
  try {
    // Simulasi proses API register
    await new Promise(resolve => setTimeout(resolve, 1500))

    const newUser = {
      id: 1,
      name: name.value,
      email: email.value,
      avatar: null,
      role: 'OWNER',
    }

    authStore.setUser(newUser)
    authStore.setToken('fake-jwt-token')

    router.push('/umkm')
  } catch (error) {
    console.error('Register failed:', error)
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
            Daftar Akun Baru
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Mulai kelola bisnis UMKM Anda dengan BOSS
          </p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleRegister" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap</label>
            <BaseInput v-model="name" placeholder="Nama Anda" required :disabled="isLoading" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <BaseInput v-model="email" type="email" placeholder="Email aktif Anda" required :disabled="isLoading" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <BasePasswordInput v-model="password" placeholder="Password minimal 6 karakter" required :disabled="isLoading" />
          </div>

          <BaseButton
            class="w-full"
            type="submit"
            variant="primary"
            size="lg"
            full-width
            :loading="isLoading"
            :disabled="!name || !email || !password"
          >
            {{ isLoading ? 'Memproses...' : 'Daftar' }}
          </BaseButton>
        </form>

        <!-- Footer -->
        <div class="mt-8 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Sudah punya akun?
            <NuxtLink to="/login" class="text-primary-600 hover:text-primary-500 font-medium">Masuk sekarang</NuxtLink>
          </p>
        </div>
      </div>
    </div>

    <!-- Right Side -->
    <div class="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 to-primary-800 items-center justify-center p-12">
      <div class="text-center text-white">
        <div class="w-64 h-64 mx-auto mb-8 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
          <Icon name="mdi:store-plus" size="120" class="text-white/80" />
        </div>
        <h2 class="text-3xl font-bold mb-4">Bangun Bisnis Anda</h2>
        <p class="text-xl text-primary-100 max-w-md">
          Buat akun gratis untuk mulai kelola outlet, produk, transaksi, dan laporan usaha Anda
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
