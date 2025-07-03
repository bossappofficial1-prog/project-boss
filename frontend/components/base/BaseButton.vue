<script setup>
defineProps({
  label: String,
  variant: {
    type: String,
    default: 'primary'
  },
  size: {
    type: String,
    default: 'md'
  },
  icon: String
})
</script>

<template>
  <button :class="[
    'inline-flex items-center justify-center rounded-lg font-semibold transition',
    size === 'sm' ? 'text-sm px-1 py-0.5' : size === 'lg' ? 'text-lg px-4 py-3' : 'text-base px-1.5 py-1',
    variant === 'primary' && 'border-2 border-primary-600 bg-primary-600 text-white hover:bg-primary-700 dark:border-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400',
    variant === 'secondary' && 'bg-white text-primary-700 border border-primary-600 hover:bg-primary-50 dark:bg-gray-800 dark:text-primary-300 dark:border-primary-500 dark:hover:bg-gray-700',
    variant === 'outline' && 'border-2 border-primary-600 text-primary-600 hover:bg-white hover:text-primary-700 dark:border-primary-500 dark:text-primary-300 dark:hover:bg-gray-800 dark:hover:text-primary-200'
  ]">
    <Icon v-if="icon" :name="icon" class="mr-2" />
    <slot />
  </button>
</template>
