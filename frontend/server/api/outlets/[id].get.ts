import { defineEventHandler } from 'h3'
import { dummyOutlets } from '~/server/dummy/outlets'

export default defineEventHandler(async (event) => {
  const outletId = event.context.params?.id as string

  const outlet = dummyOutlets.find(o => o.id === outletId)

  if (!outlet) {
    setResponseStatus(event, 404)
    return {
      success: false,
      message: 'Outlet tidak ditemukan',
      errors: []
    }
  }

  return {
    success: true,
    data: {
      outlet
    }
  }
})
