<script setup>
const featuredBusinesses = ref([
  {
    id: 1,
    name: 'Warung Kopi Sederhana',
    description: 'Kopi berkualitas dengan harga terjangkau',
    image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'F&B',
    rating: 4.8,
    location: 'Jakarta Selatan'
  },
  {
    id: 2,
    name: 'Toko Elektronik Maju',
    description: 'Elektronik terlengkap dengan garansi resmi',
    image: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'Elektronik',
    rating: 4.6,
    location: 'Bandung'
  },
  {
    id: 3,
    name: 'Salon Cantik Indah',
    description: 'Perawatan kecantikan profesional',
    image: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=400',
    category: 'Kecantikan',
    rating: 4.9,
    location: 'Surabaya'
  }
])

const stats = ref([
  { label: 'UMKM Terdaftar', value: '1,200+', icon: 'mdi:store' },
  { label: 'Transaksi Berhasil', value: '15,000+', icon: 'mdi:chart-line' },
  { label: 'Pengguna Aktif', value: '8,500+', icon: 'mdi:account-group' }
])
</script>

<template>
  <div class="min-h-screen">
    <!-- Featured Businesses -->
    <section class="py-6 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            UMKM Unggulan
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Temukan UMKM terbaik yang telah dipercaya oleh ribuan pelanggan
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <BaseCard
            v-for="business in featuredBusinesses"
            :key="business.id"
            hover
            clickable
            padding="none"
            class="overflow-hidden group"
          >
            <div class="relative">
              <img
                :src="business.image"
                :alt="business.name"
                class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">{{ business.name }}</h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">{{ business.description }}</p>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center text-gray-500 dark:text-gray-400">
                  <Icon name="mdi:map-marker" size="16" class="mr-1" />
                  <span class="text-sm">{{ business.location }}</span>
                </div>
                <BaseButton size="sm" variant="outline">
                  Lihat Detail
                </BaseButton>
              </div>
            </div>
          </BaseCard>
        </div>

        <div class="text-center mt-12">
          <BaseButton size="lg" variant="primary">
            Lihat Semua UMKM
            <Icon name="mdi:arrow-right" class="ml-2" />
          </BaseButton>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="py-16 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="text-center group"
          >
            <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
              <Icon :name="stat.icon" size="32" class="text-primary-600 dark:text-primary-400" />
            </div>
            <div class="text-3xl font-bold text-gray-900 dark:text-white mb-2">{{ stat.value }}</div>
            <div class="text-gray-600 dark:text-gray-400">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>