import { defineEventHandler, readBody } from 'h3'
import { FeeBearer, type BusinessForm, type Business } from '~/types'
import { dummyBusiness, setDummyBusiness } from '~/server/dummy/business'

export default defineEventHandler(async (event) => {
  const body = await readBody<BusinessForm>(event)

  // Simulate API validation
  if (!body.name) {
    setResponseStatus(event, 400)
    return {
      success: false,
      message: 'Nama bisnis harus diisi',
      errors: ['name: Nama bisnis harus diisi']
    }
  }

  // Simulate business update
  if (!dummyBusiness) {
    setResponseStatus(event, 404)
    return {
      success: false,
      message: 'Bisnis tidak ditemukan',
      errors: []
    }
  }

  setDummyBusiness({
    ...dummyBusiness,
    name: body.name,
    description: body.description || dummyBusiness.description || undefined,
    bankName: body.bankName || dummyBusiness.bankName || undefined,
    bankAccount: body.bankAccount || dummyBusiness.bankAccount || undefined,
    accountHolder: body.accountHolder || dummyBusiness.accountHolder || undefined,
    defaultTransactionFeeBearer: body.defaultTransactionFeeBearer || dummyBusiness.defaultTransactionFeeBearer,
    updatedAt: new Date(),
  })

  return {
    success: true,
    message: 'Profil bisnis berhasil diperbarui',
    data: {
      business: dummyBusiness
    }
  }
})
