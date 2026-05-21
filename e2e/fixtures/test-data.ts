export const TEST_PRODUCT = {
  name: "Nasi Goreng Test",
  type: "GOODS" as const,
  price: 25000,
  stock: 50,
  unit: "porsi",
};

export const TEST_SERVICE = {
  name: "Potong Rambut Test",
  type: "SERVICE" as const,
  price: 50000,
  durationMinutes: 60,
};

export const TEST_CATEGORY = {
  name: "Makanan Test",
};

export const TEST_CUSTOMER = {
  name: "Budi Test",
  phone: "081234567890",
};

export const TRANSACTION_FILTERS = {
  typeAll: "Semua Tipe",
  typeIncome: "Pemasukan",
  typeExpense: "Pengeluaran",
  statusSuccess: "Berhasil",
  statusPending: "Pending",
};
