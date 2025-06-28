<script setup>
const footerLinks = [
  {
    icon: 'lucide:mail',
    label: 'Email',
    link: 'mailto:halo@boss.id'
  },
  {
    icon: 'lucide:phone',
    label: 'Telepon',
    link: 'tel:+6281234567890'
  },
  {
    icon: 'lucide:map-pin',
    label: 'Alamat',
    link: 'https://goo.gl/maps/yourlocation'
  }
]
</script>

<template>
  <footer class="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:px-6">
    <div class="max-w-7xl mx-auto px-4 py-12">
      <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <!-- Company Info -->
          <div class="space-y-4 content-center justify-center">
            <div class="flex justify-center">
              <Icon name="boss:logo-blue-text" width="90" height="25" alt="Logo"/>
            </div>

            <div class="flex space-x-3">
              <a
                v-for="item in footerLinks"
                :key="item.label"
                :href="item.link"
                target="_blank"
                rel="noopener"
                class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition"
                :title="item.label"
              >
                <Icon :name="item.icon" class="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </a>
            </div>
          </div>

          <div class="text-sm text-gray-600 dark:text-gray-400">
            © 2025 BOSS. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
