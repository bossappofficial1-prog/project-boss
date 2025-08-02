<script setup lang="ts">
definePageMeta({
  layout: 'umkm',
  middleware: ['auth', 'business-required']
})

// Import types and composables
import type { Expense } from '~/composables/useExpenseApi'

interface ExpenseFormData {
  description: string
  amount: number
  date: string
}

// Composables
const auth = useAuthStore()
const expenseApi = useExpenseApi()

// State
const expenses = ref<Expense[]>([])
const loading = ref(false)
const error = ref('')

// Modal states
const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedExpense = ref<Expense | null>(null)

// Statistics
const totalExpenses = computed(() => 
  expenses.value.reduce((sum, expense) => sum + expense.amount, 0)
)

const thisMonthExpenses = computed(() => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  return expenses.value
    .filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear
    })
    .reduce((sum, expense) => sum + expense.amount, 0)
})

// Load expenses on mount
onMounted(() => {
  if (auth.selectedOutlet?.id) {
    loadExpenses()
  }
})

// Watch for outlet changes
watch(() => auth.selectedOutlet?.id, (newOutletId) => {
  if (newOutletId) {
    loadExpenses()
  }
})

// Load expenses from API
const loadExpenses = async () => {
  if (!auth.selectedOutlet?.id) return
  
  try {
    loading.value = true
    error.value = ''
    
    expenses.value = await expenseApi.getExpensesByOutlet(auth.selectedOutlet.id)
  } catch (err: any) {
    error.value = err.message || 'Gagal memuat data pengeluaran'
    console.error('Error loading expenses:', err)
  } finally {
    loading.value = false
  }
}

// Add new expense
const addExpense = async (data: ExpenseFormData) => {
  if (!auth.selectedOutlet?.id) return
  
  try {
    loading.value = true
    error.value = ''
    
    const requestData = {
      description: data.description,
      amount: data.amount,
      outletId: auth.selectedOutlet.id,
      date: new Date(data.date).toISOString()
    }
    
    await expenseApi.createExpense(requestData)
    await loadExpenses()
    closeModal()
  } catch (err: any) {
    error.value = err.message || 'Gagal menambah pengeluaran'
    console.error('Error adding expense:', err)
  } finally {
    loading.value = false
  }
}

// Update expense
const updateExpense = async (data: ExpenseFormData) => {
  if (!selectedExpense.value) return
  
  try {
    loading.value = true
    error.value = ''
    
    const requestData = {
      description: data.description,
      amount: data.amount
    }
    
    await expenseApi.updateExpense(selectedExpense.value.id, requestData)
    await loadExpenses()
    closeModal()
  } catch (err: any) {
    error.value = err.message || 'Gagal mengupdate pengeluaran'
    console.error('Error updating expense:', err)
  } finally {
    loading.value = false
  }
}

// Delete expense
const deleteExpense = async (expenseId: string) => {
  if (!confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) return
  
  try {
    loading.value = true
    error.value = ''
    
    await expenseApi.deleteExpense(expenseId)
    await loadExpenses()
  } catch (err: any) {
    error.value = err.message || 'Gagal menghapus pengeluaran'
    console.error('Error deleting expense:', err)
  } finally {
    loading.value = false
  }
}

// Modal functions
const openAddModal = () => {
  selectedExpense.value = null
  isAddModalOpen.value = true
}

const openEditModal = (expense: Expense) => {
  selectedExpense.value = expense
  isEditModalOpen.value = true
}

const closeModal = () => {
  isAddModalOpen.value = false
  isEditModalOpen.value = false
  selectedExpense.value = null
}

// Handle form submission from component
const handleFormSubmit = (data: ExpenseFormData) => {
  if (isEditModalOpen.value) {
    updateExpense(data)
  } else {
    addExpense(data)
  }
}

// Utility functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="p-6 space-y-8">
    <!-- Error Message -->
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
      <span>{{ error }}</span>
      <button @click="error = ''" class="text-red-500 hover:text-red-700">
        <Icon name="lucide:x" size="18" />
      </button>
    </div>

    <!-- Header -->
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Pengeluaran</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Kelola pengeluaran outlet {{ auth.selectedOutlet?.name }}</p>
      </div>
      <button @click="openAddModal" :disabled="!auth.selectedOutlet?.id"
        class="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2">
        <Icon name="lucide:plus" size="18" />
        Tambah Pengeluaran
      </button>
    </div>

    <!-- Outlet Warning -->
    <div v-if="!auth.selectedOutlet?.id" class="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
      <div class="flex items-center gap-2">
        <Icon name="lucide:alert-triangle" size="18" />
        <span>Silakan pilih outlet terlebih dahulu untuk melihat data pengeluaran</span>
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-if="auth.selectedOutlet?.id" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Total Pengeluaran</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(totalExpenses) }}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
            <Icon name="lucide:circle-dollar-sign" class="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Bulan Ini</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(thisMonthExpenses) }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Icon name="lucide:calendar" class="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Total Transaksi</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ expenses.length }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <Icon name="lucide:list" class="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Expenses Table -->
    <div v-if="auth.selectedOutlet?.id" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <!-- Loading State -->
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Memuat data pengeluaran...</p>
      </div>

      <!-- Table Content -->
      <div v-else-if="expenses.length > 0" class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th class="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">Deskripsi</th>
              <th class="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">Jumlah</th>
              <th class="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">Tanggal</th>
              <th class="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">Dibuat</th>
              <th class="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="expense in expenses" :key="expense.id" 
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td class="py-4 px-6">
                <div class="font-medium text-gray-900 dark:text-white">{{ expense.description }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">ID: {{ expense.id }}</div>
              </td>
              <td class="py-4 px-6">
                <div class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(expense.amount) }}</div>
              </td>
              <td class="py-4 px-6 text-gray-600 dark:text-gray-400">
                {{ formatDate(expense.date) }}
              </td>
              <td class="py-4 px-6 text-gray-600 dark:text-gray-400">
                {{ formatDateTime(expense.createdAt) }}
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-2">
                  <button @click="openEditModal(expense)"
                    class="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                    <Icon name="lucide:edit" size="16" />
                  </button>
                  <button @click="deleteExpense(expense.id)"
                    class="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                    <Icon name="lucide:trash-2" size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <Icon name="lucide:receipt" class="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Belum ada pengeluaran</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">Mulai tambahkan pengeluaran untuk outlet ini</p>
        <button @click="openAddModal"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
          Tambah Pengeluaran Pertama
        </button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <ExpenseForm
      :is-open="isAddModalOpen || isEditModalOpen"
      :mode="isEditModalOpen ? 'edit' : 'add'"
      :expense="selectedExpense"
      :loading="loading"
      @close="closeModal"
      @submit="handleFormSubmit"
    />
  </div>
</template>
