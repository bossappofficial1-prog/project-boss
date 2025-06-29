<template>
  <div class="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white transition-colors">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
definePageMeta({
  title: 'BOSS',
  meta: [
    { name: 'author', content: 'BOSS Team' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'description', content: 'Aplikasi BOSS - Backend Outlet Support System' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/images/logo-blue.svg' }
  ]
})
</script>
