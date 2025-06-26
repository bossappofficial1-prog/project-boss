<script setup>
import { useAuthStore } from '@/stores/useAuthStore'

const auth = useAuthStore()
</script>

<template>
  <header class="py-4 px-6 flex bg-gray-200 dark:bg-gray-900 justify-between items-center">
    <h1 class="text-xl font-bold text-gray-900 dark:text-white">BOSS</h1>

    <nav class="flex items-center space-x-4">
      <NuxtLink
        to="/home"
        class="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition"
      >
        Home
      </NuxtLink>

      <template v-if="auth.isLoggedIn">
        <span class="text-gray-800 dark:text-gray-200 font-medium">
          Halo, {{ auth.user?.name }}
        </span>
        <BaseLogoutButton />
      </template>

      <template v-else>
        <NuxtLink
          to="/login"
          class="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition"
        >
          Login
        </NuxtLink>
      </template>

      <BaseColorMode />
    </nav>
  </header>
</template>
