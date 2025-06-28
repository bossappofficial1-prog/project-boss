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

    <!-- Tabel Transaksi -->
    <BaseTable>
      <template #thead>
        <tr>
          <BaseTableHeader>#</BaseTableHeader>
          <BaseTableHeader>ID</BaseTableHeader>
          <BaseTableHeader>Nama Customer</BaseTableHeader>
          <BaseTableHeader>Jumlah</BaseTableHeader>
          <BaseTableHeader>Status</BaseTableHeader>
        </tr>
      </template>

      <BaseTableRow v-for="(item, idx) in paginatedData" :key="item.id">
        <td class="p-3">{{ startNumber + idx }}</td>
        <td class="p-3">{{ item.id }}</td>
        <td class="p-3">{{ item.customer }}</td>
        <td class="p-3">Rp {{ item.amount.toLocaleString() }}</td>
        <td class="p-3">
          <span
            :class="[
              'px-2 py-1 rounded text-xs',
              item.status === 'PAID' ? 'bg-green-100 text-green-600' :
              item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
              'bg-red-100 text-red-600'
            ]"
          >
            {{ item.status }}
          </span>
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
const transactions = ref([
  { id: 'TRX001', customer: 'Budi', amount: 150000, status: 'PAID' },
  { id: 'TRX002', customer: 'Sari', amount: 250000, status: 'PENDING' },
  { id: 'TRX003', customer: 'Andi', amount: 180000, status: 'FAILED' },
  { id: 'TRX004', customer: 'Dina', amount: 300000, status: 'PAID' },
  { id: 'TRX005', customer: 'Rina', amount: 210000, status: 'PAID' },
  { id: 'TRX006', customer: 'Agus', amount: 170000, status: 'PENDING' },
  { id: 'TRX007', customer: 'Wulan', amount: 260000, status: 'PAID' },
  { id: 'TRX008', customer: 'Rudi', amount: 200000, status: 'FAILED' },
  { id: 'TRX009', customer: 'Lisa', amount: 275000, status: 'PAID' },
  { id: 'TRX010', customer: 'Adit', amount: 225000, status: 'PENDING' },
])

const searchTerm = ref('')
const currentPage = ref(1)
const perPage = 5

// Filter data berdasarkan search
const filteredData = computed(() =>
  transactions.value.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.value.toLowerCase())
    )
  )
)

// Hitung total halaman
const totalPages = computed(() =>
  Math.ceil(filteredData.value.length / perPage)
)

// Data per halaman
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
