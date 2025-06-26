<script setup>
defineProps({
  label: String,
  variant: {
    type: String,
    default: 'primary' // primary | secondary | outline
  },
  size: {
    type: String,
    default: 'md' // sm | md | lg
  },
  icon: String
})
</script>

<template>
  <button
    :class="[
      'inline-flex items-center justify-center rounded-lg font-semibold transition',
      size === 'sm' ? 'text-sm px-3 py-1.5' : size === 'lg' ? 'text-lg px-6 py-3' : 'text-base px-4 py-2',
      variant === 'primary' && 'bg-primary-600 text-white hover:bg-primary-700',
      variant === 'secondary' && 'bg-white text-primary-700 border border-primary-600 hover:bg-primary-50',
      variant === 'outline' && 'border-3 border-primary-600 text-primary-600 hover:bg-white hover:text-primary-700'
    ]"
  >
    <Icon v-if="icon" :name="icon" class="mr-2" />
    <slot />
  </button>
</template>
