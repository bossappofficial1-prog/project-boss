<template>
  <section
    class="relative h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
    <div class="absolute inset-0 bg-black/10"></div>
    <div class="absolute inset-0">
      <div class="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
      <div class="absolute top-40 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
      <div class="absolute bottom-20 left-1/3 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 py-20 sm:py-32 flex flex-col items-center justify-center min-h-screen text-center">
      <!-- Logo -->
      <NuxtImg src="/images/logo-white-text.svg" width="360" height="100" alt="Logo"
        class="mb-8" />

      <!-- Deskripsi -->
      <p class="text-xl sm:text-2xl text-primary-100 mb-8 max-w-3xl leading-relaxed">
        Platform digital yang membantu UMKM mengelola bisnis, menerima pembayaran, dan berkembang bersama teknologi
        modern
      </p>

      <!-- Tombol -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <nuxt-link to="/home">
          <BaseButton size="lg" variant="secondary" class="text-lg px-8 py-4">
            <Icon name="lucide:rocket" class="mr-2" />
            Mulai Sekarang
          </BaseButton>
        </nuxt-link>
      </div>
    </div>
  </section>
</template>

<script setup>
definePageMeta({
  layout: 'blank'
})
</script>
