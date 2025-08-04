<script setup>
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const showMobileMenu = ref(false)
const showMenu = ref(false)

function toggleMenu() {
  showMenu.value = !showMenu.value
}
</script>

<template>
  <header
    class="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200/30 dark:border-gray-700/30 shadow-lg">
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <!-- Logo -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center space-x-4 group">
            <Icon name="boss:logo-color"
              class="dark:hidden h-9 w-9 group-hover:scale-105 transition-all duration-300" />
            <Icon name="boss:logo-white"
              class="hidden dark:block h-9 w-9 group-hover:scale-105 transition-all duration-300" />
            <div class="hidden sm:block">
              <h1
                class="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 dark:text-white bg-clip-text text-transparent">
                BOSS
              </h1>
              <p class="text-sm text-gray-500 dark:text-gray-400">Business One Stop System</p>
            </div>
          </NuxtLink>
        </div>

        <!-- Navigation Menu (Desktop) -->
        <nav class="hidden lg:flex items-center space-x-2">
          <NuxtLink to="/home" active-class="hidden"
            class="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-semibold transition-all duration-300 relative group rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20">
            <span class="relative z-10">Beranda</span>
            <span
              class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
          </NuxtLink>
          <!-- <NuxtLink to="/outlets"
            class="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-semibold transition-all duration-300 relative group rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20">
            <span class="relative z-10">Outlet</span>
            <span
              class="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
          </NuxtLink> -->
        </nav>

        <!-- Desktop Actions -->
        <div class="hidden lg:flex items-center space-x-3">
          <template v-if="auth.isLoggedIn">
            <!-- Notification Button -->
            <div class="relative">
              <button
                class="p-3 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all duration-300 relative group">
                <Icon name="lucide:bell" size="22" />
                <span
                  class="absolute top-2 right-2 w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse shadow-lg"></span>
                <span class="absolute top-2 right-2 w-3 h-3 bg-red-400 rounded-full animate-ping"></span>
              </button>
            </div>

            <!-- Profile Dropdown -->
            <div class="relative">
              <button
                class="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 group border border-transparent hover:border-red-200 dark:hover:border-red-700"
                @click="toggleMenu">
                <div class="relative">
                  <NuxtImg v-if="auth.user?.avatar" :src="auth.user.avatar" :alt="auth.user.name"
                    class="w-10 h-10 rounded-full object-cover ring-2 ring-red-200 dark:ring-red-800 group-hover:ring-red-400 transition-all duration-300 shadow-md" />
                  <div v-else
                    class="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center ring-2 ring-red-200 dark:ring-red-800 group-hover:ring-red-400 transition-all duration-300 shadow-md">
                    <span class="text-white font-bold text-lg">
                      {{ auth.user?.name?.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div
                    class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm">
                  </div>
                </div>
                <div class="hidden xl:block text-left">
                  <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {{ auth.user?.name }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ auth.user?.email }}
                  </div>
                </div>
                <Icon name="lucide:chevron-down" size="18"
                  class="text-gray-400 group-hover:text-red-500 transition-all duration-300"
                  :class="{ 'rotate-180': showMenu }" />
              </button>

              <!-- Profile Dropdown Menu -->
              <Transition enter-active-class="transition duration-300 ease-out"
                enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-200 ease-in" leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0">
                <div v-if="showMenu"
                  class="absolute right-0 top-full mt-3 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-lg">

                  <!-- Profile Header -->
                  <div
                    class="p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-b border-gray-100 dark:border-gray-700">
                    <div class="flex items-center space-x-4">
                      <NuxtImg v-if="auth.user?.avatar" :src="auth.user.avatar" :alt="auth.user.name"
                        class="w-14 h-14 rounded-full object-cover ring-3 ring-red-300 dark:ring-red-600 shadow-lg" />
                      <div v-else
                        class="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center ring-3 ring-red-300 dark:ring-red-600 shadow-lg">
                        <span class="text-white font-bold text-xl">
                          {{ auth.user?.name?.charAt(0).toUpperCase() }}
                        </span>
                      </div>
                      <div class="flex-1">
                        <div class="font-bold text-gray-900 dark:text-gray-100 text-lg">{{ auth.user?.name }}</div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">{{ auth.user?.email }}</div>
                        <div class="flex items-center mt-1">
                          <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span class="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Menu Items -->
                  <div class="py-3">
                    <NuxtLink to="/profile"
                      class="flex items-center px-6 py-4 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group"
                      @click="showMenu = false">
                      <div
                        class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mr-4 group-hover:bg-red-100 dark:group-hover:bg-red-900/20 transition-colors duration-200">
                        <Icon name="lucide:user" size="18"
                          class="text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                      </div>
                      <div>
                        <div class="font-medium">Profil Saya</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">Kelola informasi personal</div>
                      </div>
                    </NuxtLink>

                    <NuxtLink to="/settings"
                      class="flex items-center px-6 py-4 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group"
                      @click="showMenu = false">
                      <div
                        class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mr-4 group-hover:bg-red-100 dark:group-hover:bg-red-900/20 transition-colors duration-200">
                        <Icon name="lucide:settings" size="18"
                          class="text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                      </div>
                      <div>
                        <div class="font-medium">Pengaturan</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">Konfigurasi aplikasi</div>
                      </div>
                    </NuxtLink>

                    <div class="border-t border-gray-100 dark:border-gray-700 my-2"></div>

                    <div class="px-6 py-2">
                      <BaseLogout @click="showMenu = false" />
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </template>

          <!-- Guest Actions -->
          <template v-else>
            <NuxtLink to="/auth/login">
              <button
                class="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-950/20">
                <Icon name="lucide:log-in" class="mr-2" size="18" />
                Masuk
              </button>
            </NuxtLink>
            <NuxtLink to="/auth/register">
              <button
                class="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                <Icon name="lucide:user-plus" class="mr-2" size="18" />
                Daftar
              </button>
            </NuxtLink>
          </template>

          <!-- Dark Mode Toggle -->
          <div class="ml-4 pl-4 border-l border-gray-200 dark:border-gray-700">
            <BaseColorMode />
          </div>
        </div>

        <!-- Mobile menu button -->
        <div class="lg:hidden flex items-center space-x-3">
          <BaseColorMode />
          <button @click="showMobileMenu = !showMobileMenu"
            class="p-3 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600">
            <Icon :name="showMobileMenu ? 'lucide:x' : 'lucide:menu'" size="24" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <Transition enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 transform -translate-y-4" enter-to-class="opacity-100 transform translate-y-0"
      leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100 transform translate-y-0"
      leave-to-class="opacity-0 transform -translate-y-4">
      <div v-if="showMobileMenu"
        class="lg:hidden border-t border-gray-200/30 dark:border-gray-700/30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg">
        <div class="px-6 py-8 space-y-8">
          <!-- Mobile Navigation Links -->
          <nav class="space-y-3">
            <NuxtLink to="/home"
              class="flex items-center px-6 py-4 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all duration-300 font-semibold border border-transparent hover:border-red-200 dark:hover:border-red-700"
              @click="showMobileMenu = false">
              <Icon name="lucide:home" size="22" class="mr-4" />
              <span class="text-lg">Beranda</span>
            </NuxtLink>
            <NuxtLink to="/outlets"
              class="flex items-center px-6 py-4 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all duration-300 font-semibold border border-transparent hover:border-red-200 dark:hover:border-red-700"
              @click="showMobileMenu = false">
              <Icon name="lucide:store" size="22" class="mr-4" />
              <span class="text-lg">Outlet</span>
            </NuxtLink>
          </nav>

          <!-- Mobile User Section -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-8">
            <div v-if="auth.isLoggedIn" class="space-y-6">
              <!-- User Info Card -->
              <div
                class="flex items-center space-x-4 p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 rounded-2xl border border-red-200 dark:border-red-700">
                <NuxtImg v-if="auth.user?.avatar" :src="auth.user.avatar" :alt="auth.user.name"
                  class="w-16 h-16 rounded-full object-cover ring-3 ring-red-300 dark:ring-red-600 shadow-lg" />
                <div v-else
                  class="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center ring-3 ring-red-300 dark:ring-red-600 shadow-lg">
                  <span class="text-white font-bold text-xl">
                    {{ auth.user?.name?.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div class="flex-1">
                  <div class="font-bold text-gray-900 dark:text-gray-100 text-lg">{{ auth.user?.name }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">{{ auth.user?.email }}</div>
                  <div class="flex items-center mt-2">
                    <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span class="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                  </div>
                </div>
              </div>

              <!-- Mobile Menu Items -->
              <div class="space-y-3">
                <NuxtLink to="/profile"
                  class="flex items-center px-6 py-4 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all duration-300 border border-transparent hover:border-red-200 dark:hover:border-red-700"
                  @click="showMobileMenu = false">
                  <Icon name="lucide:user" size="22" class="mr-4" />
                  <span class="text-lg font-medium">Profil Saya</span>
                </NuxtLink>
                <NuxtLink to="/settings"
                  class="flex items-center px-6 py-4 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all duration-300 border border-transparent hover:border-red-200 dark:hover:border-red-700"
                  @click="showMobileMenu = false">
                  <Icon name="lucide:settings" size="22" class="mr-4" />
                  <span class="text-lg font-medium">Pengaturan</span>
                </NuxtLink>
                <div class="pt-4">
                  <BaseLogout @click="showMobileMenu = false" />
                </div>
              </div>
            </div>

            <!-- Mobile Guest Actions -->
            <template v-else>
              <div class="space-y-4">
                <NuxtLink to="/auth/login" @click="showMobileMenu = false" class="block">
                  <button
                    class="w-full px-6 py-4 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-950/20 text-lg">
                    <Icon name="lucide:log-in" class="mr-3" size="20" />
                    Masuk
                  </button>
                </NuxtLink>
                <NuxtLink to="/auth/register" @click="showMobileMenu = false" class="block">
                  <button
                    class="w-full px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-lg">
                    <Icon name="lucide:user-plus" class="mr-3" size="20" />
                    Daftar Sekarang
                  </button>
                </NuxtLink>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>