# 📱 Fitur Upload QRIS untuk Owner Dashboard

## 🎯 Overview

Fitur upload QRIS memungkinkan owner untuk mengelola (upload, view, delete) gambar QRIS untuk setiap outlet mereka. QRIS ini akan digunakan oleh customer untuk melakukan pembayaran manual via scanning QRIS code.

---

## ✨ Fitur yang Ditambahkan

### 1. **QRISUploadModal Component**
**Path**: `dashboard/components/modals/QRISUploadModal.tsx`

Modal dialog untuk upload dan manage QRIS outlet dengan fitur:
- ✅ Upload gambar QRIS baru
- ✅ Preview gambar QRIS (existing atau yang baru dipilih)
- ✅ Delete gambar QRIS yang sudah ada
- ✅ Validasi file (type & size)
- ✅ Loading states untuk better UX
- ✅ Error handling dengan toast notifications

**Props:**
```typescript
interface QRISUploadModalProps {
  open: boolean;                    // Modal visibility
  onOpenChange: (open: boolean) => void;
  outlet: {
    id: string;
    name: string;
    qrisImage?: string | null;
  } | null;
  onSuccess?: () => void;           // Callback setelah upload/delete success
}
```

**Validasi:**
- File type: harus image (image/*)
- Max size: 2MB
- Konfirmasi sebelum delete

---

### 2. **API Integration**
**Path**: `dashboard/lib/apis/outlet.ts`

Menambahkan 3 fungsi API baru:

```typescript
// Get QRIS info untuk outlet
getQRIS: (outletId: string) => Promise<{
  outletId: string;
  outletName: string;
  qrisImageUrl: string | null;
}>

// Upload QRIS image
uploadQRIS: (outletId: string, file: File) => Promise<any>

// Delete QRIS image
deleteQRIS: (outletId: string) => Promise<any>
```

**Endpoints yang digunakan:**
- GET `/api/v1/outlets/:id/qris` - Get QRIS info
- POST `/api/v1/outlets/:id/qris` - Upload QRIS
- DELETE `/api/v1/outlets/:id/qris` - Delete QRIS

---

### 3. **OutletsSection Enhancement**
**Path**: `dashboard/components/owner/dashboard/OutletsSection.tsx`

**Perubahan:**
- ✅ Menambahkan tombol QRIS (hijau dengan icon QR code) di action buttons
- ✅ Menampilkan badge "QRIS Aktif" jika outlet sudah punya QRIS
- ✅ Integrasi QRISUploadModal
- ✅ Handler untuk QRIS actions

**New Props:**
```typescript
interface OutletsSectionProps {
  // ... existing props
  onQRISUpdate?: () => void;  // Callback untuk refetch data setelah QRIS update
}
```

**Visual Indicators:**
- Tombol QRIS hijau di action buttons (muncul saat hover card)
- Badge "QRIS Aktif" dengan warna hijau jika outlet sudah memiliki QRIS

---

### 4. **Type Definitions**
**Paths**: 
- `dashboard/types/dashboard.ts`
- `dashboard/types/index.ts`

**Update pada Outlet interface:**
```typescript
export interface Outlet {
  id: string;
  name: string;
  address: string;
  phone?: string;
  image?: string;
  latitude?: number;
  longitude?: number;
  qrisImage?: string | null;  // ✅ New field
}
```

---

## 🎨 User Interface

### Action Buttons pada Outlet Card

Saat hover pada card outlet, akan muncul 3 tombol action:

1. **🟢 QRIS** (Hijau) - Upload/manage QRIS
2. **🔵 Edit** (Biru) - Edit outlet
3. **🔴 Delete** (Merah) - Hapus outlet

### QRIS Upload Modal

Modal terdiri dari:
1. **Header** - Judul dengan nama outlet
2. **Preview Area** - Menampilkan preview QRIS image
3. **File Selection** - Tombol untuk memilih file
4. **Action Buttons** - Upload atau Delete (tergantung state)

### Status Indicators

**Badge "QRIS Aktif"** (hijau dengan checkmark icon) muncul di card outlet jika outlet sudah memiliki QRIS.

---

## 🔄 User Flow

### Upload QRIS Pertama Kali

1. Owner hover pada outlet card
2. Klik tombol QRIS (hijau)
3. Modal terbuka menampilkan "Belum ada QRIS diupload"
4. Klik "Pilih Gambar QRIS"
5. Pilih file image dari device
6. Preview muncul dengan info file
7. Klik "Upload QRIS"
8. Loading indicator tampil
9. Success toast muncul
10. Modal tertutup
11. Badge "QRIS Aktif" muncul di card outlet

### Update QRIS (Replace)

1. Owner hover pada outlet card yang sudah punya QRIS
2. Klik tombol QRIS (hijau)
3. Modal terbuka menampilkan QRIS yang ada
4. Klik "Pilih Gambar QRIS" untuk ganti
5. Pilih file baru
6. Preview berubah ke file baru
7. Klik "Upload QRIS"
8. File lama otomatis terhapus di backend
9. File baru tersimpan
10. Success toast muncul

### Delete QRIS

1. Owner hover pada outlet card yang punya QRIS
2. Klik tombol QRIS (hijau)
3. Modal terbuka menampilkan QRIS yang ada
4. Klik "Hapus QRIS"
5. Konfirmasi dialog muncul
6. Klik "OK"
7. Loading indicator tampil
8. QRIS terhapus dari backend
9. Success toast muncul
10. Badge "QRIS Aktif" hilang dari card

---

## 🔐 Security & Validation

### Client-side Validation

1. **File Type** - Harus image (checked via `file.type.startsWith('image/')`)
2. **File Size** - Maksimal 2MB
3. **Delete Confirmation** - Browser confirm dialog sebelum delete

### Backend Validation

(Mengacu pada backend implementation yang sudah ada)

1. **Authentication** - JWT token required untuk upload/delete
2. **Authorization** - Hanya owner business yang bisa manage QRIS outlet
3. **File Type** - MIME type validation
4. **File Size** - Max 2MB
5. **Ownership** - Verify owner memiliki business yang outlet belong to

---

## 🛠️ Technical Details

### Dependencies

Tidak ada dependency baru. Menggunakan:
- `@/components/ui/dialog` - Shadcn/UI Dialog component
- `@/components/ui/button` - Shadcn/UI Button component
- `sonner` - Toast notifications (sudah ada)
- `next/image` - Image optimization

### Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000  # Backend API URL
```

### API Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "QRIS uploaded successfully",
  "data": {
    "outletId": "outlet-uuid",
    "qrisImageUrl": "http://localhost:5000/uploads/qris/qris-uuid.png"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

---

## 📝 Integration Checklist

### Frontend (Dashboard)

- [x] Create QRISUploadModal component
- [x] Add QRIS API functions to outlet.ts
- [x] Update OutletsSection with QRIS button
- [x] Add QRIS status indicator
- [x] Update Outlet type with qrisImage field
- [x] Integrate modal to dashboard page
- [x] Add onQRISUpdate callback

### Backend (Already Implemented)

Refer to: `QRIS_IMPLEMENTATION_SUMMARY.md`

- [x] Add qrisImage field to Outlet model
- [x] Create migration
- [x] POST /api/v1/outlets/:id/qris endpoint
- [x] GET /api/v1/outlets/:id/qris endpoint
- [x] DELETE /api/v1/outlets/:id/qris endpoint
- [x] File upload handling with Multer
- [x] Ownership validation
- [x] Auto-delete old file on update

---

## 🧪 Testing

### Manual Testing Steps

1. **Upload QRIS Baru**
   - ✅ Pilih file dengan format valid (JPG, PNG, WebP)
   - ✅ File size kurang dari 2MB
   - ✅ Preview muncul dengan benar
   - ✅ Upload berhasil dan badge "QRIS Aktif" muncul

2. **Upload dengan File Invalid**
   - ✅ Pilih file non-image → Error toast muncul
   - ✅ Pilih file > 2MB → Error toast muncul

3. **Update QRIS**
   - ✅ Pilih file baru
   - ✅ Preview berubah ke file baru
   - ✅ Upload berhasil
   - ✅ File lama terhapus

4. **Delete QRIS**
   - ✅ Klik hapus → Konfirmasi muncul
   - ✅ Konfirmasi delete → QRIS terhapus
   - ✅ Badge "QRIS Aktif" hilang

5. **Cancel Operations**
   - ✅ Close modal sebelum upload → No changes
   - ✅ Cancel delete confirmation → QRIS tetap ada

---

## 🚀 Deployment

### Prerequisites

1. Backend migration sudah dijalankan:
   ```bash
   cd backend
   npx prisma migrate dev --name add_qris_image_to_outlet
   npx prisma generate
   ```

2. Folder `backend/uploads/qris/` exists dengan write permission

3. Backend serve static files dari `/uploads` path

### Environment Setup

Pastikan `NEXT_PUBLIC_API_URL` di dashboard pointing ke backend URL yang benar.

**Development:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Production:**
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 📦 Files Modified/Created

### Created Files
1. `dashboard/components/modals/QRISUploadModal.tsx`
2. `dashboard/docs/QRIS_UPLOAD_FEATURE.md` (this file)

### Modified Files
1. `dashboard/components/owner/dashboard/OutletsSection.tsx`
2. `dashboard/lib/apis/outlet.ts`
3. `dashboard/types/dashboard.ts`
4. `dashboard/types/index.ts`
5. `dashboard/app/owner/dashboard/page.tsx`

---

## 🎯 Next Steps

### Recommended Enhancements

1. **Crop/Resize Tool** - Add image cropping before upload
2. **Image Optimization** - Compress image client-side sebelum upload
3. **Drag & Drop** - Support drag & drop untuk file upload
4. **Bulk Upload** - Upload QRIS untuk multiple outlets sekaligus
5. **QRIS Testing** - Button untuk test scan QRIS
6. **Analytics** - Track berapa kali QRIS di-scan/digunakan

### Integration dengan Customer App

Implementasi di `frontend-customer`:
1. Tampilkan QRIS saat customer checkout
2. Show outlet info dengan QRIS
3. Upload payment proof setelah scan
4. Track payment status

---

## 📞 Support & Documentation

- **Backend API Docs**: `backend/docs/QRIS_API_DOCUMENTATION.md`
- **Backend Implementation**: `QRIS_IMPLEMENTATION_SUMMARY.md`
- **Quick Start**: `QRIS_QUICK_START.md`

---

**Status**: ✅ **COMPLETED**  
**Date**: January 2025  
**Version**: 1.0.0  
**Author**: AI Assistant  
**Module**: Dashboard Owner - QRIS Management
