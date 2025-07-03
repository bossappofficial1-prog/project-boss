<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const sidebarOpen = ref(false)
const isDesktop = ref(false)

onMounted(() => {
  const checkScreen = () => {
    isDesktop.value = window.innerWidth >= 768
    if (isDesktop.value) {
      sidebarOpen.value = false
    }
  }
  
  checkScreen()
  window.addEventListener('resize', checkScreen)
  
  onUnmounted(() => window.removeEventListener('resize', checkScreen))
})

const closeSidebar = () => {
  if (!isDesktop.value) {
    sidebarOpen.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 transition-colors">
    <AppSidebar :show="sidebarOpen || isDesktop" />
    
    <div 
      v-if="sidebarOpen && !isDesktop"
      @click="closeSidebar"
      class="fixed inset-0 bg-black/50 z-40 md:hidden"
    ></div>

    <div 
      class="flex-1 flex flex-col transition-all duration-300"
      :class="{
        'md:ml-64': isDesktop,
        'ml-0': !isDesktop
      }"
    >
      <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-900 shadow-sm md:hidden border-b border-gray-200 dark:border-gray-700">
        <button 
          @click="sidebarOpen = !sidebarOpen" 
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
        >
          <Icon name="mdi:menu" size="24" />
        </button>
        <h1 class="text-lg font-bold">Dashboard</h1>
        <div class="w-10"></div> 
      </div>

      <main class="flex-1 p-4 md:p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
