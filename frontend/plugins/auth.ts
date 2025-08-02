export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()

  await authStore.initAuth()
})