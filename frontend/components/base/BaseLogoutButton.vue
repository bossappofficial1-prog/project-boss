<script setup>
import { useRouter } from '#app'
import { useAuthStore } from '@/stores/useAuthStore'

const router = useRouter()
const auth = useAuthStore()

const handleLogout = () => {
  auth.clearSession()
  router.push('/home')
}
</script>

<template>
  <button
    @click="handleLogout"
    class="flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:text-red-700 hover:underline text-sm font-medium transition"
  >
    <Icon name="lucide:log-out" size="18" />
    Keluar
  </button>
</template>
