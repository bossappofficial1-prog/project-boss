import { defineEventHandler, readBody } from 'h3'
import { v4 as uuidv4 } from 'uuid'
import type { ExpenseForm, Expense } from '~/types'
import { addDummyExpense } from '~/server/dummy/expenses'

export default defineEventHandler(async (event) => {
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

  // Simulate expense creation
  const newExpense: Expense = {
    id: uuidv4(),
    description: body.description,
    amount: body.amount,
    date: new Date(body.date), // Ensure date is a Date object
    outletId: body.outletId,
    createdAt: new Date(),
  }

  addDummyExpense(newExpense)

  return {
    success: true,
    message: 'Pengeluaran berhasil dicatat',
    data: {
      expense: newExpense
    }
  }
})