<script setup>
const name = ref('')
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const validationErrors = ref({})

const router = useRouter()

const isFormValid = computed(() => {
  return name.value && email.value && password.value && password.value.length >= 8
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
    'password': 'Password'
  }
  return fieldNames[fieldPath] || fieldPath
}

async function handleRegister() {
  if (!isFormValid.value) return

  isLoading.value = true
  clearValidationErrors()

  try {
    const { data, error } = await useApiFetch('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.value,
        name: name.value,
        password: password.value
      })
    })

    if (error.value) {
      // Handle validation errors
      if (error.value?.data?.errors && Array.isArray(error.value.data.errors)) {
        validationErrors.value = parseValidationErrors(error.value.data.errors)
        errorMessage.value = error.value.data.message || 'Terdapat kesalahan validasi'
      } else {
        errorMessage.value = error.value?.data?.message || 'Gagal mendaftar akun'
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

function switchToBusinessRegister() {
  router.replace('/register-business')
}

definePageMeta({
  layout: 'blank'
})
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Left Side - Form -->
    <div class="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
      <div class="w-full max-w-md">
        <!-- Header Section -->

        <div class="text-center mb-8">
          <div class="flex items-center justify-center mb-6">
            <Icon name="boss:logo-blue-text" class="w-48 h-24 text-primary-600" />
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Daftar Akun Baru
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Berlangganan dengan Mitra BOSS
          </p>
        </div>

        <!-- Account Type Switch -->
        <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Akun Customer</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">Untuk pelanggan biasa</p>
            </div>
            <button type="button" @click="switchToBusinessRegister"
              class="text-sm text-primary-600 hover:text-primary-500 font-medium">
              Daftar sebagai Bisnis →
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage"
          class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400 font-medium mb-2">{{ errorMessage }}</p>
          <ul v-if="Object.keys(validationErrors).length > 0" class="text-xs text-red-500 dark:text-red-400 space-y-1">
            <li v-for="(errors, field) in validationErrors" :key="field">
              <strong>{{ getFieldDisplayName(field) }}:</strong> {{ errors[0] }}
            </li>
          </ul>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleRegister" class="space-y-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Lengkap</label>
              <BaseInput v-model="name" placeholder="Nama Anda" required :disabled="isLoading"
                :error="getFieldError('name')" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <BaseInput v-model="email" type="email" placeholder="Email aktif Anda" required :disabled="isLoading"
                :error="getFieldError('email')" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <BasePasswordInput v-model="password" placeholder="Password minimal 8 karakter" required
                :disabled="isLoading" :error="getFieldError('password')" />
            </div>
          </div>

          <!-- Submit Button -->
          <BaseButton class="w-full" type="submit" variant="primary" size="lg" full-width :loading="isLoading"
            :disabled="!isFormValid">
            {{ isLoading ? 'Memproses...' : 'Daftar Sebagai Customer' }}
          </BaseButton>
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

    <!-- Right Side -->
    <div class="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 to-primary-800 items-center justify-center p-12">
      <div class="text-center text-white">
        <div class="w-64 h-64 mx-auto mb-8 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
          <Icon name="mdi:account-plus" size="120" class="text-white/80" />
        </div>
        <h2 class="text-3xl font-bold mb-4">Bergabung dengan BOSS</h2>
        <p class="text-xl text-primary-100 max-w-md">
          Daftar sebagai customer untuk mulai berbelanja dan nikmati pengalaman terbaik
        </p>
      </div>
    </div>

    <div class="absolute top-4 right-4">
      <BaseColorMode />
    </div>

    <div class="absolute top-4 left-4">
      <BaseBack />
    </div>
  </div>
</template>
