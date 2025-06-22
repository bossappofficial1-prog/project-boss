<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-primary text-white p-4">
    <!-- Logo -->
    <NuxtImg
      src="/images/logo_white.png"
      width="240"
      height="240"
      alt="Logo"
      class="rounded-full"
    />

    <!-- Judul -->
    <h1 class="text-md font-bold mb-6 text-center">Lorem ipsum dolor sit amet consectetur adipisicing elit. Laudantium reprehenderit libero unde voluptatibus provident eveniet saepe quisquam repellat, ipsam eius incidunt rerum recusandae voluptate, eum vitae temporibus. Itaque, cumque vitae?</h1>

    <UButton
      to="/home"
      color="white"
      variant="solid"
      size="lg"
      label="Mulai"
      class="text-primary font-semibold"
    />
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'blank'
})
</script>