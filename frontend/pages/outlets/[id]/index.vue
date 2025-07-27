<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useCartStore } from '~/stores/cart'
import type { Outlet, Product, BookingSlot } from '~/types'

const route = useRoute()
const cartStore = useCartStore()
const toast = useToast()
const outletId = route.params.id as string

const { data, pending, error, refresh } = useApi<Outlet>(`/api/v1/outlets/${outletId}`)

const outlet = computed(() => data.value?.data)
const products = computed(() => outlet.value?.products?.filter(p => p.type === 'GOODS') || [])
const services = computed(() => outlet.value?.products?.filter(p => p.type === 'SERVICE') || [])
const activeTab = ref<'produk' | 'layanan'>('produk')

// --- Booking State ---
const selectedService = ref<Product | null>(null)
const availableSlots = ref<BookingSlot[]>([])
const selectedDate = ref(new Date())
const isLoadingSlots = ref(false)

async function selectServiceForBooking(service: Product) {
  if (selectedService.value?.id === service.id) {
    selectedService.value = null // Deselect if clicking the same service
  } else {
    selectedService.value = service
    await fetchAvailableSlots()
  }
}

async function fetchAvailableSlots() {
  if (!selectedService.value) return
  isLoadingSlots.value = true
  try {
    const { data: slotsResponse } = await useApi<BookingSlot[]>(`/api/v1/booking/product/${selectedService.value.id}`, {
      query: { date: selectedDate.value.toISOString().split('T')[0] }
    })
    availableSlots.value = slotsResponse.value?.data || []
  } catch (e) {
    toast.error({ title: 'Gagal Memuat Slot', message: 'Tidak dapat mengambil jadwal yang tersedia.' })
  } finally {
    isLoadingSlots.value = false
  }
}

watch(selectedDate, fetchAvailableSlots)

function selectBookingSlot(slot: BookingSlot) {
  if (selectedService.value) {
    cartStore.addItem(selectedService.value, 1, slot.id)
    toast.success({ title: 'Layanan Dipesan', message: `${selectedService.value.name} telah ditambahkan.` })
    selectedService.value = null // Close booking section
  }
}

function getProductQuantityInCart(productId: string): number {
  const item = cartStore.items.find(item => item.product.id === productId)
  return item ? item.quantity : 0
}
</script>

<template>
  <div class="bg-gray-100 dark:bg-gray-900 min-h-screen">
    <div v-if="pending && !outlet" class="pt-20">
      <BaseLoading text="Memuat outlet..." />
    </div>
    <div v-else-if="error" class="pt-20">
      <BaseErrorState :error="error" @retry="refresh" />
    </div>
    <div v-else-if="outlet">
      <div class="relative">
        <!-- Hero Image -->
        <div class="relative h-56 sm:h-72 bg-gray-300 dark:bg-gray-700">
          <NuxtImg v-if="outlet.image" :src="outlet.image" :alt="outlet.name" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-b from-black/60 to-black/20"></div>
          <div class="absolute top-4 left-4 z-10">
            <BaseBack />
          </div>
        </div>

        <!-- Outlet Info Overlay -->
        <div class="absolute -bottom-16 left-0 right-0 px-4">
          <div class="max-w-3xl mx-auto">
            <BaseCard class="!p-6">
              <div class="flex justify-between items-start gap-4">
                <div>
                  <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{{ outlet.business?.name }}
                  </h1>
                  <p class="text-lg text-gray-600 dark:text-gray-300 mt-1">{{ outlet.name }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <UButton v-if="outlet.phone" :href="'https://wa.me/' + outlet.phone" target="_blank" color="success"
                    variant="ghost" icon="i-heroicons-phone" />
                </div>
              </div>
            </BaseCard>
          </div>
        </div>
      </div>

      <!-- Spacer for Card Overlay -->
      <div class="h-20"></div>

      <div class="max-w-3xl mx-auto">
        <!-- Outlet Info -->
        <div class="p-4 mb-6">
          <div class="flex items-center gap-4 mb-2">
            <UIcon name="i-heroicons-map-pin" class="text-primary-600 w-5 h-5" />
            <p class="text-gray-600 dark:text-gray-300">{{ outlet.address || 'Alamat tidak tersedia' }}</p>
          </div>
          <div class="flex items-center gap-4">
            <UIcon name="i-heroicons-phone" class="text-primary-600 w-5 h-5" />
            <p class="text-gray-600 dark:text-gray-300">{{ outlet.phone || 'No. Telepon tidak tersedia' }}</p>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="border-b border-gray-200 dark:border-gray-700">
          <div class="flex gap-6 px-4">
            <button
              :class="['py-3 px-1 font-medium relative', activeTab === 'produk' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']"
              @click="activeTab = 'produk'">
              <span>Produk</span>
              <div v-if="activeTab === 'produk'" class="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>
            </button>
            <button
              :class="['py-3 px-1 font-medium relative', activeTab === 'layanan' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300']"
              @click="activeTab = 'layanan'">
              <span>Layanan</span>
              <div v-if="activeTab === 'layanan'" class="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600"></div>
            </button>
          </div>
        </div>

        <!-- Produk Tab -->
        <div v-show="activeTab === 'produk'" class="p-4">
          <div v-if="products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseCard v-for="product in products" :key="product.id" class="overflow-hidden">
              <div class="aspect-video bg-gray-100 dark:bg-gray-800 mb-3">
                <NuxtImg v-if="product.image" :src="product.image" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-heroicons-photo" class="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <div class="px-3 pb-3">
                <h3 class="font-semibold text-gray-900 dark:text-white text-lg">{{ product.name }}</h3>
                <p class="text-primary-600 font-bold mt-1">Rp{{ product.price.toLocaleString('id-ID') }}</p>
                <div class="mt-3 flex justify-end">
                  <div v-if="getProductQuantityInCart(product.id) === 0">
                    <UButton @click="cartStore.addItem(product)" color="primary" variant="solid" size="sm">
                      Tambah ke Keranjang
                    </UButton>
                  </div>
                  <div v-else class="flex items-center gap-2">
                    <UButton @click="cartStore.updateQuantity(product.id, getProductQuantityInCart(product.id) - 1)"
                      icon="i-heroicons-minus" size="sm" color="primary" />
                    <span class="font-bold text-center w-8">{{ getProductQuantityInCart(product.id) }}</span>
                    <UButton @click="cartStore.addItem(product)" icon="i-heroicons-plus" size="sm" color="primary" />
                  </div>
                </div>
              </div>
            </BaseCard>
          </div>
          <div v-else class="py-12 text-center">
            <UIcon name="i-heroicons-shopping-bag" class="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p class="text-gray-500 dark:text-gray-400">Tidak ada produk tersedia.</p>
          </div>
        </div>

        <!-- Layanan Tab -->
        <div v-show="activeTab === 'layanan'" class="p-4">
          <div v-if="services.length > 0" class="space-y-4">
            <div v-for="service in services" :key="service.id">
              <BaseCard class="overflow-hidden">
                <div class="p-4 flex items-start gap-4 cursor-pointer" @click="selectServiceForBooking(service)">
                  <div class="flex-grow">
                    <h3 class="font-semibold text-gray-900 dark:text-white text-lg">{{ service.name }}</h3>
                    <p class="text-primary-600 font-bold mt-1">Rp{{ service.price.toLocaleString('id-ID') }}</p>
                    <p v-if="service.description" class="text-gray-500 dark:text-gray-400 text-sm mt-2">{{
                      service.description }}</p>
                  </div>
                  <UButton icon="i-heroicons-calendar-days"
                    :variant="selectedService?.id === service.id ? 'solid' : 'outline'" class="mt-1" />
                </div>
              </BaseCard>

              <!-- Booking Section -->
              <Transition name="fade">
                <div v-if="selectedService?.id === service.id" class="mt-3">
                  <BaseCard>
                    <VCalendar v-model="selectedDate" :min-date="new Date()" is-dark expanded borderless transparent />
                    <div v-if="isLoadingSlots" class="p-4">
                      <BaseLoading text="Mencari jadwal..." />
                    </div>
                    <div v-else-if="availableSlots.length" class="p-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
                      <UButton v-for="slot in availableSlots" :key="slot.id" @click="selectBookingSlot(slot)"
                        color="primary">
                        {{ new Date(slot.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        }}
                      </UButton>
                    </div>
                    <p v-else class="text-center text-gray-500 p-4">Tidak ada jadwal tersedia.</p>
                  </BaseCard>
                </div>
              </Transition>
            </div>
          </div>
          <p v-else class="text-gray-500 text-center">Tidak ada layanan tersedia.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
