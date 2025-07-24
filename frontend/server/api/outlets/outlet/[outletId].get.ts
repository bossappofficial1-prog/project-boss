import { defineEventHandler } from 'h3'
import { dummyOutlets } from '~/server/dummy/outlets'

export default defineEventHandler(async (event) => {
  const businessId = event.context.params?.outletId as string // This is actually businessId in the frontend context

  // In a real app, you'd filter by businessId. For dummy, return all.
  // Or, if we want to simulate a specific business's outlets, we can filter.
  // For now, let's assume the dummyOutlets are already associated with the dummy business.
  const filteredOutlets = dummyOutlets.filter(o => o.businessId === businessId || businessId === 'dummy-business-id')

  return {
    success: true,
    data: {
      outlets: filteredOutlets
    }
  }
})