<script setup>
const email = ref('')
const isSubscribing = ref(false)
const currentYear = new Date().getFullYear()

const subscribe = async () => {
  if (!email.value) return
  isSubscribing.value = true
  await new Promise(resolve => setTimeout(resolve, 1000))
  alert('Berhasil berlangganan!')
  email.value = ''
  isSubscribing.value = false
}
</script>

<template>
  <footer class="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
    <div class="max-w-7xl mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

        <!-- Company Info -->
        <div class="space-y-4">
          <div class="flex items-center space-x-2">
            <Icon name="mdi:bag-personal" class="w-8 h-8 text-primary-600" />
            <span class="text-xl font-bold text-gray-900 dark:text-white">BOSS</span>
          </div>
          <div class="flex space-x-3">
            <button class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition">
              <Icon name="mdi:email-outline" class="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition">
              <Icon name="mdi:phone-outline" class="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition">
              <Icon name="mdi:map-marker-outline" class="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tautan Cepat</h3>
          <div class="space-y-2">
            <NuxtLink to="/products" class="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600">Semua Produk</NuxtLink>
            <NuxtLink to="/categories" class="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600">Kategori</NuxtLink>
            <NuxtLink to="/deals" class="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600">Penawaran Khusus</NuxtLink>
            <NuxtLink to="/brands" class="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600">Brand Terpercaya</NuxtLink>
          </div>
        </div>

        <!-- Customer Service -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Layanan Pelanggan</h3>
          <div class="space-y-2">
            <NuxtLink to="/help" class="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600">Pusat Bantuan</NuxtLink>
            <NuxtLink to="/shipping" class="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600">Info Pengiriman</NuxtLink>
            <NuxtLink to="/returns" class="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600">Kebijakan Pengembalian</NuxtLink>
            <NuxtLink to="/contact" class="block text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600">Hubungi Kami</NuxtLink>
          </div>
        </div>

        <!-- Newsletter -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Newsletter</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">Dapatkan info produk terbaru dan penawaran menarik</p>
          <div class="space-y-3">
            <input
              v-model="email"
              type="email"
              placeholder="Email Anda"
              class="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
            <button
              :disabled="isSubscribing"
              @click="subscribe"
              class="w-full px-3 py-2 rounded text-white bg-primary-600 hover:bg-primary-700 text-sm transition disabled:opacity-50"
            >
              {{ isSubscribing ? 'Mengirim...' : 'Berlangganan' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom -->
      <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="text-sm text-gray-600 dark:text-gray-400">© {{ currentYear }} TokoKu. Semua hak dilindungi.</div>
          <div class="flex items-center space-x-6">
            <NuxtLink to="/privacy" class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600">Kebijakan Privasi</NuxtLink>
            <NuxtLink to="/terms" class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600">Syarat & Ketentuan</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
