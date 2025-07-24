import type { Outlet } from '~/types'
import { v4 as uuidv4 } from 'uuid'

export const dummyOutlets: Outlet[] = [
  {
    id: uuidv4(),
    name: 'Outlet Pusat',
    address: 'Jl. Contoh No. 123, Kota Contoh',
    phone: '081234567890',
    image: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=Outlet+Pusat',
    businessId: 'dummy-business-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: uuidv4(),
    name: 'Outlet Cabang A',
    address: 'Jl. Cabang A No. 45, Kota Contoh',
    phone: '081234567891',
    image: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Outlet+Cabang+A',
    businessId: 'dummy-business-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const addDummyOutlet = (outlet: Outlet) => {
  dummyOutlets.push(outlet)
}

export const updateDummyOutlet = (updatedOutlet: Outlet) => {
  const index = dummyOutlets.findIndex(o => o.id === updatedOutlet.id)
  if (index !== -1) {
    dummyOutlets[index] = updatedOutlet
  }
}

export const deleteDummyOutlet = (id: string) => {
  const index = dummyOutlets.findIndex(o => o.id === id)
  if (index !== -1) {
    dummyOutlets.splice(index, 1)
  }
}