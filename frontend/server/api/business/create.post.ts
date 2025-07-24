import { defineEventHandler, readBody } from 'h3'
import { v4 as uuidv4 } from 'uuid'
import type { BusinessForm, Business } from '~/types'
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

  // Simulate business creation
  const newBusiness: Business = {
    id: uuidv4(),
    name: body.name,
    description: body.description || undefined,
    bankName: body.bankName || undefined,
    bankAccount: body.bankAccount || undefined,
    accountHolder: body.accountHolder || undefined,
    defaultTransactionFeeBearer: body.defaultTransactionFeeBearer,
    ownerId: 'dummy-owner-id', // Placeholder
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // In a real application, you would save this to a database.
  // For dummy, we'll just return it and assume it's "created".
  if (dummyBusiness) {
    setResponseStatus(event, 409)
    return {
      success: false,
      message: 'Bisnis sudah ada. Gunakan endpoint update untuk memperbarui.',
      errors: []
    }
  }

  setDummyBusiness(newBusiness)

  return {
    success: true,
    message: 'Profil bisnis berhasil dibuat',
    data: {
      business: newBusiness
    }
  }
})
