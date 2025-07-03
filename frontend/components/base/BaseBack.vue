<template>
  <button
    @click="goBack"
    class="flex items-center space-x-2 text-gray-500 hover:text-primary-600 transition"
  >
    <Icon name="lucide:arrow-left" size="20" />
  </button>
</template>

<script setup>
function goBack() {
  history.back()
}
</script>
