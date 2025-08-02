// stores/auth.ts
import { defineStore } from 'pinia'
import type { User, Outlet, Role, LoginForm, Business } from '~/types'

interface AuthState {
  user: User | null
  business: Business | null
  selectedOutlet: Outlet | null
  availableOutlets: Outlet[]
  isLoading: boolean
  token: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    business: null,
    selectedOutlet: null,
    availableOutlets: [],
    isLoading: false,
    token: null
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.user && !!state.token,
    userRole: (state): Role | null => state.user?.role || null,
    isOwner: (state): boolean => state.user?.role === 'OWNER',
    isAdmin: (state): boolean => state.user?.role === 'ADMIN',
    hasSelectedOutlet: (state): boolean => !!state.selectedOutlet,
    canAccessOwnerFeatures: (state): boolean => !!state.user && state.user.role === 'OWNER' && state.user.isVerified,
    hasBusinessProfile: (state): boolean => !!state.business
  },

  actions: {
    async login(credentials: LoginForm) {
      this.isLoading = true
      const config = useRuntimeConfig()
      const baseURL = config.public.apiBaseUrl
      console.log(`fetching ${baseURL}/auth/login...`);

      try {
        const response = await $fetch<{
          success: boolean
          token: string
        }>('/auth/login', {
          baseURL,
          method: 'POST',
          body: credentials
        })

        if (response.success && response.token) {
          this.token = response.token
        }

        await this.fetchUserData()

        await this.navigateAfterLogin()
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      this.isLoading = true
      const config = useRuntimeConfig()
      const baseURL = config.public.apiBaseUrl
      console.log(`fetching ${baseURL}/auth/logout...`);

      try {
        await $fetch('/auth/logout', {
          baseURL,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearSession()
        this.isLoading = false
        await navigateTo('/auth/login')
      }
    },

    async updateProfile(data: Partial<User>) {
      this.isLoading = true
      const config = useRuntimeConfig()
      const baseURL = config.public.apiBaseUrl
      try {
        const response = await useApi<{ success: boolean }>('/user/profile', {
          method: 'PUT',
          body: data,
        })

        if (response.data.value?.success) {
          await this.fetchUserData()
        } else {
          throw new Error('Gagal update profile')
        }
      } catch (error) {
        console.error("Gagal update profile:", error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    setSelectedOutlet(outlet: Outlet | null) {
      this.selectedOutlet = outlet
    },

    clearSession() {
      this.user = null
      this.business = null
      this.selectedOutlet = null
      this.availableOutlets = []
      this.token = null
    },

    async navigateAfterLogin() {
      console.log(`navigating after login`);

      if (this.isOwner) {
        if (!this.hasBusinessProfile) {
          console.log("User:", this.user)
          console.log("Business Profile:", this.hasBusinessProfile)
          await navigateTo('/umkm/account?setup=true')
        } else {
          await navigateTo('/umkm')
        }
      } else {
        await navigateTo('/home')
      }
    },

    async initAuth() {
      if (this.token && !this.user) {
        try {
          await this.fetchUserData()
        } catch (error) {
          console.error('Auth verification failed:', error)
          this.clearSession()
        }
      }
    },

    async fetchUserData() {
      if (!this.token) return

      const config = useRuntimeConfig()
      const baseURL = config.public.apiBaseUrl
      console.log(`fetching ${baseURL}/auth/me...`);

      try {
        const response = await $fetch<{
          success: boolean
          data: {
            user: User
            business: Business
            outlets: Outlet[]
          }
        }>('/auth/me', {
          baseURL,
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })

        if (response.success && response.data) {
          this.user = response.data.user
          this.business = response.data.business
          this.availableOutlets = response.data.outlets
        }
      } catch (error) {
        this.clearSession()
        console.error("Failed to fetch user data:", error)
        throw error
      }
    }
  },

  persist: {
    storage: {
      getItem: (key: string) => {
        if (process.client) {
          return localStorage.getItem(key)
        }
        return null
      },
      setItem: (key: string, value: string) => {
        if (process.client) {
          localStorage.setItem(key, value)
        }
      },
    }
  }
})
