<template>
  <main class="min-h-screen" aria-label="Halaman utama BOSS">
    <!-- Hero Section -->
    <section
      class="relative min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden flex items-center justify-center"
      aria-labelledby="hero-heading">
      <div class="absolute inset-0 bg-black/20" aria-hidden="true"></div>
      <div
        class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center">
        <NuxtImg src="/images/logo-white-text.svg" width="320" height="89" alt="Logo BOSS Business One Stop System"
          class="mb-8 w-64 sm:w-80 h-auto" />

        <h1 id="hero-heading" class="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Solusi Digital untuk
          <span class="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mt-2">
            UMKM Modern
          </span>
        </h1>

        <p class="text-base sm:text-lg text-primary-100 mb-10 max-w-2xl leading-relaxed">
          Platform terintegrasi untuk mengelola bisnis, menerima pembayaran digital, dan berkembang dengan teknologi
          terdepan.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center" role="group" aria-label="Aksi utama landing page">
          <nuxt-link to="/home">
            <BaseButton size="lg" variant="secondary" class="w-full sm:w-auto"
              aria-label="Mulai Sekarang, menuju halaman utama aplikasi">
              <Icon name="lucide:rocket" class="mr-2" aria-hidden="true" />
              Mulai Sekarang
            </BaseButton>
          </nuxt-link>
          <nuxt-link to="/auth/register">
            <BaseButton size="lg" variant="outline"
              class="w-full sm:w-auto border-white/30 text-white hover:bg-white/10"
              aria-label="Daftar Gratis, buat akun baru">
              <Icon name="lucide:user-plus" class="mr-2" aria-hidden="true" />
              Daftar Gratis
            </BaseButton>
          </nuxt-link>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-16 sm:py-20 bg-gray-50 dark:bg-gray-900" aria-labelledby="features-heading">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 id="features-heading" class="text-3xl font-bold text-gray-900 dark:text-white">
            Mengapa Memilih BOSS?
          </h2>
          <p class="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Platform yang dirancang khusus untuk UMKM Indonesia dengan fitur canggih namun mudah digunakan.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <article class="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md" tabindex="0"
            aria-label="Keamanan Terjamin">
            <div
              class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="lucide:shield-check" size="32" class="text-primary-600 dark:text-primary-400"
                aria-hidden="true" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Keamanan Terjamin</h3>
            <p class="text-gray-600 dark:text-gray-400">Sistem keamanan berlapis untuk melindungi data bisnis Anda.</p>
          </article>
          <!-- Feature 2 -->
          <article class="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md" tabindex="0"
            aria-label="Performa Cepat">
            <div
              class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="lucide:zap" size="32" class="text-primary-600 dark:text-primary-400" aria-hidden="true" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Performa Cepat</h3>
            <p class="text-gray-600 dark:text-gray-400">Interface yang responsif untuk pengalaman pengguna optimal.</p>
          </article>
          <!-- Feature 3 -->
          <article class="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md" tabindex="0"
            aria-label="Support 24/7">
            <div
              class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="lucide:headphones" size="32" class="text-primary-600 dark:text-primary-400"
                aria-hidden="true" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Support 24/7</h3>
            <p class="text-gray-600 dark:text-gray-400">Tim support yang siap membantu Anda kapan saja.</p>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 sm:py-20 bg-primary-600" aria-labelledby="cta-heading">
      <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 id="cta-heading" class="text-3xl font-bold text-white">
          Siap Mengembangkan Bisnis Anda?
        </h2>
        <p class="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
          Bergabunglah dengan ribuan UMKM yang telah mempercayai BOSS untuk mengembangkan bisnis mereka.
        </p>
        <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center" role="group"
          aria-label="Aksi CTA landing page">
          <nuxt-link to="/auth/register">
            <BaseButton size="lg" variant="secondary" class="w-full sm:w-auto"
              aria-label="Daftar Sekarang, buat akun baru">
              <Icon name="lucide:user-plus" class="mr-2" aria-hidden="true" />
              Daftar Sekarang
            </BaseButton>
          </nuxt-link>
          <nuxt-link to="/home">
            <BaseButton size="lg" variant="outline"
              class="w-full sm:w-auto border-white/30 text-white hover:bg-white/10"
              aria-label="Lihat Demo, menuju halaman demo aplikasi">
              <Icon name="lucide:eye" class="mr-2" aria-hidden="true" />
              Lihat Demo
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
