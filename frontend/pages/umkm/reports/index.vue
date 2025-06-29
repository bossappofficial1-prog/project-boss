<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Transaksi</h1>
    </div>

    <!-- Filter & Search -->
    <div class="flex justify-between items-center">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Cari transaksi..."
        class="border p-2 rounded w-64"
      />
    </div>

    <BaseTable>
  <template #thead>
    <tr>
      <BaseTableHeader>#</BaseTableHeader>
      <BaseTableHeader>Tanggal</BaseTableHeader>
      <BaseTableHeader>Jumlah Transaksi</BaseTableHeader>
      <BaseTableHeader>Total Pendapatan</BaseTableHeader>
      <BaseTableHeader>Total Pengeluaran</BaseTableHeader>
      <BaseTableHeader>Laba Bersih</BaseTableHeader>
    </tr>
  </template>

  <BaseTableRow v-for="(item, idx) in paginatedData" :key="item.date">
    <td class="p-3">{{ startNumber + idx }}</td>
    <td class="p-3">{{ item.date }}</td>
    <td class="p-3">{{ item.totalTransaction }}</td>
    <td class="p-3">Rp {{ item.totalIncome.toLocaleString() }}</td>
    <td class="p-3">Rp {{ item.totalExpense.toLocaleString() }}</td>
    <td class="p-3">Rp {{ (item.totalIncome - item.totalExpense).toLocaleString() }}</td>
  </BaseTableRow>

  <template #footer>
    <BasePagination
      :current-page="currentPage"
      :total-pages="totalPages"
      @previous="prevPage"
      @next="nextPage"
    />
  </template>
</BaseTable>

  </div>
</template>

<script setup>
const reports = ref([
  { date: '2024-06-25', totalTransaction: 12, totalIncome: 2200000, totalExpense: 500000 },
  { date: '2024-06-26', totalTransaction: 8, totalIncome: 1800000, totalExpense: 350000 },
  { date: '2024-06-27', totalTransaction: 15, totalIncome: 2500000, totalExpense: 400000 },
  { date: '2024-06-28', totalTransaction: 10, totalIncome: 2000000, totalExpense: 450000 },
  { date: '2024-06-29', totalTransaction: 18, totalIncome: 3000000, totalExpense: 600000 },
])

const searchTerm = ref('')
const currentPage = ref(1)
const perPage = 5

const filteredData = computed(() =>
  reports.value.filter(item =>
    item.date.includes(searchTerm.value)
  )
)

const totalPages = computed(() =>
  Math.ceil(filteredData.value.length / perPage)
)

const paginatedData = computed(() =>
  filteredData.value.slice(
    (currentPage.value - 1) * perPage,
    currentPage.value * perPage
  )
)

const startNumber = computed(() => (currentPage.value - 1) * perPage + 1)

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

definePageMeta({
  layout: 'umkm'
})
</script>
