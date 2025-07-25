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
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  icon: String,
  iconPosition: {
    type: String,
    default: 'left'
  },
  block: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <button :disabled="disabled || loading" :class="[
    'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',

    // Sizes
    size === 'xs' && 'text-xs px-3 py-1.5',
    size === 'sm' && 'text-sm px-4 py-2',
    size === 'md' && 'text-sm px-5 py-2.5',
    size === 'lg' && 'text-base px-7 py-3',
    size === 'xl' && 'text-lg px-9 py-4',

    // Block
    block && 'w-full',

    // Variants
    variant === 'primary' && [
      'bg-gradient-to-r from-primary-600 to-primary-700 text-white',
      'hover:from-primary-500 hover:to-primary-600 hover:shadow-lg hover:-translate-y-0.5',
      'active:from-primary-800 active:to-primary-900 active:translate-y-0',
      'focus:ring-primary-500 focus:ring-offset-1 dark:focus:ring-primary-400',
      'shadow-md border border-transparent rounded-xl'
    ],

    variant === 'secondary' && [
      'bg-white text-primary-700 border border-primary-600',
      'hover:bg-primary-50 hover:border-primary-700 hover:shadow-md hover:-translate-y-0.5',
      'active:bg-primary-100 active:translate-y-0',
      'focus:ring-primary-500 focus:ring-offset-1',
      'dark:bg-gray-800 dark:text-primary-300 dark:border-primary-500',
      'dark:hover:bg-gray-700 dark:hover:border-primary-400',
      'rounded-xl'
    ],

    variant === 'outline' && [
      'bg-transparent text-primary-600 border border-primary-600',
      'hover:bg-primary-50 hover:text-primary-700 hover:shadow-md hover:-translate-y-0.5',
      'active:bg-primary-100 active:text-primary-800 active:translate-y-0',
      'focus:ring-primary-500 focus:ring-offset-1',
      'dark:text-primary-400 dark:border-primary-400',
      'dark:hover:bg-primary-900 dark:hover:text-primary-300',
      'rounded-xl'
    ],

    variant === 'ghost' && [
      'bg-transparent text-gray-700 border border-transparent',
      'hover:bg-gray-100 hover:text-gray-900 hover:-translate-y-0.5',
      'active:bg-gray-200 active:translate-y-0',
      'focus:ring-gray-500 focus:ring-offset-1',
      'dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:text-white',
      'rounded-xl'
    ],

    variant === 'danger' && [
      'bg-gradient-to-r from-red-600 to-red-700 text-white',
      'hover:from-red-500 hover:to-red-600 hover:shadow-lg hover:-translate-y-0.5',
      'active:from-red-800 active:to-red-900 active:translate-y-0',
      'focus:ring-red-500 focus:ring-offset-1',
      'shadow-md border border-transparent rounded-xl'
    ],

    variant === 'success' && [
      'bg-gradient-to-r from-green-600 to-green-700 text-white',
      'hover:from-green-500 hover:to-green-600 hover:shadow-lg hover:-translate-y-0.5',
      'active:from-green-800 active:to-green-900 active:translate-y-0',
      'focus:ring-green-500 focus:ring-offset-1',
      'shadow-md border border-transparent rounded-xl'
    ],

    variant === 'warning' && [
      'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white',
      'hover:from-yellow-400 hover:to-yellow-500 hover:shadow-lg hover:-translate-y-0.5',
      'active:from-yellow-700 active:to-yellow-800 active:translate-y-0',
      'focus:ring-yellow-500 focus:ring-offset-1',
      'shadow-md border border-transparent rounded-xl'
    ]
  ]">

    <!-- Loading State -->
    <template v-if="loading">
      <Icon name="line-md:loading-alt-loop"
        :size="size === 'xs' ? '14' : size === 'sm' ? '16' : size === 'lg' || size === 'xl' ? '20' : '18'" />
      <span v-if="$slots.default" class="ml-2">
        <slot />
      </span>
    </template>

    <!-- Normal State -->
    <template v-else>
      <!-- Left Icon -->
      <Icon v-if="icon && iconPosition === 'left'" :name="icon"
        :size="size === 'xs' ? '14' : size === 'sm' ? '16' : size === 'lg' || size === 'xl' ? '20' : '18'"
        :class="$slots.default ? 'mr-2' : ''" />

      <!-- Content -->
      <slot />

      <!-- Right Icon -->
      <Icon v-if="icon && iconPosition === 'right'" :name="icon"
        :size="size === 'xs' ? '14' : size === 'sm' ? '16' : size === 'lg' || size === 'xl' ? '20' : '18'"
        :class="$slots.default ? 'ml-2' : ''" />
    </template>
  </button>
</template>
