<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useCartStore } from '~/stores/cart'
import type { Outlet, Product, BookingSlot } from '~/types'

const route = useRoute()
const cartStore = useCartStore()
const toast = useToast()
const outletId = route.params.id as string

const { data, pending, error, refresh } = useApi<Outlet>(`/outlets/${outletId}`)

const outlet = computed(() => data.value?.data)
const { data: dataProduct, pending: pendingProduct, error: errorProduct, refresh: refreshProduct } = useApi<Product[]>(`/products/outlet/${outletId}`)
const products = computed(() => dataProduct.value?.data?.filter(p => p.type === 'GOODS') || [])
const services = computed(() => dataProduct.value?.data?.filter(p => p.type === 'SERVICE') || [])
const activeTab = ref<'produk' | 'layanan'>('produk')
const searchQuery = ref('')

// --- Booking State ---
const selectedService = ref<Product | null>(null)
const availableSlots = ref<BookingSlot[]>([])
const selectedDate = ref(new Date())
const isLoadingSlots = ref(false)

// --- UI State ---
const isHeaderCollapsed = ref(false)

// Scroll listener for header animation
onMounted(() => {
  const handleScroll = () => {
    isHeaderCollapsed.value = window.scrollY > 300
  }

  window.addEventListener('scroll', handleScroll)
  onUnmounted(() => window.removeEventListener('scroll', handleScroll))
})

async function selectServiceForBooking(service: Product) {
  if (selectedService.value?.id === service.id) {
    selectedService.value = null
  } else {
    selectedService.value = service
    await fetchAvailableSlots()
  }
}

async function fetchAvailableSlots() {
  if (!selectedService.value) return
  isLoadingSlots.value = true
  try {
    const { data: slotsResponse } = await useApi<BookingSlot[]>(`/booking/product/${selectedService.value.id}`, {
      query: { date: selectedDate.value.toISOString().split('T')[0] }
    })
    availableSlots.value = slotsResponse.value?.data || []
  } catch (e) {
    toast.add({ title: 'Gagal Memuat Slot', description: 'Tidak dapat mengambil jadwal yang tersedia.', color: 'error' })
  } finally {
    isLoadingSlots.value = false
  }
}

watch(selectedDate, fetchAvailableSlots)

function selectBookingSlot(slot: BookingSlot) {
  if (selectedService.value) {
    cartStore.addItem(selectedService.value, 1, slot.id)
    toast.add({ title: 'Layanan Dipesan', description: `${selectedService.value.name} telah ditambahkan.`, color: 'success' })
    selectedService.value = null
  }
}

function getProductQuantityInCart(productId: string): number {
  const item = cartStore.items.find(item => item.product.id === productId)
  return item ? item.quantity : 0
}

function formatCurrency(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

function openWhatsApp() {
  if (outlet.value?.phone) {
    window.open(`https://wa.me/${outlet.value.phone}`, '_blank')
  }
}


function shareOutlet() {
  if (navigator.share) {
    navigator.share({
      title: outlet.value?.business?.name || outlet.value?.name,
      url: window.location.href
    })
  } else {
    navigator.clipboard.writeText(window.location.href)
    toast.add({ title: 'Link Disalin', description: 'Link outlet berhasil disalin ke clipboard', color: 'success' })
  }
}

const filteredProducts = computed(() => {
  if (!searchQuery.value) {
    return products.value
  }
  return products.value.filter(p =>
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const filteredServices = computed(() => {
  if (!searchQuery.value) {
    return services.value
  }
  return services.value.filter(s =>
    s.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Loading State -->
    <div v-if="pending && !outlet" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse mx-auto mb-4">
          <Icon name="lucide:store" class="h-8 w-8 text-white" />
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Memuat outlet...</h3>
        <p class="text-gray-600 dark:text-gray-400">Mohon tunggu sebentar</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div class="text-center max-w-md mx-auto px-6">
        <div class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="lucide:alert-circle" class="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Oops! Ada yang salah</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Terjadi kesalahan saat memuat data outlet</p>
        <button @click="() => refresh()"
          class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
          <Icon name="lucide:refresh-cw" class="h-4 w-4 mr-2" />
          Coba Lagi
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="outlet" class="relative">
      <!-- Floating Header -->
      <Transition name="slide-down">
        <div v-if="isHeaderCollapsed"
          class="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div class="max-w-4xl mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <button @click="$router.back()"
                  class="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Icon name="lucide:arrow-left" class="h-5 w-5" />
                </button>
                <div>
                  <h1 class="text-lg font-bold text-gray-900 dark:text-white">{{ outlet.business?.name }}</h1>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ outlet.name }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button @click="shareOutlet"
                  class="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Icon name="lucide:share-2" class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Hero Section -->
      <div class="relative h-80 md:h-96 overflow-hidden">
        <div class="absolute inset-0">
          <NuxtImg v-if="outlet.image" :src="outlet.image" :alt="outlet.name" class="w-full h-full object-cover" />
          <div v-else
            class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
            <Icon name="lucide:image" class="h-20 w-20 text-gray-400" />
          </div>
          <div class="absolute inset-0 bg-black/30"></div>
        </div>

        <!-- Header Actions -->
        <div class="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
          <button @click="$router.back()"
            class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
            <Icon name="lucide:arrow-left" class="h-6 w-6 text-white" />
          </button>

          <div class="flex gap-3">
            <button @click="shareOutlet"
              class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors">
              <Icon name="lucide:share-2" class="h-6 w-6 text-white" />
            </button>

            <button v-if="outlet?.phone" @click="openWhatsApp"
              class="w-12 h-12 bg-green-500/90 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors">
              <Icon name="lucide:phone" class="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        <!-- Hero Content -->
        <div class="absolute bottom-0 left-0 right-0 p-6 mb-8">
          <div class="max-w-4xl mx-auto">
            <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white border border-white/20">
              <h1 class="text-3xl md:text-4xl font-bold mb-2">
                {{ outlet.business?.name }}
              </h1>
              <p class="text-xl text-red-100 mb-4">{{ outlet.name }}</p>

              <!-- <div class="flex flex-wrap items-center gap-6">
                <div class="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                  <div class="flex items-center gap-1">
                    <Icon name="lucide:star" class="h-4 w-4 text-yellow-400 fill-current" />
                    <Icon name="lucide:star" class="h-4 w-4 text-yellow-400 fill-current" />
                    <Icon name="lucide:star" class="h-4 w-4 text-yellow-400 fill-current" />
                    <Icon name="lucide:star" class="h-4 w-4 text-yellow-400 fill-current" />
                    <Icon name="lucide:star" class="h-4 w-4 text-yellow-400 fill-current" />
                  </div>
                  <span class="font-bold">4.9</span>
                  <span class="text-red-200">(248 ulasan)</span>
                </div>
              </div> -->
            </div>
          </div>
        </div>
      </div>

      <!-- Info Cards -->
      <div class="relative -mt-16 z-10 px-6">
        <div class="max-w-4xl mx-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Address Card -->
            <div
              class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="lucide:map-pin" class="h-6 w-6 text-white" />
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    Lokasi Outlet
                    <button class="text-red-500 hover:text-red-600 transition-colors">
                      <Icon name="lucide:external-link" class="h-4 w-4" />
                    </button>
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-3">
                    {{ outlet.address || 'Alamat akan segera diperbarui' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Contact Card -->
            <div
              class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="lucide:phone" class="h-6 w-6 text-white" />
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-gray-900 dark:text-white mb-2">Hubungi Kami</h3>
                  <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {{ outlet.phone || 'Nomor telepon akan segera diperbarui' }}
                  </p>
                  <div class="flex gap-2">
                    <button @click="openWhatsApp"
                      class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1">
                      <Icon name="lucide:message-circle" class="h-4 w-4" />
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="pt-8 pb-12">
        <div class="max-w-4xl mx-auto px-6">
          <!-- Tab Navigation -->
          <div class="mb-8">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2">
              <div class="flex">
                <button @click="activeTab = 'produk'" :class="[
                  'flex-1 py-3 px-4 font-semibold text-center transition-all duration-300 rounded-lg flex items-center justify-center gap-3',
                  activeTab === 'produk'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10'
                ]">
                  <div :class="[
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    activeTab === 'produk' ? 'bg-white/20' : 'bg-red-100 dark:bg-red-900/20'
                  ]">
                    <Icon name="lucide:shopping-bag" class="h-5 w-5" />
                  </div>
                  <div>
                    <div class="text-lg">Produk</div>
                    <div class="text-sm opacity-75">({{ filteredProducts.length }} item)</div>
                  </div>
                </button>

                <button @click="activeTab = 'layanan'" :class="[
                  'flex-1 py-3 px-4 font-semibold text-center transition-all duration-300 rounded-lg flex items-center justify-center gap-3',
                  activeTab === 'layanan'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10'
                ]">
                  <div :class="[
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    activeTab === 'layanan' ? 'bg-white/20' : 'bg-red-100 dark:bg-red-900/20'
                  ]">
                    <Icon name="lucide:wrench" class="h-5 w-5" />
                  </div>
                  <div>
                    <div class="text-lg">Layanan</div>
                    <div class="text-sm opacity-75">({{ filteredServices.length }} item)</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Search Bar -->
          <div class="mb-8">
            <div class="relative">
              <UInput
                v-model="searchQuery"
                icon="lucide:search"
                size="lg"
                color="primary"
                :trailing="false"
                placeholder="Cari produk atau layanan..."
                class="w-full"
              />
            </div>
          </div>

          <!-- Products Tab -->
          <div v-if="activeTab === 'produk'">
            <!-- Loading State for Products -->
            <div v-if="pendingProduct" class="text-center py-20">
              <div class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse mx-auto mb-4">
                <Icon name="lucide:package" class="h-8 w-8 text-white" />
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Memuat produk...</h3>
              <p class="text-gray-600 dark:text-gray-400">Mohon tunggu sebentar</p>
            </div>

            <!-- Error State for Products -->
            <div v-else-if="errorProduct" class="text-center py-20">
              <div class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="lucide:alert-circle" class="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Gagal memuat produk</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">Terjadi kesalahan saat mengambil data produk</p>
              <button @click="refreshProduct()"
                class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                <Icon name="lucide:refresh-cw" class="h-4 w-4 mr-2" />
                Coba Lagi
              </button>
            </div>

            <!-- Empty State for Products -->
            <div v-else-if="!filteredProducts.length" class="text-center py-20">
              <div
                class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon name="lucide:search-x" class="h-10 w-10 text-gray-400" />
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {{ searchQuery ? 'Produk Tidak Ditemukan' : 'Belum Ada Produk' }}
              </h3>
              <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {{ searchQuery ? `Tidak ada produk yang cocok dengan pencarian "${searchQuery}".` : 'Outlet ini sedang menyiapkan produk-produk terbaik untuk Anda' }}
              </p>
            </div>

            <!-- Products Grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="product in filteredProducts" :key="product.id"
                class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:border-red-300 dark:hover:border-red-600 transition-all duration-300">
                <!-- Product Image -->
                <div class="relative h-48 bg-gray-100 dark:bg-gray-700">
                  <img v-if="product.image" :src="product.image" :alt="product.name"
                    class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <Icon name="lucide:image" class="h-12 w-12 text-gray-400" />
                  </div>

                  <div class="absolute top-3 left-3">
                    <span class="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
                      PRODUK
                    </span>
                  </div>
                </div>

                <!-- Product Info -->
                <div class="p-5">
                  <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {{ product.name }}
                  </h3>

                  <p v-if="product.description" class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {{ product.description }}
                  </p>

                  <div class="flex justify-between items-end">
                    <div>
                      <p class="text-gray-500 text-xs mb-1">Harga</p>
                      <div class="text-xl font-bold text-red-600">
                        {{ formatCurrency(product.price) }}
                      </div>
                    </div>

                    <!-- Add to Cart -->
                    <div v-if="getProductQuantityInCart(product.id) === 0">
                      <button @click="cartStore.addItem(product)"
                        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                        <Icon name="lucide:shopping-cart" class="h-4 w-4" />
                        Tambah
                      </button>
                    </div>

                    <!-- Quantity Controls -->
                    <div v-else class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                      <button @click="cartStore.updateQuantity(product.id, getProductQuantityInCart(product.id) - 1)"
                        class="w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors">
                        <Icon name="lucide:minus" class="h-4 w-4" />
                      </button>

                      <span class="font-bold text-lg w-8 text-center">
                        {{ getProductQuantityInCart(product.id) }}
                      </span>

                      <button @click="cartStore.addItem(product)"
                        class="w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors">
                        <Icon name="lucide:plus" class="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Services Tab -->
          <div v-if="activeTab === 'layanan'">
            <!-- Loading State for Services -->
            <div v-if="pendingProduct" class="text-center py-20">
              <div class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse mx-auto mb-4">
                <Icon name="lucide:wrench" class="h-8 w-8 text-white" />
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Memuat layanan...</h3>
              <p class="text-gray-600 dark:text-gray-400">Mohon tunggu sebentar</p>
            </div>

            <!-- Error State for Services -->
            <div v-else-if="errorProduct" class="text-center py-20">
              <div class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="lucide:alert-circle" class="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Gagal memuat layanan</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">Terjadi kesalahan saat mengambil data layanan</p>
              <button @click="refreshProduct()"
                class="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                <Icon name="lucide:refresh-cw" class="h-4 w-4 mr-2" />
                Coba Lagi
              </button>
            </div>

            <!-- Empty State for Services -->
            <div v-else-if="!filteredServices.length" class="text-center py-20">
              <div
                class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon name="lucide:search-x" class="h-10 w-10 text-gray-400" />
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {{ searchQuery ? 'Layanan Tidak Ditemukan' : 'Belum Ada Layanan' }}
              </h3>
              <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {{ searchQuery ? `Tidak ada layanan yang cocok dengan pencarian "${searchQuery}".` : 'Outlet ini sedang menyiapkan berbagai layanan menarik untuk Anda' }}
              </p>
            </div>

            <!-- Services List -->
            <div v-else class="space-y-6">
              <div v-for="service in filteredServices" :key="service.id"
                class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <!-- Service Header -->
                <div class="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  @click="selectServiceForBooking(service)">
                  <div class="flex justify-between items-start">
                    <div class="flex-1">
                      <div class="flex items-center gap-4 mb-4">
                        <div class="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                          <Icon name="lucide:sparkles" class="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div class="flex items-center gap-3 mb-2">
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                              {{ service.name }}
                            </h3>
                            <span class="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
                              LAYANAN
                            </span>
                          </div>

                          <div class="flex items-center gap-6 text-gray-600 dark:text-gray-400">
                            <div class="flex items-center gap-2">
                              <Icon name="lucide:clock" class="h-4 w-4" />
                              <span class="text-sm">60 menit</span>
                            </div>
                            <div class="flex items-center gap-2">
                              <Icon name="lucide:calendar-check" class="h-4 w-4" />
                              <span class="text-sm">Booking tersedia</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div class="mb-4">
                        <div class="text-2xl font-bold text-red-600 mb-2">
                          {{ formatCurrency(service.price) }}
                        </div>
                        <p class="text-gray-600 dark:text-gray-400">
                          {{ service.description || 'Layanan berkualitas tinggi dengan pelayanan terbaik' }}
                        </p>
                      </div>
                    </div>

                    <div class="ml-6">
                      <div :class="[
                        'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                        selectedService?.id === service.id
                          ? 'bg-red-600 text-white'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      ]">
                        <Icon :name="selectedService?.id === service.id ? 'lucide:calendar-check' : 'lucide:calendar'"
                          class="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Booking Section -->
                <Transition name="expand">
                  <div v-if="selectedService?.id === service.id" class="border-t border-gray-200 dark:border-gray-700">
                    <div class="p-6 bg-red-50 dark:bg-red-900/10">
                      <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Icon name="lucide:calendar-days" class="h-5 w-5 text-red-600" />
                        Pilih Jadwal Booking
                      </h4>

                      <!-- Calendar -->
                      <div
                        class="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-600 mb-6">
                        <VCalendar v-model="selectedDate" :min-date="new Date()" expanded borderless
                          class="rounded-xl" />
                      </div>

                      <!-- Time Slots -->
                      <div v-if="isLoadingSlots" class="text-center py-8">
                        <div
                          class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto animate-pulse mb-4">
                          <Icon name="lucide:clock" class="h-6 w-6 text-white" />
                        </div>
                        <p class="text-gray-500">Mencari jadwal tersedia...</p>
                      </div>

                      <div v-else-if="availableSlots.length">
                        <h5 class="font-bold text-gray-900 dark:text-white mb-4">Waktu Tersedia</h5>
                        <div class="grid grid-cols-3 md:grid-cols-4 gap-3">
                          <button v-for="slot in availableSlots" :key="slot.id" @click="selectBookingSlot(slot)"
                            class="p-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-center">
                            <div class="font-bold text-gray-900 dark:text-white">
                              {{ new Date(slot.startTime).toLocaleTimeString('id-ID', {
                                hour: '2-digit', minute:
                                  '2-digit'
                              }) }}
                            </div>
                            <div class="text-xs text-gray-500 mt-1">Tersedia</div>
                          </button>
                        </div>
                      </div>

                      <div v-else class="text-center py-8">
                        <Icon name="lucide:calendar-x" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 class="font-bold text-gray-900 dark:text-white mb-2">Tidak Ada Jadwal Tersedia</h4>
                        <p class="text-gray-500">Silakan pilih tanggal lain</p>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart Component -->
    <AppCart />
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 1000px;
}

.line-clamp-2 {
  display: -webkit-box;
  /* -webkit-line-clamp: 2; */
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>