import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler((event) => {
  const { page = 1, limit = 6, search = '' } = getQuery(event)

  const dummyBusinesses = [
    {
      id: 'business-1',
      name: 'Kopi Sedap',
      description: 'Kedai kopi lokal Padang',
    },
    {
      id: 'business-2',
      name: 'Ayam Bakar Nendang',
      description: 'Ayam bakar enak dan pedas',
    },
    {
      id: 'business-3',
      name: 'Laundry Kilat',
      description: 'Jasa cuci cepat bersih',
    },
  ]

  const allOutlets = [
    {
      id: 'outlet-1',
      name: 'Cabang Taplau',
      address: 'Pantai Taplau, Padang',
      phone: '081234567890',
      business: dummyBusinesses[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'outlet-2',
      name: 'Outlet Pusat',
      address: 'Jl. Veteran, Padang',
      phone: '081298877665',
      business: dummyBusinesses[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'outlet-3',
      name: 'Cabang Andalas',
      address: 'Jl. Andalas, Padang',
      phone: '081234009988',
      business: dummyBusinesses[1],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'outlet-4',
      name: 'Cabang Padang Baru',
      address: 'Jl. Padang Baru',
      phone: '082277889900',
      business: dummyBusinesses[2],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'outlet-5',
      name: 'Cabang Ulak Karang',
      address: 'Jl. Ulak Karang',
      phone: '082233445566',
      business: dummyBusinesses[0],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'outlet-6',
      name: 'Cabang Siteba',
      address: 'Jl. Siteba',
      phone: '081277889900',
      business: dummyBusinesses[1],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'outlet-7',
      name: 'Cabang Kampung Jao',
      address: 'Jl. Kampung Jao',
      phone: '081299887766',
      business: dummyBusinesses[2],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  // Filter by search query (cari di name atau address)
  const filtered = allOutlets.filter((outlet) =>
    `${outlet.name} ${outlet.address}`.toLowerCase().includes((search as string).toLowerCase())
  )

  // Pagination
  const pageInt = parseInt(page as string)
  const limitInt = parseInt(limit as string)
  const start = (pageInt - 1) * limitInt
  const end = start + limitInt
  const paginatedOutlets = filtered.slice(start, end)

  const totalPages = Math.ceil(filtered.length / limitInt)

  return {
    success: true,
    message: 'Berhasil mengambil daftar outlet',
    data: paginatedOutlets,
    pagination: {
      page: pageInt,
      limit: limitInt,
      total: filtered.length,
      totalPages,
    },
    timestamp: new Date().toISOString(),
    path: `/api/outlets`,
  }
})
