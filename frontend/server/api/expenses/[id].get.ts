import { defineEventHandler } from 'h3'
import { dummyExpenses } from '~/server/dummy/expenses'

export default defineEventHandler(async (event) => {
  const expenseId = event.context.params?.id as string

  const expense = dummyExpenses.find(e => e.id === expenseId)

  if (!expense) {
    setResponseStatus(event, 404)
    return {
      success: false,
      message: 'Pengeluaran tidak ditemukan',
      errors: []
    }
  }

  return {
    success: true,
    data: {
      expense
    }
  }
})