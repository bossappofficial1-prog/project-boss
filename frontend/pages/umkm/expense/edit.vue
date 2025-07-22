<script setup lang="ts">
import type { ExpenseForm, Expense } from '~/types'

definePageMeta({
  layout: 'blank',
  middleware: ['auth', 'owner', 'business-required']
})

const auth = useAuthStore()
const route = useRoute()
const isLoading = ref(false)
const expenseId = route.params.id as string

const form = ref<ExpenseForm>({
  description: '',
  amount: 0,
  date: new Date(),
  outletId: auth.selectedOutlet?.id || ''
})

const errors = ref<Record<string, string>>({})

// Load existing expense data
onMounted(async () => {
  if (expenseId) {
    isLoading.value = true
    try {
      const { data, error } = await useApi<{ expense: Expense }>(`/api/expenses/${expenseId}`)
      if (error.value) {
        console.error('Failed to fetch expense:', error.value)
        const toast = useToast()
        toast.error({
          title: 'Error!',
          message: 'Gagal memuat data pengeluaran.'
        })
        await navigateTo('/umkm/expense')
        return
      }
      if (data.value?.data?.expense) {
        const expense = data.value.data.expense
        form.value = {
          description: expense.description || '',
          amount: expense.amount || 0,
          date: new Date(expense.date), // Convert string to Date object
          outletId: expense.outletId || auth.selectedOutlet?.id || ''
        }
      }
    } catch (error) {
      console.error('Expense fetch error:', error)
      const toast = useToast()
      toast.error({
        title: 'Error!',
        message: 'Terjadi kesalahan saat memuat data pengeluaran.'
      })
      await navigateTo('/umkm/expense')
    } finally {
      isLoading.value = false
    }
  }
})

const validateForm = (): boolean => {
  errors.value = {}
  
  if (!form.value.description.trim()) {
    errors.value.description = 'Deskripsi pengeluaran harus diisi'
    return false
  }
  if (form.value.amount <= 0) {
    errors.value.amount = 'Jumlah pengeluaran harus lebih dari 0'
    return false
  }
  if (!form.value.date) {
    errors.value.date = 'Tanggal pengeluaran harus diisi'
    return false
  }
  
  return true
}

const submitForm = async () => {
  if (!validateForm()) return
  
  isLoading.value = true
  
  try {
    const endpoint = `/api/expenses/update/${expenseId}`
    const method = 'PUT'
    
    const { data, error } = await useApi<{ expense: any }>(endpoint, {
      method,
      body: {
        ...form.value,
        date: form.value.date.toISOString() // Convert Date to ISO string for API
      }
    })
    
    if (error.value) {
      if (error.value.data?.message) {
        errors.value.submit = error.value.data.message
      } else {
        errors.value.submit = 'Terjadi kesalahan saat menyimpan data pengeluaran'
      }
      return
    }
    
    const toast = useToast()
    toast.success({
      title: 'Berhasil!',
      message: 'Pengeluaran berhasil diperbarui'
    })
    
    await navigateTo('/umkm/expense')
  } catch (error) {
    console.error('Expense form error:', error)
    errors.value.submit = 'Terjadi kesalahan saat menyimpan data pengeluaran'
  } finally {
    isLoading.value = false
  }
}

const pageTitle = computed(() => 'Edit Pengeluaran')

const buttonText = computed(() => 'Perbarui Pengeluaran')
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <BaseBack />
      <div class="flex items-center space-x-3 mt-4">
        <div class="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
          <Icon name="lucide:wallet" size="24" class="text-white" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ pageTitle }}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Kelola informasi pengeluaran Anda
          </p>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <form @submit.prevent="submitForm" class="space-y-6">
        <!-- Basic Information -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Detail Pengeluaran
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deskripsi Pengeluaran *
              </label>
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Contoh: Pembelian bahan baku, Gaji karyawan"
                :class="{ 'border-red-500': errors.description }"
              ></textarea>
              <p v-if="errors.description" class="text-red-500 text-sm mt-1">{{ errors.description }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Jumlah *
              </label>
              <input
                v-model.number="form.amount"
                type="number"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="0"
                :class="{ 'border-red-500': errors.amount }"
              />
              <p v-if="errors.amount" class="text-red-500 text-sm mt-1">{{ errors.amount }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tanggal *
              </label>
              <input
                v-model="form.date"
                type="date"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                :class="{ 'border-red-500': errors.date }"
              />
              <p v-if="errors.date" class="text-red-500 text-sm mt-1">{{ errors.date }}</p>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errors.submit" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div class="flex items-start space-x-2">
            <Icon name="lucide:alert-circle" size="16" class="text-red-500 mt-0.5" />
            <p class="text-red-600 dark:text-red-400 text-sm">{{ errors.submit }}</p>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            @click="$router.back()"
            class="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Batal
          </button>
          
          <button
            type="submit"
            :disabled="isLoading"
            class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <span v-if="isLoading">
              <Icon name="lucide:loader-2" size="20" class="animate-spin" />
            </span>
            <span>{{ buttonText }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>