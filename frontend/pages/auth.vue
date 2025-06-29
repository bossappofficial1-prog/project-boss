<script setup>
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

onMounted(async () => {
  const token = route.query.token
  if (!token) return router.replace('/login')

  try {
    authStore.setToken(token)

    const { data, error, execute } = useApiFetch('/auth/me', {}, true)

    await execute()

    if (!data.value?.data) return router.replace('/login')
  
    authStore.setUser({
      id: data.value.data.id,
      email: data.value.data.email,
      name: data.value.data.name,
      avatar: data.value.data.avatar,
      role: data.value.data.role
    })

    switch (authStore.role) {
      case 'OWNER':
        router.push('/umkm')
        break
      case 'CUSTOMER':
      case 'ADMIN':
        router.push('/home')
        break
      default:
        console.error('Role not set')
        router.replace('/login')
    }

  } catch (e) {
    console.error(e)
    router.replace('/login')
  }
})

definePageMeta({
  layout: 'blank'
})
</script>

<template>
  <div class="loading-container">
    <Icon name="lucide:loader" class="loading-icon" />
  </div>
</template>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.loading-icon {
  animation: spin 1s linear infinite;
  font-size: 48px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
