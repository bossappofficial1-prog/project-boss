<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-primary-500 text-white p-4">

    <!-- Logo -->
    <img
      src="~/assets/img/logo_white.png"
      alt="Logo"
      class="w-60 h-60 rounded-full object-cover"
    />

    <!-- Judul -->
    <h1 class="text-md font-bold mb-6 text-center">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Laudantium reprehenderit libero unde voluptatibus provident eveniet saepe quisquam repellat, ipsam eius incidunt rerum recusandae voluptate, eum vitae temporibus. Itaque, cumque vitae?
    </h1>

    <!-- Tombol -->
    <NuxtLink
      to="/home"
      class="mt-4 px-6 py-3 rounded bg-white text-primary-500 font-semibold text-lg hover:bg-gray-100 transition"
    >
      Mulai
    </NuxtLink>

  </div>
</template>

<script setup>
definePageMeta({
  layout: 'blank'
})
</script>
