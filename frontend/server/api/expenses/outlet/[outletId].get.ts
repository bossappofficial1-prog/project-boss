import { defineEventHandler } from 'h3'
import { dummyExpenses } from '~/server/dummy/expenses'

export default defineEventHandler(async (event) => {
  const outletId = event.context.params?.outletId as string

  // Filter expenses by outletId. For dummy, we'll use a placeholder outletId.
  const filteredExpenses = dummyExpenses.filter(e => e.outletId === outletId || outletId === 'dummy-outlet-id-1')

  return {
    success: true,
    data: {
      expenses: filteredExpenses
    }
  }
})