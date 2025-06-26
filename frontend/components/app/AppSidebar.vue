<script setup>
import { useAuthStore } from '@/stores/useAuthStore'
import { ref } from 'vue'

defineProps({
    show: Boolean
})

const auth = useAuthStore()

const outletOptions = [
    { id: '1', name: 'Outlet A' },
    { id: '2', name: 'Outlet B' },
    { id: '3', name: 'Outlet C' }
]

const setOutlet = (outlet) => {
    auth.setOutletFokus(outlet)
}

const handleLogout = () => {
    auth.clearSession()
    navigateTo('/home')
}
</script>

<template>
    <aside
        class="fixed top-0 left-0 z-40 w-64 h-screen transition-transform bg-primary-700 dark:bg-neutral-900 text-white p-4 space-y-4 flex flex-col justify-between"
        :class="{ '-translate-x-full': !show, 'translate-x-0': show }">
        <!-- Header -->
        <div>
            <h2 class="text-2xl font-bold mb-6">BOSS UMKM</h2>

            <!-- Dropdown Outlet -->
            <div class="mb-6">
                <label class="text-xs uppercase tracking-wide text-gray-200 mb-1 block">Pilih Outlet</label>
                <select v-model="auth.outletFokus" @change="setOutlet(auth.outletFokus)"
                    class="w-full p-2 rounded bg-primary-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-300">
                    <option :value="null" disabled>Pilih Outlet</option>
                    <option v-for="outlet in outletOptions" :key="outlet.id" :value="outlet">
                        {{ outlet.name }}
                    </option>
                </select>
            </div>

            <!-- Active Menu -->
            <nav v-if="auth.outletFokus" class="flex flex-col space-y-1">
                <NuxtLink to="/umkm" class="flex items-center gap-2 p-2 rounded hover:bg-primary-600 transition">
                    <Icon name="mdi:view-dashboard" />
                    Beranda
                </NuxtLink>

                <NuxtLink to="/umkm/layanan"
                    class="flex items-center gap-2 p-2 rounded hover:bg-primary-600 transition">
                    <Icon name="mdi:package-variant" />
                    Layanan
                </NuxtLink>

                <NuxtLink to="/umkm/laporan"
                    class="flex items-center gap-2 p-2 rounded hover:bg-primary-600 transition">
                    <Icon name="mdi:file-document-outline" />
                    Laporan
                </NuxtLink>

                <NuxtLink to="/umkm/kasir" class="flex items-center gap-2 p-2 rounded hover:bg-primary-600 transition">
                    <Icon name="mdi:cart" />
                    Kasir
                </NuxtLink>
            </nav>
        </div>

        <!-- Bottom Section -->
        <div class="space-y-2">
            <BaseColorMode />
            <button @click="handleLogout"
                class="flex items-center gap-2 p-2 rounded hover:bg-primary-600 w-full transition">
                <Icon name="mdi:logout" />
                Keluar
            </button>
        </div>
    </aside>
</template>
