<script setup>
import { useAuthStore } from '@/stores/useAuthStore'

const auth = useAuthStore()
const showMobileMenu = ref(false)
</script>

<template>
  <header
    class="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center space-x-2">
            
            <NuxtImg src="/images/logo-blue-text.png" width="90" height="25" alt="Logo"/>

          </NuxtLink>
        </div>

        <!-- Desktop Actions -->
        <div class="hidden md:flex items-center space-x-4">
          <template v-if="auth.isLoggedIn">
            <div class="flex items-center space-x-3">
              <div class="flex items-center space-x-2">
                <img v-if="auth.user?.avatar" :src="auth.user.avatar" :alt="auth.user.name"
                  class="w-8 h-8 rounded-full object-cover" />
                <div v-else class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span class="text-white text-sm font-medium">
                    {{ auth.user?.name?.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <span class="text-gray-800 dark:text-gray-200 font-medium">
                  {{ auth.user?.name }}
                </span>
              </div>
              <BaseLogoutButton />
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
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Icon :name="showMobileMenu ? 'mdi:close' : 'mdi:menu'" size="24" />
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
            <template v-if="auth.isLoggedIn">
              <div class="flex items-center space-x-3 mb-4">
                <img v-if="auth.user?.avatar" :src="auth.user.avatar" :alt="auth.user.name"
                  class="w-10 h-10 rounded-full object-cover" />
                <div v-else class="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                  <span class="text-white font-medium">
                    {{ auth.user?.name?.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <span class="text-gray-800 dark:text-gray-200 font-medium">
                  {{ auth.user?.name }}
                </span>
              </div>
              <BaseLogoutButton />
            </template>

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