<script setup>
defineProps({
  size: {
    type: String,
    default: 'md'
  },
  variant: {
    type: String,
    default: 'spinner'
  },
  text: {
    type: String,
    default: ''
  },
  fullscreen: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div :class="[
    'flex items-center justify-center',
    fullscreen && 'fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50',
    !fullscreen && 'py-8'
  ]">
    <div class="text-center">
      <!-- Spinner Variant -->
      <div v-if="variant === 'spinner'" :class="[
        'animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 mx-auto mb-4',
        size === 'sm' && 'h-8 w-8 border-t-primary-600',
        size === 'md' && 'h-12 w-12 border-t-primary-600',
        size === 'lg' && 'h-16 w-16 border-t-primary-600',
        size === 'xl' && 'h-20 w-20 border-t-primary-600'
      ]"></div>

      <!-- Dots Variant -->
      <div v-else-if="variant === 'dots'" class="flex items-center justify-center space-x-2 mb-4">
        <div v-for="i in 3" :key="i" :class="[
          'rounded-full bg-primary-600 animate-bounce',
          size === 'sm' && 'h-2 w-2',
          size === 'md' && 'h-3 w-3',
          size === 'lg' && 'h-4 w-4',
          size === 'xl' && 'h-5 w-5'
        ]" :style="{ animationDelay: `${(i - 1) * 0.1}s` }"></div>
      </div>

      <!-- Pulse Variant -->
      <div v-else-if="variant === 'pulse'" :class="[
        'rounded-full bg-primary-600 animate-pulse mx-auto mb-4',
        size === 'sm' && 'h-8 w-8',
        size === 'md' && 'h-12 w-12',
        size === 'lg' && 'h-16 w-16',
        size === 'xl' && 'h-20 w-20'
      ]"></div>

      <!-- Bars Variant -->
      <div v-else-if="variant === 'bars'" class="flex items-end justify-center space-x-1 mb-4">
        <div v-for="i in 4" :key="i" :class="[
          'bg-primary-600 animate-pulse',
          size === 'sm' && 'w-1 h-6',
          size === 'md' && 'w-1.5 h-8',
          size === 'lg' && 'w-2 h-10',
          size === 'xl' && 'w-2.5 h-12'
        ]" :style="{
              animationDelay: `${(i - 1) * 0.1}s`,
              animationDuration: '0.6s'
            }"></div>
      </div>

      <!-- Ripple Variant -->
      <div v-else-if="variant === 'ripple'" :class="[
        'relative mx-auto mb-4',
        size === 'sm' && 'h-8 w-8',
        size === 'md' && 'h-12 w-12',
        size === 'lg' && 'h-16 w-16',
        size === 'xl' && 'h-20 w-20'
      ]">
        <div v-for="i in 2" :key="i" :class="[
          'absolute rounded-full border-2 border-primary-600 animate-ping',
          size === 'sm' && 'h-8 w-8',
          size === 'md' && 'h-12 w-12',
          size === 'lg' && 'h-16 w-16',
          size === 'xl' && 'h-20 w-20'
        ]" :style="{ animationDelay: `${(i - 1) * 0.2}s` }"></div>
      </div>

      <!-- Loading Text -->
      <p v-if="text" :class="[
        'text-gray-600 dark:text-gray-400 font-medium',
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-base',
        size === 'lg' && 'text-lg',
        size === 'xl' && 'text-xl'
      ]">
        {{ text }}
      </p>
    </div>
  </div>
</template>
