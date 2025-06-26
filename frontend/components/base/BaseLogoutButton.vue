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
    class="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition"
  >
    <Icon name="mdi:logout" size="18" />
    Keluar
  </button>
</template>
