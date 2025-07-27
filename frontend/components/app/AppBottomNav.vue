<template>
    <nav class="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg flex justify-around items-center h-16 md:hidden"
        aria-label="Navigasi utama aplikasi">
        <NuxtLink to="/outlets" class="flex flex-col items-center justify-center text-xs group"
            :class="{ 'text-primary-600': isActive('/outlets') }" aria-label="Outlet">
            <i class="fas fa-store text-lg mb-1" />
            <span>Outlet</span>
        </NuxtLink>
        <NuxtLink to="/cart" class="flex flex-col items-center justify-center text-xs group"
            :class="{ 'text-primary-600': isActive('/cart') }" aria-label="Keranjang">
            <i class="fas fa-shopping-cart text-lg mb-1" />
            <span>Keranjang</span>
        </NuxtLink>
        <NuxtLink to="/orders" class="flex flex-col items-center justify-center text-xs group"
            :class="{ 'text-primary-600': isActive('/orders') }" aria-label="Pesanan">
            <i class="fas fa-receipt text-lg mb-1" />
            <span>Pesanan</span>
        </NuxtLink>
        <NuxtLink to="/profile" class="flex flex-col items-center justify-center text-xs group"
            :class="{ 'text-primary-600': isActive('/profile') }" aria-label="Akun">
            <i class="fas fa-user text-lg mb-1" />
            <span>Akun</span>
        </NuxtLink>
    </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
function isActive(path) {
    return route.path.startsWith(path)
}
</script>

<style scoped>
nav {
    box-shadow: 0 -2px 12px 0 rgba(0, 0, 0, 0.04);
}

.group.text-primary-600 i {
    color: #4f46e5;
}
</style>
