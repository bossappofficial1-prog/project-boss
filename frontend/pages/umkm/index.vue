<template>
  <div class="space-y-6">
    <!-- User Profile Section -->
    <BaseCard>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          Profil Pengguna
        </h2>
        <BaseButton size="sm" variant="outline" @click="showEditProfileModal = true">
          <Icon name="mdi:pencil" size="16" class="mr-2" />
          Edit Profil
        </BaseButton>
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

    <!-- Business Profile Section -->
    <BaseCard v-if="auth.user?.businesses">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          Profil Bisnis
        </h2>
        <BaseButton size="sm" variant="outline" @click="showEditBusinessModal = true">
          <Icon name="mdi:pencil" size="16" class="mr-2" />
          Edit Bisnis
        </BaseButton>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Nama Bisnis</label>
          <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{ auth.user.businesses.name }}
          </p>
        </div>
        
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">ID Bisnis</label>
          <p class="text-lg text-gray-900 dark:text-gray-100">
            {{ auth.user.businesses.id }}
          </p>
        </div>
        
        <div class="md:col-span-2">
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Deskripsi</label>
          <p class="text-lg text-gray-900 dark:text-gray-100">
            {{ auth.user.businesses.description || 'Belum ada deskripsi' }}
          </p>
        </div>
        
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Nama Bank</label>
          <p class="text-lg text-gray-900 dark:text-gray-100">
            {{ auth.user.businesses.bankName || 'Belum diatur' }}
          </p>
        </div>
        
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Nomor Rekening</label>
          <p class="text-lg text-gray-900 dark:text-gray-100">
            {{ auth.user.businesses.bankAccount || 'Belum diatur' }}
          </p>
        </div>
        
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Nama Pemilik Rekening</label>
          <p class="text-lg text-gray-900 dark:text-gray-100">
            {{ auth.user.businesses.accountHolder || 'Belum diatur' }}
          </p>
        </div>
        
        <div>
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Penanggung Biaya Transaksi</label>
          <p class="text-lg text-gray-900 dark:text-gray-100">
            {{ auth.user.businesses.defaultTransactionFeeBearer || 'Belum diatur' }}
          </p>
        </div>
      </div>
    </BaseCard>

    <!-- Outlets Section -->
    <BaseCard>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          Daftar Outlet
        </h2>
        <BaseButton @click="showAddOutletModal = true">
          <Icon name="mdi:plus" size="16" class="mr-2" />
          Tambah Outlet
        </BaseButton>
      </div>
      
      <div v-if="outlets.length === 0" class="text-center py-12">
        <Icon name="mdi:store-outline" size="64" class="text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Belum ada outlet
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          Tambahkan outlet pertama Anda untuk mulai mengelola bisnis
        </p>
        <BaseButton @click="showAddOutletModal = true">
          <Icon name="mdi:plus" size="16" class="mr-2" />
          Tambah Outlet
        </BaseButton>
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
              <BaseButton size="sm" variant="outline">
                {{ auth.selectedOutlet?.id === outlet.id ? 'Terpilih' : 'Pilih' }}
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>
    </BaseCard>

    <!-- Quick Actions -->
    <BaseCard v-if="auth.selectedOutlet">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Aksi Cepat - {{ auth.selectedOutlet.name }}
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NuxtLink 
          to="/umkm/products"
          class="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 transition-colors group"
        >
          <Icon name="mdi:package-variant" size="24" class="text-gray-400 group-hover:text-primary-500 mb-2" />
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-500">
            Kelola Produk
          </span>
        </NuxtLink>

        <NuxtLink 
          to="/umkm/orders"
          class="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 transition-colors group"
        >
          <Icon name="mdi:clipboard-list" size="24" class="text-gray-400 group-hover:text-primary-500 mb-2" />
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-500">
            Kelola Pesanan
          </span>
        </NuxtLink>

        <NuxtLink 
          to="/umkm/queue"
          class="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 transition-colors group"
        >
          <Icon name="mdi:account-group" size="24" class="text-gray-400 group-hover:text-primary-500 mb-2" />
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-500">
            Kelola Antrian
          </span>
        </NuxtLink>

        <NuxtLink 
          to="/umkm/reports"
          class="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 transition-colors group"
        >
          <Icon name="mdi:chart-line" size="24" class="text-gray-400 group-hover:text-primary-500 mb-2" />
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary-500">
            Lihat Laporan
          </span>
        </NuxtLink>
      </div>
    </BaseCard>

    <!-- Edit Profile Modal -->
    <div v-if="showEditProfileModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <BaseCard class="w-full max-w-md">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
            Edit Profil
          </h2>
          <button 
            @click="showEditProfileModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <Icon name="mdi:close" size="24" />
          </button>
        </div>

        <form @submit.prevent="updateProfile" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nama Lengkap
            </label>
            <input
              v-model="profileForm.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              v-model="profileForm.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nomor Telepon
            </label>
            <input
              v-model="profileForm.phone"
              type="tel"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <BaseButton
              type="button"
              variant="outline"
              @click="showEditProfileModal = false"
            >
              Batal
            </BaseButton>
            <BaseButton
              type="submit"
              :disabled="isUpdatingProfile"
            >
              <Icon v-if="isUpdatingProfile" name="mdi:loading" size="16" class="animate-spin mr-2" />
              {{ isUpdatingProfile ? 'Menyimpan...' : 'Simpan' }}
            </BaseButton>
          </div>
        </form>
      </BaseCard>
    </div>

    <!-- Edit Business Modal -->
    <div v-if="showEditBusinessModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <BaseCard class="w-full max-w-2xl">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
            Edit Bisnis
          </h2>
          <button 
            @click="showEditBusinessModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <Icon name="mdi:close" size="24" />
          </button>
        </div>

        <form @submit.prevent="updateBusiness" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nama Bisnis
            </label>
            <input
              v-model="businessForm.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deskripsi
            </label>
            <textarea
              v-model="businessForm.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Bank
              </label>
              <input
                v-model="businessForm.bankName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nomor Rekening
              </label>
              <input
                v-model="businessForm.bankAccount"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nama Pemilik Rekening
            </label>
            <input
              v-model="businessForm.accountHolder"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <BaseButton
              type="button"
              variant="outline"
              @click="showEditBusinessModal = false"
            >
              Batal
            </BaseButton>
            <BaseButton
              type="submit"
              :disabled="isUpdatingBusiness"
            >
              <Icon v-if="isUpdatingBusiness" name="mdi:loading" size="16" class="animate-spin mr-2" />
              {{ isUpdatingBusiness ? 'Menyimpan...' : 'Simpan' }}
            </BaseButton>
          </div>
        </form>
      </BaseCard>
    </div>

    <!-- Add Outlet Modal -->
    <div v-if="showAddOutletModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <BaseCard class="w-full max-w-md">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
            Tambah Outlet Baru
          </h2>
          <button 
            @click="showAddOutletModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <Icon name="mdi:close" size="24" />
          </button>
        </div>

        <form @submit.prevent="createOutlet" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nama Outlet
            </label>
            <input
              v-model="outletForm.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Masukkan nama outlet"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Alamat
            </label>
            <textarea
              v-model="outletForm.address"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Masukkan alamat outlet"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nomor Telepon
            </label>
            <input
              v-model="outletForm.phone"
              type="tel"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Masukkan nomor telepon"
            />
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <BaseButton
              type="button"
              variant="outline"
              @click="showAddOutletModal = false"
            >
              Batal
            </BaseButton>
            <BaseButton
              type="submit"
              :disabled="isCreatingOutlet"
            >
              <Icon v-if="isCreatingOutlet" name="mdi:loading" size="16" class="animate-spin mr-2" />
              {{ isCreatingOutlet ? 'Menyimpan...' : 'Simpan' }}
            </BaseButton>
          </div>
        </form>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import type { Outlet } from '~/types'

definePageMeta({
  layout: 'umkm'
})

const auth = useAuthStore()
const showEditProfileModal = ref(false)
const showEditBusinessModal = ref(false)
const showAddOutletModal = ref(false)
const isUpdatingProfile = ref(false)
const isUpdatingBusiness = ref(false)
const isCreatingOutlet = ref(false)

const profileForm = reactive({
  name: auth.user?.name || '',
  email: auth.user?.email || '',
  phone: auth.user?.phone || ''
})

const businessForm = reactive({
  name: auth.user?.businesses?.name || '',
  description: auth.user?.businesses?.description || '',
  bankName: auth.user?.businesses?.bankName || '',
  bankAccount: auth.user?.businesses?.bankAccount || '',
  accountHolder: auth.user?.businesses?.accountHolder || ''
})

const outletForm = reactive({
  name: '',
  address: '',
  phone: ''
})

const outlets = computed(() => auth.availableOutlets)

const setOutlet = (outlet: Outlet) => {
  auth.setSelectedOutlet(outlet)
}

const updateProfile = async () => {
  if (!profileForm.name.trim() || !profileForm.email.trim()) return

  isUpdatingProfile.value = true
  
  try {
    await auth.updateProfile({
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone || undefined
    })
    
    showEditProfileModal.value = false
    
    // Show success message
    console.log('Profile updated successfully')
    
  } catch (error) {
    console.error('Failed to update profile:', error)
  } finally {
    isUpdatingProfile.value = false
  }
}

const updateBusiness = async () => {
  if (!businessForm.name.trim()) return

  isUpdatingBusiness.value = true
  
  try {
    await $fetch('/api/business/profile', {
      method: 'PUT',
      body: {
        name: businessForm.name,
        description: businessForm.description || null,
        bankName: businessForm.bankName || null,
        bankAccount: businessForm.bankAccount || null,
        accountHolder: businessForm.accountHolder || null
      },
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    })
    
    // Update local state
    if (auth.user?.businesses) {
      auth.user.businesses.name = businessForm.name
      auth.user.businesses.description = businessForm.description || undefined
      auth.user.businesses.bankName = businessForm.bankName || undefined
      auth.user.businesses.bankAccount = businessForm.bankAccount || undefined
      auth.user.businesses.accountHolder = businessForm.accountHolder || undefined
    }
    
    showEditBusinessModal.value = false
    
    // Show success message
    console.log('Business updated successfully')
    
  } catch (error) {
    console.error('Failed to update business:', error)
  } finally {
    isUpdatingBusiness.value = false
  }
}

const createOutlet = async () => {
  if (!outletForm.name.trim()) return

  isCreatingOutlet.value = true
  
  try {
    const response = await $fetch<Outlet>('/api/outlets', {
      method: 'POST',
      body: {
        name: outletForm.name,
        address: outletForm.address || null,
        phone: outletForm.phone || null,
        businessId: auth.user?.businesses?.id
      },
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    })

    // Add new outlet to local state
    auth.availableOutlets.push(response)
    
    // Reset form
    outletForm.name = ''
    outletForm.address = ''
    outletForm.phone = ''
    
    showAddOutletModal.value = false
    
    // Show success message
    console.log('Outlet created successfully:', response)
    
  } catch (error) {
    console.error('Failed to create outlet:', error)
  } finally {
    isCreatingOutlet.value = false
  }
}

// Watch for changes in user data to update forms
watch(() => auth.user, (newUser) => {
  if (newUser) {
    profileForm.name = newUser.name || ''
    profileForm.email = newUser.email || ''
    profileForm.phone = newUser.phone || ''
    
    if (newUser.businesses) {
      businessForm.name = newUser.businesses.name || ''
      businessForm.description = newUser.businesses.description || ''
      businessForm.bankName = newUser.businesses.bankName || ''
      businessForm.bankAccount = newUser.businesses.bankAccount || ''
      businessForm.accountHolder = newUser.businesses.accountHolder || ''
    }
  }
}, { immediate: true })

// Initialize outlets on mount
onMounted(() => {
  if (auth.isOwner) {
    auth.fetchOutlets()
  }
})
</script>