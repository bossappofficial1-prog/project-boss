# QRISViewModal - Reusable QRIS Display Component

## 📖 Deskripsi

`QRISViewModal` adalah komponen modal yang dapat digunakan kembali (reusable) untuk menampilkan QRIS dari outlet. Komponen ini mendukung berbagai skenario penggunaan dengan fitur-fitur seperti download, print, copy URL, dan auto-fetch QRIS data.

## 🎯 Fitur

- ✅ **Auto-fetch QRIS data** - Otomatis mengambil data QRIS dari API jika hanya outletId yang diberikan
- ✅ **Manual data** - Mendukung passing data QRIS secara manual
- ✅ **Download QRIS** - Download gambar QRIS ke local
- ✅ **Print QRIS** - Print QRIS dengan layout yang rapi
- ✅ **Copy URL** - Salin URL QRIS ke clipboard
- ✅ **Responsive** - Tampilan optimal di semua ukuran layar
- ✅ **Dark mode support** - Mendukung tema gelap
- ✅ **Loading state** - Indikator loading saat fetch data
- ✅ **Empty state** - Tampilan yang informatif saat QRIS belum tersedia

## 📦 Props

```typescript
interface QRISViewModalProps {
  open: boolean;                    // State modal terbuka/tertutup
  onOpenChange: (open: boolean) => void;  // Handler untuk mengubah state modal
  outletId?: string;                // ID outlet untuk auto-fetch QRIS
  outletName?: string;              // Nama outlet (opsional)
  qrisImageUrl?: string | null;     // URL gambar QRIS (opsional, jika sudah ada)
  showActions?: boolean;            // Tampilkan tombol upload/hapus (default: false)
  onQRISUpdate?: () => void;        // Callback setelah QRIS diupdate
}
```

## 🚀 Cara Penggunaan

### 1. Import Component

```typescript
import QRISViewModal from '@/components/modals/QRISViewModal';
```

### 2. Scenario 1: Auto-fetch QRIS dari API (Recommended)

Gunakan skenario ini saat Anda hanya memiliki `outletId`. Component akan otomatis mengambil data QRIS dari API.

```typescript
'use client';

import { useState } from 'react';
import QRISViewModal from '@/components/modals/QRISViewModal';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [showQRIS, setShowQRIS] = useState(false);
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');

  const handleViewQRIS = (outletId: string) => {
    setSelectedOutletId(outletId);
    setShowQRIS(true);
  };

  return (
    <>
      <Button onClick={() => handleViewQRIS('outlet-123')}>
        Lihat QRIS
      </Button>

      <QRISViewModal
        open={showQRIS}
        onOpenChange={setShowQRIS}
        outletId={selectedOutletId}
      />
    </>
  );
}
```

### 3. Scenario 2: Passing QRIS Data Secara Manual

Gunakan skenario ini saat Anda sudah memiliki data QRIS (misal dari context atau state).

```typescript
'use client';

import { useState } from 'react';
import { useOutletContext } from '@/components/providers/OutletProvider';
import QRISViewModal from '@/components/modals/QRISViewModal';
import { Button } from '@/components/ui/button';

export default function POSPage() {
  const { selectedOutlet } = useOutletContext();
  const [showQRIS, setShowQRIS] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setShowQRIS(true)}
        disabled={!selectedOutlet?.qrisImage}
      >
        Tampilkan QRIS
      </Button>

      <QRISViewModal
        open={showQRIS}
        onOpenChange={setShowQRIS}
        outletId={selectedOutlet?.id}
        outletName={selectedOutlet?.name}
        qrisImageUrl={selectedOutlet?.qrisImage}
      />
    </>
  );
}
```

### 4. Scenario 3: POS Orders - Tampilkan QRIS saat Pilih Metode Bayar QRIS

Implementasi untuk halaman `/owner/dashboard/pos/orders`:

```typescript
'use client';

import { useState } from 'react';
import { useOutletContext } from '@/components/providers/OutletProvider';
import QRISViewModal from '@/components/modals/QRISViewModal';

export default function POSOrdersPage() {
  const { selectedOutlet } = useOutletContext();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'online'>('cash');
  const [showQRISModal, setShowQRISModal] = useState(false);

  const handlePaymentMethodChange = (method: 'cash' | 'qris' | 'online') => {
    setPaymentMethod(method);
    
    // Tampilkan QRIS modal jika pilih metode QRIS
    if (method === 'qris' && selectedOutlet?.qrisImage) {
      setShowQRISModal(true);
    }
  };

  return (
    <div>
      {/* Payment Method Selection */}
      <select
        value={paymentMethod}
        onChange={(e) => handlePaymentMethodChange(e.target.value as any)}
        className="w-full px-3 py-2 border rounded-lg"
      >
        <option value="cash">Cash / Bayar di Tempat</option>
        <option value="qris">QRIS</option>
        <option value="online">Transfer Online</option>
      </select>

      {/* QRIS Info for selected payment method */}
      {paymentMethod === 'qris' && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span className="text-sm font-medium text-green-800 dark:text-green-300">
                Pembayaran dengan QRIS
              </span>
            </div>
            <button
              onClick={() => setShowQRISModal(true)}
              className="text-sm text-green-600 dark:text-green-400 hover:underline font-medium"
            >
              Tampilkan QR
            </button>
          </div>
        </div>
      )}

      {/* QRIS Modal */}
      <QRISViewModal
        open={showQRISModal}
        onOpenChange={setShowQRISModal}
        outletId={selectedOutlet?.id}
        outletName={selectedOutlet?.name}
        qrisImageUrl={selectedOutlet?.qrisImage}
      />
    </div>
  );
}
```

### 5. Scenario 4: Dashboard - Cek QRIS di Outlet Section

Implementasi untuk halaman `/owner/dashboard`:

```typescript
// Di OutletsSection.tsx atau component serupa

'use client';

import { useState } from 'react';
import QRISViewModal from '@/components/modals/QRISViewModal';

export default function OutletCard({ outlet }: { outlet: Outlet }) {
  const [showViewQRIS, setShowViewQRIS] = useState(false);

  return (
    <div className="outlet-card">
      {/* Outlet info */}
      <div className="outlet-info">
        <h3>{outlet.name}</h3>
        <p>{outlet.address}</p>
      </div>

      {/* QRIS Status Badge */}
      {outlet.qrisImage && (
        <button
          onClick={() => setShowViewQRIS(true)}
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 hover:bg-green-200"
        >
          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          QRIS Aktif - Klik untuk lihat
        </button>
      )}

      {/* View QRIS Modal */}
      <QRISViewModal
        open={showViewQRIS}
        onOpenChange={setShowViewQRIS}
        outletId={outlet.id}
        outletName={outlet.name}
        qrisImageUrl={outlet.qrisImage}
      />
    </div>
  );
}
```

## 🎨 Features Detail

### Download QRIS
Tombol download akan mengunduh gambar QRIS dengan nama file: `QRIS-{outlet-name}.png`

### Print QRIS
Tombol print akan membuka dialog print dengan layout yang sudah dioptimalkan untuk mencetak QRIS dengan informasi outlet.

### Copy URL
Tombol copy akan menyalin URL QRIS ke clipboard untuk keperluan sharing atau lainnya.

## 🔄 Integration dengan API

Component ini menggunakan `outletApi.getQRIS()` dari `/lib/apis/outlet.ts`:

```typescript
// Otomatis dipanggil jika hanya outletId yang diberikan
const data = await outletApi.getQRIS(outletId);
// Returns: {
//   outletId: string;
//   outletName: string;
//   qrisImageUrl: string | null;
// }
```

## 💡 Tips & Best Practices

1. **Use auto-fetch** saat Anda hanya memiliki `outletId` untuk mengurangi kompleksitas
2. **Pass manual data** saat data QRIS sudah tersedia dari context/state untuk menghindari fetch ulang
3. **Check QRIS availability** sebelum menampilkan tombol untuk membuka modal
4. **Provide callback** `onQRISUpdate` jika Anda ingin refresh data setelah QRIS diupdate

## 🎯 Use Cases

✅ Dashboard owner - Cek apakah outlet sudah punya QRIS  
✅ POS Orders - Tampilkan QRIS saat customer pilih metode bayar QRIS  
✅ Settings - Preview QRIS sebelum upload  
✅ Customer facing - Tampilkan QRIS untuk pembayaran  

## 🔗 Related Components

- `QRISUploadModal` - Modal untuk upload/delete QRIS (untuk admin/owner)
- `OutletsSection` - Component yang menampilkan list outlet dengan QRIS indicator

## 📝 Notes

- Modal ini **read-only** secara default (tidak ada fitur upload/delete)
- Untuk fitur upload/delete, gunakan `QRISUploadModal`
- Component ini menggunakan `next/image` untuk optimasi gambar
- Semua action (download, print, copy) sudah dilengkapi dengan toast notification
