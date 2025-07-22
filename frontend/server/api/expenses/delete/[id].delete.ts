import { defineEventHandler } from 'h3'
import { dummyExpenses, deleteDummyExpense } from '~/server/dummy/expenses'

export default defineEventHandler(async (event) => {
  const expenseId = event.context.params?.id as string

  const initialLength = dummyExpenses.length
  deleteDummyExpense(expenseId)

  if (dummyExpenses.length === initialLength) {
    setResponseStatus(event, 404)
    return {
      success: false,
      message: 'Pengeluaran tidak ditemukan',
      errors: []
    }
  }

  return {
    success: true,
    message: 'Pengeluaran berhasil dihapus'
  }
})