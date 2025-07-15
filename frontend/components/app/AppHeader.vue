<script setup>
import { useAuthStore } from '@/stores/useAuthStore'

const auth = useAuthStore()
const showMobileMenu = ref(false)

const showMenu = ref(false)

function toggleMenu() {
  showMenu.value = !showMenu.value
}
</script>

<template>
  <header
    class="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex gap-2">
          <div class="flex items-center">
            <NuxtLink to="/" class="flex text-2xl items-center space-x-2">
              <Icon name="boss:logo-color-v" class="dark:hidden" />
              <Icon name="boss:logo-text-white" class="hidden dark:block"/>
            </NuxtLink>
          </div>

        </div>

        <!-- Desktop Actions -->
        <div class="hidden md:flex items-center space-x-4">
          <template v-if="auth.isLoggedIn">
            <div class="relative flex items-center h-16">
              <!-- Trigger Profil -->
              <div class="flex items-center space-x-3 cursor-pointer" @click="toggleMenu">
                <NuxtImg v-if="auth.user?.avatar" :src="auth.user.avatar" :alt="auth.user.name"
                  class="w-8 h-8 rounded-full object-cover" />
                <div v-else class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span class="text-white font-medium">
                    {{ auth.user?.name?.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <span class="text-gray-800 dark:text-gray-200 font-medium">
                  {{ auth.user?.name }}
                </span>
              </div>

              <!-- Dropdown Menu -->
              <div v-if="showMenu"
                class="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <BaseLogout />
              </div>
            </div>

          </template>

          <template v-else>
            <NuxtLink to="/login">
              <BaseButton variant="outline">
                Masuk
              </BaseButton>
            </NuxtLink>
            <NuxtLink to="/register">
              <BaseButton>
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
            class="p-2 rounded-lg flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Icon :name="showMobileMenu ? 'lucide:circle-x' : 'lucide:menu'" size="24" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
      <div v-if="showMobileMenu"
        class="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div class="px-4 py-4 space-y-4">
          <div class="border-t border-gray-200 dark:border-gray-800 pt-4">
            <div v-if="auth.isLoggedIn" class="flex item-center justify-between">
              <div class="flex items-center space-x-3 mb-4">
                <NuxtImg v-if="auth.user?.avatar" :src="auth.user.avatar" :alt="auth.user.name"
                  class="w-8 h-8 rounded-full object-cover" />
                <div v-else class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span class="text-white font-medium">
                    {{ auth.user?.name?.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <span class="text-gray-800 dark:text-gray-200 font-medium">
                  {{ auth.user?.name }}
                </span>
              </div>
              <BaseLogout />
            </div>

            <template v-else>
              <div class="flex flex-row justify-end items-center gap-3">
                <NuxtLink to="/login" @click="showMobileMenu = false">
                  <BaseButton variant="outline">
                    Masuk
                  </BaseButton>
                </NuxtLink>
                <NuxtLink to="/register" @click="showMobileMenu = false">
                  <BaseButton>
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