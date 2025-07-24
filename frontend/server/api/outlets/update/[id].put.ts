import { defineEventHandler, readBody } from 'h3'
import type { OutletForm, Outlet } from '~/types'
import { dummyOutlets, updateDummyOutlet } from '~/server/dummy/outlets'

export default defineEventHandler(async (event) => {
  const outletId = event.context.params?.id as string
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

  // Find the outlet to update
  const existingOutlet = dummyOutlets.find(o => o.id === outletId)
  if (!existingOutlet) {
    setResponseStatus(event, 404)
    return {
      success: false,
      message: 'Outlet tidak ditemukan',
      errors: []
    }
  }

  // Simulate outlet update
  const updated: Outlet = {
    ...existingOutlet,
    name: body.name,
    address: body.address || existingOutlet.address || undefined,
    phone: body.phone || existingOutlet.phone || undefined,
    image: body.image || existingOutlet.image || undefined,
    updatedAt: new Date(),
  }

  updateDummyOutlet(updated)

  return {
    success: true,
    message: 'Outlet berhasil diperbarui',
    data: {
      outlet: updated
    }
  }
})