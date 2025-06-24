<template>
  <footer class="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Company Info -->
        <div class="space-y-4">
          <div class="flex items-center space-x-2">
            <UIcon name="i-heroicons-shopping-bag" class="w-8 h-8 text-primary-600" />
            <span class="text-xl font-bold text-gray-900 dark:text-white">
              BOSS
            </span>
          </div>
          <div class="flex space-x-4">
            <UButton 
              icon="i-heroicons-envelope" 
              variant="ghost" 
              color="gray" 
              size="sm"
              square
            />
            <UButton 
              icon="i-heroicons-phone" 
              variant="ghost" 
              color="gray" 
              size="sm"
              square
            />
            <UButton 
              icon="i-heroicons-map-pin" 
              variant="ghost" 
              color="gray" 
              size="sm"
              square
            />
          </div>
        </div>

        <!-- Quick Links -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Tautan Cepat
          </h3>
          <div class="space-y-2">
            <NuxtLink 
              to="/products" 
              class="block text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
            >
              Semua Produk
            </NuxtLink>
            <NuxtLink 
              to="/categories" 
              class="block text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
            >
              Kategori
            </NuxtLink>
            <NuxtLink 
              to="/deals" 
              class="block text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
            >
              Penawaran Khusus
            </NuxtLink>
            <NuxtLink 
              to="/brands" 
              class="block text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
            >
              Brand Terpercaya
            </NuxtLink>
          </div>
        </div>

        <!-- Customer Service -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Layanan Pelanggan
          </h3>
          <div class="space-y-2">
            <NuxtLink 
              to="/help" 
              class="block text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
            >
              Pusat Bantuan
            </NuxtLink>
            <NuxtLink 
              to="/shipping" 
              class="block text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
            >
              Info Pengiriman
            </NuxtLink>
            <NuxtLink 
              to="/returns" 
              class="block text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
            >
              Kebijakan Pengembalian
            </NuxtLink>
            <NuxtLink 
              to="/contact" 
              class="block text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
            >
              Hubungi Kami
            </NuxtLink>
          </div>
        </div>

        <!-- Newsletter -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Newsletter
          </h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm">
            Dapatkan info produk terbaru dan penawaran menarik
          </p>
          <div class="space-y-3">
            <UInput 
              placeholder="Email Anda" 
              size="sm"
              v-model="email"
            />
            <UButton 
              color="primary" 
              size="sm" 
              class="w-full"
              @click="subscribe"
              :loading="isSubscribing"
            >
              Berlangganan
            </UButton>
          </div>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div class="text-gray-600 dark:text-gray-400 text-sm">
            © {{ currentYear }} TokoKu. Semua hak dilindungi.
          </div>
          
          <div class="flex items-center space-x-6">
            <NuxtLink 
              to="/privacy" 
              class="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
            >
              Kebijakan Privasi
            </NuxtLink>
            <NuxtLink 
              to="/terms" 
              class="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
            >
              Syarat & Ketentuan
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
const email = ref('')
const isSubscribing = ref(false)

const currentYear = new Date().getFullYear()

const subscribe = async () => {
  if (!email.value) return
  
  isSubscribing.value = true
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const toast = useToast()
  toast.add({
    title: 'Berhasil berlangganan!',
    description: 'Terima kasih telah berlangganan newsletter kami',
    icon: 'i-heroicons-check-circle',
    color: 'green'
  })
  
  email.value = ''
  isSubscribing.value = false
}
</script>