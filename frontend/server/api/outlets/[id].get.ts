export default defineEventHandler(async (event) => {
  const outletId = getRouterParam(event, 'id')

  // Dummy business (1 bisnis)
  const dummyBusiness = {
    id: 'business-1',
    name: 'Kopi Sedap',
    description: 'Kedai kopi lokal Padang',
    createdAt: new Date(),
    updatedAt: new Date(),
    bankName: 'BCA',
    bankAccount: '1234567890',
    accountHolder: 'Budi Owner'
  }

  // Dummy products milik outlet
  const dummyProducts = [
    {
      id: 'product-1',
      name: 'Kopi Hitam',
      description: 'Kopi hitam tanpa gula',
      price: 15000,
      type: 'BARANG',
      stock: 50,
      unit: 'gelas'
    },
    {
      id: 'product-2',
      name: 'Teh Tarik',
      description: 'Teh susu tarik khas',
      price: 12000,
      type: 'BARANG',
      stock: 30,
      unit: 'gelas'
    },
    {
      id: 'product-3',
      name: 'Voucher Internet',
      description: 'Layanan voucher wifi 1 jam',
      price: 5000,
      type: 'JASA',
      stock: 100,
      unit: 'kode'
    }
  ]

  // Dummy outlet detail
  const outletDetail = {
    id: outletId,
    name: 'Cabang Taplau',
    address: 'Pantai Taplau, Padang',
    phone: '081234567890',
    createdAt: new Date(),
    updatedAt: new Date(),
    business: dummyBusiness,
    products: dummyProducts
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    success: true,
    message: 'Berhasil mengambil detail outlet',
    data: outletDetail,
  }
})
