<template>
  <UCard>
    <template #header>
      <h2 class="text-2xl font-bold">Selamat Datang</h2>
    </template>
    <p class="text-gray-300">Ini halaman utama dashboard pakai Nuxt UI + dark mode.</p>
  </UCard>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard'
})
</script>
