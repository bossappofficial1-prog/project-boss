<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Stok Produk Outlet</h1>
    </div>

    <!-- Filter & Search -->
    <div class="flex justify-between items-center">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Cari produk..."
        class="border p-2 rounded w-64"
      />
    </div>

    <!-- Tabel Stok Produk -->
    <BaseTable>
      <template #thead>
        <tr>
          <BaseTableHeader>#</BaseTableHeader>
          <BaseTableHeader>Gambar</BaseTableHeader>
          <BaseTableHeader>Nama Produk</BaseTableHeader>
          <BaseTableHeader>Tipe</BaseTableHeader>
          <BaseTableHeader>Stok</BaseTableHeader>
          <BaseTableHeader>Satuan</BaseTableHeader>
          <BaseTableHeader>Harga Jual</BaseTableHeader>
          <BaseTableHeader>Aksi</BaseTableHeader>
        </tr>
      </template>

      <BaseTableRow v-for="(item, idx) in paginatedData" :key="item.id">
        <td class="p-3">{{ startNumber + idx }}</td>
        <td class="p-3">
          <img :src="item.image" alt="produk" class="w-14 h-14 object-cover rounded" />
        </td>
        <td class="p-3">{{ item.name }}</td>
        <td class="p-3">
          <span
            :class="[
              'px-2 py-1 rounded text-xs',
              item.type === 'BARANG' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
            ]"
          >
            {{ item.type }}
          </span>
        </td>
        <td class="p-3">{{ item.quantity ?? '-' }}</td>
        <td class="p-3">{{ item.unit ?? '-' }}</td>
        <td class="p-3">Rp {{ item.price.toLocaleString() }}</td>
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
const products = ref([
  {
    id: 'PRD001',
    name: 'Kopi Hitam',
    image: 'https://via.placeholder.com/150',
    type: 'BARANG',
    quantity: 50,
    unit: 'Pcs',
    price: 15000
  },
  {
    id: 'PRD002',
    name: 'Facial Treatment',
    image: 'https://via.placeholder.com/150',
    type: 'JASA',
    quantity: null,
    unit: null,
    price: 120000
  },
  {
    id: 'PRD003',
    name: 'Teh Tarik',
    image: 'https://via.placeholder.com/150',
    type: 'BARANG',
    quantity: 30,
    unit: 'Pcs',
    price: 12000
  },
  {
    id: 'PRD004',
    name: 'Potong Rambut',
    image: 'https://via.placeholder.com/150',
    type: 'JASA',
    quantity: null,
    unit: null,
    price: 35000
  },
  {
    id: 'PRD005',
    name: 'Kopi Susu',
    image: 'https://via.placeholder.com/150',
    type: 'BARANG',
    quantity: 20,
    unit: 'Pcs',
    price: 18000
  }
])

const searchTerm = ref('')
const currentPage = ref(1)
const perPage = 5

const filteredData = computed(() =>
  products.value.filter(item =>
    item.name.toLowerCase().includes(searchTerm.value.toLowerCase())
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
