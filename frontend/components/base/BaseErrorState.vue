<script setup>
defineProps({
  icon: {
    type: String,
    default: 'lucide:alert-circle'
  },
  title: {
    type: String,
    default: 'Terjadi Kesalahan'
  },
  description: {
    type: String,
    default: 'Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.'
  },
  error: {
    type: [String, Object],
    default: null
  },
  retryText: {
    type: String,
    default: 'Coba Lagi'
  },
  showRetry: {
    type: Boolean,
    default: true
  },
  compact: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'error'
  }
})

defineEmits(['retry'])

const iconName = computed(() => {
  if (props.variant === 'warning') return 'lucide:alert-triangle'
  if (props.variant === 'info') return 'lucide:info'
  if (props.variant === 'network') return 'lucide:wifi-off'
  return props.icon
})

const iconColor = computed(() => {
  if (props.variant === 'warning') return 'text-yellow-500'
  if (props.variant === 'info') return 'text-blue-500'
  if (props.variant === 'network') return 'text-gray-500'
  return 'text-red-500'
})

const bgColor = computed(() => {
  if (props.variant === 'warning') return 'bg-yellow-100 dark:bg-yellow-900/20'
  if (props.variant === 'info') return 'bg-blue-100 dark:bg-blue-900/20'
  if (props.variant === 'network') return 'bg-gray-100 dark:bg-gray-800'
  return 'bg-red-100 dark:bg-red-900/20'
})
</script>

<template>
  <div :class="[
    'flex flex-col items-center justify-center text-center',
    compact ? 'py-8' : 'py-16'
  ]">
    <!-- Icon -->
    <div :class="[
      'rounded-full flex items-center justify-center mb-6',
      bgColor,
      compact ? 'w-16 h-16' : 'w-24 h-24'
    ]">
      <Icon :name="iconName" :size="compact ? '32' : '48'" :class="iconColor" />
    </div>

    <!-- Title -->
    <h3 :class="[
      'font-semibold text-gray-900 dark:text-white mb-2',
      compact ? 'text-lg' : 'text-xl'
    ]">
      {{ title }}
    </h3>

    <!-- Description -->
    <p :class="[
      'text-gray-600 dark:text-gray-400 mb-2 max-w-md',
      compact ? 'text-sm' : 'text-base'
    ]">
      {{ description }}
    </p>

    <!-- Error Details -->
    <details v-if="error && typeof error === 'object'" class="mb-6 max-w-md">
      <summary
        class="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
        Lihat detail error
      </summary>
      <pre
        class="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-left overflow-auto max-h-32 text-gray-700 dark:text-gray-300">{{ error }}</pre>
    </details>

    <p v-else-if="error && typeof error === 'string'" class="text-sm text-gray-500 dark:text-gray-400 mb-6 font-mono">
      {{ error }}
    </p>

    <!-- Retry Button -->
    <div class="flex flex-col sm:flex-row gap-3">
      <BaseButton v-if="showRetry" @click="$emit('retry')" :variant="variant === 'error' ? 'danger' : 'primary'"
        class="shadow-md hover:shadow-lg">
        <Icon name="lucide:refresh-cw" class="mr-2" size="16" />
        {{ retryText }}
      </BaseButton>

      <!-- Custom Actions Slot -->
      <slot name="actions" />
    </div>
  </div>
</template>
