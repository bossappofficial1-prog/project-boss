import type { Expense } from '~/types'
import { v4 as uuidv4 } from 'uuid'

export const dummyExpenses: Expense[] = [
  {
    id: uuidv4(),
    description: 'Pembelian bahan baku kopi',
    amount: 500000,
    date: new Date('2023-01-15T00:00:00.000Z'),
    outletId: 'dummy-outlet-id-1', // Placeholder
    createdAt: new Date('2023-01-15T00:00:00.000Z'),
  },
  {
    id: uuidv4(),
    description: 'Gaji karyawan bulan Januari',
    amount: 2000000,
    date: new Date('2023-01-31T00:00:00.000Z'),
    outletId: 'dummy-outlet-id-1', // Placeholder
    createdAt: new Date('2023-01-31T00:00:00.000Z'),
  },
]

export const addDummyExpense = (expense: Expense) => {
  dummyExpenses.push(expense)
}

export const updateDummyExpense = (updatedExpense: Expense) => {
  const index = dummyExpenses.findIndex(e => e.id === updatedExpense.id)
  if (index !== -1) {
    dummyExpenses[index] = updatedExpense
  }
}

export const deleteDummyExpense = (id: string) => {
  const index = dummyExpenses.findIndex(e => e.id === id)
  if (index !== -1) {
    dummyExpenses.splice(index, 1)
  }
}