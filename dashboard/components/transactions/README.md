# 🎯 Transaction Management - Dashboard

Dokumentasi lengkap untuk manajemen transaksi dan pembayaran di BOSS Dashboard.

## 📁 Struktur File

```
dashboard/
├── lib/
│   ├── apis/
│   │   └── transaction.ts          # Transaction API calls
│   ├── api.ts                       # Export barrel (updated)
│   └── utils/
│       └── authorization.ts         # Role-based access control
├── hooks/
│   └── useTransactions.ts           # Transaction hooks
└── components/
    └── transactions/
        ├── ApprovePaymentButton.tsx # Approve button component
        ├── RejectPaymentButton.tsx  # Reject button component
        └── index.ts                 # Component exports
```

---

## 🚀 Cara Penggunaan

### 1. Import Components

```typescript
import { ApprovePaymentButton, RejectPaymentButton } from '@/components/transactions';
```

### 2. Gunakan di Page

```typescript
'use client';

import { ApprovePaymentButton, RejectPaymentButton } from '@/components/transactions';
import { useTransactions } from '@/hooks/useTransactions';

export default function TransactionDetailPage({ params }: { params: { id: string } }) {
  const { useTransaction } = useTransactions();
  const { data, isLoading } = useTransaction(params.id);

  if (isLoading) return <div>Loading...</div>;
  if (!data?.data) return <div>Transaction not found</div>;

  const transaction = data.data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Detail Transaksi</h1>
        
        {/* Buttons hanya muncul jika status PENDING */}
        {transaction.status === 'PENDING' && (
          <div className="flex gap-2">
            <ApprovePaymentButton 
              transactionId={transaction.id}
              onSuccess={() => {
                console.log('Payment approved!');
              }}
            />
            <RejectPaymentButton 
              transactionId={transaction.id}
              onSuccess={() => {
                console.log('Payment rejected!');
              }}
            />
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <p><strong>Amount:</strong> Rp {transaction.amount.toLocaleString()}</p>
        <p><strong>Status:</strong> {transaction.status}</p>
        <p><strong>Order ID:</strong> {transaction.orderId}</p>
      </div>
    </div>
  );
}
```

### 3. Gunakan di Table

```typescript
import { ApprovePaymentButton, RejectPaymentButton } from '@/components/transactions';
import { useTransactions } from '@/hooks/useTransactions';

export function TransactionTable() {
  const { useTransactionList } = useTransactions();
  const { data, isLoading } = useTransactionList({ page: 1, limit: 10 });

  const columns = [
    {
      id: 'id',
      header: 'ID',
      cell: ({ row }) => row.original.id
    },
    {
      id: 'amount',
      header: 'Amount',
      cell: ({ row }) => `Rp ${row.original.amount.toLocaleString()}`
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => row.original.status
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const transaction = row.original;
        
        if (transaction.status !== 'PENDING') return null;
        
        return (
          <div className="flex gap-2">
            <ApprovePaymentButton 
              transactionId={transaction.id} 
              size="sm" 
            />
            <RejectPaymentButton 
              transactionId={transaction.id} 
              size="sm" 
            />
          </div>
        );
      }
    }
  ];

  // ... rest of table implementation
}
```

### 4. Custom Hooks Usage

```typescript
import { useTransactions } from '@/hooks/useTransactions';

function MyComponent() {
  const { 
    useTransactionList, 
    useTransaction, 
    useApprovePayment,
    useRejectPayment,
    useUpdateStatus
  } = useTransactions();

  // Get list with pagination
  const { data: transactions, isLoading } = useTransactionList({ 
    page: 1, 
    limit: 10,
    status: 'PENDING'
  });

  // Get single transaction
  const { data: transaction } = useTransaction('transaction-id');

  // Approve mutation
  const { mutate: approve, isPending: isApproving } = useApprovePayment();

  // Reject mutation
  const { mutate: reject, isPending: isRejecting } = useRejectPayment();

  const handleApprove = (id: string) => {
    approve(id, {
      onSuccess: () => console.log('Approved!'),
      onError: (error) => console.error(error)
    });
  };

  const handleReject = (id: string, reason?: string) => {
    reject(
      { id, reason },
      {
        onSuccess: () => console.log('Rejected!'),
        onError: (error) => console.error(error)
      }
    );
  };

  // ... component logic
}
```

---

## 🔐 Authorization

Button components secara otomatis mengecek role user. Hanya user dengan role `OWNER` atau `ADMIN` yang dapat melihat dan menggunakan button approve/reject.

```typescript
import { Authorization } from '@/lib/utils/authorization';
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user } = useAuth();

  // Manual check jika diperlukan
  if (Authorization.canApprovePayment(user?.role)) {
    // Show approve functionality
  }

  if (Authorization.canRejectPayment(user?.role)) {
    // Show reject functionality
  }

  // Utility lainnya
  const isOwner = Authorization.isOwner(user?.role);
  const canManageUsers = Authorization.canManageUsers(user?.role);
  const canExport = Authorization.canExportTransactions(user?.role);
}
```

---

## 🎨 Customization Options

### ApprovePaymentButton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `transactionId` | `string` | - | **Required**. ID transaksi |
| `disabled` | `boolean` | `false` | Disable button |
| `variant` | `'default' \| 'outline' \| 'ghost'` | `'default'` | Button variant |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'sm'` | Button size |
| `onSuccess` | `() => void` | - | Callback setelah approve berhasil |

### RejectPaymentButton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `transactionId` | `string` | - | **Required**. ID transaksi |
| `disabled` | `boolean` | `false` | Disable button |
| `variant` | `'default' \| 'outline' \| 'ghost' \| 'destructive'` | `'destructive'` | Button variant |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'sm'` | Button size |
| `onSuccess` | `() => void` | - | Callback setelah reject berhasil |

### Examples

```typescript
// Variant default
<ApprovePaymentButton transactionId={id} />

// Outline variant
<ApprovePaymentButton transactionId={id} variant="outline" />

// Large size
<ApprovePaymentButton transactionId={id} size="lg" />

// With callback
<ApprovePaymentButton 
  transactionId={id} 
  onSuccess={() => router.push('/transactions')}
/>

// Disabled
<ApprovePaymentButton transactionId={id} disabled={true} />
```

---

## 📡 API Integration

### Transaction API Endpoints

API menggunakan base URL dari environment variable `NEXT_PUBLIC_API_BASE_URL`.

#### Get All Transactions
```
GET /transactions?page=1&limit=10&status=PENDING
```

#### Get Transaction by ID
```
GET /transactions/:id
```

#### Approve Payment
```
PATCH /transactions/:id/approve
```

#### Reject Payment
```
PATCH /transactions/:id/reject
Body: { reason?: string }
```

#### Update Status
```
PATCH /transactions/:id/status
Body: { status: string }
```

---

## ✅ Features

1. **Centralized API** - Satu tempat untuk semua transaction API calls
2. **Type Safety** - Full TypeScript support dengan interface
3. **Auto Invalidation** - React Query auto-invalidate setelah mutasi
4. **Toast Notifications** - Success/error toast otomatis
5. **Role Validation** - Auto-check role user
6. **Loading States** - Built-in loading indicators
7. **Confirmation Dialog** - Konfirmasi sebelum approve
8. **Optional Reason** - Alasan penolakan untuk reject
9. **Reusable Components** - Pakai di mana saja
10. **Consistent UX** - Pengalaman user yang seragam

---

## 🧪 Testing Checklist

- [ ] Test approve payment dengan role OWNER
- [ ] Test approve payment dengan role ADMIN
- [ ] Test approve payment dengan role USER (should not show button)
- [ ] Test reject payment dengan alasan
- [ ] Test reject payment tanpa alasan
- [ ] Test loading state saat approve/reject
- [ ] Test error handling (network error, validation error)
- [ ] Test button disabled state
- [ ] Test callback onSuccess
- [ ] Test di berbagai ukuran layar (responsive)

---

## 🔧 Troubleshooting

### Button tidak muncul
- Cek role user dengan `useAuth()`
- Pastikan user memiliki role `OWNER` atau `ADMIN`
- Cek console untuk error

### API call gagal
- Cek environment variable `NEXT_PUBLIC_API_BASE_URL`
- Cek CORS configuration di backend
- Cek network tab di browser DevTools

### Toast tidak muncul
- Pastikan `<Toaster />` dari `sonner` sudah di-render di root layout
- Cek apakah ada error di console

### Type errors
- Jalankan `npm run build` untuk cek TypeScript errors
- Update types di `lib/apis/transaction.ts` sesuai backend response

---

## 📚 Related Documentation

- [React Query Docs](https://tanstack.com/query/latest)
- [Shadcn/UI Components](https://ui.shadcn.com)
- [BOSS Project Instructions](../../.github/instructions/copilot-instructions.md)

---

**Created**: 12 Oktober 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
