import { defineEventHandler } from 'h3'
import { dummyBusiness } from '~/server/dummy/business'

export default defineEventHandler(async (event) => {
  if (!dummyBusiness) {
    setResponseStatus(event, 404)
    return {
      success: false,
      message: 'Bisnis tidak ditemukan',
      errors: []
    }
  }

  return {
    success: true,
    data: {
      business: dummyBusiness
    }
  }
})