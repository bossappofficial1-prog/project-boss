<script setup lang="ts">
interface Expense {
  id: string
  description: string
  amount: number
  date: string
  outletId: string
  createdAt: string
  updatedAt: string
}

interface ExpenseFormData {
  description: string
  amount: number
  date: string
}

interface Props {
  isOpen: boolean
  expense?: Expense | null
  mode: 'add' | 'edit'
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', data: ExpenseFormData): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

// Form data
const formData = ref<ExpenseFormData>({
  description: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0]
})

// Validation errors
const formErrors = ref<Record<string, string>>({})

// Watch for expense prop changes (for edit mode)
watch(() => props.expense, (newExpense) => {
  if (newExpense && props.mode === 'edit') {
    formData.value = {
      description: newExpense.description,
      amount: newExpense.amount,
      date: newExpense.date.split('T')[0]
    }
  }
}, { immediate: true })

// Reset form when modal opens for add mode
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.mode === 'add') {
    resetForm()
  }
})

// Validate form
const validateForm = (): boolean => {
  formErrors.value = {}
  
  if (!formData.value.description.trim()) {
    formErrors.value.description = 'Deskripsi wajib diisi'
  }
  
  if (!formData.value.amount || formData.value.amount <= 0) {
    formErrors.value.amount = 'Jumlah harus lebih dari 0'
  }
  
  if (!formData.value.date) {
    formErrors.value.date = 'Tanggal wajib diisi'
  }
  
  return Object.keys(formErrors.value).length === 0
}

// Reset form
const resetForm = () => {
  formData.value = {
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  }
  formErrors.value = {}
}

// Handle form submission
const handleSubmit = () => {
  if (validateForm()) {
    emit('submit', { ...formData.value })
  }
}

// Close modal
const closeModal = () => {
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" 
    class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop with blur effect -->
    <div 
      class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
      @click="closeModal">
    </div>
    
    <!-- Modal container -->
    <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
      <!-- Modal content -->
      <div 
        class="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left shadow-2xl transition-all duration-300 w-full max-w-lg mx-4 sm:mx-auto"
        @click.stop>
        
        <!-- Modal Header -->
        <div class="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <Icon name="lucide:receipt" class="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ mode === 'edit' ? 'Edit Pengeluaran' : 'Tambah Pengeluaran' }}
              </h3>
            </div>
            <button @click="closeModal" 
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-105">
              <Icon name="lucide:x" size="20" />
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="bg-white dark:bg-gray-800 px-6 pb-6">
          <form @submit.prevent="handleSubmit" class="space-y-6 pt-6">
            <!-- Description -->
            <div class="space-y-2">
              <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Icon name="lucide:file-text" size="16" class="text-gray-500" />
                Deskripsi Pengeluaran *
              </label>
              <input 
                v-model="formData.description"
                type="text" 
                placeholder="Contoh: Pembelian bahan baku kopi..."
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 placeholder-gray-400"
                :class="formErrors.description ? 'border-red-300 dark:border-red-600 ring-2 ring-red-100 dark:ring-red-900/20' : 'hover:border-gray-400 dark:hover:border-gray-500'"
              >
              <p v-if="formErrors.description" class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <Icon name="lucide:alert-circle" size="14" />
                {{ formErrors.description }}
              </p>
            </div>

            <!-- Amount -->
            <div class="space-y-2">
              <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Icon name="lucide:banknote" size="16" class="text-gray-500" />
                Jumlah Pengeluaran *
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span class="text-gray-500 dark:text-gray-400 font-medium">Rp</span>
                </div>
                <input 
                  v-model.number="formData.amount"
                  type="number" 
                  min="1"
                  step="1"
                  placeholder="0"
                  class="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200 text-right"
                  :class="formErrors.amount ? 'border-red-300 dark:border-red-600 ring-2 ring-red-100 dark:ring-red-900/20' : 'hover:border-gray-400 dark:hover:border-gray-500'"
                >
              </div>
              <p v-if="formErrors.amount" class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <Icon name="lucide:alert-circle" size="14" />
                {{ formErrors.amount }}
              </p>
              <p v-else class="text-xs text-gray-500 dark:text-gray-400">
                Masukkan jumlah dalam Rupiah (minimal Rp 1)
              </p>
            </div>

            <!-- Date (only for add mode) -->
            <div v-if="mode === 'add'" class="space-y-2">
              <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Icon name="lucide:calendar" size="16" class="text-gray-500" />
                Tanggal Pengeluaran *
              </label>
              <input 
                v-model="formData.date"
                type="date" 
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                :class="formErrors.date ? 'border-red-300 dark:border-red-600 ring-2 ring-red-100 dark:ring-red-900/20' : 'hover:border-gray-400 dark:hover:border-gray-500'"
              >
              <p v-if="formErrors.date" class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <Icon name="lucide:alert-circle" size="14" />
                {{ formErrors.date }}
              </p>
            </div>

            <!-- Form Actions -->
            <div class="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button type="button" @click="closeModal"
                class="flex-1 sm:flex-none px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 font-medium hover:scale-[1.02] order-2 sm:order-1">
                Batal
              </button>
              <button type="submit" :disabled="loading"
                class="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2 hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl order-1 sm:order-2">
                <div v-if="loading" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <Icon v-else name="lucide:save" size="18" />
                {{ mode === 'edit' ? 'Simpan Perubahan' : 'Tambah Pengeluaran' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
