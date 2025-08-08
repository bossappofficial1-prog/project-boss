<script setup lang="ts">
import type { Business, BusinessForm, FeeBearer } from '~/types'

definePageMeta({
  layout: 'umkm',
  middleware: ['auth', 'owner']
})

const auth = useAuthStore()
const route = useRoute()
const isLoading = ref(false)
const isSetupMode = ref(route.query.setup === 'true')
const activeTab = ref('profile')

const form = ref<BusinessForm>({
  name: '',
  description: '',
  bankName: '',
  bankAccount: '',
  accountHolder: '',
  defaultTransactionFeeBearer: 'CUSTOMER' as FeeBearer
})

const userForm = ref({
  name: auth.user?.name || '',
  email: auth.user?.email || '',
  phone: auth.user?.phone || ''
})

const errors = ref<Record<string, string>>({})

const feeOptions = [
  { value: 'CUSTOMER', label: 'Pelanggan menanggung biaya transaksi' },
  { value: 'OWNER', label: 'Saya yang menanggung biaya transaksi' }
]

const tabs = [
  { id: 'profile', label: 'Profil Pengguna', icon: 'lucide:user' },
  { id: 'business', label: 'Profil Bisnis', icon: 'lucide:building' },
  { id: 'security', label: 'Keamanan', icon: 'lucide:shield' }
]

// Load existing business data if available
onMounted(async () => {
  if (auth.user?.business && !isSetupMode.value) {
    const business = auth.user.business
    form.value = {
      name: business.name || '',
      description: business.description || '',
      bankName: business.bankName || '',
      bankAccount: business.bankAccount || '',
      accountHolder: business.accountHolder || '',
      defaultTransactionFeeBearer: business.defaultTransactionFeeBearer || 'CUSTOMER'
    }
  }
})

const validateForm = (): boolean => {
  errors.value = {}

  if (!form.value.name?.trim()) {
    errors.value.name = 'Nama bisnis harus diisi'
    return false
  }

  if (!form.value.bankName?.trim()) {
    errors.value.bankName = 'Nama bank harus diisi'
    return false
  }

  if (!form.value.bankAccount?.trim()) {
    errors.value.bankAccount = 'Nomor rekening harus diisi'
    return false
  }

  if (!form.value.accountHolder?.trim()) {
    errors.value.accountHolder = 'Nama pemilik rekening harus diisi'
    return false
  }

  return true
}

const submitForm = async () => {
  if (!validateForm()) return

  isLoading.value = true
  errors.value = {}

  try {
    const endpoint = auth.user?.business
      ? `/business/${auth.user.business.id}`
      : '/business'

    const method = auth.user?.business ? 'PATCH' : 'POST'

    const { data, error } = await useApi(endpoint, {
      method,
      body: form.value
    })

    if (error.value) {
      if (error.value.data?.message) {
        errors.value.submit = error.value.data.message
      } else {
        errors.value.submit = 'Terjadi kesalahan saat menyimpan data bisnis'
      }
      return
    }

    // Update auth store with new business data
    if (data.value?.data && auth.user) {
      auth.user.business = data.value.data as any
    }

    const toast = useToast()
    toast.add({
      title: 'Berhasil!',
      description: isSetupMode.value ? 'Profil bisnis berhasil dibuat' : 'Profil bisnis berhasil diperbarui'
    } as any)

    if (isSetupMode.value) {
      await navigateTo('/umkm/outlets/create?setup=true')
    } else {
      await navigateTo('/umkm')
    }
  } catch (e: any) {
    errors.value.submit = e.message || 'Terjadi kesalahan yang tidak terduga'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan Akun</h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Kelola profil dan pengaturan akun Anda
              </p>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span class="text-sm text-green-600 dark:text-green-400 font-medium">Aktif</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar Navigation -->
        <div class="lg:col-span-1">
          <nav class="space-y-2">
            <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
              'w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200',
              activeTab === tab.id
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-l-4 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            ]">
              <Icon :name="tab.icon" size="20" class="mr-3" />
              <span class="font-medium">{{ tab.label }}</span>
            </button>
          </nav>

          <!-- Profile Summary Card -->
          <BaseCard class="mt-6 p-4">
            <div class="text-center">
              <div
                class="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name="lucide:user" size="24" class="text-primary-600 dark:text-primary-400" />
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ auth.user?.name }}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ auth.user?.email }}</p>
              <div
                class="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300">
                <Icon name="lucide:check-circle" size="12" class="mr-1" />
                Terverifikasi
              </div>
            </div>
          </BaseCard>
        </div>

        <!-- Main Content -->
        <div class="lg:col-span-3">
          <!-- Profile Tab -->
          <div v-if="activeTab === 'profile'" class="space-y-6">
            <BaseCard class="p-6">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Profil Pengguna</h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Informasi pribadi Anda</p>
                </div>
                <BaseButton variant="outline" size="sm">
                  <Icon name="lucide:edit" size="16" class="mr-2" />
                  Edit Profil
                </BaseButton>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Lengkap
                  </label>
                  <BaseInput v-model="userForm.name" placeholder="Masukkan nama lengkap" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <BaseInput v-model="userForm.email" type="email" placeholder="Masukkan email" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nomor Telepon
                  </label>
                  <BaseInput v-model="userForm.phone" placeholder="Masukkan nomor telepon" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status Verifikasi
                  </label>
                  <div class="flex items-center space-x-2">
                    <Icon name="lucide:check-circle" size="16" class="text-green-500" />
                    <span class="text-sm text-green-600 dark:text-green-400">Email Terverifikasi</span>
                  </div>
                </div>
              </div>
            </BaseCard>
          </div>

          <!-- Business Tab -->
          <div v-if="activeTab === 'business'" class="space-y-6">
            <BaseCard class="p-6">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Profil Bisnis</h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Informasi tentang bisnis Anda</p>
                </div>
                <BaseButton variant="outline" size="sm">
                  <Icon name="lucide:edit" size="16" class="mr-2" />
                  Edit Bisnis
                </BaseButton>
              </div>

              <form @submit.prevent="submitForm" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nama Bisnis *
                    </label>
                    <BaseInput v-model="form.name" placeholder="Masukkan nama bisnis" :error="errors.name" />
                  </div>

                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Deskripsi Bisnis
                    </label>
                    <textarea v-model="form.description" rows="4"
                      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-colors"
                      placeholder="Ceritakan tentang bisnis Anda..."></textarea>
                  </div>
                </div>

                <!-- Bank Information -->
                <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 class="text-md font-semibold text-gray-900 dark:text-white mb-4">
                    Informasi Bank
                  </h3>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nama Bank *
                      </label>
                      <BaseInput v-model="form.bankName" placeholder="Contoh: Bank BNI" :error="errors.bankName" />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nomor Rekening *
                      </label>
                      <BaseInput v-model="form.bankAccount" placeholder="Masukkan nomor rekening"
                        :error="errors.bankAccount" />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nama Pemilik Rekening *
                      </label>
                      <BaseInput v-model="form.accountHolder" placeholder="Sesuai dengan KTP"
                        :error="errors.accountHolder" />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Penanggung Biaya Transaksi
                      </label>
                      <BaseSelect v-model="form.defaultTransactionFeeBearer" :options="feeOptions" />
                    </div>
                  </div>
                </div>

                <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <BaseButton variant="outline" type="button">
                    Batal
                  </BaseButton>
                  <BaseButton type="submit" :loading="isLoading">
                    {{ isSetupMode ? 'Buat Profil Bisnis' : 'Simpan Perubahan' }}
                  </BaseButton>
                </div>
              </form>
            </BaseCard>
          </div>

          <!-- Security Tab -->
          <div v-if="activeTab === 'security'" class="space-y-6">
            <BaseCard class="p-6">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Keamanan Akun</h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Kelola password dan keamanan akun</p>
                </div>
              </div>

              <div class="space-y-6">
                <div
                  class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div class="flex items-start">
                    <Icon name="lucide:shield-alert" size="20"
                      class="text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
                    <div>
                      <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Keamanan Akun
                      </h3>
                      <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Pastikan akun Anda aman dengan menggunakan password yang kuat dan aktifkan autentikasi dua
                        faktor.
                      </p>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 gap-4">
                  <div
                    class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div class="flex items-center">
                      <Icon name="lucide:key" size="20" class="text-gray-400 mr-3" />
                      <div>
                        <h4 class="text-sm font-medium text-gray-900 dark:text-white">Password</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Terakhir diubah 30 hari yang lalu</p>
                      </div>
                    </div>
                    <BaseButton variant="outline" size="sm">
                      Ubah Password
                    </BaseButton>
                  </div>

                  <div
                    class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div class="flex items-center">
                      <Icon name="lucide:smartphone" size="20" class="text-gray-400 mr-3" />
                      <div>
                        <h4 class="text-sm font-medium text-gray-900 dark:text-white">Autentikasi Dua Faktor</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Belum diaktifkan</p>
                      </div>
                    </div>
                    <BaseButton variant="outline" size="sm">
                      Aktifkan
                    </BaseButton>
                  </div>

                  <div
                    class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div class="flex items-center">
                      <Icon name="lucide:monitor" size="20" class="text-gray-400 mr-3" />
                      <div>
                        <h4 class="text-sm font-medium text-gray-900 dark:text-white">Perangkat Login</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Kelola perangkat yang terhubung</p>
                      </div>
                    </div>
                    <BaseButton variant="outline" size="sm">
                      Kelola
                    </BaseButton>
                  </div>
                </div>
              </div>
            </BaseCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
