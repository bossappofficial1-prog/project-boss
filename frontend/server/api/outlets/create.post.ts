import { defineEventHandler, readBody } from 'h3'
import { v4 as uuidv4 } from 'uuid'
import type { OutletForm, Outlet } from '~/types'
import { addDummyOutlet } from '~/server/dummy/outlets'

export default defineEventHandler(async (event) => {
  const body = await readBody<OutletForm>(event)

  // Simulate API validation
  if (!body.name) {
    setResponseStatus(event, 400)
    return {
      success: false,
      message: 'Nama outlet harus diisi',
      errors: ['name: Nama outlet harus diisi']
    }
  }

  // Simulate outlet creation
  const newOutlet: Outlet = {
    id: uuidv4(),
    name: body.name,
    address: body.address || undefined,
    phone: body.phone || undefined,
    image: body.image || undefined,
    businessId: 'dummy-business-id', // Placeholder
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  addDummyOutlet(newOutlet)

  return {
    success: true,
    message: 'Outlet berhasil dibuat',
    data: {
      outlet: newOutlet
    }
  }
})