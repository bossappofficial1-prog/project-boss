<script setup lang="ts">
const auth = useAuthStore()

const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
const isDesktop = ref(false)
const showProfileMenu = ref(false)

function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value
}

onMounted(() => {
  const checkScreen = () => {
    isDesktop.value = window.innerWidth >= 768
    if (isDesktop.value) {
      sidebarOpen.value = true
      // Load collapsed state from localStorage
      const savedCollapsed = localStorage.getItem('sidebar-collapsed')
      sidebarCollapsed.value = savedCollapsed === 'true'
    } else {
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

const toggleSidebar = () => {
  if (isDesktop.value) {
    sidebarCollapsed.value = !sidebarCollapsed.value
    // Save collapsed state to localStorage
    localStorage.setItem('sidebar-collapsed', sidebarCollapsed.value.toString())
  } else {
    sidebarOpen.value = !sidebarOpen.value
  }
}

const sidebarWidth = computed(() => {
  if (!isDesktop.value) return 'ml-0'
  return sidebarCollapsed.value ? 'md:ml-16' : 'md:ml-64'
})
</script>

<template>
  <div class="flex min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 transition-colors">
    <AppSidebar :show="sidebarOpen || isDesktop" :collapsed="sidebarCollapsed && isDesktop" />

    <div v-if="sidebarOpen && !isDesktop" @click="closeSidebar" class="fixed inset-0 bg-black/50 z-40 md:hidden"></div>

    <div class="flex-1 flex flex-col transition-all duration-300" :class="sidebarWidth">
      <!-- Header -->
      <div
        class="flex items-center justify-between p-4 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <button @click="toggleSidebar"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
          <Icon :name="isDesktop ? (sidebarCollapsed ? 'mdi:menu-open' : 'mdi:menu') : 'mdi:menu'" size="24" />
        </button>
        <!-- Right side - Profile and actions -->
        <div class="flex items-center space-x-4">
          <BaseColorMode />
          <!-- Profile Section -->
          <div class="relative profile-menu-container">
            <button @click="toggleProfileMenu"
              class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">

              <!-- Profile Avatar -->
              <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white">
                <span class="text-sm font-bold">
                  {{ auth.user?.name?.charAt(0).toUpperCase() }}
                </span>
              </div>

              <!-- Profile Info (hidden on mobile) -->
              <div class="hidden sm:block text-left">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">
                  {{ auth.user?.name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                  {{ auth.user?.email }}
                </p>
              </div>

              <!-- Dropdown Arrow -->
              <Icon name="lucide:chevron-down" size="16" class="text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': showProfileMenu }" />
            </button>

            <!-- Profile Dropdown Menu -->
            <Transition enter-active-class="transition ease-out duration-200"
              enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-150" leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95">
              <div v-if="showProfileMenu"
                class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">

                <!-- Profile Info Header -->
                <div class="block sm:hidden px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white">
                      <span class="text-sm font-bold">
                        {{ auth.user?.name?.charAt(0).toUpperCase() }}
                      </span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {{ auth.user?.name }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {{ auth.user?.email }}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="py-1">
                  <BaseLogout class="text-gray-700 dark:text-gray-300" />
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Mobile spacer -->
        <!-- <div class="w-10 md:hidden flex-shrink-0"></div> -->
      </div>

      <main class="flex-1 p-4 md:p-6 overflow-auto min-w-0">
        <slot />
      </main>
    </div>
  </div>
</template>