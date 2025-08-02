<template>
  <div class="space-y-6">
    <!-- User Profile Section -->
    <BaseCard>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          Profil Pengguna
        </h2>
        <NuxtLink to="/umkm/edit/profile">
          <BaseButton size="sm" variant="outline">
            <Icon name="mdi:pencil" size="16" class="mr-2" />
            Edit Profil
          </BaseButton>
        </NuxtLink>
      </div>
      
      <div class="flex items-center space-x-6">
        <div class="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
          <img 
            v-if="auth.user?.avatar" 
            :src="auth.user.avatar" 
            :alt="auth.user.name"
            class="w-full h-full rounded-full object-cover"
          />
          <Icon v-else name="mdi:account" size="40" class="text-primary-600 dark:text-primary-400" />
        </div>
        
        <div class="flex-1">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Nama Lengkap</label>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ auth.user?.name || 'Belum diatur' }}
              </p>
            </div>
            
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
              <p class="text-lg text-gray-900 dark:text-gray-100">
                {{ auth.user?.email || 'Belum diatur' }}
              </p>
            </div>
            
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Nomor Telepon</label>
              <p class="text-lg text-gray-900 dark:text-gray-100">
                {{ auth.user?.phone || 'Belum diatur' }}
              </p>
            </div>
            
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Status Verifikasi</label>
              <div class="flex items-center space-x-2">
                <div :class="[
                  'w-3 h-3 rounded-full',
                  auth.user?.isVerified ? 'bg-green-500' : 'bg-red-500'
                ]"></div>
                <span :class="[
                  'text-sm font-medium',
                  auth.user?.isVerified ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                ]">
                  {{ auth.user?.isVerified ? 'Terverifikasi' : 'Belum Terverifikasi' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>

    <BaseCard v-if="auth.business">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          Profil Bisnis
        </h2>
        <NuxtLink to="/umkm/account">
          <BaseButton size="sm" variant="outline">
          <Icon name="mdi:pencil" size="16" class="mr-2" />
          Edit Bisnis
        </BaseButton>
        </NuxtLink>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ auth.business.name }}
          </p>
          <p class="text-md text-gray-900 dark:text-gray-100">
            {{ auth.business.description || 'Belum ada deskripsi' }}
          </p>
        </div>
        
        <div class="md:col-span-2">
        </div>
        
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Nama Bank</label>
          <p class="text-lg text-gray-900 dark:text-gray-100">
            {{ auth.business.bankName || 'Belum diatur' }}
          </p>
        </div>
        
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Nomor Rekening</label>
          <p class="text-lg text-gray-900 dark:text-gray-100">
            {{ auth.business.bankAccount || 'Belum diatur' }}
          </p>
        </div>
        
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Nama Pemilik Rekening</label>
          <p class="text-lg text-gray-900 dark:text-gray-100">
            {{ auth.business.accountHolder || 'Belum diatur' }}
          </p>
        </div>
        
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Penanggung Biaya Transaksi</label>
          <p class="text-lg text-gray-900 dark:text-gray-100">
            {{ auth.business.defaultTransactionFeeBearer || 'Belum diatur' }}
          </p>
        </div>
      </div>
    </BaseCard>

    <BaseCard>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          Daftar Outlet
        </h2>
        <NuxtLink to="/umkm/outlets/create">
          <BaseButton>
          <Icon name="mdi:plus" size="16" class="mr-2" />
          Tambah Outlet
        </BaseButton>
        </NuxtLink>
      </div>
      
      <div v-if="outlets.length === 0" class="text-center py-12">
        <Icon name="mdi:store-outline" size="64" class="text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Belum ada outlet
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          Tambahkan outlet pertama Anda untuk mulai mengelola bisnis
        </p>
        <NuxtLink to="/umkm/outlets/create">
          <BaseButton>
          <Icon name="mdi:plus" size="16" class="mr-2" />
          Tambah Outlet
        </BaseButton>
        </NuxtLink>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BaseCard
          v-for="outlet in outlets"
          :key="outlet.id"
          hover
          clickable
          padding="none"
          class="overflow-hidden group"
          @click="setOutlet(outlet)"
        >
          <NuxtImg 
            v-if="outlet.image" 
            :src="outlet.image" 
            :alt="outlet.name"
            class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
          />
          <div v-else
            class="w-full h-48 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500">
            <Icon name="mdi:store-outline" size="32" class="mr-2" />
            <span class="text-sm">{{ outlet.name }}</span>
          </div>
          
          <div class="p-4">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                {{ outlet.name }}
              </h3>
              <div v-if="auth.selectedOutlet?.id === outlet.id" 
                class="flex items-center space-x-1 text-green-600 dark:text-green-400">
                <Icon name="mdi:check-circle" size="16" />
                <span class="text-xs font-medium">Terpilih</span>
              </div>
            </div>
            
            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div class="flex items-center">
                <Icon name="mdi:map-marker" size="16" class="mr-2" />
                <span>{{ outlet.address || 'Alamat belum diatur' }}</span>
              </div>
              
              <div class="flex items-center">
                <Icon name="mdi:phone" size="16" class="mr-2" />
                <span>{{ outlet.phone || 'Telepon belum diatur' }}</span>
              </div>
            </div>
            
            <div class="flex items-center justify-between mt-4">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                ID: {{ outlet.id }}
              </span>
              <NuxtLink :to="`/umkm/outlets/${outlet.id}/edit`">
                <BaseButton size="sm" variant="outline" class="mr-2">
                  Edit
                </BaseButton>
              </NuxtLink>
              <BaseButton size="sm" variant="outline" :disabled="auth.selectedOutlet?.id === outlet.id">
                {{ auth.selectedOutlet?.id === outlet.id ? 'Terpilih' : 'Pilih' }}
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>
    </BaseCard>

    <!-- Dashboard Section -->
    <BaseCard v-if="auth.selectedOutlet">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Dashboard - {{ auth.selectedOutlet.name }}
      </h3>
      <UmkmDashboard />
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import type { Outlet } from '~/types'

definePageMeta({
  layout: 'umkm',
  middleware: ["auth", 'owner', 'business-required']
})

const auth = useAuthStore()

const belumSelesai = ()=>{
  alert("On Progress")
}

const outlets = computed(() => auth.availableOutlets)

const setOutlet = (outlet: Outlet) => {
  auth.setSelectedOutlet(outlet)
}
</script>
