<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Daftar Transaksi</h1>
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
          <BaseTableHeader>Customer</BaseTableHeader>
          <BaseTableHeader>Tanggal</BaseTableHeader>
          <BaseTableHeader>Jumlah</BaseTableHeader>
          <BaseTableHeader>Metode</BaseTableHeader>
          <BaseTableHeader>Status</BaseTableHeader>
          <BaseTableHeader>Aksi</BaseTableHeader>
        </tr>
      </template>

      <BaseTableRow v-for="(item, idx) in paginatedData" :key="item.id">
        <td class="p-3">{{ startNumber + idx }}</td>
        <td class="p-3">{{ item.id }}</td>
        <td class="p-3">{{ item.customer }}</td>
        <td class="p-3">{{ new Date(item.createdAt).toLocaleString() }}</td>
        <td class="p-3">Rp {{ item.amount.toLocaleString() }}</td>
        <td class="p-3">{{ item.method }}</td>
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
        <td class="p-3 space-x-2">
          <button class="text-blue-600 hover:underline">Detail</button>
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
  {
    id: 'TRX001',
    customer: 'Budi',
    createdAt: '2024-06-29T10:00:00',
    amount: 150000,
    method: 'QRIS',
    status: 'PAID'
  },
  {
    id: 'TRX002',
    customer: 'Sari',
    createdAt: '2024-06-29T11:30:00',
    amount: 250000,
    method: 'Gopay',
    status: 'PENDING'
  },
  {
    id: 'TRX003',
    customer: 'Andi',
    createdAt: '2024-06-29T12:45:00',
    amount: 180000,
    method: 'QRIS',
    status: 'PAID'
  },
  {
    id: 'TRX004',
    customer: 'Dina',
    createdAt: '2024-06-29T14:00:00',
    amount: 300000,
    method: 'QRIS',
    status: 'FAILED'
  },
  {
    id: 'TRX005',
    customer: 'Rina',
    createdAt: '2024-06-29T15:00:00',
    amount: 210000,
    method: 'Bank Transfer',
    status: 'PAID'
  }
])

const searchTerm = ref('')
const currentPage = ref(1)
const perPage = 5

const filteredData = computed(() =>
  transactions.value.filter(item =>
    item.id.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    item.customer.toLowerCase().includes(searchTerm.value.toLowerCase())
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
