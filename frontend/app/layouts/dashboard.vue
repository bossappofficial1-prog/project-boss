<template>
  <div class="flex min-h-screen bg-gray-900 text-white">
    <!-- Sidebar Desktop -->
    <UmkmSidebar :show="sidebarOpen || isDesktop" />

    <!-- Content Area -->
    <div class="flex-1 flex flex-col">
      <!-- Topbar -->
      <div class="flex items-center justify-between p-4 bg-gray-800 md:hidden">
        <UButton color="gray" icon="i-heroicons-bars-3" @click="sidebarOpen = !sidebarOpen" square />
        <h1 class="text-lg font-bold">Dashboard</h1>
      </div>

      <main class="p-4 flex flex-row">
        <div :class="sidebarOpan || isDesktop ? 'w-64' : ''"></div>
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const sidebarOpen = ref(false)
const isDesktop = ref(false)

onMounted(() => {
  const checkScreen = () => {
    isDesktop.value = window.innerWidth >= 768
  }
  checkScreen()
  window.addEventListener('resize', checkScreen)
})
</script>
