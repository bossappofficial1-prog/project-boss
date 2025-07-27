<script setup>
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'

const auth = useAuthStore()
const cart = useCartStore()
const cartState = useCartState()
const showMobileMenu = ref(false)
const showMenu = ref(false)

function toggleMenu() {
  showMenu.value = !showMenu.value
}
</script>

<template>
  <header class="sticky top-0 z-50 glass border-b border-gray-200/20 dark:border-gray-800/20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center space-x-3 group">
            <div class="relative">
              <Icon name="boss:logo-color-v"
                class="dark:hidden transition-transform duration-300 group-hover:scale-110" />
              <Icon name="boss:logo-text-white"
                class="hidden dark:block transition-transform duration-300 group-hover:scale-110" />
            </div>
          </NuxtLink>
        </div>

        <!-- Navigation Menu (Desktop) -->
        <nav class="hidden md:flex items-center space-x-8">
          <NuxtLink to="/home"
            class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200 relative group">
            Beranda
            <span
              class="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
          </NuxtLink>
          <NuxtLink to="/outlets"
            class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200 relative group">
            Outlet
            <span
              class="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
          </NuxtLink>
        </nav>

        <!-- Desktop Actions -->
        <div class="hidden md:flex items-center space-x-4">
          <template v-if="auth.isLoggedIn">
            <div class="relative">
              <!-- Notification Button -->
              <button
                class="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 relative">
                <Icon name="lucide:bell" size="20" />
                <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
            </div>

            <div class="relative">
              <!-- Profile Dropdown Trigger -->
              <button
                class="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                @click="toggleMenu">
                <div class="relative">
                  <NuxtImg v-if="auth.user?.avatar" :src="auth.user.avatar" :alt="auth.user.name"
                    class="w-8 h-8 rounded-full object-cover ring-2 ring-primary-200 dark:ring-primary-800 group-hover:ring-primary-400 transition-all duration-200" />
                  <div v-else
                    class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center ring-2 ring-primary-200 dark:ring-primary-800 group-hover:ring-primary-400 transition-all duration-200">
                    <span class="text-white font-semibold text-sm">
                      {{ auth.user?.name?.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <div
                    class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800">
                  </div>
                </div>
                <div class="hidden lg:block text-left">
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ auth.user?.name }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ auth.user?.email }}
                  </div>
                </div>
                <Icon name="lucide:chevron-down" size="16"
                  class="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-all duration-200"
                  :class="{ 'rotate-180': showMenu }" />
              </button>

              <!-- Profile Dropdown Menu -->
              <Transition enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-150 ease-in" leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0">
                <div v-if="showMenu"
                  class="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div class="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div class="flex items-center space-x-3">
                      <NuxtImg v-if="auth.user?.avatar" :src="auth.user.avatar" :alt="auth.user.name"
                        class="w-12 h-12 rounded-full object-cover" />
                      <div v-else
                        class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <span class="text-white font-semibold">
                          {{ auth.user?.name?.charAt(0).toUpperCase() }}
                        </span>
                      </div>
                      <div>
                        <div class="font-medium text-gray-900 dark:text-gray-100">{{ auth.user?.name }}</div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">{{ auth.user?.email }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="py-2">
                    <NuxtLink to="/profile"
                      class="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                      @click="showMenu = false">
                      <Icon name="lucide:user" size="16" class="mr-3 text-gray-400" />
                      Profil Saya
                    </NuxtLink>
                    <NuxtLink to="/settings"
                      class="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                      @click="showMenu = false">
                      <Icon name="lucide:settings" size="16" class="mr-3 text-gray-400" />
                      Pengaturan
                    </NuxtLink>
                    <div class="border-t border-gray-100 dark:border-gray-700 my-2"></div>
                    <BaseLogout @click="showMenu = false" />
                  </div>
                </div>
              </Transition>
            </div>
          </template>

          <template v-else>
            <NuxtLink to="/auth/login">
              <BaseButton variant="outline" class="shadow-sm hover:shadow-md transition-shadow duration-200">
                <Icon name="lucide:log-in" class="mr-2" size="16" />
                Masuk
              </BaseButton>
            </NuxtLink>
            <NuxtLink to="/auth/register">
              <BaseButton class="shadow-md hover:shadow-lg transition-shadow duration-200">
                <Icon name="lucide:user-plus" class="mr-2" size="16" />
                Daftar
              </BaseButton>
            </NuxtLink>
          </template>

          <BaseColorMode />
        </div>

        <!-- Mobile menu button -->
        <div class="md:hidden flex items-center space-x-2">
          <BaseColorMode />
          <button @click="showMobileMenu = !showMobileMenu"
            class="p-2 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 relative">
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
      <div v-if="showMobileMenu" class="md:hidden border-t border-gray-200/20 dark:border-gray-800/20 glass">
        <div class="px-4 py-6 space-y-6">
          <!-- Mobile Navigation Links -->
          <nav class="space-y-4">
            <NuxtLink to="/home"
              class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200"
              @click="showMobileMenu = false">
              <Icon name="lucide:home" size="20" class="mr-3" />
              Beranda
            </NuxtLink>
            <NuxtLink to="/outlets"
              class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200"
              @click="showMobileMenu = false">
              <Icon name="lucide:store" size="20" class="mr-3" />
              Outlet
            </NuxtLink>
          </nav>

          <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div v-if="auth.isLoggedIn" class="space-y-4">
              <div class="flex items-center space-x-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <NuxtImg v-if="auth.user?.avatar" :src="auth.user.avatar" :alt="auth.user.name"
                  class="w-12 h-12 rounded-full object-cover" />
                <div v-else
                  class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <span class="text-white font-semibold">
                    {{ auth.user?.name?.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div>
                  <div class="font-medium text-gray-900 dark:text-gray-100">{{ auth.user?.name }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ auth.user?.email }}</div>
                </div>
              </div>

              <div class="space-y-2">
                <NuxtLink to="/profile"
                  class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200"
                  @click="showMobileMenu = false">
                  <Icon name="lucide:user" size="20" class="mr-3" />
                  Profil Saya
                </NuxtLink>
                <NuxtLink to="/settings"
                  class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200"
                  @click="showMobileMenu = false">
                  <Icon name="lucide:settings" size="20" class="mr-3" />
                  Pengaturan
                </NuxtLink>
                <BaseLogout @click="showMobileMenu = false" />
              </div>
            </div>

            <template v-else>
              <div class="space-y-3">
                <NuxtLink to="/auth/login" @click="showMobileMenu = false" class="block">
                  <BaseButton variant="outline" class="w-full justify-center">
                    <Icon name="lucide:log-in" class="mr-2" size="16" />
                    Masuk
                  </BaseButton>
                </NuxtLink>
                <NuxtLink to="/auth/register" @click="showMobileMenu = false" class="block">
                  <BaseButton class="w-full justify-center">
                    <Icon name="lucide:user-plus" class="mr-2" size="16" />
                    Daftar
                  </BaseButton>
                </NuxtLink>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>