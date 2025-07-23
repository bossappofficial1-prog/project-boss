export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore()
  
  if (auth.isOwner && !auth.hasBusinessProfile) {
    return navigateTo('/umkm/account?setup=true')
  }
})