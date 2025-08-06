<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Transaksi</h1>
    </div>

    <!-- ReusableTable Implementation -->
    <ReusableTable :data="reports" :columns="transactionColumns" :actions="headerActions" :row-actions="rowActions"
      :filters="transactionFilters" title="Laporan Transaksi Harian" subtitle="Monitor performa bisnis harian Anda"
      :searchable="true" :sortable="true" :filterable="true" :selectable="false" :paginated="true"
      :show-row-numbers="true" :default-page-size="10" :page-size-options="[5, 10, 15, 20]"
      search-placeholder="Cari berdasarkan tanggal..." empty-message="Tidak ada data transaksi" :show-export="true"
      :show-refresh="true" @search="handleSearch" @sort="handleSort" @filter="handleFilter" @export="handleExport"
      @refresh="handleRefresh">
      <!-- Custom slot untuk kolom tanggal -->
      <template #date="{ value }">
        <div class="flex items-center">
          <CalendarIcon class="w-4 h-4 text-gray-400 mr-2" />
          <span class="font-medium">{{ formatDate(value) }}</span>
        </div>
      </template>

      <!-- Custom slot untuk total transaksi dengan badge -->
      <template #totalTransaction="{ value }">
        <span :class="getTransactionBadge(value)">
          {{ value }} transaksi
        </span>
      </template>

      <!-- Custom slot untuk pendapatan dengan trend -->
      <template #totalIncome="{ value, row }">
        <div class="flex items-center">
          <span class="text-green-600 font-semibold">
            Rp {{ value.toLocaleString() }}
          </span>
          <ArrowTrendingUpIcon class="w-4 h-4 text-green-500 ml-1" />
        </div>
      </template>

      <!-- Custom slot untuk pengeluaran -->
      <template #totalExpense="{ value }">
        <span class="text-red-600 font-semibold">
          Rp {{ value.toLocaleString() }}
        </span>
      </template>

      <!-- Custom slot untuk laba bersih dengan indicator -->
      <template #netProfit="{ value, row }">
        <div class="flex items-center">
          <span :class="value >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">
            Rp {{ Math.abs(value).toLocaleString() }}
          </span>
          <component :is="value >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon"
            :class="value >= 0 ? 'text-green-500' : 'text-red-500'" class="w-4 h-4 ml-1" />
        </div>
      </template>
    </ReusableTable>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 rounded-lg">
            <HashtagIcon class="w-6 h-6 text-blue-600" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Transaksi</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalTransactions }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 rounded-lg">
            <ArrowTrendingUpIcon class="w-6 h-6 text-green-600" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pendapatan</p>
            <p class="text-2xl font-bold text-green-600">Rp {{ totalIncome.toLocaleString() }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <div class="p-2 bg-red-100 rounded-lg">
            <ArrowTrendingDownIcon class="w-6 h-6 text-red-600" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pengeluaran</p>
            <p class="text-2xl font-bold text-red-600">Rp {{ totalExpense.toLocaleString() }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 rounded-lg">
            <CurrencyDollarIcon class="w-6 h-6 text-purple-600" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Laba Bersih</p>
            <p :class="['text-2xl font-bold', netProfit >= 0 ? 'text-green-600' : 'text-red-600']">
              Rp {{ Math.abs(netProfit).toLocaleString() }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ReusableTable from '~/components/base/BaseTable2.vue'
import {
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  HashtagIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/vue/24/outline'

// Data transaksi
const reports = ref([])
const auth = useAuthStore()
const { data: reportData, pending, error, refresh } = await useApi(`/reports/daily/${auth.selectedOutlet.id}`)

// Watch for changes in API response
watch(reportData, (newData) => {
  if (newData && newData.value?.data) {
    reports.value = newData.value.data
  }
}, { immediate: true })

// Konfigurasi kolom tabel
const transactionColumns = ref([
  {
    key: 'date',
    label: 'Tanggal',
    type: 'slot',
    sortable: true,
    searchable: true
  },
  {
    key: 'totalTransaction',
    label: 'Jumlah Transaksi',
    type: 'slot',
    sortable: true
  },
  {
    key: 'totalIncome',
    label: 'Total Pendapatan',
    type: 'slot',
    sortable: true
  },
  {
    key: 'totalExpense',
    label: 'Total Pengeluaran',
    type: 'slot',
    sortable: true
  },
  {
    key: 'netProfit',
    label: 'Laba Bersih',
    type: 'slot',
    sortable: true
  }
])

// Row actions
const rowActions = ref([
  {
    key: 'view',
    label: 'Lihat Detail',
    icon: EyeIcon,
    variant: 'view',
    handler: (row) => viewTransaction(row)
  }
])

// Computed properties untuk summary cards
const totalTransactions = computed(() =>
  reports.value.reduce((sum, item) => sum + item.totalTransaction, 0)
)

const totalIncome = computed(() =>
  reports.value.reduce((sum, item) => sum + item.totalIncome, 0)
)

const totalExpense = computed(() =>
  reports.value.reduce((sum, item) => sum + item.totalExpense, 0)
)

const netProfit = computed(() => totalIncome.value - totalExpense.value)

// Methods
const formatDate = (dateString) => {
  const options = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  return new Date(dateString).toLocaleDateString('id-ID', options)
}

const getTransactionBadge = (count) => {
  if (count >= 20) return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
  if (count >= 10) return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'
  return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
}

// Event handlers
const handleSearch = (term) => {
  console.log('Search term:', term)
  // Implementasi search logic jika diperlukan
}

const handleSort = (sortConfig) => {
  console.log('Sort config:', sortConfig)
  // Implementasi server-side sorting jika diperlukan
}

const handleFilter = (filters) => {
  console.log('Active filters:', filters)
  // Implementasi filtering logic
}

const handleExport = () => {
  console.log('Exporting transaction data...')
  // Implementasi export ke Excel/PDF
  const csvContent = "data:text/csv;charset=utf-8," +
    "Tanggal,Jumlah Transaksi,Total Pendapatan,Total Pengeluaran,Laba Bersih\n" +
    reports.value.map(row =>
      `${row.date},${row.totalTransaction},${row.totalIncome},${row.totalExpense},${row.netProfit}`
    ).join("\n")

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", "laporan-transaksi.csv")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleRefresh = async () => {
  console.log('Refreshing data...')
  await refresh()
}

// Action handlers
const addTransaction = () => {
  console.log('Adding new transaction')
  // Navigate to add transaction page atau buka modal
}

const viewTransaction = (transaction) => {
  console.log('Viewing transaction:', transaction)
  // Navigate to detail page atau buka modal
}

const editTransaction = (transaction) => {
  console.log('Editing transaction:', transaction)
  // Navigate to edit page atau buka modal
}

const deleteTransaction = (transaction) => {
  console.log('Deleting transaction:', transaction)
  // Show confirmation dialog
  if (confirm(`Apakah Anda yakin ingin menghapus transaksi tanggal ${transaction.date}?`)) {
    const index = reports.value.findIndex(item => item.id === transaction.id)
    if (index > -1) {
      reports.value.splice(index, 1)
    }
  }
}

definePageMeta({
  layout: 'umkm'
})
</script>

<style scoped>
/* Custom styles jika diperlukan */
.transaction-summary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>