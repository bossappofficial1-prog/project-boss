<script setup>
import { ref } from 'vue'
import { useRouter } from '#app'
import { useAuthStore } from '~/stores/auth'

// --- Existing script setup - No changes to functionality ---
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
    // Simulate API registration process
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
        <Icon name="mdi:store-plus" size="100" class="mb-6 opacity-80" />
        <h1 class="text-3xl font-bold mb-3">
          Bangun Bisnis Anda
        </h1>
        <p class="text-primary-100">
          Buat akun gratis untuk mulai kelola outlet, produk, transaksi, dan laporan usaha Anda.
        </p>
      </div>

      <!-- Right Side - Form -->
      <div class="w-full md:w-1/2 p-8 sm:p-12">
        <!-- Header -->
        <div class="text-center md:text-left mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Akun Baru
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Selamat datang! Silakan isi data Anda.
          </p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleRegister" class="space-y-5">
          <!-- Name Input -->
          <div class="relative">
            <!-- <Icon name="mdi:account-outline" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /> -->
            <BaseInput 
              v-model="name" 
              placeholder="Nama Lengkap Anda" 
              required 
              :disabled="isLoading" 
              input-class="pl-10"
            />
          </div>

          <!-- Email Input -->
          <div class="relative">
            <!-- <Icon name="mdi:email-outline" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /> -->
            <BaseInput 
              v-model="email" 
              type="email" 
              placeholder="Email aktif Anda" 
              required 
              :disabled="isLoading" 
              input-class="pl-10"
            />
          </div>

          <!-- Password Input -->
          <div class="relative">
            <BasePasswordInput 
              v-model="password" 
              placeholder="Password minimal 6 karakter" 
              required 
              :disabled="isLoading"
              input-class="pl-10"
            />
          </div>

          <!-- Submit Button -->
          <BaseButton
            class="w-full"
            type="submit"
            variant="primary"
            size="lg"
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
            <NuxtLink to="/auth/login" class="text-primary-600 hover:text-primary-500 font-medium">Masuk di sini</NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
