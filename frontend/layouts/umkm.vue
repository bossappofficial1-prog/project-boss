<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const sidebarOpen = ref(false)
const isDesktop = ref(false)

const sidebarRef = ref(null)

onMounted(() => {
  const checkScreen = () => {
    isDesktop.value = window.innerWidth >= 768
  }
  checkScreen()
  window.addEventListener('resize', checkScreen)
  onUnmounted(() => window.removeEventListener('resize', checkScreen))
})
</script>

<template>
  <div class="flex min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 transition-colors">
    <!-- Sidebar -->
    <AppSidebar :show="sidebarOpen || isDesktop" />

    <!-- Content Area -->
    <div class="flex-1 flex flex-col">
      <!-- Topbar Mobile -->
      <div class="flex items-center justify-between p-4 bg-gray-800 md:hidden">
        <button @click="sidebarOpen = !sidebarOpen" class="text-gray-200">
          <Icon name="mdi:menu" size="24" />
        </button>
        <h1 class="text-lg font-bold text-white">Dashboard</h1>
      </div>

      <!-- Main Content -->
      <main class="p-4">
        <slot />
      </main>
    </div>
  </div>
</template>
