# Simulasi Perhitungan Fee Dinamis

## Test Case 1: QRIS Payment

**Subtotal Belanja:** Rp 100.000

**Sebelum memilih payment method:**

- Total: Rp 100.000

**Setelah pilih QRIS:**

- Subtotal: Rp 100.000
- Transaction Fee (0.7%): Rp 700
- Application Fee (3%): Rp 3.000
- **Grand Total: Rp 103.700**

## Test Case 2: Virtual Account Payment

**Subtotal Belanja:** Rp 100.000

**Sebelum memilih payment method:**

- Total: Rp 100.000

**Setelah pilih VA (BCA, BNI, etc):**

- Subtotal: Rp 100.000
- Transaction Fee (flat): Rp 4.000
- Application Fee (3%): Rp 3.000
- **Grand Total: Rp 107.000**

## Test Case 3: Perbandingan

**Subtotal Belanja:** Rp 50.000

**QRIS:**

- Transaction Fee: Rp 350 (0.7%)
- Application Fee: Rp 1.500 (3%)
- Total: Rp 51.850

**Virtual Account:**

- Transaction Fee: Rp 4.000 (flat)
- Application Fee: Rp 1.500 (3%)
- Total: Rp 55.500

**Kesimpulan:** QRIS lebih murah untuk transaksi kecil, VA lebih ekonomis untuk transaksi besar.
