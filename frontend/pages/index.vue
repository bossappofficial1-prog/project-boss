<template>
  <main class="h-screen" aria-label="Halaman utama BOSS">
    <!-- Hero Section -->
    <section
      class="relative h-screen bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white overflow-hidden flex items-center justify-center"
      aria-labelledby="hero-heading">
      <div class="absolute inset-0 bg-black/10" aria-hidden="true"></div>
      <!-- Floating animation elements -->
      <div class="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div
          class="absolute bottom-1/3 right-1/4 w-48 h-48 bg-red-300/10 rounded-full blur-2xl animate-pulse delay-1000">
        </div>
      </div>
      <div
        class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center">
        <div class="mb-8 transform transition-all duration-1000 hover:scale-110 hover:rotate-1">
          <NuxtImg src="/images/logo-white-text.svg" width="320" height="89" alt="Logo BOSS Business One Stop System"
            class="w-64 sm:w-80 h-auto animate-fade-in-down" />
        </div>

        <h1 id="hero-heading"
          class="text-xl sm:text-4xl md:text-3xl lg:text-4xl font-bold mb-6 leading-tight animate-fade-in-up">
          <span class="block">SOLUSI DIGITAL UNTUK</span>
          <span
            class="text-5xl block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300 mt-2 animate-pulse">
            UMKM MODERN
          </span>
        </h1>

        <p
          class="text-base sm:text-lg md:text-xl text-red-100 mb-10 max-w-3xl leading-relaxed animate-fade-in-up delay-300">
          Platform terintegrasi untuk mengelola bisnis, menerima pembayaran digital, dan berkembang dengan teknologi
          terdepan yang mudah digunakan.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-500" role="group"
          aria-label="Aksi utama landing page">
          <nuxt-link to="/home" class="transform transition-all duration-300 hover:scale-105">
            <BaseButton size="lg" variant="secondary" class="w-full sm:w-auto shadow-lg hover:shadow-xl"
              aria-label="Mulai Sekarang, menuju halaman utama aplikasi">
              <Icon name="lucide:rocket" class="mr-2" aria-hidden="true" />
              Mulai Sekarang
            </BaseButton>
          </nuxt-link>
          <nuxt-link to="/auth/register" class="transform transition-all duration-300 hover:scale-105">
            <BaseButton size="lg" variant="outline"
              class="w-full sm:w-auto border-white/30 text-white shadow-lg hover:shadow-xl"
              aria-label="Daftar Gratis, buat akun baru">
              <Icon name="lucide:user-plus" class="mr-2" aria-hidden="true" />
              Daftar Gratis
            </BaseButton>
          </nuxt-link>
        </div>
      </div>
    </section>

  </main>
</template>

<script setup>
definePageMeta({
  layout: 'blank'
})
</script>