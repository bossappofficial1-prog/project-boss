import { defineEventHandler } from 'h3'
import { dummyOutlets, deleteDummyOutlet } from '~/server/dummy/outlets'

export default defineEventHandler(async (event) => {
  const outletId = event.context.params?.id as string

  const initialLength = dummyOutlets.length
  deleteDummyOutlet(outletId)

  if (dummyOutlets.length === initialLength) {
    setResponseStatus(event, 404)
    return {
      success: false,
      message: 'Outlet tidak ditemukan',
      errors: []
    }
  }

  return {
    success: true,
    message: 'Outlet berhasil dihapus'
  }
})