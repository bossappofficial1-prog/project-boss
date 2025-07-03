<template>
  <div class="flex items-center justify-between text-sm mt-4">
    <button @click="$emit('previous')" :disabled="currentPage === 1" class="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
    <span>Halaman {{ currentPage }} dari {{ totalPages }}</span>
    <button @click="$emit('next')" :disabled="currentPage === totalPages" class="px-3 py-1 border rounded disabled:opacity-50">Next</button>
  </div>
</template>

<script setup>
const props = defineProps({
  currentPage: Number,
  totalPages: Number,
});
</script>
