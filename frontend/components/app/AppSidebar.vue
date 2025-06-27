<script setup>
import { useAuthStore } from '@/stores/useAuthStore'

defineProps({
    show: Boolean
})

const auth = useAuthStore()

const outletOptions = computed(() => auth.outletOptions)
const selectedOutletId = ref(auth.outletFokus?.id || '')

watch(selectedOutletId, (newId) => {
  const outlet = outletOptions.value.find(o => o.id === newId)
  if (outlet) auth.setOutletFokus(outlet)
})

const menuItems = [
    { to: '/umkm', icon: 'mdi:view-dashboard', label: 'Dashboard' },
    { to: '/umkm/products', icon: 'mdi:package-variant', label: 'Produk & Layanan' },
    { to: '/umkm/orders', icon: 'mdi:clipboard-list', label: 'Pesanan' },
    { to: '/umkm/queue', icon: 'mdi:account-group', label: 'Antrian' },
    { to: '/umkm/reports', icon: 'mdi:chart-line', label: 'Laporan' },
    { to: '/umkm/settings', icon: 'mdi:cog', label: 'Pengaturan' }
]
</script>

<template>
    <aside
        class="fixed top-0 left-0 z-50 w-64 h-screen transition-transform duration-300 bg-gradient-to-b from-primary-600 to-primary-800 text-white shadow-2xl md:translate-x-0"
        :class="{ 
            '-translate-x-full': !show, 
            'translate-x-0': show 
        }"
    >
        <div class="flex flex-col h-full">
            <!-- Header -->
            <div class="p-6 border-b border-primary-500/30">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Icon name="mdi:bag-personal" size="24" />
                    </div>
                    <div>
                        <h2 class="text-xl font-bold">BOSS</h2>
                        <p class="text-primary-200 text-sm">UMKM Dashboard</p>
                    </div>
                </div>
            </div>

            <!-- Outlet Selector -->
            <div class="p-4 border-b border-primary-500/30">
                <label class="text-xs uppercase tracking-wide text-primary-200 mb-2 block font-medium">
                    Pilih Outlet
                </label>
                <BaseSelect
                    v-model="selectedOutletId"
                    :options="outletOptions"
                    placeholder="Pilih Outlet"
                    value-key="id"
                    label-key="name"
                    class="bg-primary-700/50 border-primary-500"
                />
            </div>

            <!-- Navigation Menu -->
            <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
                <template v-if="auth.outletFokus">
                    <NuxtLink
                        v-for="item in menuItems"
                        :key="item.to"
                        :to="item.to"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-500/30 transition-all duration-200 group"
                        active-class="bg-primary-500/50 shadow-lg"
                    >
                        <Icon :name="item.icon" size="20" class="group-hover:scale-110 transition-transform" />
                        <span class="font-medium">{{ item.label }}</span>
                    </NuxtLink>
                </template>
                
                <div v-else class="text-center py-8">
                    <Icon name="mdi:store-alert" size="48" class="text-primary-300 mx-auto mb-3" />
                    <p class="text-primary-200 text-sm">Pilih outlet untuk melanjutkan</p>
                </div>
            </nav>

            <!-- Bottom Section -->
            <div class="p-4 border-t border-primary-500/30 space-y-3">
                <!-- User Info -->
                <div class="flex items-center space-x-3 p-3 bg-primary-700/30 rounded-lg">
                    <div class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                        <span class="text-sm font-bold">
                            {{ auth.user?.name?.charAt(0).toUpperCase() }}
                        </span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium truncate">{{ auth.user?.name }}</p>
                        <p class="text-xs text-primary-200 truncate">{{ auth.user?.email }}</p>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex space-x-2">
                    <BaseColorMode />
                    <BaseLogoutButton />
                </div>
            </div>
        </div>
    </aside>
</template>
