import type { Business } from '~/types'
import { FeeBearer } from '~/types'

export let dummyBusiness: Business | null = {
  id: 'dummy-business-id',
  name: 'Dummy Business Name',
  description: 'This is a dummy business for testing purposes.',
  bankName: 'BCA',
  bankAccount: '1234567890',
  accountHolder: 'Dummy Account Holder',
  defaultTransactionFeeBearer: FeeBearer.CUSTOMER,
  ownerId: 'dummy-owner-id',
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const setDummyBusiness = (business: Business | null) => {
  dummyBusiness = business
}