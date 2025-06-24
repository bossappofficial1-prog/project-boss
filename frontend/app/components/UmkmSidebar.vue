<template>
  <aside
    class="fixed top-0 left-0 z-40 w-64 h-screen transition-transform bg-gray-900 text-white p-4 space-y-4"
    :class="{ '-translate-x-full': !show, 'translate-x-0': show }"
  >
    <h2 class="text-2xl font-bold">Dashboard</h2>
    <nav class="flex flex-col space-y-2">
      <ULink to="/dashboard" active-class="text-primary" class="p-2 rounded hover:bg-gray-800">Dashboard</ULink>
      <ULink to="/dashboard/users" class="p-2 rounded hover:bg-gray-800">Users</ULink>
      <ULink to="/dashboard/products" class="p-2 rounded hover:bg-gray-800">Products</ULink>
      <ColorModeButton />
    </nav>
  </aside>
</template>

<script setup>
defineProps({
  show: Boolean
})
</script>
