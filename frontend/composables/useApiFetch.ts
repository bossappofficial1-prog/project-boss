export const useApiFetch = (path: string, options = {}, isLazy = false) => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  const token = auth.token
  
  // console.log(`Fetching ${config.public.apiBaseUrl}${path} with token ${token}`)

  return useFetch(`${config.public.apiBaseUrl}${path}`, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    lazy: isLazy,
    ...options
  })
}
