<template>
  <UCard 
    class="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    :ui="{ 
      base: 'relative',
      body: { padding: 'p-0' },
      header: { padding: 'p-0' }
    }"
  >
    <!-- Product Image -->
    <div class="relative overflow-hidden bg-gray-100 dark:bg-gray-800">
      <img 
        :src="product.image" 
        :alt="product.name"
        class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      
      <!-- Badges -->
      <div class="absolute top-3 left-3 flex flex-col gap-2">
        <UBadge 
          v-if="product.isNew" 
          color="green" 
          variant="solid"
          class="text-xs font-medium"
        >
          Baru
        </UBadge>
        
        <UBadge 
          v-if="product.badge" 
          :color="getBadgeColor(product.badge)" 
          variant="solid"
          class="text-xs font-medium"
        >
          {{ product.badge }}
        </UBadge>
      </div>

      <!-- Quick Actions -->
      <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div class="flex flex-col gap-2">
          <UButton 
            icon="i-heroicons-heart" 
            size="sm" 
            color="white" 
            variant="solid"
            square
            @click.stop="toggleWishlist"
            :class="{ 'text-red-500': isInWishlist }"
          />
          <UButton 
            icon="i-heroicons-eye" 
            size="sm" 
            color="white" 
            variant="solid"
            square
            @click.stop="quickView"
          />
        </div>
      </div>

      <!-- Discount Percentage -->
      <div 
        v-if="discountPercentage > 0" 
        class="absolute bottom-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded"
      >
        -{{ discountPercentage }}%
      </div>
    </div>

    <!-- Product Info -->
    <div class="p-4">
      <!-- Rating -->
      <div class="flex items-center gap-1 mb-2">
        <div class="flex items-center">
          <UIcon 
            v-for="star in 5" 
            :key="star"
            name="i-heroicons-star-solid" 
            :class="star <= Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'"
            class="w-4 h-4"
          />
        </div>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ product.rating }} ({{ product.reviews }})
        </span>
      </div>

      <!-- Product Name -->
      <h3 class="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        {{ product.name }}
      </h3>

      <!-- Price -->
      <div class="flex items-center gap-2 mb-4">
        <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
          {{ formatPrice(product.price) }}
        </span>
        <span 
          v-if="product.originalPrice" 
          class="text-sm text-gray-500 line-through"
        >
          {{ formatPrice(product.originalPrice) }}
        </span>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <UButton 
          color="primary" 
          variant="solid"
          size="sm"
          class="flex-1"
          @click="addToCart"
          :loading="isAddingToCart"
        >
          <UIcon name="i-heroicons-shopping-cart" class="mr-1" />
          Tambah
        </UButton>
        
        <UButton 
          color="primary" 
          variant="outline"
          size="sm"
          square
          @click="buyNow"
        >
          <UIcon name="i-heroicons-bolt" />
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup>
const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['add-to-cart', 'quick-view', 'buy-now'])

// Reactive states
const isAddingToCart = ref(false)
const isInWishlist = ref(false)

// Computed properties
const discountPercentage = computed(() => {
  if (!props.product.originalPrice) return 0
  return Math.round(((props.product.originalPrice - props.product.price) / props.product.originalPrice) * 100)
})

// Methods
const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price)
}

const getBadgeColor = (badge) => {
  const colors = {
    'Bestseller': 'blue',
    'Sale': 'red',
    'Promo': 'orange',
    'Hot': 'red',
    'Limited': 'purple'
  }
  return colors[badge] || 'gray'
}

const addToCart = async () => {
  isAddingToCart.value = true
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500))
  
  emit('add-to-cart', props.product)
  isAddingToCart.value = false
}

const buyNow = () => {
  emit('buy-now', props.product)
}

const quickView = () => {
  emit('quick-view', props.product)
}

const toggleWishlist = () => {
  isInWishlist.value = !isInWishlist.value
  
  const toast = useToast()
  toast.add({
    title: isInWishlist.value ? 'Ditambahkan ke Wishlist' : 'Dihapus dari Wishlist',
    description: props.product.name,
    icon: isInWishlist.value ? 'i-heroicons-heart-solid' : 'i-heroicons-heart',
    color: isInWishlist.value ? 'red' : 'gray'
  })
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>