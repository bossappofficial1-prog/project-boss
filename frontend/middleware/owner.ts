export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore()
  
  if (!auth.isOwner) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Akses ditolak. Hanya owner yang dapat mengakses halaman ini.'
    })
  }
})