# Vue Reusable Table Component Documentation

Komponen tabel yang sangat fleksibel dan reusable untuk Vue.js 3 dengan fitur-fitur modern.

## 📦 Installation

```bash
npm install @heroicons/vue
```

## 🚀 Basic Usage

```vue
<template>
  <ReusableTable
    :data="tableData"
    :columns="tableColumns"
    title="My Data Table"
  />
</template>

<script setup>
import ReusableTable from "./components/ReusableTable.vue";

const tableData = ref([
  { id: 1, name: "John Doe", email: "john@example.com", status: "Active" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", status: "Inactive" },
]);

const tableColumns = ref([
  { key: "name", label: "Name", sortable: true, searchable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "status", label: "Status", type: "badge" },
]);
</script>
```

## 📋 Props

### Data Props

| Prop      | Type  | Default | Description                  |
| --------- | ----- | ------- | ---------------------------- |
| `data`    | Array | `[]`    | Data array untuk ditampilkan |
| `columns` | Array | `[]`    | Konfigurasi kolom tabel      |

### Configuration Props

| Prop         | Type    | Default        | Description                 |
| ------------ | ------- | -------------- | --------------------------- |
| `title`      | String  | `'Data Table'` | Judul tabel                 |
| `subtitle`   | String  | `''`           | Subtitle tabel              |
| `searchable` | Boolean | `true`         | Aktifkan fitur search       |
| `sortable`   | Boolean | `true`         | Aktifkan fitur sorting      |
| `filterable` | Boolean | `false`        | Aktifkan fitur filtering    |
| `selectable` | Boolean | `false`        | Aktifkan checkbox selection |
| `paginated`  | Boolean | `true`         | Aktifkan pagination         |

### Customization Props

| Prop                | Type   | Default               | Description                    |
| ------------------- | ------ | --------------------- | ------------------------------ |
| `filters`           | Array  | `[]`                  | Konfigurasi filter dropdown    |
| `actions`           | Array  | `[]`                  | Tombol aksi di header          |
| `rowActions`        | Array  | `[]`                  | Tombol aksi per row            |
| `searchPlaceholder` | String | `'Search...'`         | Placeholder untuk search input |
| `emptyMessage`      | String | `'No data available'` | Pesan ketika data kosong       |

### Pagination Props

| Prop              | Type   | Default           | Description                     |
| ----------------- | ------ | ----------------- | ------------------------------- |
| `defaultPageSize` | Number | `10`              | Jumlah item per halaman default |
| `pageSizeOptions` | Array  | `[5, 10, 25, 50]` | Opsi jumlah item per halaman    |

### Style Props

| Prop              | Type   | Default | Description             |
| ----------------- | ------ | ------- | ----------------------- |
| `className`       | String | `''`    | CSS class untuk wrapper |
| `headerClassName` | String | `''`    | CSS class untuk header  |
| `tableClassName`  | String | `''`    | CSS class untuk table   |

### Feature Flags

| Prop             | Type    | Default | Description              |
| ---------------- | ------- | ------- | ------------------------ |
| `showHeader`     | Boolean | `true`  | Tampilkan header         |
| `showFooter`     | Boolean | `true`  | Tampilkan footer         |
| `showRowNumbers` | Boolean | `false` | Tampilkan nomor baris    |
| `showExport`     | Boolean | `true`  | Tampilkan tombol export  |
| `showRefresh`    | Boolean | `true`  | Tampilkan tombol refresh |
| `striped`        | Boolean | `true`  | Baris bergaris           |
| `hoverable`      | Boolean | `true`  | Hover effect pada baris  |

## 🔧 Column Configuration

### Basic Column

```javascript
{
  key: 'name',           // Key dari data object
  label: 'Full Name',    // Label yang ditampilkan di header
  sortable: true,        // Dapat di-sort (default: true)
  searchable: true       // Dapat di-search (default: true)
}
```

### Column Types

#### 1. Badge Type

```javascript
{
  key: 'status',
  label: 'Status',
  type: 'badge',
  badgeConfig: {
    'Active': 'bg-green-100 text-green-800',
    'Inactive': 'bg-red-100 text-red-800'
  }
}
```

#### 2. Avatar Type

```javascript
{
  key: 'name',
  label: 'User',
  type: 'avatar'  // Akan menampilkan avatar dengan initial
}
```

#### 3. Date Type

```javascript
{
  key: 'createdAt',
  label: 'Created',
  type: 'date'  // Auto format tanggal
}
```

#### 4. Currency Type

```javascript
{
  key: 'price',
  label: 'Price',
  type: 'currency'  // Format mata uang Indonesia
}
```

#### 5. Slot Type

```javascript
{
  key: 'name',
  label: 'User',
  type: 'slot'  // Menggunakan slot untuk custom rendering
}
```

## 🎯 Actions Configuration

### Header Actions

```javascript
const actions = ref([
  {
    label: "Add User",
    icon: PlusIcon,
    variant: "primary", // 'primary' | 'default'
    handler: () => addUser(),
  },
]);
```

### Row Actions

```javascript
const rowActions = ref([
  {
    key: "edit",
    label: "Edit",
    icon: PencilIcon,
    variant: "edit", // 'view' | 'edit' | 'delete' | 'default'
    handler: (row, index) => editRow(row),
  },
]);
```

## 🔍 Filters Configuration

```javascript
const filters = ref([
  {
    key: "status", // Key untuk filtering
    label: "Status", // Label dropdown
    placeholder: "All Status", // Placeholder option
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
]);
```

## 🎪 Custom Slots

### Named Slots per Column

```vue
<ReusableTable :data="data" :columns="columns">
  <!-- Slot name sesuai dengan column key -->
  <template #name="{ value, row, index }">
    <div class="flex items-center">
      <img :src="row.avatar" class="w-8 h-8 rounded-full" />
      <span class="ml-2">{{ value }}</span>
    </div>
  </template>
  
  <template #department="{ value }">
    <span class="inline-flex items-center">
      <span class="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
      {{ value }}
    </span>
  </template>
</ReusableTable>
```

## 📡 Events

```vue
<ReusableTable
  :data="data"
  :columns="columns"
  @search="handleSearch"
  @sort="handleSort"
  @filter="handleFilter"
  @select="handleSelect"
  @row-click="handleRowClick"
  @export="handleExport"
  @refresh="handleRefresh"
/>
```

### Event Handlers

```javascript
const handleSearch = (searchTerm) => {
  console.log("Search:", searchTerm);
};

const handleSort = ({ key, direction }) => {
  console.log("Sort:", key, direction);
};

const handleFilter = (filters) => {
  console.log("Active filters:", filters);
};

const handleSelect = (selectedIds) => {
  console.log("Selected rows:", selectedIds);
};

const handleRowClick = (row, index) => {
  console.log("Row clicked:", row);
};
```

## 🎨 Styling & Theming

### Custom CSS Classes

```vue
<ReusableTable
  :data="data"
  :columns="columns"
  class-name="custom-table-wrapper"
  header-class-name="bg-blue-50"
  table-class-name="text-sm"
/>
```

### Badge Colors

```javascript
// Predefined badge colors
const badgeConfig = {
  Active: "bg-green-100 text-green-800 border-green-200",
  Inactive: "bg-red-100 text-red-800 border-red-200",
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
};
```

## 💡 Advanced Examples

### 1. User Management Table

```vue
<ReusableTable
  :data="users"
  :columns="userColumns"
  :actions="headerActions"
  :row-actions="rowActions"
  :filters="userFilters"
  title="User Management"
  subtitle="Manage team members and permissions"
  :searchable="true"
  :sortable="true"
  :filterable="true"
  :selectable="true"
  :show-row-numbers="true"
  search-placeholder="Search users..."
/>
```

### 2. Simple Product List

```vue
<ReusableTable
  :data="products"
  :columns="productColumns"
  title="Products"
  :searchable="true"
  :filterable="false"
  :selectable="false"
  :show-export="false"
  :show-refresh="false"
/>
```

### 3. Minimal Order History

```vue
<ReusableTable
  :data="orders"
  :columns="orderColumns"
  title="Recent Orders"
  :searchable="false"
  :sortable="false"
  :paginated="false"
  :show-header="false"
  :show-footer="false"
/>
```

## 🔄 Data Management

### Reactive Data

```javascript
const tableData = ref([]);

// Update data
const refreshData = async () => {
  try {
    const response = await api.getUsers();
    tableData.value = response.data;
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }
};
```

### Server-side Operations

```javascript
// Server-side search
const handleSearch = async (term) => {
  const response = await api.searchUsers(term);
  tableData.value = response.data;
};

// Server-side sorting
const handleSort = async ({ key, direction }) => {
  const response = await api.getUsers({ sortBy: key, order: direction });
  tableData.value = response.data;
};
```

## 🚨 Best Practices

1. **Performance**: Gunakan `v-memo` untuk data besar
2. **Accessibility**: Pastikan semua aksi memiliki label yang jelas
3. **Mobile**: Test responsiveness pada berbagai ukuran layar
4. **Loading States**: Tampilkan loading indicator saat fetch data
5. **Error Handling**: Handle error dengan graceful fallback

## 🛠️ Dependencies

- Vue 3 (Composition API)
- @heroicons/vue (untuk icons)
- Tailwind CSS (untuk styling)
