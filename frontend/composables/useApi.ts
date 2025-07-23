// composables/useApi/ts
import type { ApiResponse } from "~/types"

export function useApi<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE',
    query?: Record<string, any>,
    body?: any,
    lazy?: boolean
  } = {}
) {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  const token = auth.token

  const headers: HeadersInit = {
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  // console.log("useApi called with endpoint:", endpoint, "and options:", options);
  
  // const backend = config.public.backendUrl
  // masih dummy
  return useFetch<ApiResponse<T>>(`${endpoint}`, {
    method: options.method ?? 'GET',
    query: options.query,
    body: options.body,
    headers,
    lazy: options.lazy ?? false,
  })
}
