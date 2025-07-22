import { defineEventHandler, readBody } from 'h3'
import type { ExpenseForm, Expense } from '~/types'
import { dummyExpenses, updateDummyExpense } from '~/server/dummy/expenses'

export default defineEventHandler(async (event) => {
  const expenseId = event.context.params?.id as string
  const body = await readBody<ExpenseForm>(event)

  // Simulate API validation
  if (!body.description) {
    setResponseStatus(event, 400)
    return {
      success: false,
      message: 'Deskripsi pengeluaran harus diisi',
      errors: ['description: Deskripsi pengeluaran harus diisi']
    }
  }
  if (body.amount <= 0) {
    setResponseStatus(event, 400)
    return {
      success: false,
      message: 'Jumlah pengeluaran harus lebih dari 0',
      errors: ['amount: Jumlah pengeluaran harus lebih dari 0']
    }
  }
  if (!body.date) {
    setResponseStatus(event, 400)
    return {
      success: false,
      message: 'Tanggal pengeluaran harus diisi',
      errors: ['date: Tanggal pengeluaran harus diisi']
    }
  }

  // Find the expense to update
  const existingExpense = dummyExpenses.find(e => e.id === expenseId)
  if (!existingExpense) {
    setResponseStatus(event, 404)
    return {
      success: false,
      message: 'Pengeluaran tidak ditemukan',
      errors: []
    }
  }

  // Simulate expense update
  const updated: Expense = {
    ...existingExpense,
    description: body.description,
    amount: body.amount,
    date: new Date(body.date), // Ensure date is a Date object
    outletId: body.outletId,
    createdAt: existingExpense.createdAt, // Keep original creation date
  }

  updateDummyExpense(updated)

  return {
    success: true,
    message: 'Pengeluaran berhasil diperbarui',
    data: {
      expense: updated
    }
  }
})