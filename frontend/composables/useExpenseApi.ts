interface Expense {
  id: string
  description: string
  amount: number
  date: string
  outletId: string
  createdAt: string
  updatedAt: string
}

interface CreateExpenseData {
  description: string
  amount: number
  outletId: string
  date: string
}

interface UpdateExpenseData {
  description: string
  amount: number
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
  path: string
}

export const useExpenseApi = () => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  const baseURL = config.public.apiBaseUrl

  // Get auth headers
  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    }
    
    if (auth.token) {
      headers.Authorization = `Bearer ${auth.token}`
    }
    
    return headers
  }

  // Create new expense
  const createExpense = async (data: CreateExpenseData): Promise<Expense> => {
    const response = await $fetch<ApiResponse<Expense>>(`${baseURL}/expenses`, {
      method: 'POST',
      headers: getHeaders(),
      body: data
    })

    if (!response.success) {
      throw new Error(response.message || 'Failed to create expense')
    }

    return response.data
  }

  // Get expenses by outlet
  const getExpensesByOutlet = async (outletId: string): Promise<Expense[]> => {
    const response = await $fetch<ApiResponse<Expense | Expense[]>>(`${baseURL}/expenses/outlet/${outletId}`, {
      headers: getHeaders()
    })

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch expenses')
    }

    // Ensure we always return an array
    return Array.isArray(response.data) ? response.data : [response.data]
  }

  // Update expense
  const updateExpense = async (id: string, data: UpdateExpenseData): Promise<Expense> => {
    const response = await $fetch<ApiResponse<Expense>>(`${baseURL}/expenses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: data
    })

    if (!response.success) {
      throw new Error(response.message || 'Failed to update expense')
    }

    return response.data
  }

  // Delete expense
  const deleteExpense = async (id: string): Promise<void> => {
    await $fetch(`${baseURL}/expenses/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
  }

  return {
    createExpense,
    getExpensesByOutlet,
    updateExpense,
    deleteExpense
  }
}

export type { Expense, CreateExpenseData, UpdateExpenseData, ApiResponse }
