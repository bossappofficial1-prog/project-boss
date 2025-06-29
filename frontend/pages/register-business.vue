<script setup>
const name = ref('')
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const validationErrors = ref({})

// Business form data
const businessName = ref('')
const businessDescription = ref('')
const outletName = ref('')
const outletAddress = ref('')
const outletPhone = ref('')

const router = useRouter()

const isFormValid = computed(() => {
  return name.value && 
         email.value && 
         password.value && 
         password.value.length >= 8 &&
         businessName.value && 
         outletName.value && 
         outletAddress.value
})

// Function to parse validation errors
function parseValidationErrors(errors) {
  const errorMap = {}
  
  errors.forEach(error => {
    const fieldPath = error.path
    if (!errorMap[fieldPath]) {
      errorMap[fieldPath] = []
    }
    errorMap[fieldPath].push(error.msg)
  })
  
  return errorMap
}

// Function to get error message for a field
function getFieldError(fieldPath) {
  const errors = validationErrors.value[fieldPath]
  return errors && errors.length > 0 ? errors[0] : null
}

// Clear validation errors
function clearValidationErrors() {
  validationErrors.value = {}
  errorMessage.value = ''
}

// Get field display name for error messages
function getFieldDisplayName(fieldPath) {
  const fieldNames = {
    'name': 'Nama',
    'email': 'Email',
    'password': 'Password',
    'business.name': 'Nama Bisnis',
    'business.description': 'Deskripsi Bisnis',
    'outlets': 'Data Outlet',
    'outlets[0].name': 'Nama Outlet',
    'outlets[0].address': 'Alamat Outlet',
    'outlets[0].phone': 'Telepon Outlet'
  }
  return fieldNames[fieldPath] || fieldPath
}

async function handleRegister() {
  if (!isFormValid.value) return

  isLoading.value = true
  clearValidationErrors()
  
  try {
    // Register business account dengan form data
    const formData = new FormData()
    formData.append('name', name.value)
    formData.append('email', email.value)
    formData.append('password', password.value)
    formData.append('business[name]', businessName.value)
    
    if (businessDescription.value) {
      formData.append('business[description]', businessDescription.value)
    }
    
    formData.append('outlets[0][name]', outletName.value)
    formData.append('outlets[0][address]', outletAddress.value)
    
    if (outletPhone.value) {
      formData.append('outlets[0][phone]', outletPhone.value)
    }

    const { data, error } = await useApiFetch('/auth/register-business', {
      method: 'POST',
      body: formData
    })

    if (error.value) {
      // Handle validation errors
      if (error.value?.data?.errors && Array.isArray(error.value.data.errors)) {
        validationErrors.value = parseValidationErrors(error.value.data.errors)
        errorMessage.value = error.value.data.message || 'Terdapat kesalahan validasi'
      } else {
        errorMessage.value = error.value?.data?.message || 'Gagal mendaftar akun bisnis'
      }
      return
    }

    // Success - redirect to login
    router.replace('/login')
  } catch (error) {
    console.error('Register failed:', error)
    errorMessage.value = error.message || 'Terjadi kesalahan saat mendaftar'
  } finally {
    isLoading.value = false
  }
}

function switchToCustomerRegister() {
  router.replace('/register')
}

definePageMeta({
  layout: 'blank'
})

const bank = [
  'BNI',
  'BRI',
  'BCA',
  'Mandiri',
  'Nagari',
]
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Main Container -->
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <!-- Header Section -->
        <div class="text-center mb-8">
          <div class="flex items-center justify-center mb-6">
            <Icon name="boss:logo-blue-text" class="w-48 h-24 text-primary-600" />
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Daftar Akun Bisnis
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Bangun dan kelola bisnis UMKM Anda dengan mudah
          </p>
        </div>

        <!-- Account Type Switch -->
        <div class="mb-8 p-4 bg-gradient-to-r from-primary-50 to-primary-50 dark:from-primary-900/20 dark:to-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="p-2 bg-primary-100 dark:bg-primary-800 rounded-lg">
                <Icon name="mdi:store" size="20" class="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">Akun Bisnis</p>
                <p class="text-xs text-gray-600 dark:text-gray-400">Untuk pemilik usaha/toko</p>
              </div>
            </div>
            <button
              type="button"
              @click="switchToCustomerRegister"
              class="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-500 font-medium px-3 py-1.5 rounded-lg hover:bg-white/50 transition-colors"
            >
              <Icon name="mdi:account" size="16" />
              <span>Customer</span>
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400 font-medium mb-2">{{ errorMessage }}</p>
          <ul v-if="Object.keys(validationErrors).length > 0" class="text-xs text-red-500 dark:text-red-400 space-y-1">
            <li v-for="(errors, field) in validationErrors" :key="field">
              <strong>{{ getFieldDisplayName(field) }}:</strong> {{ errors[0] }}
            </li>
          </ul>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleRegister" class="space-y-8">
          <!-- Basic Info Section -->
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <div class="flex items-center space-x-2 mb-6">
              <div class="p-2 bg-primary-100 dark:bg-primary-800 rounded-lg">
                <Icon name="mdi:account" size="20" class="text-primary-600 dark:text-primary-400" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Informasi Dasar</h3>
            </div>
            
            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap</label>
                <BaseInput 
                  v-model="name"
                  placeholder="Nama Anda" 
                  required 
                  :disabled="isLoading"
                  :error="getFieldError('name')"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <BaseInput 
                  v-model="email"
                  type="email" 
                  placeholder="Email aktif Anda" 
                  required 
                  :disabled="isLoading"
                  :error="getFieldError('email')"
                />
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                <BasePasswordInput 
                  v-model="password"
                  placeholder="Password minimal 8 karakter" 
                  required 
                  :disabled="isLoading"
                  :error="getFieldError('password')"
                />
              </div>
            </div>
          </div>

          <!-- Business Info Section -->
          <div class="bg-gradient-to-br from-primary-50 to-primary-50 dark:from-primary-900/20 dark:to-primary-900/20 rounded-xl p-6 border border-primary-100 dark:border-primary-800">
            <div class="flex items-center space-x-2 mb-6">
              <div class="p-2 bg-primary-100 dark:bg-primary-800 rounded-lg">
                <Icon name="mdi:domain" size="20" class="text-primary-600 dark:text-primary-400" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Informasi Bisnis</h3>
            </div>
            
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Bisnis</label>
                <BaseInput 
                  v-model="businessName"
                  placeholder="Nama bisnis Anda" 
                  required 
                  :disabled="isLoading"
                  :error="getFieldError('business.name')"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nomor Rekening</label>
                <div class="flex flex-row gap-2">
                  <input
                  type="text"
                  class="w-2/3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors"
                  placeholder="Nomor rekening"
                  :disabled="isLoading"
                  />
                  <select
                  class="w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-colors"
                  :disabled="isLoading"
                  >
                  <option value="" disabled selected>Pilih Bank</option>
                  <option value="BNI">BNI</option>
                  <option value="BRI">BRI</option>
                  <option value="BCA">BCA</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="Nagari">Nagari</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deskripsi Bisnis</label>
                <textarea
                  v-model="businessDescription"
                  placeholder="Ceritakan tentang bisnis Anda... (opsional)"
                  :disabled="isLoading"
                  rows="4"
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none resize-none transition-colors"
                />
                <div v-if="getFieldError('business.description')" class="text-xs text-red-500 mt-1">
                  {{ getFieldError('business.description') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Outlet Info Section -->
          <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-100 dark:border-green-800">
            <div class="flex items-center space-x-2 mb-6">
              <div class="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                <Icon name="mdi:store-marker" size="20" class="text-green-600 dark:text-green-400" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Informasi Outlet</h3>
            </div>

            <div class="grid md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Outlet</label>
                <BaseInput 
                  v-model="outletName"
                  placeholder="Nama outlet/toko Anda" 
                  required 
                  :disabled="isLoading"
                  :error="getFieldError('outlets') || getFieldError('outlets[0].name')"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nomor Telepon</label>
                <BaseInput 
                  v-model="outletPhone"
                  placeholder="Nomor telepon outlet (opsional)" 
                  :disabled="isLoading"
                  :error="getFieldError('outlets[0].phone')"
                />
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alamat Outlet</label>
                <BaseInput 
                  v-model="outletAddress"
                  placeholder="Alamat lengkap outlet" 
                  required 
                  :disabled="isLoading"
                  :error="getFieldError('outlets[0].address')"
                />
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-4">
            <BaseButton
              class="w-full"
              type="submit"
              variant="primary"
              size="lg"
              full-width
              :loading="isLoading"
              :disabled="!isFormValid"
            >
              <Icon name="mdi:store-plus" size="20" class="mr-2" />
              {{ isLoading ? 'Memproses...' : 'Daftar Sebagai Bisnis' }}
            </BaseButton>
          </div>
        </form>

        <!-- Footer -->
        <div class="mt-8 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Sudah punya akun?
            <NuxtLink to="/login" class="text-primary-600 hover:text-primary-500 font-medium">Masuk sekarang</NuxtLink>
          </p>
        </div>
      </div>
    </div>

    <!-- Fixed Elements -->
    <div class="absolute top-4 right-4">
      <BaseColorMode />
    </div>
    
    <div class="absolute top-4 left-4">
      <BaseBack />
    </div>
  </div>
</template>