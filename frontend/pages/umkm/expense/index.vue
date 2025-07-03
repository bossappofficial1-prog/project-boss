<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Pengeluaran Outlet</h1>
    </div>

    <!-- Filter & Search -->
    <div class="flex justify-between items-center">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Cari pengeluaran..."
        class="border p-2 rounded w-64"
      />
    </div>

    <!-- Tabel Pengeluaran -->
    <BaseTable>
      <template #thead>
        <tr>
          <BaseTableHeader>#</BaseTableHeader>
          <BaseTableHeader>Tanggal</BaseTableHeader>
          <BaseTableHeader>Deskripsi</BaseTableHeader>
          <BaseTableHeader>Jumlah</BaseTableHeader>
          <BaseTableHeader>Aksi</BaseTableHeader>
        </tr>
      </template>

      <BaseTableRow v-for="(item, idx) in paginatedData" :key="item.id">
        <td class="p-3">{{ startNumber + idx }}</td>
        <td class="p-3">{{ new Date(item.date).toLocaleDateString() }}</td>
        <td class="p-3">{{ item.description }}</td>
        <td class="p-3">Rp {{ item.amount.toLocaleString() }}</td>
        <td class="p-3 space-x-2">
          <button class="text-blue-600 hover:underline">Edit</button>
          <button class="text-red-600 hover:underline">Hapus</button>
        </td>
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
const expenses = ref([
  {
    id: 'EXP001',
    date: '2024-06-28T10:00:00',
    description: 'Beli bahan baku',
    amount: 500000
  },
  {
    id: 'EXP002',
    date: '2024-06-28T12:30:00',
    description: 'Bayar listrik',
    amount: 250000
  },
  {
    id: 'EXP003',
    date: '2024-06-28T13:00:00',
    description: 'Beli kemasan plastik',
    amount: 150000
  },
  {
    id: 'EXP004',
    date: '2024-06-28T14:00:00',
    description: 'Servis AC',
    amount: 300000
  },
  {
    id: 'EXP005',
    date: '2024-06-28T15:00:00',
    description: 'Bayar internet',
    amount: 200000
  }
])

const searchTerm = ref('')
const currentPage = ref(1)
const perPage = 5

const filteredData = computed(() =>
  expenses.value.filter(item =>
    item.description.toLowerCase().includes(searchTerm.value.toLowerCase())
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
