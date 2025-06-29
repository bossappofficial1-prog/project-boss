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
          <BaseTableHeader>ID Pesanan</BaseTableHeader>
          <BaseTableHeader>Customer</BaseTableHeader>
          <BaseTableHeader>Tanggal</BaseTableHeader>
          <BaseTableHeader>Total</BaseTableHeader>
          <BaseTableHeader>Status Antrian</BaseTableHeader>
          <BaseTableHeader>Status Pembayaran</BaseTableHeader>
        </tr>
      </template>

      <BaseTableRow v-for="(item, idx) in paginatedData" :key="item.id">
  <td class="p-3">{{ startNumber + idx }}</td>
  <td class="p-3">{{ item.id }}</td>
  <td class="p-3">{{ item.customer.name }}</td>
  <td class="p-3">{{ new Date(item.createdAt).toLocaleString() }}</td>
  <td class="p-3">Rp {{ item.totalAmount.toLocaleString() }}</td>
  <td class="p-3">
    <span
      :class="[
        'px-2 py-1 rounded text-xs',
        item.queueStatus === 'COMPLETED' ? 'bg-green-100 text-green-600' :
        item.queueStatus === 'ON_PROGRESS' ? 'bg-blue-100 text-blue-600' :
        item.queueStatus === 'AWAITING_PAYMENT' ? 'bg-yellow-100 text-yellow-600' :
        'bg-gray-100 text-gray-600'
      ]"
    >
      {{ item.queueStatus }}
    </span>
  </td>
  <td class="p-3">
    <span
      :class="[
        'px-2 py-1 rounded text-xs',
        item.paymentStatus === 'PAID' ? 'bg-green-100 text-green-600' :
        item.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
        'bg-red-100 text-red-600'
      ]"
    >
      {{ item.paymentStatus }}
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
  { id: 'ORD001', customer: { name: 'Budi' }, createdAt: '2024-06-29T12:00:00', totalAmount: 150000, queueStatus: 'AWAITING_PAYMENT', paymentStatus: 'PENDING' },
  { id: 'ORD002', customer: { name: 'Sari' }, createdAt: '2024-06-29T13:30:00', totalAmount: 250000, queueStatus: 'ON_PROGRESS', paymentStatus: 'PAID' },
  { id: 'ORD003', customer: { name: 'Andi' }, createdAt: '2024-06-29T14:00:00', totalAmount: 180000, queueStatus: 'COMPLETED', paymentStatus: 'PAID' },
  { id: 'ORD004', customer: { name: 'Dina' }, createdAt: '2024-06-29T14:30:00', totalAmount: 300000, queueStatus: 'ON_PROGRESS', paymentStatus: 'PENDING' },
  { id: 'ORD005', customer: { name: 'Rina' }, createdAt: '2024-06-29T15:00:00', totalAmount: 210000, queueStatus: 'AWAITING_PAYMENT', paymentStatus: 'FAILED' },
])


const searchTerm = ref('')
const currentPage = ref(1)
const perPage = 5

// Filter data berdasarkan search
const filteredData = computed(() =>
  transactions.value.filter(item =>
    item.id.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    item.customer.name.toLowerCase().includes(searchTerm.value.toLowerCase())
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
