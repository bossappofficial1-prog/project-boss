<script setup>
const currentYear = new Date().getFullYear()

// Minimalis - tidak perlu banyak links
// Menyimpan legal links saja

const legalLinks = [
  { name: 'Syarat & Ketentuan', href: '/terms' },
  { name: 'Kebijakan Privasi', href: '/privacy' },
  { name: 'Cookies', href: '/cookies' }
]

const socialLinks = [
  {
    name: 'Facebook',
    icon: 'lucide:facebook',
    href: 'https://facebook.com/boss',
    color: 'hover:text-blue-600'
  },
  {
    name: 'Twitter',
    icon: 'lucide:twitter',
    href: 'https://twitter.com/boss',
    color: 'hover:text-blue-400'
  },
  {
    name: 'Instagram',
    icon: 'lucide:instagram',
    href: 'https://instagram.com/boss',
    color: 'hover:text-pink-600'
  },
  {
    name: 'LinkedIn',
    icon: 'lucide:linkedin',
    href: 'https://linkedin.com/company/boss',
    color: 'hover:text-blue-700'
  },
  {
    name: 'YouTube',
    icon: 'lucide:youtube',
    href: 'https://youtube.com/boss',
    color: 'hover:text-red-600'
  }
]
</script>

<template>
  <footer class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
    <div class="max-w-7xl mx-auto px-4 py-12">
      <!-- Logo Center Top -->
      <div class="flex justify-center mb-10">
        <Icon name="boss:logo-color-v" class="dark:hidden h-14 w-auto" />
        <Icon name="boss:logo-text-white" class="hidden dark:block h-14 w-auto" />
      </div>

      <!-- Main Footer Content - Minimalist -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Left: Contact Info -->
        <div class="space-y-4">
          <div class="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
            <Icon name="lucide:mail" size="18" class="text-primary-600 dark:text-primary-400" />
            <a href="mailto:halo@boss.id"
              class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200">
              halo@boss.id
            </a>
          </div>
          <div class="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
            <Icon name="lucide:phone" size="18" class="text-primary-600 dark:text-primary-400" />
            <a href="tel:+6281234567890"
              class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200">
              +62 812-3456-7890
            </a>
          </div>
          <div class="flex items-start space-x-3 text-gray-600 dark:text-gray-400">
            <Icon name="lucide:map-pin" size="18" class="text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
            <span>
              Jl. Teknologi No. 123<br>
              Jakarta Selatan, Indonesia
            </span>
          </div>

          <!-- Social Media -->
          <div class="flex space-x-3 pt-2">
            <a v-for="social in socialLinks" :key="social.name" :href="social.href" target="_blank"
              rel="noopener noreferrer"
              class="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg transition-all duration-200 hover:scale-110"
              :class="social.color" :title="social.name">
              <Icon :name="social.icon" size="18" />
            </a>
          </div>
        </div>

        <!-- Right: Description -->
        <div class="space-y-4 md:text-right">
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed md:ml-auto md:max-w-md">
            Platform digital terdepan yang membantu UMKM Indonesia mengelola bisnis,
            menerima pembayaran, dan berkembang dengan teknologi modern.
          </p>

          <!-- Simple Links -->
          <div class="flex flex-wrap gap-x-6 gap-y-2 md:justify-end pt-2">
            <NuxtLink v-for="link in legalLinks" :key="link.name" :to="link.href"
              class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200">
              {{ link.name }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Bottom Copyright -->
      <div class="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          © {{ currentYear }} BOSS
        </div>
      </div>
    </div>
  </footer>
</template>
