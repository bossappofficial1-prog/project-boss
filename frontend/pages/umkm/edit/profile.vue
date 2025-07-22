<template>
  <div class="">
    <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">Edit Profil</h2>
    
    <form @submit.prevent="onSubmit" class="space-y-6">
      <!-- Pratinjau dan Unggah Foto Profil -->
      <div class="flex flex-col items-center">
        <div class="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 mb-4">
          <NuxtImg
            v-if="previewUrl || form.avatar"
            :src="previewUrl || form.avatar"
            alt="Foto Profil"
            class="w-full h-full object-cover"
            :modifiers="{ roundCrop: true }"
            format="webp"
            quality="80"
          />
          <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center">
            <span class="text-gray-500 text-sm">Tidak ada foto</span>
          </div>
        </div>
        <input  
          id="profileImage"
          type="file"
          accept="image/*"
          @change="handleFileChange"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
        />
      </div>

      <!-- Form BaseInput -->
      <div>
        <label for="name" class="block font-medium text-gray-700">Nama Lengkap</label>
        <BaseInput
          id="name"
          v-model="form.name"
          type="text"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
        />
      </div>

      <div>
        <label for="email" class="block font-medium text-gray-700">Email</label>
        <BaseInput
          id="email"
          v-model="form.email"
          type="email"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
        />
      </div>

      <div>
        <label for="phone" class="block font-medium text-gray-700">Nomor HP</label>
        <BaseInput
          id="phone"
          v-model="form.phone"
          type="tel"
          placeholder="08xxxxxxxxxx"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
        />
      </div>

      <!-- Tombol Aksi -->
      <div class="flex justify-end space-x-4">
        <NuxtLink
          to="/umkm"
          class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
        >
          Batal
        </NuxtLink>
        <button
          type="submit"
          :disabled="loading"
          class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {{ loading ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

// State dari auth store
const auth = useAuthStore()
const router = useRouter()
const form = ref({
  name: auth.user?.name ?? '',
  email: auth.user?.email ?? '',
  phone: auth.user?.phone ?? '',
  avatar: auth.user?.avatar ?? ''
})
const previewUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const loading = ref(false)

// Menangani perubahan file gambar
const handleFileChange = (event: Event) => {
  const BaseInput = event.target as HTMLInputElement
  const file = BaseInput.files?.[0]
  if (file) {
    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar!')
      return
    }
    // Validasi ukuran file (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar! Maksimum 5MB.')
      return
    }
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

// Menangani submit form
async function onSubmit() {
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('name', form.value.name)
    formData.append('email', form.value.email)
    formData.append('phone', form.value.phone)
    if (selectedFile.value) {
      formData.append('profileImage', selectedFile.value)
    }
    
    await auth.updateProfile(form.value)
    router.push("/umkm")
    
  } catch (error) {
    console.error('Error:', error)
    alert('Gagal memperbarui profil.')
  } finally {
    loading.value = false
  }
}

// Reset form dan pratinjau
const reset = () => {
  form.value = {
    name: auth.user?.name ?? '',
    email: auth.user?.email ?? '',
    phone: auth.user?.phone ?? '',
    avatar: auth.user?.avatar ?? ''
  }
  previewUrl.value = null
  selectedFile.value = null
  const BaseInput = document.getElementById('profileImage') as HTMLInputElement
  if (BaseInput) BaseInput.value = ''
}

definePageMeta({
  layout: 'umkm'
})
</script>
