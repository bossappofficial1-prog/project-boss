<script setup>
defineProps({
  hover: Boolean,
  clickable: Boolean,
  padding: {
    type: String,
    default: 'p-4'
  }
})
</script>

<template>
  <div
    :class="[
      'rounded-xl shadow bg-white dark:bg-gray-900 transition overflow-hidden',
      hover && 'hover:shadow-lg hover:scale-[1.02]',
      clickable && 'cursor-pointer',
      padding
    ]"
  >
    <slot />
  </div>
</template>
