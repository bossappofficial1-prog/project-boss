// composables/useApi/ts
import type { ApiResponse } from "~/types"

export function useApi<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    query?: Record<string, any>,
    body?: any,
    lazy?: boolean,
    immediate?: boolean
  } = {}
) {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  const token = auth.token

  const headers: HeadersInit = {
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }

  // If the body is FormData, don't set the Content-Type header.
  // The browser will automatically set it with the correct boundary.
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  return useFetch<ApiResponse<T>>(endpoint, {
    baseURL: config.public.apiBaseUrl,
    method: options.method ?? 'GET',
    query: options.query,
    body: options.body,
    headers,
    lazy: options.lazy ?? false,
    immediate: options.immediate ?? true
  })
}
