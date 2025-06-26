<script setup>
import { ref } from 'vue'
import { useRouter } from '#app'
import { useAuthStore } from '~/stores/useAuthStore'

const email = ref('')
const password = ref('')
const router = useRouter()
const authSore = useAuthStore()

function handleLogin() {
  const data = {
    email: 'test@example.com',
    name: 'Toko Contoh',
    avatar: null,
    role: 'OWNER'
  }

  authSore.setUser(data)

  if (authSore.user.role === 'OWNER') {
    router.push('/umkm')
  } else {
    router.push('/')
  }
}

definePageMeta({
  layout: 'blank'
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
    <div class="relative w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-2xl shadow space-y-6">
      <div class="absolute top-4 right-4">
        <ColorModeButton />
      </div>

      <h2 class="text-2xl font-bold text-center text-gray-800 dark:text-white">Masuk ke Akun</h2>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <BaseInput v-model="email" type="email" placeholder="Email Anda" required />
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <BasePasswordInput v-model="password" placeholder="••••••••" required />
        </div>

        <button
          type="submit"
          class="w-full px-4 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition"
        >
          Masuk
        </button>
      </form>

      <p class="text-center text-sm text-gray-500">
        Belum punya akun?
        <NuxtLink to="/register" class="text-primary-600 font-medium hover:underline">Daftar</NuxtLink>
      </p>
    </div>
  </div>
</template>
