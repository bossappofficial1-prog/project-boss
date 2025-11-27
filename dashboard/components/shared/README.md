# Shared Components

Reusable components untuk digunakan di seluruh dashboard application.

## 📦 Components

### DataTable

Generic table component dengan features lengkap.

**Features:**
- ✅ Sorting
- ✅ Row selection (single/bulk)
- ✅ Row actions
- ✅ Loading skeleton
- ✅ Empty state
- ✅ Custom cell rendering

**Usage:**
```typescript
import { DataTable } from '@/components/shared/DataTable';
import { TableColumn, TableAction } from '@/types';

const columns: TableColumn<User>[] = [
  { 
    key: 'name', 
    title: 'Nama', 
    sortable: true 
  },
  { 
    key: 'email', 
    title: 'Email' 
  },
  {
    key: 'role',
    title: 'Role',
    render: (value) => <Badge>{value}</Badge>
  }
];

const actions: TableAction<User>[] = [
  {
    label: 'Edit',
    onClick: (user) => handleEdit(user),
    variant: 'default'
  }
];

<DataTable
  data={users}
  columns={columns}
  actions={actions}
  selectable
  loading={isLoading}
  onSort={handleSort}
/>
```

---

### Pagination

Reusable pagination component dengan navigasi lengkap.

**Features:**
- ✅ Page navigation
- ✅ Page size selector
- ✅ Info display
- ✅ Responsive design
- ✅ First/Last page buttons

**Usage:**
```typescript
import { Pagination } from '@/components/shared/Pagination';

<Pagination
  page={page}
  pageSize={pageSize}
  total={total}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
/>
```

---

### ExampleUsersPage

Complete example implementation menggunakan semua pattern baru.

**Demo:**
- Factory hooks (useUsersV3)
- DataTable component
- Pagination component
- Table state management (useTableState)
- Filters & search
- Bulk operations

**Copy pattern ini untuk fitur baru!**

---

## 🎯 Best Practices

1. **Gunakan DataTable** untuk semua list view
2. **Gunakan Pagination** untuk paginasi
3. **Follow pattern** di ExampleUsersPage
4. **Consistent styling** dengan shadcn/ui
5. **Type-safe** - gunakan types dari `@/types`

---

## 📚 Related Docs

- [Refactoring Guide](../../docs/REFACTORING_GUIDE.md)
- [Refactoring Summary](../../docs/REFACTORING_SUMMARY.md)
