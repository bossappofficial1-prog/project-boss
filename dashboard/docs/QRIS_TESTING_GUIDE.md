# 🧪 Quick Testing Guide - QRIS Upload Feature

## Persiapan Testing

### 1. Backend Setup
```bash
cd backend

# Jalankan migration (jika belum)
npx prisma migrate dev --name add_qris_image_to_outlet
npx prisma generate

# Start backend
npm run dev
```

### 2. Dashboard Setup
```bash
cd dashboard

# Install dependencies (jika belum)
npm install

# Start development server
npm run dev
```

### 3. Login sebagai Owner
- Buka browser: http://localhost:3000
- Login dengan akun owner yang sudah memiliki business dan outlet

---

## Test Scenarios

### ✅ Test 1: Upload QRIS Pertama Kali

**Steps:**
1. Di halaman dashboard owner
2. Hover mouse ke salah satu outlet card
3. Lihat 3 tombol muncul di kanan atas card
4. Klik tombol **QRIS** (hijau, icon QR code)
5. Modal "Upload QRIS" terbuka
6. Pastikan terlihat text "Belum ada QRIS diupload"
7. Klik tombol "Pilih Gambar QRIS"
8. Pilih file gambar QRIS (JPG/PNG/WebP, < 2MB)
9. Preview gambar muncul
10. Klik tombol "Upload QRIS"
11. Loading indicator tampil
12. Toast success "QRIS berhasil diupload" muncul
13. Modal tertutup
14. Badge hijau "QRIS Aktif" muncul di outlet card

**Expected Result:**
- ✅ Upload berhasil
- ✅ Badge "QRIS Aktif" muncul
- ✅ File tersimpan di `backend/uploads/qris/`

---

### ✅ Test 2: View QRIS yang Sudah Ada

**Steps:**
1. Hover ke outlet yang sudah punya QRIS (ada badge "QRIS Aktif")
2. Klik tombol QRIS (hijau)
3. Modal terbuka

**Expected Result:**
- ✅ Preview QRIS image yang sudah diupload tampil
- ✅ Text "QRIS saat ini" muncul di bawah preview
- ✅ Tombol "Hapus QRIS" tersedia (warna merah)

---

### ✅ Test 3: Update/Replace QRIS

**Steps:**
1. Buka modal QRIS dari outlet yang sudah punya QRIS
2. Klik "Pilih Gambar QRIS"
3. Pilih file QRIS yang baru
4. Preview berubah ke gambar baru
5. Klik "Upload QRIS"
6. Loading tampil
7. Success toast muncul
8. Modal tertutup

**Expected Result:**
- ✅ File lama terhapus dari server
- ✅ File baru tersimpan
- ✅ Badge "QRIS Aktif" tetap ada

**Verify:**
```bash
# Cek folder backend/uploads/qris/
# Seharusnya hanya ada 1 file untuk outlet tersebut
ls backend/uploads/qris/
```

---

### ✅ Test 4: Delete QRIS

**Steps:**
1. Buka modal QRIS dari outlet yang punya QRIS
2. Klik tombol "Hapus QRIS" (merah)
3. Browser confirm dialog muncul
4. Klik "OK"
5. Loading indicator tampil
6. Success toast "QRIS berhasil dihapus" muncul
7. Modal tertutup

**Expected Result:**
- ✅ QRIS terhapus dari database
- ✅ File terhapus dari `backend/uploads/qris/`
- ✅ Badge "QRIS Aktif" hilang dari card

**Verify:**
```bash
# File seharusnya sudah terhapus
ls backend/uploads/qris/
```

---

### ❌ Test 5: Upload File Invalid (Non-Image)

**Steps:**
1. Buka modal QRIS
2. Klik "Pilih Gambar QRIS"
3. Pilih file PDF atau TXT
4. Lihat response

**Expected Result:**
- ✅ Error toast: "File harus berupa gambar"
- ✅ Preview tidak berubah
- ✅ Tombol upload tidak muncul

---

### ❌ Test 6: Upload File Terlalu Besar

**Steps:**
1. Buka modal QRIS
2. Pilih file gambar > 2MB
3. Lihat response

**Expected Result:**
- ✅ Error toast: "Ukuran file maksimal 2MB"
- ✅ Preview tidak berubah
- ✅ File tidak terupload

---

### ✅ Test 7: Cancel Upload

**Steps:**
1. Buka modal QRIS
2. Pilih file baru
3. Preview muncul
4. **Jangan klik upload**
5. Klik X atau klik di luar modal untuk close
6. Modal tertutup

**Expected Result:**
- ✅ Tidak ada perubahan pada QRIS
- ✅ File tidak terupload

---

### ✅ Test 8: Cancel Delete

**Steps:**
1. Buka modal QRIS yang sudah ada QRIS
2. Klik "Hapus QRIS"
3. Confirm dialog muncul
4. Klik "Cancel"

**Expected Result:**
- ✅ QRIS tidak terhapus
- ✅ Modal tetap terbuka
- ✅ Preview QRIS masih tampil

---

## 🔍 Visual Testing Checklist

### Outlet Card
- [ ] Tombol QRIS (hijau) muncul saat hover
- [ ] Icon QR code terlihat jelas
- [ ] Tooltip "Upload QRIS" muncul saat hover tombol
- [ ] Badge "QRIS Aktif" muncul jika ada QRIS
- [ ] Badge warna hijau dengan checkmark icon

### Modal
- [ ] Header menampilkan nama outlet dengan benar
- [ ] Preview area responsive
- [ ] Image preview proporsional (tidak stretched)
- [ ] Tombol "Pilih Gambar QRIS" terlihat jelas
- [ ] Info validasi (Format & Max size) terlihat
- [ ] Loading state tampil dengan spinner
- [ ] Tombol upload/delete sesuai state

### Responsiveness
- [ ] Modal responsive di mobile view
- [ ] Button sizes sesuai di berbagai screen size
- [ ] Preview image tidak overflow

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to upload QRIS"
**Causes:**
- Backend tidak running
- Token expired
- Network error

**Solutions:**
```bash
# Cek backend running
curl http://localhost:5000/health

# Cek token masih valid
# Re-login jika perlu
```

### Issue 2: Image tidak muncul setelah upload
**Causes:**
- Static file serving belum dikonfigurasi
- Path tidak benar

**Solutions:**
```typescript
// backend/src/app.ts
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
```

### Issue 3: Badge tidak update setelah upload/delete
**Cause:**
- `refetch()` tidak dipanggil

**Solution:**
- Pastikan `onQRISUpdate={refetch}` di OutletsSection
- Pastikan `onSuccess` dipanggil di modal

### Issue 4: CORS error
**Solution:**
```typescript
// backend/src/app.ts
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

## 📊 Backend Verification

### Cek Database
```bash
# Masuk ke Prisma Studio
cd backend
npx prisma studio

# Lihat Outlet table
# Kolom qrisImage seharusnya terisi dengan path relatif
# Contoh: "qris/qris-uuid.png"
```

### Cek Files
```bash
# List files di folder QRIS
ls -lah backend/uploads/qris/

# Setiap file format: qris-{uuid}.{ext}
# Contoh: qris-abc123def.png
```

### Cek Logs
```bash
# Backend logs saat upload
# Lihat console untuk success/error messages
```

---

## ✅ Final Checklist

Testing lengkap jika:

- [ ] Upload QRIS baru berhasil
- [ ] View QRIS existing berhasil
- [ ] Update/replace QRIS berhasil
- [ ] Delete QRIS berhasil
- [ ] Validasi file type berfungsi
- [ ] Validasi file size berfungsi
- [ ] Cancel actions tidak ada side effect
- [ ] Badge "QRIS Aktif" update dengan benar
- [ ] Modal UI/UX smooth dan responsive
- [ ] Toast notifications muncul dengan benar
- [ ] Loading states berfungsi
- [ ] File tersimpan di backend dengan benar
- [ ] Database terupdate dengan benar

---

## 📝 Test Report Template

```markdown
## QRIS Upload Feature - Test Report

**Tester:** [Nama]
**Date:** [Tanggal]
**Environment:** Development/Production

### Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Upload QRIS Baru | ✅/❌ | |
| View QRIS | ✅/❌ | |
| Update QRIS | ✅/❌ | |
| Delete QRIS | ✅/❌ | |
| File Validation | ✅/❌ | |
| UI/UX | ✅/❌ | |
| Responsiveness | ✅/❌ | |

### Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Steps to reproduce:
   - Expected vs Actual:

### Recommendations
1. [Recommendation]
```

---

**Happy Testing! 🎉**
