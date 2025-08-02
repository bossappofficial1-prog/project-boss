<script setup lang="ts">
defineProps({
  show: Boolean,
  collapsed: Boolean
})

const auth = useAuthStore()

const outletOptions = computed(() => auth.availableOutlets)
const selectedOutletId = ref(auth.selectedOutlet?.id || '')

watch(selectedOutletId, (newId) => {
  const outlet = outletOptions.value.find(o => o.id === newId)
  if (outlet) auth.setSelectedOutlet(outlet)
})

const menuItems = [
  { to: '/umkm', icon: 'lucide:layout-dashboard', label: 'Dashboard' },
  { to: '/umkm/products', icon: 'lucide:package', label: 'Produk & Layanan' },
  { to: '/umkm/stocks', icon: 'lucide:package-plus', label: 'Stok Produk' },
  { to: '/umkm/orders', icon: 'lucide:layout-list', label: 'Pesanan' },
  { to: '/umkm/queue', icon: 'lucide:list-ordered', label: 'Antrian' },
  { to: '/umkm/reports', icon: 'lucide:clipboard-list', label: 'Laporan' },
  { to: '/umkm/transaction', icon: 'lucide:circle-dollar-sign', label: 'Pengeluaran' },
  { to: '/umkm/expense', icon: 'lucide:history', label: 'Riwayat transaksi' },
  { to: '/umkm/withdrawal', icon: 'lucide:landmark', label: 'Penarikan Dana' },
]
</script>

<template>
  <aside
    class="fixed top-0 left-0 z-50 h-screen transition-all duration-300 bg-gradient-to-b from-primary-600 to-primary-800 text-white shadow-2xl md:translate-x-0"
    :class="{
      '-translate-x-full': !show,
      'translate-x-0': show,
      'w-64': !collapsed,
      'w-16': collapsed
    }">
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="p-6 border-b border-primary-500/30" :class="{ 'px-4': collapsed }">
        <div class="flex items-center space-x-3" :class="{ 'justify-center': collapsed }">
          <RouterLink to="/home">
            <div class="text-white rounded-lg flex items-center justify-center">
              <Icon v-if="collapsed" name="boss:logo-white" size="32" />
              <Icon v-else name="boss:logo-text-white" size="50" />
            </div>
          </RouterLink>
        </div>
      </div>

      <!-- Outlet Selector -->
      <div v-if="!collapsed" class="p-4 border-b border-primary-500/30">
        <label class="text-xs uppercase tracking-wide text-primary-200 mb-2 block font-medium">
          Pilih Outlet
        </label>
        <BaseSelect v-model="selectedOutletId" :options="outletOptions" placeholder="Pilih Outlet" value-key="id"
          label-key="name" class="bg-primary-700/50 border-primary-500" />
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto" :class="{ 'px-2': collapsed }">
        <template v-if="auth.selectedOutlet">
          <NuxtLink v-for="item in menuItems" :key="item.to" :to="item.to"
            class="flex items-center rounded-lg hover:bg-primary-500/30 transition-all duration-200 group relative"
            :class="{
              'gap-3 px-3 py-2.5': !collapsed,
              'justify-center px-2 py-3 overflow-x-hidden': collapsed
            }" active-class="bg-primary-500/50 shadow-lg">
            <Icon :name="item.icon" size="20" class="group-hover:scale-110 transition-transform flex-shrink-0" />
            <span v-if="!collapsed" class="font-medium">{{ item.label }}</span>

            <!-- Tooltip for collapsed state -->
            <div v-if="collapsed"
                class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              {{ item.label }}
            </div>
          </NuxtLink>
        </template>

        <div v-else class="text-center py-8">
          <Icon name="mdi:store-alert" :size="collapsed ? '32' : '48'" class="text-primary-300 mx-auto mb-3" />
          <p v-if="!collapsed" class="text-primary-200 text-sm">Pilih outlet untuk melanjutkan</p>
        </div>
      </nav>
    </div>
  </aside>
</template>