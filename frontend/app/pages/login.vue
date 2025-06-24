<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <UCard class="w-full max-w-md shadow-lg rounded-2xl p-6 space-y-6">
      <template #header>
        <h2 class="text-2xl font-bold text-center text-gray-800 dark:text-white">Masuk ke Akun</h2>
      </template>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <UInput class="w-full" v-model="email" type="email" placeholder="contoh@email.com" size="lg" required />
        </div>

        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <UInput class="w-full" v-model="password" type="password" placeholder="••••••••" size="lg" required />
        </div>

        <UButton type="submit" color="primary" block size="lg">
          Masuk
        </UButton>
      </form>

      <template #footer>
        <p class="text-center text-sm text-gray-500">
          Belum punya akun?
          <ULink to="/register" class="text-primary font-medium">Daftar</ULink>
        </p>
      </template>
    </UCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from '#app'

const email = ref('')
const password = ref('')
const router = useRouter()

function handleLogin() {
  router.push('/umkm')
}
definePageMeta({
    layout: 'blank'
})
</script>
