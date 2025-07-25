<script setup>
defineProps({
  hover: {
    type: Boolean,
    default: false
  },
  clickable: {
    type: Boolean,
    default: false
  },
  padding: {
    type: String,
    default: 'default'
  },
  variant: {
    type: String,
    default: 'default'
  },
  bordered: {
    type: Boolean,
    default: true
  },
  rounded: {
    type: String,
    default: 'xl'
  },
  shadow: {
    type: String,
    default: 'default'
  }
})
</script>

<template>
  <div :class="[
    'transition-all duration-300 overflow-hidden',

    // Base styles
    'bg-white dark:bg-gray-800',

    // Rounded
    rounded === 'none' && 'rounded-none',
    rounded === 'sm' && 'rounded-sm',
    rounded === 'md' && 'rounded-md',
    rounded === 'lg' && 'rounded-lg',
    rounded === 'xl' && 'rounded-xl',
    rounded === '2xl' && 'rounded-2xl',
    rounded === 'full' && 'rounded-full',

    // Border
    bordered && 'border border-gray-200 dark:border-gray-700',

    // Shadow
    shadow === 'none' && 'shadow-none',
    shadow === 'sm' && 'shadow-sm',
    shadow === 'default' && 'shadow-md',
    shadow === 'lg' && 'shadow-lg',
    shadow === 'xl' && 'shadow-xl',

    // Padding
    padding === 'none' && 'p-0',
    padding === 'xs' && 'p-2',
    padding === 'sm' && 'p-3',
    padding === 'default' && 'p-4',
    padding === 'md' && 'p-6',
    padding === 'lg' && 'p-8',
    padding === 'xl' && 'p-10',

    // Variants
    variant === 'primary' && 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800',
    variant === 'secondary' && 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600',
    variant === 'success' && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    variant === 'warning' && 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    variant === 'danger' && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    variant === 'glass' && 'glass',

    // Interactive states
    clickable && 'cursor-pointer select-none',

    // Hover effects
    hover && [
      'hover:shadow-xl hover:-translate-y-1',
      variant === 'default' && 'hover:border-gray-300 dark:hover:border-gray-600',
      variant === 'primary' && 'hover:border-primary-300 dark:hover:border-primary-700',
      variant === 'secondary' && 'hover:border-gray-400 dark:hover:border-gray-500',
      variant === 'success' && 'hover:border-green-300 dark:hover:border-green-700',
      variant === 'warning' && 'hover:border-yellow-300 dark:hover:border-yellow-700',
      variant === 'danger' && 'hover:border-red-300 dark:hover:border-red-700'
    ],

    // Focus states for clickable cards
    clickable && [
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      variant === 'default' && 'focus:ring-gray-500',
      variant === 'primary' && 'focus:ring-primary-500',
      variant === 'secondary' && 'focus:ring-gray-500',
      variant === 'success' && 'focus:ring-green-500',
      variant === 'warning' && 'focus:ring-yellow-500',
      variant === 'danger' && 'focus:ring-red-500'
    ]
  ]" :tabindex="clickable ? 0 : undefined" role="region">
    <slot />
  </div>
</template>
