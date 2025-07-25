<template>
  <div>
    <AppHeader />

    <main class="min-h-screen">
      <slot />
    </main>

    <AppFooter />
    <AppCart />
  </div>
</template>

<script setup>
// Add Cart component to default layout
import AppCart from '@/components/app/Cart.vue'
</script>
